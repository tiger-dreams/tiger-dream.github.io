# 📊 Google Sheets 연동 설정 가이드

## 🎯 개요
Threads 콘텐츠 생성기와 Google Sheets를 연동하여 생성된 콘텐츠를 자동으로 스프레드시트에 저장합니다.

## 🚀 빠른 설정 (Google Apps Script 사용)

### STEP 1: 스프레드시트 생성
1. **Google Sheets** 새 스프레드시트 생성
2. 이름: `AnnotateShot Threads Content`
3. **URL에서 스프레드시트 ID 복사**
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### STEP 2: Google Apps Script 설정
1. **script.google.com** 방문
2. **새 프로젝트** 생성
3. `google-apps-script.js` 파일의 코드 복사하여 붙여넣기
4. **코드 상단의 SPREADSHEET_ID 변경**:
   ```javascript
   const SPREADSHEET_ID = '여기에_실제_스프레드시트_ID_붙여넣기';
   ```

### STEP 3: 웹앱으로 배포
1. **배포 > 새 배포** 클릭
2. 유형: **웹앱** 선택
3. 실행 계정: **나**
4. 액세스 권한: **모든 사용자**
5. **배포** 클릭
6. **웹앱 URL 복사** (매우 중요!)

### STEP 4: 환경변수 설정
`.env` 파일에 웹앱 URL 추가:
```bash
GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## 📋 생성될 시트 구조

### 🧵 Threads Content 시트
| 날짜 | 요일 | 콘텐츠 타입 | 글자수 | 상태 | 콘텐츠 | 해시태그 | 생성시간 |
|------|------|-------------|---------|------|--------|----------|----------|
| 2024-08-24 | Monday | productivity_tip | 250 | ✅ 사용가능 | Tiger's tip... | #Productivity #Tools | 2024-08-24 10:30 |

### 📊 통계 시트
| 날짜 | 총 생성 | 사용 가능 | 편집 필요 | 성공률(%) |
|------|---------|-----------|-----------|-----------|
| 2024-08-24 | 5 | 3 | 2 | 60% |

## 🎨 자동 기능들

### ✅ 조건부 서식
- **✅ 사용가능**: 녹색 배경
- **⚠️ 편집필요**: 노란색 배경

### 📊 통계 추적
- 일별 생성 통계 자동 업데이트
- 성공률 자동 계산
- 트렌드 분석 가능

### 🔄 데이터 정리
- 해시태그 자동 추출
- 글자수 자동 계산
- 상태 자동 분류

## 🧪 테스트 방법

### 1. 기본 테스트
```bash
node generate-threads-batch.js batch
```

### 2. 특정 타입 테스트
```bash
node generate-threads-batch.js type productivity_tip 3
```

### 3. Google Apps Script 테스트
Apps Script 편집기에서 `testFunction` 실행

## 📈 사용 시나리오

### 📅 주간 콘텐츠 계획
1. **월요일 오전**: 1주일치 콘텐츠 생성
2. **Google Sheets**: 자동 업로드 및 정리
3. **Buffer/Hootsuite**: 스케줄링
4. **매일**: 자동 포스팅

### 🔍 콘텐츠 분석
- **성공률 추적**: 얼마나 많은 콘텐츠가 바로 사용 가능한지
- **타입별 분석**: 어떤 콘텐츠 타입이 가장 효과적인지
- **트렌드 파악**: 시간별 생성 품질 변화

## ⚠️ 문제 해결

### 권한 오류
```
Google Apps Script 배포 시 권한 승인 필요
"고급 > 안전하지 않은 페이지로 이동" 클릭
```

### 스프레드시트 접근 오류
```
SPREADSHEET_ID가 정확한지 확인
스프레드시트가 같은 Google 계정에 있는지 확인
```

### 웹앱 URL 오류
```
배포된 웹앱 URL이 정확한지 확인
.env 파일의 URL이 올바른지 확인
```

## 🚀 고급 활용

### API 연동 확장
```javascript
// 다른 플랫폼 콘텐츠도 추가 가능
await sheetsUploader.uploadContent({
  platform: 'twitter',
  content: twitterPosts
});
```

### 자동화 스케줄링
```bash
# cron job으로 매일 자동 실행
0 9 * * * cd /path/to/marketing-agents && node generate-threads-batch.js batch
```

## 📞 지원

문제가 있으면 다음을 확인하세요:
1. Google Apps Script 로그 확인
2. 스프레드시트 권한 확인
3. 웹앱 URL 재배포 시도

---

✨ **이제 Threads 콘텐츠가 Google Sheets에 자동으로 정리됩니다!**