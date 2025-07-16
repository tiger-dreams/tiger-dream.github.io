# Chrome Extension ZIP 패키징 가이드

## ZIP 파일에 포함되어야 하는 파일들

### ✅ 필수 파일 (ZIP에 포함)
```
annotateshot-capture-extension.zip
├── manifest.json           # 확장 프로그램 설정
├── background.js           # 서비스 워커
├── content-script.js       # 콘텐츠 스크립트
├── popup.html             # 팝업 UI
├── popup.js               # 팝업 스크립트
├── icon-16.svg            # 16x16 아이콘
├── icon-48.svg            # 48x48 아이콘
└── icon-128.svg           # 128x128 아이콘
```

### ❌ ZIP에 포함하지 않는 파일들
- `chrome-web-store-listing.md` (제출 정보용)
- `english-listing.md` (제출 정보용)
- `privacy-policy.md` (웹사이트 업로드용)
- `screenshot-guide.md` (가이드용)
- `packaging-guide.md` (이 파일)
- `icon.svg` (원본 파일, 불필요)

## ZIP 파일 생성 방법

### 방법 1: 명령어 사용
```bash
cd /Users/user/tiger-dream.github.io/extension

# 필요한 파일만 ZIP으로 패키징
zip -r annotateshot-capture-extension.zip \
  manifest.json \
  background.js \
  content-script.js \
  popup.html \
  popup.js \
  icon-16.svg \
  icon-48.svg \
  icon-128.svg
```

### 방법 2: 폴더 생성 후 ZIP
```bash
# 제출용 폴더 생성
mkdir extension-package
cd extension-package

# 필요한 파일들 복사
cp ../manifest.json .
cp ../background.js .
cp ../content-script.js .
cp ../popup.html .
cp ../popup.js .
cp ../icon-16.svg .
cp ../icon-48.svg .
cp ../icon-128.svg .

# ZIP 파일 생성
cd ..
zip -r annotateshot-capture-extension.zip extension-package/
```

## 제출 전 확인사항

### 파일 검증
- [ ] manifest.json 파일 포함 및 문법 오류 없음
- [ ] 모든 JavaScript 파일 포함
- [ ] 모든 HTML 파일 포함
- [ ] 필요한 아이콘 파일 모두 포함 (16, 48, 128px)
- [ ] 불필요한 파일 제외 (문서, 가이드 등)

### 크기 제한
- ZIP 파일 크기: 최대 128MB
- 압축 해제 시 크기: 최대 128MB
- 현재 예상 크기: 약 50KB (매우 작음)

### 파일 구조 검증
```
# ZIP 파일 내용 확인
unzip -l annotateshot-capture-extension.zip

# 예상 출력:
# manifest.json
# background.js  
# content-script.js
# popup.html
# popup.js
# icon-16.svg
# icon-48.svg
# icon-128.svg
```

## Chrome Web Store 제출 단계

### 1. 개발자 계정 준비
- Google 계정 필요
- Chrome Web Store 개발자 등록 ($5 일회성 비용)
- 개발자 계정 인증 완료

### 2. 확장 프로그램 업로드
1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 접속
2. "새 항목 추가" 클릭
3. ZIP 파일 업로드
4. 스토어 등록 정보 입력

### 3. 스토어 등록 정보 입력
- **설명**: chrome-web-store-listing.md 내용 사용
- **스크린샷**: screenshot-guide.md 가이드 참고
- **아이콘**: ZIP에 포함된 아이콘 자동 인식
- **개인정보처리방침**: privacy-policy.md를 웹사이트에 업로드 후 URL 입력

### 4. 검토 및 게시
- 자동 검토: 몇 분 내 완료
- 수동 검토: 보통 1-3일 소요
- 승인 후 자동 게시

## 주의사항

### 보안 검토
- 코드 난독화 금지 (리뷰 거부 사유)
- 외부 코드 삽입 금지
- 최소 권한 원칙 준수

### 정책 준수
- 사용자 데이터 최소 수집
- 명확한 기능 설명
- 스팸성 키워드 금지

### 일반적인 거부 사유
- 설명과 기능 불일치
- 개인정보처리방침 부재
- 스크린샷 품질 불량
- 불필요한 권한 요청

## 긴급 수정 필요사항

### manifest.json 확인
- 개발 환경 URL 제거 필요 (http://127.0.0.1:5500)
- 운영 환경만 남겨두기

### 최종 테스트
- 로컬에서 확장 프로그램 로드 테스트
- 모든 기능 정상 작동 확인
- 다양한 웹사이트에서 테스트

## 제출 후 관리

### 업데이트 프로세스
1. 버전 번호 증가 (manifest.json)
2. 새 ZIP 파일 생성
3. 개발자 대시보드에서 업데이트 업로드
4. 검토 및 자동 배포

### 사용자 피드백 관리
- 리뷰 및 평점 모니터링
- 버그 리포트 대응
- 기능 개선 요청 검토