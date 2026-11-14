# 코아스 프로젝트 전달 안내

이 자료는 기존 코아스 사이트를 Antigravity에서 이어서 개발하기 위한 전달 패키지입니다. 새 쇼핑몰을 자동 생성하거나 배포하는 자료가 아닙니다.

## 순서

1. ZIP을 다운로드하고 **새 빈 폴더**에 압축을 풉니다. 기존 프로젝트 위에 덮어쓰지 마세요.
2. `project/`가 실제 프로젝트입니다. Antigravity에서 이 폴더를 여세요.
3. 먼저 `python3 ../VERIFY_FILES.py`로 파일 무결성을 확인합니다. Windows에서는 설치 상태에 따라 `python` 또는 `py`를 사용하세요.
4. `02_ANTIGRAVITY_AUDIT_PROMPT.md`를 복사해 Antigravity에 입력합니다. 이 단계는 읽기 전용입니다.
5. 조사 결과를 확인한 뒤 `03_ANTIGRAVITY_RUN_PROMPT.md`를 입력합니다.
6. 기존 사이트 실행을 확인한 뒤 `04_ANTIGRAVITY_CHANGE_PROMPT.md`의 요청란을 채워 기능을 추가합니다.
7. 추후 Replit에서 다시 최신 자료를 내보낼 때는 `01_REPLIT_EXPORT_PROMPT.md`를 사용합니다. 이미 받은 ZIP을 사용하기 위해 Replit 프롬프트를 다시 실행할 필요는 없습니다.

## 포함된 것

- `project/client/`, `server/`, `shared/`, `script/`
- 패키지 잠금파일과 루트 설정 파일
- 소스코드의 `@assets/` 참조에서 확인한 원본 이미지
- `client/public/`의 로고·공개 정적 파일 등
- 실제 비밀값이 없는 `.env.example`
- `FILE_MANIFEST.csv`: 파일 경로·크기·SHA-256
- `ASSET_REFERENCES.csv`: 이미지와 사용 소스의 대응 목록
- `PACKAGING_REPORT.md`: 이번 압축의 구성과 검증 결과
- 단계별 프롬프트와 `VERIFY_FILES.py`

이미지는 파일명을 변경하거나 크롭·재인코딩하지 않았습니다. ZIP 압축은 파일 바이트를 보존합니다.

## 포함되지 않은 것과 한계

- API 키·비밀번호·실제 `.env`·Replit 비밀정보
- 운영 DB와 고객 문의/신청 데이터, Git 이력
- `node_modules/`, `dist/`, 캐시·로그, 내부 에이전트 지침
- 코드가 직접 참조하지 않는 기존 업로드 자료
- 외부 URL로 제공되는 이미지의 실제 파일
- DB `imageUrl` 등에만 저장되어 소스코드에서 확인할 수 없는 이미지

따라서 이 ZIP은 **코드와 정적 이미지 전달본**이지 DB까지 포함한 전체 운영 백업은 아닙니다. DB 백업·복구는 별도 승인과 안전한 전달 절차가 필요합니다.

## 실행 전 주의

현재 서버는 DB 연결 설정과 AI 연동 설정에 의존합니다. 비밀값을 설정하지 않은 상태에서 서버가 바로 실행된다고 가정하지 마세요. `.env.example`은 변수 이름 참고용이며, 그 파일 자체가 자동으로 로드되거나 연결을 제공하지는 않습니다.

Replit 밖에서는 관리형 AI 연결과 분석 추적기가 자동 제공되지 않을 수 있습니다. 외부 도구에서의 실행과 Windows 호환성은 아직 검증하지 않았습니다.

`npm run db:push`, 시딩, 운영 데이터 변경, 유료 API 호출, 이메일 전송은 자동 실행하지 마세요.

## Replit의 일반 ZIP 내보내기와 차이

Replit 공식 안내에는 파일 트리 상단의 점 세 개 메뉴에서 `Download as zip`을 선택하는 방법도 있습니다. 이번 ZIP은 그 메뉴를 사용한 것이 아니라, 전달 대상 파일만 선정하고 SHA-256 목록을 생성한 별도 패키지입니다.

참고: https://docs.replit.com/help/projects-and-files
