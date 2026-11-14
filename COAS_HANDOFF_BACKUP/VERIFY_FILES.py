"""Run from any directory: python3 path/to/VERIFY_FILES.py."""
from pathlib import Path
import csv
import hashlib
import sys

root = Path(__file__).resolve().parent
errors = []
expected = set()
with (root / "FILE_MANIFEST.csv").open(encoding="utf-8-sig", newline="") as stream:
    for row in csv.DictReader(stream):
        relative = row["path"]
        path = (root / relative).resolve()
        if not path.is_relative_to(root):
            errors.append(f"Unsafe path: {relative}")
            continue
        expected.add(relative)
        if not path.is_file():
            errors.append(f"Missing: {relative}")
        elif path.stat().st_size != int(row["bytes"]):
            errors.append(f"Size mismatch: {relative}")
        elif hashlib.sha256(path.read_bytes()).hexdigest() != row["sha256"]:
            errors.append(f"Hash mismatch: {relative}")

actual = {p.relative_to(root).as_posix() for p in root.rglob("*") if p.is_file()}
extras = actual - expected - {"FILE_MANIFEST.csv"}
for path in sorted(extras):
    errors.append(f"Extra file: {path}")
if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"PASS: {len(expected)} files verified; no missing, changed, or extra files.")
