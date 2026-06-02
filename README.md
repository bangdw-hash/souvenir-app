# 기념품 불출 대장 - 배포 가이드

## 배포 순서 요약
1. Google Sheets 생성
2. Google Apps Script 배포 → URL 복사
3. JS 파일에 URL 붙여넣기
4. GitHub Pages 배포
5. QR 코드 생성

---

## STEP 1. Google Sheets 생성

1. [Google Sheets](https://sheets.google.com) 접속 (bangdw@gmail.com 계정)
2. 새 스프레드시트 생성 → 이름: **기념품 불출 대장**
3. 시트 이름을 `신청내역`으로 변경
4. 두 번째 시트 추가 → 이름: `물품목록`
5. 주소창 URL에서 Spreadsheet ID 복사
   - 예: `https://docs.google.com/spreadsheets/d/`**`여기가ID`**`/edit`

---

## STEP 2. Google Apps Script 배포

1. Sheets 상단 메뉴 → **확장 프로그램 → Apps Script**
2. `Code.gs` 파일의 내용을 전체 붙여넣기
3. 상단 설정값 4가지 수정:

```javascript
var SPREADSHEET_ID = '복사한_시트_ID';
var TELEGRAM_BOT_TOKEN = '텔레그램_봇_토큰';
var TELEGRAM_CHAT_ID = '나의_채팅_ID';
var ADMIN_PASSWORD = '원하는_비밀번호';
```

4. **배포 → 새 배포** 클릭
5. 유형: **웹 앱** 선택
6. 설정:
   - 설명: 기념품 불출 대장
   - 다음 사용자로 실행: **나(본인)**
   - 액세스 권한: **모든 사용자**
7. **배포** 클릭 → 권한 승인
8. 웹 앱 URL 복사 (https://script.google.com/macros/s/... 형태)

---

## STEP 3. 텔레그램 봇 설정

### 봇 토큰 발급
1. 텔레그램 앱에서 **@BotFather** 검색
2. `/newbot` 입력
3. 봇 이름 입력 (예: 기념품신청알림봇)
4. 봇 아이디 입력 (예: souvenir_noti_bot)
5. 발급된 **토큰** 복사 → `TELEGRAM_BOT_TOKEN`에 입력

### 채팅 ID 확인
1. 위에서 만든 봇과 대화 시작 (아무 메시지 전송)
2. 브라우저에서 아래 URL 접속:
   `https://api.telegram.org/bot[봇토큰]/getUpdates`
3. 결과에서 `"chat":{"id":숫자}` 부분의 숫자 복사 → `TELEGRAM_CHAT_ID`에 입력

---

## STEP 4. JS 파일 URL 교체

`js/form.js`와 `js/admin.js` 두 파일에서:

```javascript
var GAS_URL = 'YOUR_GAS_WEB_APP_URL';
```

를 STEP 2에서 복사한 웹 앱 URL로 교체.

---

## STEP 5. GitHub Pages 배포

1. [GitHub](https://github.com) 접속 → 새 저장소 생성
   - 이름: `souvenir-app` (public)
2. 이 폴더 전체를 업로드 (gas 폴더 제외해도 됨)
3. 저장소 Settings → Pages → Source: **main 브랜치** 선택 → Save
4. 배포 완료 후 URL 확인:
   `https://[깃헙아이디].github.io/souvenir-app/`

---

## STEP 6. QR 코드 생성

1. [QR 코드 생성기](https://qr.io) 또는 검색에서 "QR 코드 생성기" 사용
2. GitHub Pages URL 입력
3. QR 이미지 다운로드 후 인쇄

---

## 관리자 페이지 접속

- URL: `https://[깃헙아이디].github.io/souvenir-app/admin.html`
- 또는 신청 폼 하단의 "관리자 페이지" 링크 클릭
- 설정한 관리자 비밀번호 입력

---

## 파일 구조

```
souvenir-app/
├── index.html       ← 신청 폼 (QR이 가리키는 페이지)
├── admin.html       ← 관리자 페이지
├── css/
│   └── style.css
├── js/
│   ├── form.js      ← GAS_URL 교체 필요
│   └── admin.js     ← GAS_URL 교체 필요
└── gas/
    └── Code.gs      ← Apps Script에 붙여넣기
```
