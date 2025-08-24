# 🚀 Marketing Agents 사용 가이드

AnnotateShot 마케팅 자동화 도구 사용법

## 📋 목차

- [빠른 시작](#빠른-시작)
- [Threads 콘텐츠 생성](#threads-콘텐츠-생성)
- [Reddit 마케팅](#reddit-마케팅)
- [Google Sheets 연동](#google-sheets-연동)
- [API 키 설정](#api-키-설정)

---

## 🚀 빠른 시작

### 1. 환경 설정 확인
```bash
# 필수 환경변수 확인
cat .env
```

### 2. 의존성 설치
```bash
npm install  # 없다면 패키지들 수동 설치 필요
```

---

## 🧵 Threads 콘텐츠 생성

### 1주일치 콘텐츠 배치 생성
```bash
node generate-threads-batch.js batch
```

### 특정 타입 대량 생성
```bash
node generate-threads-batch.js type [타입] [개수]
```

**사용 가능한 타입:**
- `productivity_tip` - 생산성 팁
- `feature_showcase` - 기능 소개
- `user_story` - 사용자 성공 사례
- `behind_scenes` - 개발 뒷이야기
- `question_engagement` - 질문/토론

**예시:**
```bash
# 생산성 팁 10개 생성
node generate-threads-batch.js type productivity_tip 10

# 기능 소개 5개 생성
node generate-threads-batch.js type feature_showcase 5
```

### ✨ 생성되는 콘텐츠 특징
- **280자 제한** 준수 (실제로는 250자 목표)
- **Tiger PM 페르소나** 적용
- **annotateshot.com** 링크 포함
- **구체적 활용 사례** 중심:
  - 빠른 번호 주석 달기
  - 도형으로 UI 요소 강조
  - 모바일 급한 편집
  - 로컬 처리 (프라이버시)
  - 포토샵보다 빠른 작업
  - IT 개발자 워크플로우

---

## 📝 Reddit 마케팅

### 콘텐츠 생성
```bash
node community-marketing-agent.js reddit [서브레딧] [타입]
```

### 자동 포스팅
```bash
node community-marketing-agent.js reddit [서브레딧] [타입] --post
```

**콘텐츠 타입:**
- `helpful_post` - 도움되는 포스트 (250-400단어)
- `tutorial_post` - 튜토리얼/개발 인사이트 (300-450단어)
- `comment_reply` - 댓글 답변 3개 생성 (각 100단어 이하)

**추천 서브레딧:**
```bash
# 생산성 관련
node community-marketing-agent.js reddit r/productivity helpful_post

# 웹개발 관련  
node community-marketing-agent.js reddit r/webdev tutorial_post

# 자바스크립트 관련
node community-marketing-agent.js reddit r/javascript helpful_post

# 디자인 도구 관련
node community-marketing-agent.js reddit r/DesignPorn comment_reply
```

### ⚠️ 주의사항
- `--post` 플래그는 실제 Reddit에 포스팅됩니다
- Reddit API 제한: 하루 100개 포스트
- 스팸 방지를 위해 시간 간격 두고 포스팅

---

## 📊 Google Sheets 연동

### 설정 방법
1. **Google Sheets 생성**
   - 새 스프레드시트 생성
   - URL에서 스프레드시트 ID 복사

2. **Google Apps Script 설정**
   - `script.google.com` 방문
   - `google-apps-script.js` 코드 붙여넣기
   - `SPREADSHEET_ID` 변경
   - 웹앱으로 배포 (Anyone 액세스)

3. **환경변수 설정**
   ```bash
   GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

### 자동 업로드
Threads 콘텐츠 생성 시 자동으로 Google Sheets에 저장:
- 날짜, 요일, 콘텐츠 타입
- 글자수, 상태 (사용가능/편집필요)
- 콘텐츠 본문, 해시태그
- 통계 시트 자동 업데이트

---

## 🔑 API 키 설정

### 필수 API 키

#### Gemini API
```bash
GEMINI_API_KEY=your_gemini_api_key
```
- [aistudio.google.com](https://aistudio.google.com) 에서 발급
- 콘텐츠 생성에 필수

#### Reddit API  
```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_REFRESH_TOKEN=your_refresh_token
```
- [reddit.com/prefs/apps](https://reddit.com/prefs/apps) 에서 앱 생성
- OAuth 인증 필요

### 선택 API 키

#### Google Sheets
```bash
GOOGLE_SHEETS_WEBAPP_URL=your_webapp_url
```
- 콘텐츠 자동 저장용

#### Google Analytics (사용 안 함)
```bash
GOOGLE_ANALYTICS_API_KEY=not_needed_for_ga4
```
- 현재 미사용, 더미값으로 둠

---

## 📈 사용 시나리오

### 주간 콘텐츠 계획
1. **월요일**: 1주일치 Threads 콘텐츠 생성
   ```bash
   node generate-threads-batch.js batch
   ```

2. **화요일**: Reddit 커뮤니티 마케팅
   ```bash
   node community-marketing-agent.js reddit r/productivity helpful_post --post
   ```

3. **수요일**: 특정 타입 추가 생성
   ```bash
   node generate-threads-batch.js type user_story 5
   ```

4. **목요일**: 다른 서브레딧 공략
   ```bash
   node community-marketing-agent.js reddit r/webdev tutorial_post --post
   ```

5. **금요일**: Google Sheets 데이터 확인 및 분석

### 대량 콘텐츠 생성
```bash
# 각 타입별 10개씩 생성
for type in productivity_tip feature_showcase user_story behind_scenes question_engagement; do
  node generate-threads-batch.js type $type 10
  sleep 5  # API 제한 고려
done
```

---

## 🔧 문제 해결

### Google Sheets 업로드 오류
- **Issue #65**: 업로드는 되지만 응답 파싱 실패
- **해결책**: 기능은 정상, 추후 수정 예정

### Reddit API 오류
```bash
# 인증 상태 확인
node -e "console.log('Reddit API:', process.env.REDDIT_CLIENT_ID ? '✅' : '❌')"
```

### Gemini API 제한
- 하루 1000회 제한
- 요청 간 1초 대기 권장

---

## 📞 지원

문제가 있으면:
1. 환경변수 설정 재확인
2. API 키 유효성 검사
3. 네트워크 연결 확인
4. GitHub Issue 등록

---

**🎯 일관성이 핵심입니다! 매일 꾸준히 콘텐츠를 생성하고 포스팅하세요.**