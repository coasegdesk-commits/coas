# 2단계 — Antigravity에 입력할 조사 프롬프트

project/ 폴더를 연 뒤 아래 내용을 입력하세요. 이 단계에서는 파일을 변경하지 않습니다.

---

당신은 기존 프로젝트 인수 담당 시니어 개발자입니다.
이 폴더는 코아스(COAS) 인테리어하드웨어 사이트의 실제 원본 전달본입니다.
프로젝트를 새로 만들지 말고 **읽기 전용 조사**부터 진행하세요.

## 입력 자료

- 현재 열린 project/가 실제 소스 루트입니다.
- 상위 폴더에 전달 안내서, FILE_MANIFEST.csv, ASSET_REFERENCES.csv, PACKAGING_REPORT.md, VERIFY_FILES.py가 있습니다.
- 먼저 검증 스크립트를 실행해 전달 파일의 크기·해시·누락·추가 파일을 확인하세요. python3가 없으면 설치를 강행하지 말고 사용 가능한 Python 명령 또는 대체 해시 도구를 안내하세요.

## 확인할 기존 기술 구성

React 19, TypeScript, Vite 7, Express 4, Tailwind CSS 4, shadcn/ui·Radix UI, Wouter, TanStack React Query, Framer Motion, PostgreSQL·Drizzle ORM, OpenAI 연동입니다. 실제 package.json과 잠금파일을 우선하세요.

- @ → client/src
- @shared → shared
- @assets → attached_assets

Vite와 TypeScript의 경로 해석이 일치하는지도 확인하세요.

## 조사 항목

1. 폴더 구조, 진입점, npm 명령, Node 버전 조건
2. 홈·신제품·부품 인덱스·제품 상세·문의 페이지와 실제 API 연결
3. 상품명 → 제품 ID → 상세 URL → 이미지 연결
4. DP-40, DP-60, 200kg(SD), 1 Body-40/60/90의 현재 대응 관계
5. 이미지·CSS·폰트·외부 URL·DB 전용 이미지의 의존성
6. 비밀값을 제외한 환경변수 이름과 사용 위치
7. DB 초기 연결과 AI 클라이언트 생성 때문에 실행이 막힐 수 있는 부분
8. Replit 전용 플러그인, 도메인 처리, 분석 스크립트 의존성
9. 운영체제별 실행 명령 차이와 .env 로딩 여부
10. 이미 구현된 기능과 화면만 존재하는 기능의 구분

## 금지

- 파일 수정, 패키지 설치, 새 템플릿 생성
- 원본 위에 다른 저장소 덮어쓰기
- DB 연결·스키마 변경·자동 시딩·데이터 삭제
- 비밀값 조회·출력, 유료 API 호출, 외부 전송
- 가짜 제품 데이터나 대체 이미지로 오류 숨기기

조사 결과를 “정상 확인 / 누락 또는 확인 불가 / 실행 차단 요인 / 최소 변경 계획 / 사용자가 준비할 설정” 순서로 보고하세요. 프롬프트를 받았다는 이유만으로 코드 수정을 시작하지 마세요.

---
