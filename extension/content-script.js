// content-script.js - 웹페이지에 주입되는 스크립트

// 전역 변수
let isCapturing = false;

// 백그라운드 스크립트로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startFullPageCapture') {
        startFullPageCapture().then(sendResponse);
        return true; // 비동기 응답을 위해 필요
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