/* ==========================================
   Device Detection & CSS Loading
   기기 감지 후 필요한 CSS만 로딩
   ========================================== */

(function() {
    'use strict';
    
    // User Agent 기반 모바일 감지 (Safari 지원 강화)
    function isMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Safari 모바일 특별 감지
        const isSafariMobile = /iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent);
        
        // 실제 화면 크기로 추가 검증 (Safari는 더 관대하게)
        const isActualMobile = window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        
        const mobileKeywords = [
            'android', 'webos', 'iphone', 'ipad', 'ipod', 
            'blackberry', 'windows phone', 'mobile', 'opera mini'
        ];
        
        const hasMobileKeyword = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // Safari 모바일이거나, 모바일 키워드가 있으면서 실제 모바일 환경일 때 true
        return isSafariMobile || (hasMobileKeyword && isActualMobile);
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
            
            // 캔버스 시스템 완전 교체 (PC → 모바일)
            const pcCanvas = document.getElementById('imageCanvas');
            const mobileCanvas = document.getElementById('mobileImageCanvas');
            const pcContainer = document.getElementById('canvasContainer');
            const mobileContainer = document.getElementById('mobileCanvasContainer');
            
            if (pcCanvas && mobileCanvas && pcContainer && mobileContainer) {
                // PC 캔버스 ID 변경 (백업용)
                pcCanvas.id = 'pcImageCanvas';
                pcContainer.id = 'pcCanvasContainer';
                
                // 모바일 캔버스를 메인 캔버스로 설정
                mobileCanvas.id = 'imageCanvas';
                mobileContainer.id = 'canvasContainer';
                
                console.log('📱 캔버스 시스템 모바일로 교체 완료');
            }
            
            // 모바일 전용 요소 표시
            const mobileElements = document.querySelectorAll('.mobile-only');
            mobileElements.forEach(el => {
                if (el.style.display === 'none') {
                    el.style.display = 'block';
                }
            });
            
            // 모바일 전용 캔버스 시스템 사용으로 번역 시스템 우회 불필요
            console.log('📱 모바일 전용 UI 완전 분리 완료 - 번역 시스템 간섭 없음');
            
        } else {
            // 데스크톱 기기
            document.body.classList.add('desktop-device');
            document.body.classList.remove('mobile-device');
            
            // 데스크톱 CSS 활성화, 모바일 CSS 비활성화
            if (desktopCSS) desktopCSS.disabled = false;
            if (mobileCSS) mobileCSS.disabled = true;
            
            console.log('🖥️ 데스크톱 모드 활성화');
            
            // 모바일 전용 요소 DOM에서 완전 제거 (더 포괄적)
            const mobileSelectors = [
                '.mobile-only', '.mobile-toolbar', '.floating-action-buttons', 
                '.emoji-layer', '.fab', '.mobile-mode-panel', '.mobile-settings-panel',
                '.mobile-debug-panel', '#mobileModePanel', '#mobileSettingsPanel', 
                '#mobileDebugPanel', '[class*="mobile-"]'
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