// background.js - 서비스 워커 (백그라운드 스크립트)

// 설치 이벤트
chrome.runtime.onInstalled.addListener(() => {
    console.log('AnnotateShot Capture 익스텐션이 설치되었습니다.');
});

// 단축키 명령어 처리
chrome.commands.onCommand.addListener((command) => {
    if (command === 'capture-visible') {
        captureVisibleArea();
    } else if (command === 'capture-full') {
        captureFullPage();
    } else if (command === 'capture-partial') {
        capturePartialArea();
    }
});

// 팝업에서 온 메시지 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'captureVisible') {
        captureVisibleArea().then(sendResponse);
        return true; // 비동기 응답을 위해 필요
    } else if (request.action === 'capturePartial') {
        capturePartialArea().then(sendResponse);
        return true;
    } else if (request.action === 'captureFullPage') {
        captureFullPage().then(sendResponse);
        return true;
    } else if (request.action === 'captureCurrentView') {
        // content script에서 현재 화면 캡처 요청
        chrome.tabs.captureVisibleTab(sender.tab.windowId, {
            format: 'png',
            quality: 100
        }).then(dataUrl => {
            sendResponse({ success: true, dataUrl: dataUrl });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    } else if (request.action === 'captureCompleted') {
        // content script에서 전체 페이지 캡처 완료 알림
        openAnnotateShot(request.imageData)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (request.action === 'partialCaptureCompleted') {
        // content script에서 부분 캡처 완료 알림
        openAnnotateShot(request.imageData)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

// 현재 보이는 영역 캡처
async function captureVisibleArea() {
    try {
        console.log('현재 화면 캡처 시작...');
        
        // 현재 활성 탭 가져오기
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('활성 탭을 찾을 수 없습니다.');
        }
        
        // 화면 캡처
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'png',
            quality: 100
        });
        
        console.log('캡처 완료, AnnotateShot으로 전송 중...');
        
        // AnnotateShot으로 이미지 전송
        await openAnnotateShot(dataUrl);
        
        return { success: true };
    } catch (error) {
        console.error('현재 화면 캡처 실패:', error);
        return { success: false, error: error.message };
    }
}

// DevTools Protocol을 사용한 전체 페이지 캡처 (새로운 방식)
async function captureFullPageWithDevTools(tabId) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('DevTools Protocol을 사용한 전체 페이지 캡처 시작...');
            
            // 토스트 알림 제거 (캡처에 포함되는 문제 해결)
            
            // 디버거 연결
            await chrome.debugger.attach({ tabId }, '1.3');
            console.log('디버거 연결 완료');
            
            // Page 도메인 활성화
            await chrome.debugger.sendCommand({ tabId }, 'Page.enable');
            
            // 페이지 완전 로드 대기 (시간 단축)
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 페이지 레이아웃 메트릭 가져오기
            const layoutMetrics = await chrome.debugger.sendCommand({ tabId }, 'Page.getLayoutMetrics');
            console.log('페이지 레이아웃 메트릭:', layoutMetrics);
            
            const { contentSize, visualViewport } = layoutMetrics;
            
            // 실제 콘텐츠 크기 계산 (여백 제거)
            // DOM에서 실제 콘텐츠 크기 확인
            const actualContentSize = await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
                expression: `
                    (() => {
                        const body = document.body;
                        const html = document.documentElement;
                        
                        // 실제 콘텐츠의 스크롤 크기
                        const scrollWidth = Math.max(
                            body.scrollWidth || 0,
                            html.scrollWidth || 0,
                            body.offsetWidth || 0,
                            html.offsetWidth || 0,
                            body.clientWidth || 0,
                            html.clientWidth || 0
                        );
                        
                        const scrollHeight = Math.max(
                            body.scrollHeight || 0,
                            html.scrollHeight || 0,
                            body.offsetHeight || 0,
                            html.offsetHeight || 0,
                            body.clientHeight || 0,
                            html.clientHeight || 0
                        );
                        
                        return {
                            width: scrollWidth,
                            height: scrollHeight,
                            viewportWidth: window.innerWidth,
                            viewportHeight: window.innerHeight
                        };
                    })()
                `,
                returnByValue: true
            });
            
            const actualSize = actualContentSize.result.value;
            console.log('실제 콘텐츠 크기:', actualSize);
            console.log('DevTools 레이아웃 크기:', contentSize);
            
            // 더 정확한 크기 사용 (실제 콘텐츠 크기와 DevTools 크기 중 작은 값)
            const finalWidth = Math.min(actualSize.width, contentSize.width);
            const finalHeight = Math.min(actualSize.height, contentSize.height);
            
            console.log('최종 캡처 크기:', { width: finalWidth, height: finalHeight });
            
            // 전체 페이지 캡처 설정
            const screenshotConfig = {
                format: 'png',
                captureBeyondViewport: true,
                fromSurface: true,
                clip: {
                    x: 0,
                    y: 0,
                    width: finalWidth,
                    height: finalHeight,
                    scale: 1
                }
            };
            
            console.log('캡처 설정:', screenshotConfig);
            
            // 전체 페이지 스크린샷 캡처
            const screenshot = await chrome.debugger.sendCommand({ tabId }, 'Page.captureScreenshot', screenshotConfig);
            
            console.log('DevTools Protocol 캡처 완료, 이미지 크기:', Math.round(screenshot.data.length / 1024), 'KB');
            
            // base64 데이터를 data URL로 변환
            const dataUrl = `data:image/png;base64,${screenshot.data}`;
            
            // 디버거 연결 해제 (이미지 전송 전에 해제)
            await chrome.debugger.detach({ tabId });
            console.log('디버거 연결 해제 완료');
            
            resolve(dataUrl);
            
        } catch (error) {
            console.error('DevTools Protocol 캡처 실패:', error);
            
            // 오류 발생시 디버거 연결 해제
            try {
                await chrome.debugger.detach({ tabId });
            } catch (detachError) {
                console.warn('디버거 연결 해제 실패:', detachError);
            }
            
            reject(error);
        }
    });
}

// 전체 페이지 캡처 (개선된 버전 - DevTools Protocol 우선 사용)
async function captureFullPage() {
    try {
        console.log('전체 페이지 캡처 시작...');
        
        // 현재 활성 탭 가져오기
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('활성 탭을 찾을 수 없습니다.');
        }
        
        console.log('활성 탭 ID:', tab.id, 'URL:', tab.url);
        
        // 특정 URL에서는 캡처할 수 없음
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
            throw new Error('이 페이지에서는 캡처할 수 없습니다.');
        }
        
        // 사용자 설정 확인 (디버그 모드가 활성화된 경우에만 DevTools Protocol 사용)
        let useDevTools = false;
        try {
            const settings = await chrome.storage.local.get(['enableDebugMode']);
            if (settings.enableDebugMode === true) {
                useDevTools = true;
                console.log('사용자 설정: 디버그 모드 활성화 - DevTools Protocol 사용');
            } else {
                console.log('사용자 설정: 디버그 모드 비활성화 - 전체 페이지 캡처 불가');
            }
        } catch (storageError) {
            console.warn('설정 읽기 실패, 기본값 사용:', storageError);
        }

        if (useDevTools) {
            try {
                // 1순위: DevTools Protocol 사용 시도
                console.log('DevTools Protocol 방식 시도...');
                const devToolsImage = await captureFullPageWithDevTools(tab.id);
                
                console.log('DevTools Protocol 캡처 성공, 디버거 연결 해제 후 AnnotateShot으로 전송...');
                
                // 디버거 연결 해제 후 잠시 대기
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await openAnnotateShot(devToolsImage);
                
                return { success: true, method: 'devtools' };
                
            } catch (devToolsError) {
                console.error('DevTools Protocol 실패:', devToolsError.message);
                throw new Error('고품질 캡처 실패: ' + devToolsError.message);
            }
        } else {
            // 디버그 모드가 비활성화된 경우
            throw new Error('전체 페이지 캡처가 비활성화되어 있습니다. 익스텐션 팝업에서 디버그 모드를 활성화해주세요.');
        }
        
    } catch (error) {
        console.error('전체 페이지 캡처 최종 실패:', error);
        return { success: false, error: error.message };
    }
}

// Content script 준비 상태 확인 및 주입
async function ensureContentScriptReady(tabId, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Content script 연결 확인 시도 ${attempt}/${maxRetries}`);
            
            // ping 메시지로 연결 확인
            const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            if (response && response.success) {
                console.log('Content script 연결 확인됨');
                return true;
            }
        } catch (pingError) {
            console.log(`Ping 실패 (시도 ${attempt}):`, pingError.message);
        }
        
        // 연결 실패 시 content script 재주입 시도
        try {
            console.log(`Content script 주입 시도 ${attempt}/${maxRetries}`);
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content-script.js']
            });
            
            // 주입 후 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 다시 연결 확인
            const retryResponse = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            if (retryResponse && retryResponse.success) {
                console.log('Content script 주입 및 연결 성공');
                return true;
            }
        } catch (injectError) {
            console.error(`Content script 주입 실패 (시도 ${attempt}):`, injectError);
        }
        
        // 마지막 시도가 아니면 잠시 대기
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
    
    console.error('Content script 준비 최종 실패');
    return false;
}

// 탭에 안전하게 메시지 전송
async function sendMessageToTab(tabId, message, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`탭 메시지 전송 시도 ${attempt}/${maxRetries}:`, message.action);
            
            const response = await chrome.tabs.sendMessage(tabId, message);
            console.log('메시지 전송 성공:', response);
            return response;
            
        } catch (error) {
            console.warn(`메시지 전송 실패 (시도 ${attempt}):`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // 다음 시도 전 대기
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
    }
}

// AnnotateShot으로 이미지 전송 및 열기
async function openAnnotateShot(imageDataUrl) {
    try {
        console.log('AnnotateShot 열기 시작...', '이미지 크기:', Math.round(imageDataUrl.length / 1024), 'KB');
        
        // 이미지 크기 확인 (localStorage 제한: 도메인당 보통 5MB)
        const imageSizeKB = Math.round(imageDataUrl.length / 1024);
        console.log('전송할 이미지 크기:', imageSizeKB, 'KB');
        
        if (imageSizeKB > 4000) { // 4MB 이상이면 경고
            console.warn('이미지가 큽니다:', imageSizeKB, 'KB. localStorage 제한(보통 5MB)으로 인해 문제가 발생할 수 있습니다.');
        }
        
        // 운영 환경 URL 사용
        const baseUrl = 'https://alllogo.net';
        // Extension 유입임을 나타내는 URL 파라미터 추가
        const annotateUrl = `${baseUrl}/index.html?source=extension&t=${Date.now()}`;
        
        // 새 탭 열기
        const tab = await chrome.tabs.create({
            url: annotateUrl
        });
        
        console.log('새 탭 생성 완료, 이미지 전송 대기...');
        
        // 탭이 로드될 때까지 대기
        return new Promise((resolve) => {
            const listener = (tabId, changeInfo) => {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    
                    // 약간의 지연 후 이미지 전송 (DevTools 연결 해제 완료 대기)
                    setTimeout(async () => {
                        try {
                            console.log('이미지 데이터 전송 시작...', imageSizeKB, 'KB');
                            
                            // 탭 상태 확인 후 스크립트 실행
                            const tabInfo = await chrome.tabs.get(tab.id);
                            if (tabInfo.status !== 'complete') {
                                console.log('탭 로드 대기 중...', tabInfo.status);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                            
                            // 이미지 전송을 위한 더 안정적인 스크립트 (압축 기능 포함)
                            await chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                func: async function(imageData, imageSizeKB) {
                                    console.log('AnnotateShot에서 이미지 데이터 수신:', imageSizeKB, 'KB');
                                    
                                    // 이미지 압축 함수
                                    function compressImage(dataUrl, quality = 0.8, maxSizeKB = 4000) {
                                        return new Promise((resolve) => {
                                            const img = new Image();
                                            img.onload = function() {
                                                const canvas = document.createElement('canvas');
                                                const ctx = canvas.getContext('2d');
                                                
                                                // 원본 크기 유지 (품질만 조정)
                                                canvas.width = img.width;
                                                canvas.height = img.height;
                                                
                                                // 이미지 그리기
                                                ctx.drawImage(img, 0, 0);
                                                
                                                // 압축된 이미지 생성
                                                let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                                                let compressedSizeKB = Math.round(compressedDataUrl.length / 1024);
                                                
                                                console.log(`압축 결과: ${imageSizeKB}KB -> ${compressedSizeKB}KB (품질: ${quality})`);
                                                
                                                // 여전히 크면 더 압축
                                                if (compressedSizeKB > maxSizeKB && quality > 0.3) {
                                                    const newQuality = Math.max(0.3, quality * (maxSizeKB / compressedSizeKB));
                                                    console.log(`추가 압축 시도: 품질 ${quality} -> ${newQuality}`);
                                                    compressImage(dataUrl, newQuality, maxSizeKB).then(resolve);
                                                } else {
                                                    resolve({
                                                        dataUrl: compressedDataUrl,
                                                        originalSize: imageSizeKB,
                                                        compressedSize: compressedSizeKB,
                                                        quality: quality
                                                    });
                                                }
                                            };
                                            img.src = dataUrl;
                                        });
                                    }
                                    
                                    try {
                                        // localStorage 사용 가능 용량 확인
                                        const storageQuota = (() => {
                                            try {
                                                const test = 'test';
                                                localStorage.setItem(test, test);
                                                localStorage.removeItem(test);
                                                return true;
                                            } catch (e) {
                                                return false;
                                            }
                                        })();
                                        
                                        if (!storageQuota) {
                                            throw new Error('localStorage를 사용할 수 없습니다.');
                                        }
                                        
                                        // 이미지 크기가 4MB 이상이면 압축 시도
                                        let finalImageData = imageData;
                                        let finalSizeKB = imageSizeKB;
                                        
                                        if (imageSizeKB > 4000) {
                                            console.log('이미지가 큼 (', imageSizeKB, 'KB), 압축 시도...');
                                            try {
                                                const compressed = await compressImage(imageData, 0.8, 4000);
                                                finalImageData = compressed.dataUrl;
                                                finalSizeKB = compressed.compressedSize;
                                                console.log(`압축 완료: ${compressed.originalSize}KB -> ${compressed.compressedSize}KB (품질: ${compressed.quality})`);
                                            } catch (compressionError) {
                                                console.warn('압축 실패, 원본 사용:', compressionError);
                                            }
                                        }
                                        
                                        console.log('localStorage 사용 가능, 이미지 저장 시도...', finalSizeKB, 'KB');
                                        
                                        // localStorage에 저장 시도 (오류 감지 개선)
                                        try {
                                            localStorage.setItem('annotateshot_captured_image', finalImageData);
                                            localStorage.setItem('annotateshot_image_source', 'extension');
                                            console.log('localStorage에 이미지 저장 완료');
                                        } catch (storageError) {
                                            // 저장 실패 시 구체적인 오류 분석
                                            console.error('localStorage 저장 실패:', storageError);
                                            
                                            if (storageError.name === 'QuotaExceededError' || 
                                                storageError.message.includes('quota') ||
                                                storageError.message.includes('storage')) {
                                                
                                                // 첫 번째 압축이 실패했거나 여전히 크면 더 강력한 압축 시도
                                                if (finalSizeKB > 2000) {
                                                    console.log('저장 실패, 더 강력한 압축 시도...');
                                                    try {
                                                        const heavyCompressed = await compressImage(imageData, 0.5, 2000);
                                                        localStorage.setItem('annotateshot_captured_image', heavyCompressed.dataUrl);
                                                        localStorage.setItem('annotateshot_image_source', 'extension');
                                                        console.log(`강력한 압축으로 저장 성공: ${heavyCompressed.compressedSize}KB`);
                                                    } catch (finalError) {
                                                        throw new Error('이미지가 너무 커서 저장할 수 없습니다 (최대 압축 후: ' + finalSizeKB + 'KB)');
                                                    }
                                                } else {
                                                    throw new Error('브라우저 저장소 용량 초과 (이미지 크기: ' + finalSizeKB + 'KB)');
                                                }
                                            } else {
                                                throw new Error('저장소 접근 오류: ' + storageError.message);
                                            }
                                        }
                                        
                                        // 저장 확인
                                        const saved = localStorage.getItem('annotateshot_captured_image');
                                        if (!saved) {
                                            throw new Error('localStorage 저장 실패 - 저장된 데이터 없음');
                                        }
                                        
                                        const actualSavedSizeKB = Math.round(saved.length / 1024);
                                        console.log('이미지 저장 검증 완료');
                                        console.log('- 원본 크기:', imageSizeKB, 'KB');
                                        console.log('- 최종 저장 크기:', actualSavedSizeKB, 'KB');
                                        
                                        if (actualSavedSizeKB !== finalSizeKB) {
                                            console.log('- 크기 차이 감지 (압축/처리 과정에서 발생 가능)');
                                        }
                                        
                                        // 페이지가 완전히 로드될 때까지 대기
                                        let attempts = 0;
                                        const maxAttempts = 20;
                                        
                                        const tryLoadImage = () => {
                                            attempts++;
                                            console.log('이미지 로드 시도:', attempts, '/', maxAttempts);
                                            
                                            if (window.loadCapturedImage && typeof window.loadCapturedImage === 'function') {
                                                console.log('loadCapturedImage 함수 발견, 호출 중...');
                                                try {
                                                    const success = window.loadCapturedImage();
                                                    console.log('loadCapturedImage 결과:', success);
                                                    if (success) {
                                                        console.log('이미지 로드 성공');
                                                        return;
                                                    }
                                                } catch (loadError) {
                                                    console.error('loadCapturedImage 실행 오류:', loadError);
                                                }
                                            } else {
                                                console.log('loadCapturedImage 함수 없음, DOM 상태:', document.readyState);
                                            }
                                            
                                            if (attempts < maxAttempts) {
                                                setTimeout(tryLoadImage, 200); // 200ms 후 재시도
                                            } else {
                                                console.log('최대 재시도 초과, 새로고침 시도');
                                                window.location.reload();
                                            }
                                        };
                                        
                                        // 초기 시도
                                        setTimeout(tryLoadImage, 300);
                                        
                                    } catch (error) {
                                        console.error('이미지 저장/로드 오류:', error);
                                        
                                        // 오류 유형별 메시지
                                        let errorMessage = '이미지 로드에 실패했습니다.';
                                        if (error.message.includes('localStorage')) {
                                            errorMessage = 'localStorage 용량 부족 또는 접근 불가';
                                        } else if (error.message.includes('quota')) {
                                            errorMessage = '브라우저 저장소 용량 초과';
                                        }
                                        
                                        console.error('상세 오류 정보:', error);
                                        
                                        // AnnotateShot 페이지에 오류 메시지 표시 (alert 대신)
                                        try {
                                            const messageDiv = document.getElementById('message');
                                            if (messageDiv) {
                                                messageDiv.textContent = errorMessage + ': ' + error.message;
                                                messageDiv.style.color = '#ff4444';
                                            }
                                        } catch (e) {
                                            console.error('메시지 표시 실패:', e);
                                        }
                                    }
                                },
                                args: [imageDataUrl, imageSizeKB]
                            });
                            
                            console.log('스크립트 전송 완료');
                            resolve();
                        } catch (error) {
                            console.error('스크립트 실행 실패:', error);
                            
                            // 스크립트 실행 실패 시 재시도 (1회)
                            try {
                                console.log('스크립트 실행 재시도...');
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                
                                await chrome.scripting.executeScript({
                                    target: { tabId: tab.id },
                                    func: async function(imageData, imageSizeKB) {
                                        // 간단한 압축 함수 (재시도용)
                                        function simpleCompress(dataUrl) {
                                            return new Promise((resolve) => {
                                                const img = new Image();
                                                img.onload = function() {
                                                    const canvas = document.createElement('canvas');
                                                    const ctx = canvas.getContext('2d');
                                                    canvas.width = img.width;
                                                    canvas.height = img.height;
                                                    ctx.drawImage(img, 0, 0);
                                                    resolve(canvas.toDataURL('image/jpeg', 0.6));
                                                };
                                                img.src = dataUrl;
                                            });
                                        }
                                        
                                        async function tryStore() {
                                            try {
                                                let finalData = imageData;
                                                if (imageSizeKB > 3000) {
                                                    console.log('재시도: 이미지 압축 중...');
                                                    finalData = await simpleCompress(imageData);
                                                }
                                                
                                                localStorage.setItem('annotateshot_captured_image', finalData);
                                                localStorage.setItem('annotateshot_image_source', 'extension');
                                                
                                                if (window.loadCapturedImage) {
                                                    window.loadCapturedImage();
                                                } else {
                                                    window.location.reload();
                                                }
                                            } catch (e) {
                                                console.error('재시도 실패:', e);
                                                window.location.reload();
                                            }
                                        }
                                        
                                        tryStore();
                                    },
                                    args: [imageDataUrl, imageSizeKB]
                                });
                                console.log('재시도 성공');
                            } catch (retryError) {
                                console.error('재시도도 실패:', retryError);
                            }
                            
                            resolve();
                        }
                    }, 3000); // 3초로 증가 (DevTools 해제 대기시간 포함)
                }
            };
            
            chrome.tabs.onUpdated.addListener(listener);
        });
        
    } catch (error) {
        console.error('AnnotateShot 열기 실패:', error);
        throw error;
    }
}

// 부분 영역 캡처 - 안정성 개선
async function capturePartialArea() {
    try {
        console.log('부분 영역 캡처 시작...');
        
        // 현재 활성 탭 가져오기
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('활성 탭을 찾을 수 없습니다.');
        }
        
        console.log('활성 탭 ID:', tab.id, 'URL:', tab.url);
        
        // 특정 URL에서는 content script가 작동하지 않음
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
            throw new Error('이 페이지에서는 캡처할 수 없습니다.');
        }
        
        // content script 연결 확인 및 주입
        const isContentScriptReady = await ensureContentScriptReady(tab.id);
        if (!isContentScriptReady) {
            throw new Error('Content script 준비 실패');
        }
        
        // content script에 부분 캡처 시작 메시지 전송
        const response = await sendMessageToTab(tab.id, {
            action: 'startPartialCapture'
        });
        
        console.log('부분 캡처 응답:', response);
        
        if (response && response.success) {
            return { success: true, message: '부분 캡처가 시작되었습니다.' };
        } else {
            throw new Error(response?.error || '부분 캡처 시작 실패');
        }
        
    } catch (error) {
        console.error('부분 캡처 오류:', error);
        return { success: false, error: error.message };
    }
}