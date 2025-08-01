// popup.js - 팝업 UI 이벤트 처리

// 다국어 텍스트 정의
const translations = {
    ko: {
        subtitle: '웹페이지 캡처 및 편집',
        currentCapture: '현재 화면 캡처',
        currentCaptureDesc: '보이는 영역만 캡처하여 편집',
        partialCapture: '부분 영역 캡처',
        partialCaptureDesc: '드래그로 원하는 영역만 캡처',
        fullCapture: '전체 페이지 캡처 (고품질)',
        fullCaptureDesc: 'DevTools Protocol로 전체 페이지 캡처',
        fullCaptureDisabled: '전체 페이지 캡처 (비활성화)',
        fullCaptureDisabledDesc: '디버그 모드 체크 후 사용 가능',
        captureSettings: '⚙️ 캡처 설정',
        debugModeLabel: '고품질 전체 페이지 캡처 (디버그 모드)',
        debugModeDesc1: '체크 시: DevTools Protocol로 고품질 캡처 (디버깅 메시지 표시)',
        debugModeDesc2: '체크 해제 시: 전체 페이지 캡처 비활성화',
        debugGuideTitle: '🔒 디버그 모드 안전 가이드',
        debugGuide1: 'Chrome의 DevTools API를 브라우저 내에서만 사용',
        debugGuide2: '캡처된 이미지는 외부 서버로 전송되지 않음',
        debugGuide3: '개인정보나 데이터 분석 없이 로컬에서만 처리',
        debugGuide4: '단순히 고품질 스크린샷을 위한 기술적 방법',
        debugGuide5: 'Chrome 상단의 "디버깅 중" 메시지는 일시적 기술 알림',
        // 상태 메시지
        capturingCurrent: '현재 화면을 캡처 중...',
        capturingPartial: '영역을 드래그하여 선택하세요.',
        capturingFull: '전체 페이지를 캡처 중... (디버그 모드)',
        captureComplete: '캡처 완료! 편집기로 이동합니다.',
        captureFailed: '캡처 실패: ',
        enableDebugFirst: '디버그 모드를 먼저 활성화해주세요.',
        debugModeEnabled: '디버그 모드 활성화됨 (고품질 캡처 가능)',
        debugModeDisabled: '디버그 모드 비활성화됨 (전체 캡처 불가)',
        settingsSaveFailed: '설정 저장 실패'
    },
    en: {
        subtitle: 'Web Page Capture & Editing',
        currentCapture: 'Current View Capture',
        currentCaptureDesc: 'Capture only the visible area for editing',
        partialCapture: 'Partial Area Capture',
        partialCaptureDesc: 'Drag to select the desired area',
        fullCapture: 'Full Page Capture (High Quality)',
        fullCaptureDesc: 'Full page capture with DevTools Protocol',
        fullCaptureDisabled: 'Full Page Capture (Disabled)',
        fullCaptureDisabledDesc: 'Enable debug mode to use this feature',
        captureSettings: '⚙️ Capture Settings',
        debugModeLabel: 'High Quality Full Page Capture (Debug Mode)',
        debugModeDesc1: 'Checked: High quality capture with DevTools Protocol (debugging message shown)',
        debugModeDesc2: 'Unchecked: Full page capture disabled',
        debugGuideTitle: '🔒 Debug Mode Safety Guide',
        debugGuide1: 'Uses Chrome\'s DevTools API only within the browser',
        debugGuide2: 'Captured images are not sent to external servers',
        debugGuide3: 'Local processing only, no personal data analysis',
        debugGuide4: 'Simply a technical method for high-quality screenshots',
        debugGuide5: 'Chrome\'s "debugging" message is a temporary technical notification',
        // 상태 메시지
        capturingCurrent: 'Capturing current view...',
        capturingPartial: 'Drag to select an area.',
        capturingFull: 'Capturing full page... (Debug mode)',
        captureComplete: 'Capture complete! Moving to editor.',
        captureFailed: 'Capture failed: ',
        enableDebugFirst: 'Please enable debug mode first.',
        debugModeEnabled: 'Debug mode enabled (high quality capture available)',
        debugModeDisabled: 'Debug mode disabled (full capture unavailable)',
        settingsSaveFailed: 'Settings save failed'
    }
};

// 언어 감지 함수
function getLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('ko') ? 'ko' : 'en';
}

// 텍스트 번역 함수
function t(key) {
    const lang = getLanguage();
    return translations[lang][key] || translations['en'][key] || key;
}

document.addEventListener('DOMContentLoaded', () => {
    const captureBtn = document.getElementById('capture-visible');
    const capturePartialBtn = document.getElementById('capture-partial');
    const captureFullBtn = document.getElementById('capture-full');
    const statusDiv = document.getElementById('status');
    const enableDebugModeCheckbox = document.getElementById('enable-debug-mode');
    
    // UI 텍스트 업데이트 함수
    function updateUITexts() {
        // 헤더 텍스트 업데이트
        document.getElementById('subtitle').textContent = t('subtitle');
        
        // 버튼 텍스트 업데이트
        document.querySelector('#capture-visible .title').textContent = t('currentCapture');
        document.querySelector('#capture-visible .desc').textContent = t('currentCaptureDesc');
        
        document.querySelector('#capture-partial .title').textContent = t('partialCapture');
        document.querySelector('#capture-partial .desc').textContent = t('partialCaptureDesc');
        
        // 설정 섹션 텍스트 업데이트
        document.querySelector('[style*="font-weight: 500"]').textContent = t('captureSettings');
        document.querySelector('label span').textContent = t('debugModeLabel');
        
        // 디버그 모드 설명 업데이트
        const descDiv = document.querySelector('[style*="margin-left: 20px"][style*="color: #94a3b8"]');
        if (descDiv) {
            descDiv.innerHTML = t('debugModeDesc1') + '<br>' + t('debugModeDesc2');
        }
        
        // 안전 가이드 업데이트
        const guideTitle = document.querySelector('[style*="color: #0369a1"]');
        if (guideTitle) {
            guideTitle.textContent = t('debugGuideTitle');
        }
        
        const guideDiv = document.querySelector('[style*="color: #0284c7"][style*="line-height: 1.3"]');
        if (guideDiv) {
            guideDiv.innerHTML = `
                • ${t('debugGuide1')}<br>
                • ${t('debugGuide2')}<br>
                • ${t('debugGuide3')}<br>
                • ${t('debugGuide4')}<br>
                • ${t('debugGuide5')}
            `;
        }
    }
    
    // 상태 메시지 표시 함수
    function showStatus(message, duration = 2000) {
        statusDiv.textContent = message;
        statusDiv.classList.add('show');
        setTimeout(() => {
            statusDiv.classList.remove('show');
        }, duration);
    }
    
    // 전체 페이지 캡처 버튼 활성화/비활성화 업데이트
    function updateFullCaptureButton() {
        const isEnabled = enableDebugModeCheckbox.checked;
        captureFullBtn.disabled = !isEnabled;
        captureFullBtn.style.opacity = isEnabled ? '1' : '0.4';
        captureFullBtn.style.cursor = isEnabled ? 'pointer' : 'not-allowed';
        captureFullBtn.style.backgroundColor = isEnabled ? '#ffffff' : '#f8f9fa';
        captureFullBtn.style.borderColor = isEnabled ? '#e2e8f0' : '#e5e7eb';
        
        const titleElement = captureFullBtn.querySelector('.title');
        const descElement = captureFullBtn.querySelector('.desc');
        
        if (titleElement && descElement) {
            if (isEnabled) {
                titleElement.textContent = t('fullCapture');
                descElement.textContent = t('fullCaptureDesc');
                titleElement.style.color = '#0f172a';
                descElement.style.color = '#64748b';
            } else {
                titleElement.textContent = t('fullCaptureDisabled');
                descElement.textContent = t('fullCaptureDisabledDesc');
                titleElement.style.color = '#9ca3af';
                descElement.style.color = '#9ca3af';
            }
        }
    }
    
    // 현재 화면 캡처 버튼 클릭
    captureBtn.addEventListener('click', () => {
        showStatus(t('capturingCurrent'));
        
        // 백그라운드 스크립트에 캡처 요청
        chrome.runtime.sendMessage({
            action: 'captureVisible'
        }, (response) => {
            if (response && response.success) {
                showStatus(t('captureComplete'));
                setTimeout(() => window.close(), 500);
            } else {
                showStatus(t('captureFailed') + (response?.error || 'Unknown error'));
            }
        });
    });
    
    // 부분 영역 캡처 버튼 클릭
    capturePartialBtn.addEventListener('click', () => {
        showStatus(t('capturingPartial'));
        
        // 백그라운드 스크립트에 부분 캡처 요청
        chrome.runtime.sendMessage({
            action: 'capturePartial'
        }, (response) => {
            if (response && response.success) {
                showStatus(t('captureComplete'));
                setTimeout(() => window.close(), 500);
            } else {
                showStatus(t('captureFailed') + (response?.error || 'Unknown error'));
            }
        });
        
        // 팝업 닫기 (사용자가 영역을 선택할 수 있도록)
        setTimeout(() => window.close(), 100);
    });
    
    // 전체 페이지 캡처 버튼 클릭
    captureFullBtn.addEventListener('click', () => {
        // 디버그 모드가 체크되지 않았으면 실행하지 않음
        if (!enableDebugModeCheckbox.checked) {
            showStatus(t('enableDebugFirst'));
            return;
        }
        
        showStatus(t('capturingFull'));
        
        // 백그라운드 스크립트에 전체 페이지 캡처 요청
        chrome.runtime.sendMessage({
            action: 'captureFullPage'
        }, (response) => {
            if (response && response.success) {
                showStatus(t('captureComplete'));
                setTimeout(() => window.close(), 500);
            } else {
                showStatus(t('captureFailed') + (response?.error || 'Unknown error'));
            }
        });
    });
    
    // 설정 로드 및 저장
    async function loadSettings() {
        try {
            const result = await chrome.storage.local.get(['enableDebugMode']);
            enableDebugModeCheckbox.checked = result.enableDebugMode || false;
            updateFullCaptureButton();
        } catch (error) {
            console.warn('설정 로드 실패:', error);
        }
    }
    
    async function saveSettings() {
        try {
            await chrome.storage.local.set({
                enableDebugMode: enableDebugModeCheckbox.checked
            });
            updateFullCaptureButton();
            showStatus(enableDebugModeCheckbox.checked ? 
                t('debugModeEnabled') : 
                t('debugModeDisabled'), 
                1500);
        } catch (error) {
            console.warn('설정 저장 실패:', error);
            showStatus(t('settingsSaveFailed'));
        }
    }
    
    // 설정 체크박스 이벤트 리스너
    enableDebugModeCheckbox.addEventListener('change', saveSettings);
    
    // 초기화 함수
    function initialize() {
        // UI 텍스트 업데이트
        updateUITexts();
        
        // 전체 페이지 캡처 버튼 초기 상태 설정 (기본: 비활성화)
        updateFullCaptureButton();
        
        // 초기 설정 로드
        loadSettings();
        
        // 단축키 표시 (Mac에서는 Cmd 표시)
        if (navigator.platform.indexOf('Mac') > -1) {
            document.querySelectorAll('.shortcut').forEach(shortcut => {
                shortcut.textContent = shortcut.textContent.replace('Ctrl', 'Cmd');
            });
        }
    }
    
    // 초기화 실행
    initialize();
});