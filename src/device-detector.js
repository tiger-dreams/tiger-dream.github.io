/* ==========================================
   Device Detection & CSS Loading
   기기 감지 후 필요한 CSS만 로딩
   ========================================== */

(function() {
    'use strict';
    
    // User Agent 기반 모바일 감지 (개발자 도구 모바일 시뮬레이터 제외)
    function isMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // 개발자 도구의 모바일 시뮬레이터 감지
        const isDevToolsEmulation = window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect;
        
        // 실제 화면 크기로 추가 검증
        const isActualMobile = window.innerWidth <= 768 && 'ontouchstart' in window;
        
        const mobileKeywords = [
            'android', 'webos', 'iphone', 'ipad', 'ipod', 
            'blackberry', 'windows phone', 'mobile', 'opera mini'
        ];
        
        const hasMobileKeyword = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // 개발자 도구 시뮬레이터가 아니고, 모바일 키워드가 있으며, 실제 모바일 환경일 때만 true
        return hasMobileKeyword && !isDevToolsEmulation && isActualMobile;
    }
    
    // CSS 파일 동적 로딩
    function loadCSS(href, id) {
        return new Promise((resolve, reject) => {
            // 이미 로드된 경우 건너뛰기
            if (document.getElementById(id)) {
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.id = id;
            
            link.onload = () => {
                console.log(`✅ CSS 로드 완료: ${href}`);
                resolve();
            };
            
            link.onerror = () => {
                console.error(`❌ CSS 로드 실패: ${href}`);
                reject(new Error(`Failed to load CSS: ${href}`));
            };
            
            document.head.appendChild(link);
        });
    }
    
    // 기기별 CSS 활성화/비활성화
    function activateDeviceSpecificCSS() {
        const isMobile = isMobileDevice();
        
        // CSS 링크 요소들 가져오기
        const commonCSS = document.getElementById('common-css');
        const desktopCSS = document.getElementById('desktop-css');
        const mobileCSS = document.getElementById('mobile-css');
        
        if (isMobile) {
            // 모바일 기기
            document.body.classList.add('mobile-device');
            document.body.classList.remove('desktop-device');
            
            // 모바일 CSS 활성화, 데스크톱 CSS 비활성화
            if (mobileCSS) mobileCSS.disabled = false;
            if (desktopCSS) desktopCSS.disabled = true;
            
            console.log('📱 모바일 모드 활성화');
            
            // 모바일 전용 요소 표시
            const mobileElements = document.querySelectorAll('.mobile-only');
            mobileElements.forEach(el => {
                if (el.style.display === 'none') {
                    el.style.display = 'block';
                }
            });
            
            // 모바일 감지 후 번역 다시 실행 (모바일용 텍스트 적용)
            const updateMobileText = () => {
                if (typeof window.applyLanguage === 'function') {
                    window.applyLanguage();
                    console.log('📱 모바일용 번역 적용 완료');
                }
                
                // 추가로 uploadImagePrompt 요소 직접 업데이트
                const uploadPromptElement = document.getElementById('uploadPromptText');
                if (uploadPromptElement && typeof window.translate === 'function') {
                    const mobileText = window.translate('mobileUploadImagePrompt');
                    uploadPromptElement.innerHTML = mobileText.replace(/\n/g, '<br>');
                    uploadPromptElement.style.display = 'block';
                    uploadPromptElement.style.width = '100%';
                    console.log('📱 초기 화면 텍스트 직접 업데이트 완료:', mobileText.substring(0, 50) + '...');
                }
            };
            
            // 여러 번 시도하여 확실히 적용
            setTimeout(updateMobileText, 100);
            setTimeout(updateMobileText, 300);
            setTimeout(updateMobileText, 500);
            
        } else {
            // 데스크톱 기기
            document.body.classList.add('desktop-device');
            document.body.classList.remove('mobile-device');
            
            // 데스크톱 CSS 활성화, 모바일 CSS 비활성화
            if (desktopCSS) desktopCSS.disabled = false;
            if (mobileCSS) mobileCSS.disabled = true;
            
            console.log('🖥️ 데스크톱 모드 활성화');
            
            // 모바일 전용 요소 DOM에서 완전 제거 (설정 패널과 디버그 패널 제외)
            const mobileSelectors = [
                '.mobile-only', '.mobile-toolbar', '.floating-action-buttons', 
                '.emoji-layer', '.fab', '.mobile-mode-panel',
                '#mobileModePanel'
            ];
            
            mobileSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    el.remove(); // DOM에서 완전 제거
                });
            });
            
            // mobile.js 로딩 방지를 위한 플래그 설정
            window.DISABLE_MOBILE_MODE = true;
            
            console.log('🖥️ 데스크톱 - 모바일 요소들 DOM에서 완전 제거 완료');
        }
    }
    
    // DOM 로드 완료 후 실행 + 지연 실행으로 확실한 적용
    function init() {
        activateDeviceSpecificCSS();
        // 추가 지연으로 모든 요소가 로드된 후 다시 실행
        setTimeout(activateDeviceSpecificCSS, 100);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 디버깅을 위한 전역 함수
    window.getDeviceInfo = function() {
        return {
            isMobile: isMobileDevice(),
            userAgent: navigator.userAgent,
            bodyClasses: Array.from(document.body.classList),
            loadedCSS: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => ({
                id: link.id,
                href: link.href
            }))
        };
    };
    
})();