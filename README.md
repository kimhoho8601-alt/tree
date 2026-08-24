# Tree Workshop

200명이 함께 만드는 Save the Children 워크숍 약속나무입니다.

## 화면
- `index.html` : 참여자 모바일 입력 화면
- `screen.html` : 행사장 빔/LED 메인 화면
- 1명 참여 시 열매 1개 활성화
- 200명 완료 시 최종 메시지 화면 자동 전환

## 데이터
Supabase 프로젝트 `performance-management` 안에 워크숍 전용 테이블/함수/공개 뷰를 분리했습니다.

- `tree_workshop_entries` : 원본 데이터 (브라우저 device_id 포함, 공개 SELECT 차단)
- `tree_workshop_public` : 화면 표시용 공개 뷰 (device_id 제외)
- `submit_tree_workshop_entry(...)` : 익명 참여용 검증 RPC, 최대 200명 / 브라우저당 1회

## 행사 운영
1. 행사장 PC에서 `/screen.html` 전체화면 실행
2. 참가자는 루트 URL을 QR로 접속
3. 테스트 데이터를 초기화하려면 Supabase SQL Editor에서 `delete from public.tree_workshop_entries;` 실행

## GitHub Pages
`.github/workflows/pages.yml`이 정적 사이트를 Pages에 배포합니다. 저장소 Settings > Pages에서 Source가 **GitHub Actions**로 설정되어 있어야 합니다.
