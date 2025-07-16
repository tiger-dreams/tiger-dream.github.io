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

// 전체 페이지 캡처 (스크롤)
async function captureFullPage() {
    try {
        console.log('전체 페이지 캡처 시작...');
        
        // 현재 활성 탭 가져오기
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('활성 탭을 찾을 수 없습니다.');
        }
        
        // content script에게 전체 페이지 캡처 요청
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'startFullPageCapture'
        });
        
        if (response && response.success) {
            console.log('전체 페이지 캡처 완료');
            return { success: true };
        } else {
            throw new Error(response?.error || '전체 페이지 캡처 실패');
        }
    } catch (error) {
        console.error('전체 페이지 캡처 실패:', error);
        return { success: false, error: error.message };
    }
}

// AnnotateShot으로 이미지 전송 및 열기
async function openAnnotateShot(imageDataUrl) {
    try {
        console.log('AnnotateShot 열기 시작...');
        
        // 운영 환경 URL 사용
        const baseUrl = 'https://alllogo.net';
        
        // localStorage에 이미지 저장하고 새 탭 열기
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
                            console.log('이미지 데이터 전송 시작...');
                            
                            await chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                func: function(imageData) {
                                    console.log('이미지 데이터 localStorage에 저장 중...', imageData.substring(0, 50) + '...');
                                    localStorage.setItem('annotateshot_captured_image', imageData);
                                    localStorage.setItem('annotateshot_image_source', 'extension');
                                    
                                    // 약간의 지연 후 로드 함수 호출
                                    setTimeout(() => {
                                        if (window.loadCapturedImage && typeof window.loadCapturedImage === 'function') {
                                            console.log('loadCapturedImage 함수 발견, 호출 중...');
                                            window.loadCapturedImage();
                                        } else {
                                            console.log('loadCapturedImage 함수 없음, 새로고침 필요');
                                            window.location.reload();
                                        }
                                    }, 500);
                                },
                                args: [imageDataUrl]
                            });
                            
                            console.log('스크립트 실행 완료');
                            resolve();
                        } catch (error) {
                            console.error('스크립트 실행 실패:', error);
                            resolve();
                        }
                    }, 1500);
                }
            };
            
            chrome.tabs.onUpdated.addListener(listener);
        });
        
    } catch (error) {
        console.error('AnnotateShot 열기 실패:', error);
        throw error;
    }
}

// 부분 영역 캡처
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
        
        try {
            // 먼저 content script가 준비되었는지 확인
            await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        } catch (pingError) {
            console.log('Content script가 준비되지 않음, 주입 시도...');
            
            // content script 수동 주입
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content-script.js']
                });
                
                // 잠시 대기
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (injectError) {
                console.error('Content script 주입 실패:', injectError);
                throw new Error('이 페이지에서는 캡처 기능을 사용할 수 없습니다.');
            }
        }
        
        // content script에 부분 캡처 시작 메시지 전송
        const response = await chrome.tabs.sendMessage(tab.id, {
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