"""Create a curated source handoff without reading environment secret values."""
from pathlib import Path
import csv
import hashlib
import json
import re
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "generated-artifacts" / "coas-handoff"
STAGE = OUTPUT / "COAS_HANDOFF"
ARCHIVE = OUTPUT / "COAS_Antigravity_Handoff.zip"
SOURCE_FOLDERS = ("client", "server", "shared", "script")
ROOT_FILES = (
    "package.json", "package-lock.json", "tsconfig.json", "vite.config.ts",
    "vite-plugin-meta-images.ts", "drizzle.config.ts", "components.json",
    "postcss.config.js", "replit.md", ".replit", ".gitignore", ".replitignore",
)
TEXT_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".json"}
SENSITIVE_SUFFIXES = {".pem", ".key", ".p12", ".pfx", ".sql", ".sqlite", ".db"}
SENSITIVE_NAMES = {".env", ".npmrc", ".netrc", ".git-credentials"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe(path):
    rel = path.relative_to(ROOT)
    if path.is_symlink() or any(part in {"node_modules", ".git", "dist", "__pycache__"} for part in rel.parts):
        raise RuntimeError(f"Disallowed export entry: {rel}")
    if path.name.startswith(".env") or path.name in SENSITIVE_NAMES or path.suffix.lower() in SENSITIVE_SUFFIXES:
        raise RuntimeError(f"Sensitive filename rejected: {rel}")
    # Inspect source literals only; never inspect the process environment.
    if path.suffix in TEXT_SUFFIXES:
        text = path.read_text(encoding="utf-8")
        patterns = (
            r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
            r"sk-(?:proj-)?[A-Za-z0-9_-]{24,}",
            r"postgres(?:ql)?://[^:\s\"']+:[^@\s\"']+@",
        )
        if any(re.search(pattern, text) for pattern in patterns):
            raise RuntimeError(f"Possible credential literal; review privately: {rel}")


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if STAGE.exists():
        shutil.rmtree(STAGE)
    STAGE.mkdir()
    selected = set()
    references = {}
    for folder in SOURCE_FOLDERS:
        for path in (ROOT / folder).rglob("*"):
            if path.is_file() and "__pycache__" not in path.parts:
                safe(path)
                selected.add(path)
                if path.suffix in TEXT_SUFFIXES:
                    text = path.read_text(encoding="utf-8")
                    for name in re.findall(r"""@assets/([^"'\n]+)""", text):
                        asset = ROOT / "attached_assets" / name
                        if not asset.resolve().is_relative_to((ROOT / "attached_assets").resolve()):
                            raise RuntimeError("Unsafe asset reference")
                        if not asset.is_file():
                            raise RuntimeError(f"Missing asset: {name}")
                        safe(asset)
                        selected.add(asset)
                        references.setdefault(asset.relative_to(ROOT).as_posix(), set()).add(path.relative_to(ROOT).as_posix())
    for name in ROOT_FILES:
        path = ROOT / name
        if path.is_file():
            safe(path)
            selected.add(path)

    source_hashes = {}
    for source in sorted(selected):
        rel = source.relative_to(ROOT)
        target = STAGE / "project" / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        source_hashes[rel.as_posix()] = sha(source)
        shutil.copy2(source, target)
        if sha(target) != source_hashes[rel.as_posix()]:
            raise RuntimeError(f"Snapshot mismatch: {rel}")

    for source in (ROOT / "handoff").iterdir():
        if source.is_file():
            shutil.copy2(source, STAGE / source.name)
    (STAGE / "project" / ".env.example").write_text(
        "# Variable names only. No credentials or live connections are included.\n"
        "# Configure environment loading explicitly; this file is not auto-loaded.\n"
        "DATABASE_URL=\nAI_INTEGRATIONS_OPENAI_API_KEY=\n"
        "AI_INTEGRATIONS_OPENAI_BASE_URL=\nSESSION_SECRET=\nPORT=5000\n",
        encoding="utf-8",
    )
    with (STAGE / "ASSET_REFERENCES.csv").open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["asset_path", "source_path"])
        for asset, sources in sorted(references.items()):
            for source in sorted(sources):
                writer.writerow([asset, source])

    checks = {}
    for label, command in (
        ("타입 검사", ["npm", "run", "check"]),
        ("프로덕션 빌드", ["npm", "run", "build"]),
        ("분석 이벤트 안전성 테스트", ["node_modules/.bin/tsx", "--test", "script/analytics.test.ts"]),
    ):
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=180)
        checks[label] = result.returncode
    # Report only concise diagnostics, not complete potentially sensitive process output.
    asset_bytes = sum((ROOT / name).stat().st_size for name in references)
    project_count = len(selected) + 1
    lines = [
        "# 이번 압축파일 생성 설명\n",
        "## 생성 방법",
        "Python 표준 라이브러리 pathlib, shutil, hashlib, csv, zipfile을 사용했습니다.",
        "원본을 별도 폴더에 복사한 다음 ZIP_DEFLATED(level 6)로 압축했습니다.",
        "원본 코드와 이미지의 파일명·상대 경로·바이트를 유지했습니다.",
        "현재 앱의 디자인·기능·패키지·DB는 이 포장 작업으로 수정하지 않았습니다.\n",
        "## 구성",
        f"- project/ 파일 수: {project_count}개 (.env.example 포함)",
        f"- 코드에서 직접 참조한 이미지: {len(references)}개",
        f"- 해당 이미지 원본 총 크기: {asset_bytes:,} bytes",
        "- client/public/ 파일은 project/ 파일 수에 별도로 포함됩니다.",
        "- @assets 참조는 전체 client/server/shared/script 텍스트 소스에서 추출했습니다.",
        "- @assets 외 다른 상대/공개 경로는 별도 소스 점검 대상이며, client/public/ 전체를 포함했습니다.",
        "- DB 전용 이미지와 외부 URL 파일은 다운로드하거나 DB 조회하지 않았습니다.\n",
        "## 제외",
        "실제 비밀정보, 실제 .env, DB 덤프, 고객 데이터, node_modules, dist, Git 이력, 캐시, 로그,",
        "내부 에이전트 자료, 코드에서 직접 참조하지 않은 업로드 자료는 포함하지 않았습니다.",
        "공개 연락처 등 원래 서비스 소스에 있는 내용은 보존했습니다.",
        "파일 경로 허용목록과 알려진 자격증명 문자열 패턴 검사는 완전한 비밀정보 탐지를 보장하지 않습니다.\n",
        "## 실행 검사 (현재 Replit 환경)",
    ]
    lines.extend(f"- {label}: {'통과' if code == 0 else f'실패 (종료 코드 {code})'}" for label, code in checks.items())
    lines.extend([
        "- 원본에서 이미 알려진 내비게이션 multiLine 타입 문제가 있다면 수정 없이 인계합니다.",
        "- Antigravity·외부 OS·새 DB 환경에서의 실행은 아직 검증하지 않았습니다.",
        "- DB 마이그레이션·시딩·실제 문의 전송·AI 요청은 실행하지 않았습니다.\n",
        "## 무결성 검증 방식",
        "- 복사 전 원본과 복사본의 SHA-256을 비교합니다.",
        "- 압축 전까지 원본 해시가 동일한지 재확인합니다.",
        "- FILE_MANIFEST.csv에는 자기 자신을 제외한 모든 전달 파일의 경로·크기·SHA-256을 기록합니다.",
        "- 생성 후 ZIP CRC 검사와 ZIP 내부 바이트 해시 비교를 수행합니다.",
        "- 별도 폴더에 해제하고 VERIFY_FILES.py로 다시 검증합니다.",
        "- ZIP 전체 SHA-256과 최종 압축 크기는 다운로드 안내에서 별도로 제공합니다.\n",
        "## 재현",
        "원래 Replit 프로젝트 루트에서 python3 script/package-handoff.py를 실행하면 재생성됩니다.",
        "project/는 전달용 소스 스냅샷이므로 패키징 재실행에는 원본의 handoff/ 안내 파일들도 필요합니다.",
        "빌드 산출물과 압축파일은 generated-artifacts/ 아래에만 생성되고 Git·배포 대상에서 제외됩니다.",
    ])
    (STAGE / "PACKAGING_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    for rel, original in source_hashes.items():
        if sha(ROOT / rel) != original:
            raise RuntimeError(f"Source changed during packaging: {rel}")

    with (STAGE / "FILE_MANIFEST.csv").open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["path", "bytes", "sha256"])
        for path in sorted(STAGE.rglob("*")):
            if path.is_file() and path.name != "FILE_MANIFEST.csv":
                writer.writerow([path.relative_to(STAGE).as_posix(), path.stat().st_size, sha(path)])

    subprocess.run([sys.executable, str(STAGE / "VERIFY_FILES.py")], check=True)
    with zipfile.ZipFile(ARCHIVE, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
        for path in sorted(STAGE.rglob("*")):
            if path.is_file():
                bundle.write(path, (Path("COAS_HANDOFF") / path.relative_to(STAGE)).as_posix())

    with zipfile.ZipFile(ARCHIVE) as bundle:
        if bundle.testzip() is not None:
            raise RuntimeError("ZIP CRC failure")
        for info in bundle.infolist():
            relative = Path(info.filename).relative_to("COAS_HANDOFF")
            if hashlib.sha256(bundle.read(info)).hexdigest() != sha(STAGE / relative):
                raise RuntimeError(f"Archive content mismatch: {relative}")
        if len(bundle.infolist()) != sum(p.is_file() for p in STAGE.rglob("*")):
            raise RuntimeError("ZIP file count mismatch")
        extracted = OUTPUT / "verification"
        if extracted.exists():
            shutil.rmtree(extracted)
        bundle.extractall(extracted)
    subprocess.run([sys.executable, str(extracted / "COAS_HANDOFF" / "VERIFY_FILES.py")], check=True)
    digest = sha(ARCHIVE)
    (OUTPUT / "COAS_Antigravity_Handoff.zip.sha256").write_text(f"{digest}  {ARCHIVE.name}\n", encoding="utf-8")
    print(json.dumps({
        "archive": str(ARCHIVE.relative_to(ROOT)),
        "archive_bytes": ARCHIVE.stat().st_size,
        "archive_sha256": digest,
        "project_files": project_count,
        "referenced_assets": len(references),
        "checks": checks,
        "zip_verified": True,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
