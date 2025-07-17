# Chrome Extension 아이콘 변환 가이드

## 🚨 문제 상황
Chrome Extension에서 SVG 아이콘이 표시되지 않는 문제

## 💡 해결 방법
SVG 아이콘을 PNG로 변환 필요

## 📋 작업 단계

### 1. SVG to PNG 변환
다음 파일들을 PNG로 변환:
- `icon-16.svg` → `icon-16.png`
- `icon-48.svg` → `icon-48.png`
- `icon-128.svg` → `icon-128.png`

### 2. 변환 방법 옵션

#### 옵션 A: 제공된 HTML 변환기 사용
```bash
# 브라우저에서 파일 열기
open /Users/user/tiger-dream.github.io/extension/svg-to-png-converter.html
```

#### 옵션 B: 온라인 도구 사용
- **Convertio**: https://convertio.co/svg-png/
- **CloudConvert**: https://cloudconvert.com/svg-to-png
- **FreeConvert**: https://www.freeconvert.com/svg-to-png

#### 옵션 C: 명령어 도구 사용 (macOS)
```bash
# ImageMagick 설치 후
brew install imagemagick
magick icon-16.svg icon-16.png
magick icon-48.svg icon-48.png
magick icon-128.svg icon-128.png
```

### 3. manifest.json 수정
변환 후 아이콘 경로를 PNG로 변경:

```json
{
  "icons": {
    "16": "icon-16.png",
    "48": "icon-48.png", 
    "128": "icon-128.png"
  },
  "action": {
    "default_icon": {
      "16": "icon-16.png",
      "48": "icon-48.png",
      "128": "icon-128.png"
    }
  }
}
```

### 4. 새로운 ZIP 패키지 생성
```bash
cd /Users/user/tiger-dream.github.io/extension

# 새로운 ZIP 파일 생성
zip -r annotateshot-capture-extension-v2.zip \
  manifest.json \
  background.js \
  content-script.js \
  popup.html \
  popup.js \
  icon-16.png \
  icon-48.png \
  icon-128.png
```

### 5. 확장 프로그램 테스트
1. Chrome 확장 프로그램 관리 페이지에서 "개발자 모드" 활성화
2. "압축해제된 확장 프로그램을 로드합니다" 클릭
3. extension 폴더 선택
4. 아이콘이 정상 표시되는지 확인

### 6. Chrome Web Store 업데이트
PNG 변환 완료 후:
1. 새로운 ZIP 파일로 확장 프로그램 업데이트
2. 버전 번호 증가 (1.0.0 → 1.0.1)
3. 업데이트 제출

## 🔧 지원되는 아이콘 형식
- ✅ PNG (권장)
- ✅ JPG
- ✅ GIF
- ✅ BMP
- ✅ ICO
- ❌ SVG (지원 안 됨)

## 📏 아이콘 크기 요구사항
- **16x16**: 브라우저 툴바 (필수)
- **48x48**: 확장 프로그램 관리 페이지 (필수)
- **128x128**: Chrome Web Store (필수)

## 🎯 최적화 팁
1. **PNG 압축**: TinyPNG 등으로 파일 크기 최적화
2. **투명 배경**: 원형 아이콘의 경우 투명 배경 사용
3. **고화질**: 선명한 아이콘을 위해 고화질 유지
4. **일관성**: 모든 크기에서 일관된 디자인 유지

## 🚀 빠른 해결책
가장 빠른 방법은 온라인 변환기 사용:
1. https://convertio.co/svg-png/ 접속
2. 3개 SVG 파일 업로드
3. PNG로 변환 및 다운로드
4. manifest.json 수정
5. 확장 프로그램 재로드