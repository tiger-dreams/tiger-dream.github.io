// content-script.js - 웹페이지에 주입되는 스크립트

console.log('AnnotateShot Content Script 로드됨');

// 전역 변수
let isCapturing = false;
let isPartialCapturing = false;
let selectionOverlay = null;
let selectionBox = null;
let startX = 0;
let startY = 0;
let isSelecting = false;

// 메시지 전송 재시도 함수
async function sendMessageWithRetry(message, maxRetries = 3, delay = 500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`메시지 전송 시도 ${attempt}/${maxRetries}:`, message.action);
            
            const response = await new Promise((resolve, reject) => {
                // runtime이 유효한지 확인
                if (!chrome.runtime || !chrome.runtime.sendMessage) {
                    reject(new Error('Chrome runtime이 사용할 수 없습니다'));
                    return;
                }
                
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn(`시도 ${attempt} 실패:`, chrome.runtime.lastError.message);
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });
            
            console.log(`메시지 전송 성공 (시도 ${attempt}):`, response?.success ? '성공' : '실패');
            return response;
            
        } catch (error) {
            console.warn(`메시지 전송 시도 ${attempt} 실패:`, error.message);
            
            if (attempt === maxRetries) {
                throw new Error(`${maxRetries}회 시도 후 메시지 전송 실패: ${error.message}`);
            }
            
            // 다음 시도 전 대기
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
}

// 확장 프로그램 상태 확인 함수
function checkExtensionHealth() {
    try {
        return chrome.runtime && chrome.runtime.id && !chrome.runtime.lastError;
    } catch (error) {
        console.error('확장 프로그램 상태 확인 실패:', error);
        return false;
    }
}

// 스크롤 완료 대기 함수
async function waitForScrollComplete(targetY) {
    return new Promise(resolve => {
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkScroll = () => {
            const currentY = window.scrollY;
            attempts++;
            
            if (Math.abs(currentY - targetY) <= 5 || attempts >= maxAttempts) {
                // 목표 위치에 도달하거나 최대 시도 횟수 초과
                setTimeout(resolve, 200); // 추가 안정화 시간
            } else {
                setTimeout(checkScroll, 50); // 50ms 후 재확인
            }
        };
        
        setTimeout(checkScroll, 100); // 초기 대기 시간
    });
}

// 사이트별 특성 감지 함수
function detectSiteSpecificSettings() {
    const hostname = window.location.hostname;
    const settings = {
        siteName: hostname,
        needsExtraScrollBuffer: false,
        customScrollDelay: 200,
        hasComplexFooter: false
    };
    
    // 사이트별 특성 설정
    if (hostname.includes('naver.com')) {
        settings.needsExtraScrollBuffer = true;
        settings.customScrollDelay = 300;
        settings.hasComplexFooter = true;
        console.log('Naver.com 특성 적용: 추가 스크롤 버퍼 및 긴 지연시간');
    } else if (hostname.includes('clien.net')) {
        settings.customScrollDelay = 150;
        console.log('Clien.net 특성 적용: 짧은 지연시간');
    } else if (hostname.includes('tistory.com') || hostname.includes('blog.')) {
        settings.hasComplexFooter = true;
        console.log('블로그 사이트 특성 적용: 복잡한 footer 구조');
    }
    
    return settings;
}

// 실제 최대 스크롤 위치 확인 함수 (사이트별 조정 포함)
async function getActualMaxScrollY(calculatedMaxScrollY, viewportHeight) {
    const originalScrollY = window.scrollY;
    const siteSettings = detectSiteSpecificSettings();
    
    try {
        console.log('실제 최대 스크롤 위치 확인 중... (사이트:', siteSettings.siteName + ')');
        
        // 계산된 최대 위치로 스크롤 시도
        window.scrollTo({ top: calculatedMaxScrollY, behavior: 'instant' });
        await new Promise(resolve => setTimeout(resolve, siteSettings.customScrollDelay));
        
        let actualMaxScrollY = window.scrollY;
        console.log('첫 번째 시도 결과:', actualMaxScrollY);
        
        // 사이트별 추가 테스트 위치 설정
        const baseTestPositions = [
            calculatedMaxScrollY + viewportHeight * 0.5,
            calculatedMaxScrollY + viewportHeight,
            calculatedMaxScrollY + viewportHeight * 1.5,
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        ];
        
        // 복잡한 footer가 있는 사이트는 추가 버퍼 적용
        if (siteSettings.hasComplexFooter) {
            baseTestPositions.push(
                calculatedMaxScrollY + viewportHeight * 2,
                calculatedMaxScrollY + viewportHeight * 2.5
            );
            console.log('복잡한 footer 감지, 추가 테스트 위치 추가');
        }
        
        for (const testY of baseTestPositions) {
            window.scrollTo({ top: testY, behavior: 'instant' });
            await new Promise(resolve => setTimeout(resolve, siteSettings.customScrollDelay));
            
            const newScrollY = window.scrollY;
            if (newScrollY > actualMaxScrollY) {
                actualMaxScrollY = newScrollY;
                console.log('더 큰 스크롤 위치 발견:', actualMaxScrollY);
            }
            
            // 더 이상 스크롤되지 않으면 최대값에 도달
            if (newScrollY === actualMaxScrollY && testY > actualMaxScrollY + 100) {
                break;
            }
        }
        
        // 추가 버퍼가 필요한 사이트는 안전 마진 추가
        if (siteSettings.needsExtraScrollBuffer) {
            const bufferTest = actualMaxScrollY + viewportHeight * 0.1;
            window.scrollTo({ top: bufferTest, behavior: 'instant' });
            await new Promise(resolve => setTimeout(resolve, siteSettings.customScrollDelay));
            
            const finalScrollY = window.scrollY;
            if (finalScrollY > actualMaxScrollY) {
                actualMaxScrollY = finalScrollY;
                console.log('추가 버퍼로 발견된 최대 위치:', actualMaxScrollY);
            }
        }
        
        console.log('실제 최대 스크롤 위치 확인 완료:', actualMaxScrollY);
        return actualMaxScrollY;
        
    } finally {
        // 원래 위치로 복원
        window.scrollTo({ top: originalScrollY, behavior: 'instant' });
        await new Promise(resolve => setTimeout(resolve, siteSettings.customScrollDelay));
    }
}

// 백그라운드 스크립트로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log('Content script에서 메시지 수신:', request.action);
    
    try {
        if (request.action === 'ping') {
            // Content script가 준비되었음을 알림
            console.log('Ping 요청 수신, 응답 전송');
            sendResponse({ success: true, message: 'Content script ready' });
            return false;
        } else if (request.action === 'startFullPageCapture') {
            console.log('전체 페이지 캡처 요청 수신');
            startFullPageCapture()
                .then(result => {
                    console.log('전체 페이지 캡처 결과:', result);
                    sendResponse(result);
                })
                .catch(error => {
                    console.error('전체 페이지 캡처 오류:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // 비동기 응답을 위해 필요
        } else if (request.action === 'startPartialCapture') {
            console.log('부분 캡처 요청 수신');
            startPartialCapture()
                .then(result => {
                    console.log('부분 캡처 결과:', result);
                    sendResponse(result);
                })
                .catch(error => {
                    console.error('부분 캡처 오류:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        } else {
            console.log('알 수 없는 액션:', request.action);
            sendResponse({ success: false, error: '알 수 없는 액션' });
            return false;
        }
    } catch (error) {
        console.error('메시지 처리 중 오류:', error);
        sendResponse({ success: false, error: error.message });
        return false;
    }
});

// 전체 페이지 캡처 시작 (고정 요소 처리 개선)
async function startFullPageCapture() {
    try {
        if (isCapturing) {
            return { success: false, error: '이미 캡처 중입니다.' };
        }
        
        // 확장 프로그램 상태 확인
        if (!checkExtensionHealth()) {
            throw new Error('확장 프로그램이 비활성화되었거나 연결이 끊어졌습니다.');
        }
        
        isCapturing = true;
        console.log('전체 페이지 캡처 시작...');
        
        // 고정 요소들 감지
        const fixedElements = detectFixedElements();
        console.log(`감지된 고정 요소: ${fixedElements.length}개`);
        
        // 고정 요소를 임시로 숨길지 결정 (3개 이상이면 숨김 방식 사용)
        const useHideMethod = fixedElements.length >= 3;
        let hiddenElements = [];
        
        if (useHideMethod) {
            console.log('고정 요소가 많아 임시 숨김 방식 사용');
            hiddenElements = hideFixedElements(fixedElements);
            // 숨김 처리 후 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        try {
            // 페이지 전체 높이 계산 (더 정확한 방법)
            const documentHeight = Math.max(
                document.body.scrollHeight || 0,
                document.body.offsetHeight || 0,
                document.documentElement.clientHeight || 0,
                document.documentElement.scrollHeight || 0,
                document.documentElement.offsetHeight || 0
            );
            
            const viewportHeight = window.innerHeight;
            const originalScrollY = window.scrollY;
            
            // 실제 스크롤 가능한 최대 높이 계산 (더 정확한 방법)
            const maxScrollY = Math.max(0, documentHeight - viewportHeight);
            
            // 실제 스크롤 테스트로 정확한 최대 스크롤 위치 확인
            const actualMaxScrollY = await getActualMaxScrollY(maxScrollY, viewportHeight);
            
            console.log('페이지 정보:', { 
                documentHeight, 
                viewportHeight, 
                maxScrollY,
                actualMaxScrollY,
                originalScrollY,
                useHideMethod
            });
            
            // 스크롤 단위로 캡처할 이미지 데이터 배열
            const captures = [];
            
            // 더 정확한 캡처 횟수 계산 (실제 최대 스크롤 위치 사용)
            const maxCaptures = Math.min(Math.ceil(actualMaxScrollY / viewportHeight) + 1, 30);
            
            for (let i = 0; i < maxCaptures; i++) {
                let y = i * viewportHeight;
                
                // 마지막 캡처에서는 실제 최대 스크롤 위치로 조정
                if (i === maxCaptures - 1 && y < actualMaxScrollY) {
                    y = actualMaxScrollY;
                }
                
                // 이미 캡처한 위치면 건너뛰기
                if (i > 0 && y <= captures[captures.length - 1]?.scrollY) {
                    continue;
                }
                
                // 스크롤 이동
                window.scrollTo({
                    top: y,
                    behavior: 'instant'
                });
                
                console.log(`스크롤 위치: ${y} (${i + 1}/${maxCaptures})`);
                
                // 스크롤 완료까지 대기 (더 안정적인 방법)
                await waitForScrollComplete(y);
                
                try {
                    // 현재 화면 캡처 요청 (재시도 로직 포함)
                    const captureData = await sendMessageWithRetry({
                        action: 'captureCurrentView'
                    }, 3); // 최대 3회 재시도
                    
                    if (captureData && captureData.success) {
                        captures.push({
                            dataUrl: captureData.dataUrl,
                            scrollY: y
                        });
                        console.log(`캡처 ${i + 1}/${maxCaptures} 완료`);
                    } else {
                        console.warn(`캡처 ${i + 1} 실패:`, captureData?.error);
                    }
                } catch (captureError) {
                    console.error(`캡처 ${i + 1} 실패:`, captureError);
                    // 캡처 실패해도 계속 진행
                }
            }
            
            // 원래 스크롤 위치로 복원
            window.scrollTo({
                top: originalScrollY,
                behavior: 'instant'
            });
            
            if (captures.length === 0) {
                throw new Error('캡처된 이미지가 없습니다.');
            }
            
            console.log(`총 ${captures.length}개 이미지 캡처 완료, 합성 시작`);
            
            // 이미지 합성 (숨김 방식을 사용했다면 헤더 처리 안 함)
            const mergedImage = await mergeVerticalImages(captures, documentHeight, viewportHeight, useHideMethod);
            
            // 이미지 크기 확인 및 압축
            const optimizedImage = await optimizeImageSize(mergedImage);
            
            // 백그라운드에 완료 알림
            await sendMessageWithRetry({
                action: 'captureCompleted',
                imageData: optimizedImage
            });
            
            isCapturing = false;
            return { success: true };
            
        } finally {
            // 고정 요소 복원 (캡처 성공/실패 관계없이 실행)
            if (useHideMethod && hiddenElements.length > 0) {
                console.log('고정 요소 복원 중...');
                restoreFixedElements(hiddenElements);
            }
        }
        
    } catch (error) {
        isCapturing = false;
        console.error('전체 페이지 캡처 오류:', error);
        return { success: false, error: error.message };
    }
}

// 고정 요소 감지 함수 (개선된 버전)
function detectFixedElements() {
    const fixedElements = [];
    const elements = document.querySelectorAll('*');
    
    elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const position = style.position;
        
        // position: fixed 또는 sticky인 요소들 감지
        if (position === 'fixed' || position === 'sticky') {
            const rect = el.getBoundingClientRect();
            
            // 충분히 큰 요소만 대상 (최소 크기 조건)
            if (rect.width > 50 && rect.height > 10) {
                const top = parseFloat(style.top) || 0;
                const bottom = parseFloat(style.bottom) || 0;
                const left = parseFloat(style.left) || 0;
                const right = parseFloat(style.right) || 0;
                
                fixedElements.push({
                    element: el,
                    position: position,
                    rect: rect,
                    style: {
                        top: top,
                        bottom: bottom,
                        left: left,
                        right: right,
                        zIndex: parseInt(style.zIndex) || 0
                    },
                    // 원본 스타일 백업
                    originalDisplay: el.style.display,
                    originalVisibility: el.style.visibility
                });
            }
        }
    });
    
    // z-index와 위치에 따라 정렬
    fixedElements.sort((a, b) => {
        // 먼저 z-index로 정렬
        if (a.style.zIndex !== b.style.zIndex) {
            return b.style.zIndex - a.style.zIndex;
        }
        // 그 다음 크기로 정렬
        return (b.rect.width * b.rect.height) - (a.rect.width * a.rect.height);
    });
    
    return fixedElements;
}

// 상단 고정 헤더만 감지 (기존 호환성을 위해 유지)
function detectStickyHeaders() {
    const allFixedElements = detectFixedElements();
    
    // 상단에 위치한 고정 요소만 필터링
    const topFixedElements = allFixedElements.filter(item => {
        const rect = item.rect;
        return rect.top <= 150 && rect.top >= -50; // 상단 150px 이내, 약간의 음수값도 허용
    });
    
    // 가장 큰(높이 기준) 상단 고정 헤더 반환
    if (topFixedElements.length > 0) {
        const largest = topFixedElements.reduce((prev, current) => {
            return current.rect.height > prev.rect.height ? current : prev;
        });
        
        return {
            element: largest.element,
            height: largest.rect.height,
            top: largest.rect.top
        };
    }
    
    return null;
}

// 고정 요소들을 임시로 숨기는 함수
function hideFixedElements(elements) {
    const hiddenElements = [];
    
    elements.forEach(item => {
        try {
            // 백업 정보 저장
            hiddenElements.push({
                element: item.element,
                originalDisplay: item.element.style.display,
                originalVisibility: item.element.style.visibility
            });
            
            // 요소 숨기기 (display: none 대신 visibility: hidden 사용으로 레이아웃 유지)
            item.element.style.visibility = 'hidden';
        } catch (error) {
            console.warn('고정 요소 숨기기 실패:', error);
        }
    });
    
    return hiddenElements;
}

// 숨겨진 고정 요소들을 복원하는 함수
function restoreFixedElements(hiddenElements) {
    hiddenElements.forEach(item => {
        try {
            item.element.style.display = item.originalDisplay;
            item.element.style.visibility = item.originalVisibility;
        } catch (error) {
            console.warn('고정 요소 복원 실패:', error);
        }
    });
}

// 이미지 콘텐츠 기반 겹침 감지 함수
function detectImageOverlap(prevImg, currentImg, maxSearchHeight = 200) {
    const canvas1 = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    
    canvas1.width = prevImg.width;
    canvas1.height = Math.min(maxSearchHeight, prevImg.height);
    canvas2.width = currentImg.width;
    canvas2.height = Math.min(maxSearchHeight, currentImg.height);
    
    // 이전 이미지의 하단부 추출
    const prevBottomHeight = Math.min(maxSearchHeight, prevImg.height);
    ctx1.drawImage(
        prevImg,
        0, prevImg.height - prevBottomHeight, prevImg.width, prevBottomHeight,
        0, 0, prevImg.width, prevBottomHeight
    );
    
    // 현재 이미지의 상단부 추출
    const currentTopHeight = Math.min(maxSearchHeight, currentImg.height);
    ctx2.drawImage(
        currentImg,
        0, 0, currentImg.width, currentTopHeight,
        0, 0, currentImg.width, currentTopHeight
    );
    
    const imageData1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
    const imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
    
    // 가로 방향 평균 색상 계산하여 비교 (더 빠른 처리)
    const rowAverages1 = [];
    const rowAverages2 = [];
    
    for (let y = 0; y < Math.min(imageData1.height, imageData2.height); y++) {
        let r1 = 0, g1 = 0, b1 = 0;
        let r2 = 0, g2 = 0, b2 = 0;
        
        for (let x = 0; x < Math.min(imageData1.width, imageData2.width); x++) {
            const idx = (y * imageData1.width + x) * 4;
            r1 += imageData1.data[idx];
            g1 += imageData1.data[idx + 1];
            b1 += imageData1.data[idx + 2];
            r2 += imageData2.data[idx];
            g2 += imageData2.data[idx + 1];
            b2 += imageData2.data[idx + 2];
        }
        
        const width = Math.min(imageData1.width, imageData2.width);
        rowAverages1.push([r1/width, g1/width, b1/width]);
        rowAverages2.push([r2/width, g2/width, b2/width]);
    }
    
    // 겹치는 영역 찾기 (상단부터 일치하는 줄 수 계산)
    let overlapHeight = 0;
    const threshold = 10; // 색상 차이 허용 범위
    
    for (let i = 0; i < Math.min(rowAverages1.length, rowAverages2.length); i++) {
        const [r1, g1, b1] = rowAverages1[rowAverages1.length - 1 - i];
        const [r2, g2, b2] = rowAverages2[i];
        
        const diff = Math.sqrt(Math.pow(r1-r2, 2) + Math.pow(g1-g2, 2) + Math.pow(b1-b2, 2));
        
        if (diff < threshold) {
            overlapHeight = i + 1;
        } else {
            break;
        }
    }
    
    console.log(`이미지 콘텐츠 기반 겹침 감지: ${overlapHeight}px`);
    return overlapHeight;
}

// 정확한 겹침을 고려한 캔버스 높이 계산 함수 (개선된 버전)
function calculateActualCanvasHeight(images, headerHeight, skipHeaderProcessing) {
    if (images.length === 0) return 0;
    
    // 첫 번째 이미지는 전체 높이
    let totalHeight = images[0].img.height;
    
    // 나머지 이미지들은 콘텐츠 기반 겹침을 계산해서 추가
    for (let i = 1; i < images.length; i++) {
        const currentImg = images[i].img;
        const currentScrollY = images[i].scrollY;
        const prevImg = images[i - 1].img;
        const prevScrollY = images[i - 1].scrollY;
        
        // 1. 스크롤 위치 기반 겹침 계산 (기존 방식)
        const prevImageEnd = prevScrollY + prevImg.height;
        const currentImageStart = currentScrollY;
        const scrollBasedOverlap = Math.max(0, prevImageEnd - currentImageStart);
        
        // 2. 이미지 콘텐츠 기반 겹침 감지 (새로운 방식)
        const contentBasedOverlap = detectImageOverlap(prevImg, currentImg);
        
        // 3. 두 방식 중 더 정확한 것 선택
        let finalOverlap;
        if (Math.abs(scrollBasedOverlap - contentBasedOverlap) < 50) {
            // 두 값이 비슷하면 콘텐츠 기반 사용 (더 정확)
            finalOverlap = contentBasedOverlap;
            console.log(`이미지 ${i}: 스크롤 기반=${scrollBasedOverlap}px, 콘텐츠 기반=${contentBasedOverlap}px → 콘텐츠 기반 사용`);
        } else {
            // 큰 차이가 나면 더 작은 값 사용 (보수적 접근)
            finalOverlap = Math.min(scrollBasedOverlap, contentBasedOverlap);
            console.log(`이미지 ${i}: 스크롤 기반=${scrollBasedOverlap}px, 콘텐츠 기반=${contentBasedOverlap}px → 작은 값(${finalOverlap}px) 사용`);
        }
        
        let effectiveHeight = currentImg.height - finalOverlap;
        
        // 고정 헤더 추가 처리
        if (!skipHeaderProcessing && headerHeight > 0) {
            if (finalOverlap < headerHeight) {
                const additionalHeaderRemoval = headerHeight - finalOverlap;
                effectiveHeight -= additionalHeaderRemoval;
                console.log(`이미지 ${i}: 헤더 추가 제거 ${additionalHeaderRemoval}px`);
            }
        }
        
        if (effectiveHeight > 0) {
            totalHeight += effectiveHeight;
        }
        
        console.log(`이미지 ${i}: 최종 겹침=${finalOverlap}px, 유효높이=${effectiveHeight}px`);
    }
    
    console.log(`캔버스 높이 계산 완료: ${totalHeight}px (이미지 ${images.length}개, 헤더 ${headerHeight}px)`);
    return totalHeight;
}

// 이미지 세로 합성 함수 (고정 헤더 처리 포함)
async function mergeVerticalImages(captures, totalHeight, _viewportHeight, skipHeaderProcessing = false) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let headerHeight = 0;
        let stickyHeader = null;
        
        // 고정 요소를 숨기는 방식을 사용했다면 헤더 처리 건너뛰기
        if (!skipHeaderProcessing) {
            stickyHeader = detectStickyHeaders();
            headerHeight = stickyHeader ? stickyHeader.height : 0;
            console.log('고정 헤더 감지:', stickyHeader ? `높이 ${headerHeight}px` : '없음');
        } else {
            console.log('고정 요소 숨김 방식 사용으로 헤더 처리 건너뛰기');
        }
        
        // 첫 번째 이미지로 캔버스 크기 설정
        const firstImage = new Image();
        firstImage.onload = () => {
            canvas.width = firstImage.width;
            
            // 캔버스 높이 설정 (정확한 겹침 처리에 맞게 동적 계산)
            if (skipHeaderProcessing) {
                // 고정 요소를 숨겼으므로 전체 높이 사용
                canvas.height = totalHeight;
            } else {
                // 실제 합성될 높이를 정확히 계산
                let calculatedHeight = 0;
                
                // 임시로 이미지들을 로드해서 실제 합성될 높이 계산
                const tempImages = [];
                let loadCount = 0;
                
                captures.forEach((capture, index) => {
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        tempImages[index] = { img: tempImg, scrollY: capture.scrollY };
                        loadCount++;
                        
                        if (loadCount === captures.length) {
                            // 모든 임시 이미지 로드 완료, 높이 계산
                            calculatedHeight = calculateActualCanvasHeight(tempImages, headerHeight, skipHeaderProcessing);
                            console.log('계산된 실제 캔버스 높이:', calculatedHeight);
                            canvas.height = calculatedHeight;
                            
                            // 실제 합성 시작
                            startImageComposition();
                        }
                    };
                    tempImg.src = capture.dataUrl;
                });
                
                // 높이 계산이 완료되면 실제 합성을 시작하는 함수
                function startImageComposition() {
                    let loadedCount = 0;
                    const images = [];
                    
                    captures.forEach((capture, index) => {
                        const img = new Image();
                        img.onload = () => {
                            images[index] = { img, scrollY: capture.scrollY };
                            loadedCount++;
                            
                            if (loadedCount === captures.length) {
                                performActualComposition(images);
                            }
                        };
                        img.onerror = () => {
                            console.error(`이미지 ${index} 로드 실패`);
                            loadedCount++;
                            if (loadedCount === captures.length) {
                                reject(new Error('이미지 합성 실패'));
                            }
                        };
                        img.src = capture.dataUrl;
                    });
                }
                
                return; // 비동기 처리를 위해 여기서 리턴
            }
            
            // skipHeaderProcessing인 경우의 기존 로직 유지
            let loadedCount = 0;
            const images = [];
            
            function performActualComposition(finalImages) {
                console.log(`이미지 합성 시작... ${skipHeaderProcessing ? '(고정 요소 숨김 사용)' : '(고정 헤더 처리 포함)'}`);
                
                // 배경색으로 캔버스 초기화
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 단순하고 확실한 이미지 합성 (뷰포트 기반 연속 배치)
                console.log('=== 이미지 합성 시작 ===');
                console.log('합성할 이미지 정보:', finalImages.map(({scrollY, img}, i) => 
                    `이미지 ${i}: 스크롤=${scrollY}px, 크기=${img.width}x${img.height}px`
                ).join('\n'));
                console.log(`캔버스 크기: ${canvas.width}x${canvas.height}px`);
                console.log(`헤더 높이: ${headerHeight}px, 헤더 처리 건너뛰기: ${skipHeaderProcessing}`);
                
                let currentCanvasY = 0;
                
                finalImages.forEach(({ img, scrollY }, index) => {
                    console.log(`\n=== 이미지 ${index} 처리 ===`);
                    console.log(`scrollY: ${scrollY}, 이미지 크기: ${img.width}x${img.height}`);
                    
                    if (index === 0) {
                        // 첫 번째 이미지는 전체 사용
                        console.log('첫 번째 이미지 - 전체 사용');
                        ctx.drawImage(img, 0, 0);
                        currentCanvasY = img.height;
                    } else {
                        // 개선된 겹침 계산 사용
                        const prevScrollY = finalImages[index - 1].scrollY;
                        const prevImg = finalImages[index - 1].img;
                        
                        // 1. 스크롤 위치 기반 겹침 계산
                        const prevImageEnd = prevScrollY + prevImg.height;
                        const currentImageStart = scrollY;
                        const scrollBasedOverlap = Math.max(0, prevImageEnd - currentImageStart);
                        
                        // 2. 이미지 콘텐츠 기반 겹침 감지
                        const contentBasedOverlap = detectImageOverlap(prevImg, img);
                        
                        // 3. 최적의 겹침 값 선택
                        let finalOverlap;
                        if (Math.abs(scrollBasedOverlap - contentBasedOverlap) < 50) {
                            finalOverlap = contentBasedOverlap;
                            console.log(`이미지 ${index}: 스크롤 기반=${scrollBasedOverlap}px, 콘텐츠 기반=${contentBasedOverlap}px → 콘텐츠 기반 사용`);
                        } else {
                            finalOverlap = Math.min(scrollBasedOverlap, contentBasedOverlap);
                            console.log(`이미지 ${index}: 스크롤 기반=${scrollBasedOverlap}px, 콘텐츠 기반=${contentBasedOverlap}px → 작은 값(${finalOverlap}px) 사용`);
                        }
                        
                        console.log(`이전 이미지 끝: ${prevImageEnd}, 현재 이미지 시작: ${currentImageStart}`);
                        console.log(`최종 선택된 겹침: ${finalOverlap}px`);
                        
                        let srcY = finalOverlap;
                        let srcHeight = img.height - finalOverlap;
                        
                        // 고정 헤더 추가 처리
                        if (!skipHeaderProcessing && headerHeight > 0) {
                            // 겹침 제거 후에도 헤더가 남아있다면 추가 제거
                            if (srcY < headerHeight) {
                                console.log(`겹침 제거 후 남은 헤더: ${headerHeight - srcY}px 추가 제거`);
                                const additionalHeaderRemoval = headerHeight - srcY;
                                srcY = headerHeight;
                                srcHeight -= additionalHeaderRemoval;
                            }
                        }
                        
                        console.log(`최종 그리기: srcY=${srcY}, srcHeight=${srcHeight}, drawY=${currentCanvasY}`);
                        
                        if (srcHeight > 0) {
                            ctx.drawImage(
                                img,
                                0, srcY, img.width, srcHeight,
                                0, currentCanvasY, img.width, srcHeight
                            );
                            currentCanvasY += srcHeight;
                        } else {
                            console.log('유효한 새 콘텐츠 없음 (완전 겹침)');
                        }
                    }
                    
                    console.log(`현재 캔버스 Y 위치: ${currentCanvasY}`);
                });
                
                console.log(`이미지 합성 완료 ${skipHeaderProcessing ? '(고정 요소 숨김 방식)' : '(고정 헤더 처리됨)'}`);
                resolve(canvas.toDataURL('image/png'));
            }
            
            captures.forEach((capture, index) => {
                const img = new Image();
                img.onload = () => {
                    images[index] = { img, scrollY: capture.scrollY };
                    loadedCount++;
                    
                    if (loadedCount === captures.length) {
                        performActualComposition(images);
                    }
                };
                img.onerror = () => {
                    console.error(`이미지 ${index} 로드 실패`);
                    loadedCount++;
                    if (loadedCount === captures.length) {
                        reject(new Error('이미지 합성 실패'));
                    }
                };
                img.src = capture.dataUrl;
            });
        };
        
        firstImage.onerror = () => {
            reject(new Error('첫 번째 이미지 로드 실패'));
        };
        
        firstImage.src = captures[0].dataUrl;
    });
}

// 부분 영역 캡처 시작
async function startPartialCapture() {
    try {
        if (isPartialCapturing) {
            return { success: false, error: '이미 부분 캡처 중입니다.' };
        }
        
        isPartialCapturing = true;
        console.log('부분 영역 캡처 시작...');
        
        // 선택 오버레이 생성
        createSelectionOverlay();
        
        return { success: true, message: '영역을 드래그하여 선택하세요.' };
        
    } catch (error) {
        console.error('부분 캡처 시작 오류:', error);
        isPartialCapturing = false;
        return { success: false, error: error.message };
    }
}

// 선택 오버레이 생성
function createSelectionOverlay() {
    // 기존 오버레이가 있으면 제거
    removeSelectionOverlay();
    
    // 페이지의 최대 z-index 찾기
    const maxZIndex = Math.max(
        ...Array.from(document.querySelectorAll('*')).map(el => {
            const zIndex = parseInt(window.getComputedStyle(el).zIndex) || 0;
            return isNaN(zIndex) ? 0 : zIndex;
        })
    );
    
    // 충분히 큰 z-index 사용 (최대값 + 1000000)
    const overlayZIndex = Math.max(maxZIndex + 1000000, 2147483647 - 1000);
    
    console.log(`오버레이 z-index: ${overlayZIndex} (페이지 최대: ${maxZIndex})`);
    
    // 오버레이 컨테이너 생성
    selectionOverlay = document.createElement('div');
    selectionOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.3);
        z-index: ${overlayZIndex};
        cursor: crosshair;
        user-select: none;
    `;
    
    // 선택 박스 생성
    selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
        position: absolute;
        border: 2px dashed #3b82f6;
        background-color: rgba(59, 130, 246, 0.1);
        display: none;
        pointer-events: none;
    `;
    
    // 안내 텍스트 생성
    const instructionText = document.createElement('div');
    instructionText.textContent = '드래그하여 캡처할 영역을 선택하세요 (ESC: 취소)';
    instructionText.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        pointer-events: none;
        z-index: ${overlayZIndex + 1};
    `;
    
    selectionOverlay.appendChild(selectionBox);
    selectionOverlay.appendChild(instructionText);
    document.body.appendChild(selectionOverlay);
    
    // 이벤트 리스너 추가
    addSelectionEventListeners();
}

// 선택 이벤트 리스너 추가
function addSelectionEventListeners() {
    // 마우스 다운
    selectionOverlay.addEventListener('mousedown', handleMouseDown);
    
    // 마우스 무브
    document.addEventListener('mousemove', handleMouseMove);
    
    // 마우스 업
    document.addEventListener('mouseup', handleMouseUp);
    
    // ESC 키로 취소
    document.addEventListener('keydown', handleKeyDown);
}

// 마우스 다운 처리
function handleMouseDown(e) {
    if (!isPartialCapturing) return;
    
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
    
    e.preventDefault();
}

// 마우스 무브 처리
function handleMouseMove(e) {
    if (!isPartialCapturing || !isSelecting) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
}

// 마우스 업 처리
async function handleMouseUp() {
    if (!isPartialCapturing || !isSelecting) return;
    
    isSelecting = false;
    
    const rect = selectionBox.getBoundingClientRect();
    
    // 최소 크기 체크 (10x10 픽셀)
    if (rect.width < 10 || rect.height < 10) {
        console.log('선택 영역이 너무 작습니다.');
        return;
    }
    
    // 선택 완료, 캡처 진행
    await captureSelectedArea(rect);
}

// 키 다운 처리 (ESC로 취소)
function handleKeyDown(e) {
    if (e.key === 'Escape' && isPartialCapturing) {
        cancelPartialCapture();
    }
}

// 선택된 영역 캡처
async function captureSelectedArea(rect) {
    let hiddenElements = [];
    
    try {
        console.log('선택된 영역 캡처 중...', rect);
        
        // 고정 요소들 감지 및 숨김 (부분 캡처에서도 적용)
        const fixedElements = detectFixedElements();
        if (fixedElements.length > 0) {
            console.log(`부분 캡처에서 ${fixedElements.length}개 고정 요소 감지, 임시 숨김`);
            hiddenElements = hideFixedElements(fixedElements);
        }
        
        // 오버레이 임시 숨김
        selectionOverlay.style.display = 'none';
        
        // 잠시 대기 (오버레이 및 고정 요소가 완전히 숨겨지도록)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 현재 화면 캡처 요청 (재시도 로직 포함)
        const response = await sendMessageWithRetry({
            action: 'captureCurrentView'
        });
        
        if (!response || !response.success) {
            throw new Error(response?.error || '화면 캡처 실패');
        }
        
        // 캡처된 이미지를 캔버스에서 크롭
        const croppedImageData = await cropImage(response.dataUrl, rect);
        
        // 이미지 크기 최적화
        const optimizedImageData = await optimizeImageSize(croppedImageData);
        
        // 부분 캡처 완료를 백그라운드에 알림
        await sendMessageWithRetry({
            action: 'partialCaptureCompleted',
            imageData: optimizedImageData
        });
        
        // 정리
        removeSelectionOverlay();
        isPartialCapturing = false;
        
        console.log('부분 캡처 완료');
        
    } catch (error) {
        console.error('부분 캡처 오류:', error);
        removeSelectionOverlay();
        isPartialCapturing = false;
    } finally {
        // 고정 요소 복원 (성공/실패 관계없이)
        if (hiddenElements.length > 0) {
            console.log('부분 캡처에서 고정 요소 복원');
            restoreFixedElements(hiddenElements);
        }
    }
}

// 이미지 크롭
async function cropImage(dataUrl, rect) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 디바이스 픽셀 비율 고려
            const dpr = window.devicePixelRatio || 1;
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            
            // 선택된 영역만 그리기
            ctx.drawImage(
                img,
                rect.left * dpr, rect.top * dpr, rect.width * dpr, rect.height * dpr,
                0, 0, canvas.width, canvas.height
            );
            
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = dataUrl;
    });
}

// 이미지 크기 최적화 함수 (localStorage 제한 고려)
async function optimizeImageSize(dataUrl, maxSizeKB = 4000) { // 4MB로 줄임
    return new Promise((resolve) => {
        try {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 원본 크기
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // 현재 크기 확인
                let currentDataUrl = canvas.toDataURL('image/png');
                let currentSizeKB = Math.round(currentDataUrl.length / 1024);
                
                console.log('원본 이미지 크기:', currentSizeKB, 'KB', '(최대:', maxSizeKB, 'KB)');
                
                // 크기가 적당하면 그대로 반환
                if (currentSizeKB <= maxSizeKB) {
                    console.log('이미지 크기가 적당함, 최적화 건너뛰기');
                    resolve(currentDataUrl);
                    return;
                }
                
                // 크기가 크면 JPEG로 압축 시도
                console.log('이미지가 커서 JPEG로 압축 시도...');
                
                let quality = 0.9;
                let attempts = 0;
                const maxAttempts = 5;
                
                while (currentSizeKB > maxSizeKB && attempts < maxAttempts && quality > 0.3) {
                    currentDataUrl = canvas.toDataURL('image/jpeg', quality);
                    currentSizeKB = Math.round(currentDataUrl.length / 1024);
                    console.log(`압축 시도 ${attempts + 1}: 품질 ${quality}, 크기 ${currentSizeKB}KB`);
                    
                    quality -= 0.15;
                    attempts++;
                }
                
                // 여전히 크면 해상도 줄이기
                if (currentSizeKB > maxSizeKB) {
                    console.log('해상도를 줄여서 재시도...');
                    
                    const scale = Math.sqrt(maxSizeKB / currentSizeKB * 0.8); // 80% 여유
                    const newWidth = Math.floor(img.width * scale);
                    const newHeight = Math.floor(img.height * scale);
                    
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    
                    currentDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    currentSizeKB = Math.round(currentDataUrl.length / 1024);
                    console.log(`해상도 축소: ${newWidth}x${newHeight}, 최종 크기: ${currentSizeKB}KB`);
                }
                
                resolve(currentDataUrl);
            };
            
            img.onerror = () => {
                console.error('이미지 최적화 실패, 원본 반환');
                resolve(dataUrl);
            };
            
            img.src = dataUrl;
        } catch (error) {
            console.error('이미지 최적화 오류:', error);
            resolve(dataUrl);
        }
    });
}

// 부분 캡처 취소
function cancelPartialCapture() {
    console.log('부분 캡처 취소됨');
    removeSelectionOverlay();
    isPartialCapturing = false;
    isSelecting = false;
}

// 선택 오버레이 제거
function removeSelectionOverlay() {
    if (selectionOverlay) {
        // 이벤트 리스너 제거
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
        
        // DOM에서 제거
        if (selectionOverlay.parentNode) {
            selectionOverlay.parentNode.removeChild(selectionOverlay);
        }
        
        selectionOverlay = null;
        selectionBox = null;
    }
}