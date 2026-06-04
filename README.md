# 가족 건강 허브 (Family Health Hub)

가족 모두의 진료 일정, 진료 이력, 복약 정보를 한 곳에서 관리하는 웹 앱입니다.  
언로그인 없이 그룹 슬러그 URL 공유만으로 접근 가능합니다.

## 기술 스택

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend/DB**: Firebase Firestore (실시간 동기화)
- **파일 저장**: Firebase Storage
- **배포**: Firebase Hosting

## 환경 설정

1. `.env.example` 파일을 `.env`로 복사합니다:
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일에 Firebase 프로젝트 정보를 입력합니다.

3. 의존성 설치:
   ```bash
   npm install
   ```

4. 개발 서버 실행:
   ```bash
   npm run dev
   ```

## 라우팅 구조

```
/                          → 랜딩 페이지 (그룹 생성 / 참여)
/group/:slug               → 그룹 홈 대시보드
/group/:slug/calendar      → 통합 캐린더
/group/:slug/patient/:id   → 환자 개인 페이지
/group/:slug/add           → 빠른 입력
/group/:slug/settings      → 그룹 설정
```

## Phase 1 현재 구현 완료 기능

- [x] 그룹 생성 (고유 슬러그 URL 자동 발급)
- [x] 그룹 상담로크 접근
- [x] 환자(가족 구성원) 프로필 등록/수정/삭제
- [x] 진료 일정 수동 입력
- [x] 월간 캐린더 뷰 (환자별 색상 도트)
- [x] 진료 이력 기록 (진단명, 소견, 처방약)
- [x] 병원 예약 문자 파싱 엔진 (주요 10개 병원)
- [x] 실시간 활동 피드
- [x] 모바일 우선 반응형 디자인

## 상태 색상 구분

| 상태 | 색상 |
|------|------|
| 예약완료 | 파란 |
| 진료완료 | 초록 |
| 취소 | 회색 |
| 미확인 | 주황 |

## Firestore 데이터 구조

```
groups/{groupId}
  ├── name, slug, createdAt
  ├── members/{memberId}
  ├── patients/{patientId}
  ├── appointments/{apptId}
  ├── records/{recordId}
  ├── activity/{activityId}
  └── medications/{medId} (Phase 2)
```
