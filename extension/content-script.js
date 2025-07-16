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

// 백그라운드 스크립트로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ping') {
        // Content script가 준비되었음을 알림
        sendResponse({ success: true, message: 'Content script ready' });
        return false;
    } else if (request.action === 'startFullPageCapture') {
        startFullPageCapture().then(sendResponse);
        return true; // 비동기 응답을 위해 필요
    } else if (request.action === 'startPartialCapture') {
        startPartialCapture().then(sendResponse);
        return true;
    }
});

// 전체 페이지 캡처 시작
async function startFullPageCapture() {
    try {
        if (isCapturing) {
            return { success: false, error: '이미 캡처 중입니다.' };
        }
        
        isCapturing = true;
        console.log('전체 페이지 캡처 시작...');
        
        // 페이지 전체 높이 계산
        const documentHeight = Math.max(
            document.body.scrollHeight || 0,
            document.body.offsetHeight || 0,
            document.documentElement.clientHeight || 0,
            document.documentElement.scrollHeight || 0,
            document.documentElement.offsetHeight || 0
        );
        
        const viewportHeight = window.innerHeight;
        const originalScrollY = window.scrollY;
        
        console.log('페이지 정보:', { documentHeight, viewportHeight, originalScrollY });
        
        // 스크롤 단위로 캡처할 이미지 데이터 배열
        const captures = [];
        
        // 각 화면마다 캡처 (최대 20개 제한으로 무한루프 방지)
        const maxCaptures = Math.min(Math.ceil(documentHeight / viewportHeight), 20);
        
        for (let i = 0; i < maxCaptures; i++) {
            const y = i * viewportHeight;
            
            // 스크롤 이동
            window.scrollTo({
                top: y,
                behavior: 'instant'
            });
            
            console.log(`스크롤 위치: ${y} (${i + 1}/${maxCaptures})`);
            
            // 스크롤 완료까지 대기
            await new Promise(resolve => setTimeout(resolve, 300));
            
            try {
                // 현재 화면 캡처 요청
                const captureData = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({ action: 'captureCurrentView' }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                });
                
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
        
        // 이미지 합성
        const mergedImage = await mergeVerticalImages(captures, documentHeight, viewportHeight);
        
        // 백그라운드에 완료 알림
        chrome.runtime.sendMessage({
            action: 'captureCompleted',
            imageData: mergedImage
        });
        
        isCapturing = false;
        return { success: true };
        
    } catch (error) {
        isCapturing = false;
        console.error('전체 페이지 캡처 오류:', error);
        return { success: false, error: error.message };
    }
}

// 이미지 세로 합성 함수
async function mergeVerticalImages(captures, totalHeight, viewportHeight) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 첫 번째 이미지로 캔버스 크기 설정
        const firstImage = new Image();
        firstImage.onload = () => {
            canvas.width = firstImage.width;
            canvas.height = totalHeight;
            
            let loadedCount = 0;
            const images = [];
            
            captures.forEach((capture, index) => {
                const img = new Image();
                img.onload = () => {
                    images[index] = { img, scrollY: capture.scrollY };
                    loadedCount++;
                    
                    if (loadedCount === captures.length) {
                        // 모든 이미지 로드 완료, 합성 시작
                        console.log('이미지 합성 시작...');
                        
                        // 배경색으로 캔버스 초기화
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // 순서대로 이미지 합성
                        images.forEach(({ img, scrollY }) => {
                            ctx.drawImage(img, 0, scrollY);
                        });
                        
                        console.log('이미지 합성 완료');
                        resolve(canvas.toDataURL('image/png'));
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
    
    // 오버레이 컨테이너 생성
    selectionOverlay = document.createElement('div');
    selectionOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.3);
        z-index: 999999;
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
        z-index: 1000000;
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
async function handleMouseUp(e) {
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
    try {
        console.log('선택된 영역 캡처 중...', rect);
        
        // 오버레이 임시 숨김
        selectionOverlay.style.display = 'none';
        
        // 잠시 대기 (오버레이가 완전히 숨겨지도록)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 현재 화면 캡처 요청
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'captureCurrentView'
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
        
        if (!response || !response.success) {
            throw new Error(response?.error || '화면 캡처 실패');
        }
        
        // 캡처된 이미지를 캔버스에서 크롭
        const croppedImageData = await cropImage(response.dataUrl, rect);
        
        // 부분 캡처 완료를 백그라운드에 알림
        chrome.runtime.sendMessage({
            action: 'partialCaptureCompleted',
            imageData: croppedImageData
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('메시지 전송 오류:', chrome.runtime.lastError);
            } else {
                console.log('캡처 완료 메시지 전송됨:', response);
            }
        });
        
        // 정리
        removeSelectionOverlay();
        isPartialCapturing = false;
        
        console.log('부분 캡처 완료');
        
    } catch (error) {
        console.error('부분 캡처 오류:', error);
        removeSelectionOverlay();
        isPartialCapturing = false;
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