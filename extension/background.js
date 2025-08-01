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
            
            // 사용자에게 디버깅 모드 진입 알림
            try {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    func: function() {
                        // 임시 알림 표시
                        const notification = document.createElement('div');
                        notification.id = 'annotateshot-debug-notice';
                        notification.style.cssText = `
                            position: fixed;
                            top: 20px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: rgba(59, 130, 246, 0.95);
                            color: white;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                            font-size: 14px;
                            font-weight: 500;
                            z-index: 2147483647;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            border: none;
                            pointer-events: none;
                        `;
                        notification.textContent = '🔧 고품질 전체 페이지 캡처 중... (디버깅 모드 일시 활성화)';
                        document.body.appendChild(notification);
                        
                        // 3초 후 자동 제거
                        setTimeout(() => {
                            const notice = document.getElementById('annotateshot-debug-notice');
                            if (notice) notice.remove();
                        }, 3000);
                    }
                });
            } catch (notificationError) {
                console.warn('알림 표시 실패:', notificationError);
            }
            
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
            
            const { contentSize } = layoutMetrics;
            
            // 전체 페이지 캡처 설정
            const screenshotConfig = {
                format: 'png',
                captureBeyondViewport: true,
                fromSurface: true,
                clip: {
                    x: 0,
                    y: 0,
                    width: contentSize.width,
                    height: contentSize.height,
                    scale: 1
                }
            };
            
            console.log('캡처 설정:', screenshotConfig);
            
            // 전체 페이지 스크린샷 캡처
            const screenshot = await chrome.debugger.sendCommand({ tabId }, 'Page.captureScreenshot', screenshotConfig);
            
            console.log('DevTools Protocol 캡처 완료, 이미지 크기:', Math.round(screenshot.data.length / 1024), 'KB');
            
            // base64 데이터를 data URL로 변환
            const dataUrl = `data:image/png;base64,${screenshot.data}`;
            
            // 디버거 연결 해제
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
        
        // 사용자 설정 확인 (저장된 설정이 있으면 해당 방식 우선 사용)
        let useDevToolsFirst = true;
        try {
            const settings = await chrome.storage.local.get(['preferScrollCapture']);
            if (settings.preferScrollCapture === true) {
                useDevToolsFirst = false;
                console.log('사용자 설정: 스크롤 방식 우선 사용');
            }
        } catch (storageError) {
            console.warn('설정 읽기 실패, 기본값 사용:', storageError);
        }

        if (useDevToolsFirst) {
            try {
                // 1순위: DevTools Protocol 사용 시도
                console.log('DevTools Protocol 방식 시도...');
                const devToolsImage = await captureFullPageWithDevTools(tab.id);
                
                console.log('DevTools Protocol 캡처 성공, AnnotateShot으로 전송...');
                await openAnnotateShot(devToolsImage);
                
                return { success: true, method: 'devtools' };
                
            } catch (devToolsError) {
                console.warn('DevTools Protocol 실패, 기존 스크롤 방식으로 대체:', devToolsError.message);
                
                // 사용자에게 설정 변경 옵션 제안
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: function(errorMsg) {
                            const notice = document.createElement('div');
                            notice.style.cssText = `
                                position: fixed; top: 20px; right: 20px; z-index: 2147483647;
                                background: rgba(255, 152, 0, 0.95); color: white; padding: 16px;
                                border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                                font-size: 13px; max-width: 300px; cursor: pointer;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            `;
                            notice.innerHTML = `
                                ⚠️ 고품질 캡처 실패<br>
                                <small>스크롤 방식으로 대체됩니다.<br>
                                설정에서 기본 방식을 변경할 수 있습니다.</small>
                            `;
                            document.body.appendChild(notice);
                            setTimeout(() => notice.remove(), 4000);
                        },
                        args: [devToolsError.message]
                    });
                } catch (e) {
                    // 알림 실패해도 계속 진행
                }
            }
        }

        // DevTools 실패 시 또는 사용자가 스크롤 방식 선호 시
        try {
            // 2순위: 기존 스크롤 방식 사용
            const isContentScriptReady = await ensureContentScriptReady(tab.id);
            if (!isContentScriptReady) {
                throw new Error('Content script 준비 실패');
            }
            
            const response = await sendMessageToTab(tab.id, {
                action: 'startFullPageCapture'
            });
            
            if (response && response.success) {
                console.log('기존 스크롤 방식으로 전체 페이지 캡처 완료');
                return { success: true, method: 'scroll' };
            } else {
                throw new Error(response?.error || '전체 페이지 캡처 실패');
            }
        } catch (scrollError) {
            console.error('스크롤 방식도 실패:', scrollError);
            throw scrollError;
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
        const annotateUrl = `${baseUrl}/index.html`;
        
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
                    
                    // 약간의 지연 후 이미지 전송
                    setTimeout(async () => {
                        try {
                            console.log('이미지 데이터 전송 시작...', imageSizeKB, 'KB');
                            
                            // 이미지 전송을 위한 더 안정적인 스크립트
                            await chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                func: function(imageData, imageSizeKB) {
                                    console.log('AnnotateShot에서 이미지 데이터 수신:', imageSizeKB, 'KB');
                                    
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
                                        
                                        console.log('localStorage 사용 가능, 이미지 저장 시도...');
                                        
                                        // localStorage에 저장 시도 (오류 감지 개선)
                                        try {
                                            localStorage.setItem('annotateshot_captured_image', imageData);
                                            localStorage.setItem('annotateshot_image_source', 'extension');
                                            console.log('localStorage에 이미지 저장 완료');
                                        } catch (storageError) {
                                            // 저장 실패 시 구체적인 오류 분석
                                            console.error('localStorage 저장 실패:', storageError);
                                            
                                            if (storageError.name === 'QuotaExceededError' || 
                                                storageError.message.includes('quota') ||
                                                storageError.message.includes('storage')) {
                                                throw new Error('브라우저 저장소 용량 초과 (이미지가 너무 큼: ' + imageSizeKB + 'KB)');
                                            } else {
                                                throw new Error('저장소 접근 오류: ' + storageError.message);
                                            }
                                        }
                                        
                                        // 저장 확인
                                        const saved = localStorage.getItem('annotateshot_captured_image');
                                        if (!saved) {
                                            throw new Error('localStorage 저장 실패 - 저장된 데이터 없음');
                                        }
                                        
                                        if (saved.length !== imageData.length) {
                                            console.warn('저장된 이미지 크기가 다름:', saved.length, 'vs', imageData.length);
                                        }
                                        
                                        console.log('이미지 저장 검증 완료, 실제 저장 크기:', Math.round(saved.length / 1024), 'KB');
                                        
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
                            resolve();
                        }
                    }, 2000); // 2초로 증가
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