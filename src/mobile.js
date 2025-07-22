/**
 * AnnotateShot Mobile UI Module
 * 모바일 기기 전용 UI/UX 기능 모듈
 * 완전히 독립적으로 동작하며 main.js와 분리됨
 */

class MobileAnnotateShot {
    constructor() {
        this.isMobile = false;
        this.isInitialized = false;
        this.touchActive = false;
        
        // 모바일 감지
        this.detectMobile();
        
        if (this.isMobile) {
            console.log('🔥 Mobile AnnotateShot 모듈 초기화');
            this.init();
        }
    }
    
    detectMobile() {
        const userAgent = navigator.userAgent;
        console.log('🔍 User Agent 확인:', userAgent);
        
        // iPhone Safari에서 자주 사용되는 패턴들
        const mobileChecks = [
            // iPhone 감지
            /iPhone/i.test(userAgent),
            // iPad 감지 (iOS 13+ 에서는 desktop처럼 표시될 수 있음)
            /iPad/i.test(userAgent),
            // iPod 감지
            /iPod/i.test(userAgent),
            // Android 감지
            /Android/i.test(userAgent),
            // 기타 모바일 기기들
            /webOS|BlackBerry|Windows Phone|Mobile|Opera Mini/i.test(userAgent),
            // 터치 지원 확인 (iOS 13+ iPad 대응)
            ('ontouchstart' in window) && window.innerWidth <= 1024
        ];
        
        // 강제 모바일 모드 확인
        const forceMobile = localStorage.getItem('dev-force-mobile') === 'true' || 
                           new URLSearchParams(window.location.search).get('mobile') === 'true';
        
        this.isMobile = mobileChecks.some(check => check) || forceMobile;
        
        console.log('📱 모바일 감지 결과:', {
            iPhone: /iPhone/i.test(userAgent),
            iPad: /iPad/i.test(userAgent),
            Android: /Android/i.test(userAgent),
            touchSupport: 'ontouchstart' in window,
            screenWidth: window.innerWidth,
            forceMobile: forceMobile,
            finalResult: this.isMobile
        });
        
        if (this.isMobile) {
            document.body.classList.remove('desktop-device');
            document.body.classList.add('mobile-device');
            console.log('✅ 모바일 UI 활성화 - 클래스 추가됨');
        } else {
            document.body.classList.remove('mobile-device');
            document.body.classList.add('desktop-device');
            console.log('🖥️ 데스크톱 UI 유지');
        }
    }
    
    init() {
        if (this.isInitialized) return;
        
        console.log('🚀 모바일 모듈 초기화 시작 - DOM 상태:', document.readyState);
        
        // 즉시 실행 (스크립트가 body 하단에 있으므로 DOM이 준비됨)
        this.setupMobileUI();
        
        this.isInitialized = true;
    }
    
    setupMobileUI() {
        console.log('📱 모바일 UI 설정 시작');
        
        // 모바일 UI 요소 표시
        this.showMobileElements();
        
        // 데스크톱 전용 요소들 숨기기/조정
        this.hideMobileIncompatibleElements();
        
        // 이미지 업로드 기능 설정
        this.setupImageUpload();
        
        // 플로팅 액션 버튼 설정
        this.setupFloatingButtons();
        
        // 하단 툴바 설정
        this.setupBottomToolbar();
        
        // 터치 이벤트 설정
        this.setupTouchEvents();
        
        // 모바일 최적화 설정
        this.optimizeForMobile();
        
        console.log('✅ 모바일 UI 설정 완료');
    }
    
    showMobileElements() {
        const mobileElements = document.querySelector('.mobile-only');
        if (mobileElements) {
            mobileElements.style.display = 'block';
            mobileElements.style.visibility = 'visible';
            mobileElements.style.opacity = '1';
            console.log('✅ 모바일 전용 UI 요소 표시됨');
            
            // 개별 요소들도 확인
            const fabButtons = document.querySelectorAll('.fab');
            const mobileToolbar = document.querySelector('.mobile-toolbar');
            
            console.log('🔧 모바일 UI 요소 상태:', {
                mobileElements: !!mobileElements,
                fabButtons: fabButtons.length,
                mobileToolbar: !!mobileToolbar,
                display: mobileElements.style.display
            });
        } else {
            console.error('❌ .mobile-only 요소를 찾을 수 없습니다');
        }
    }
    
    hideMobileIncompatibleElements() {
        // 데스크톱 전용 요소들을 모바일에서 숨기거나 조정
        console.log('🔧 모바일 비호환 요소들 처리 중...');
        
        // Chrome 익스텐션 링크 숨기기 (CSS로도 처리되지만 확실하게)
        const chromeLink = document.querySelector('.chrome-extension-link');
        if (chromeLink) {
            chromeLink.style.display = 'none';
            console.log('✅ Chrome 익스텐션 링크 숨김');
        }
        
        // 사이드바 초기 상태 조정 (모바일에서는 숨김)
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
            console.log('✅ 사이드바 초기 상태 조정');
        }
        
        // 모바일 오버레이 준비
        const mobileOverlay = document.getElementById('mobileOverlay');
        if (mobileOverlay) {
            mobileOverlay.classList.remove('show');
        }
        
        console.log('✅ 모바일 비호환 요소 처리 완료');
    }
    
    setupImageUpload() {
        console.log('📷 이미지 업로드 기능 설정 중...');
        
        const fabImage = document.getElementById('fabImage');
        const mobileImageInput = document.getElementById('mobileImageInput');
        
        if (!fabImage || !mobileImageInput) {
            console.error('❌ 이미지 업로드 요소를 찾을 수 없음');
            return;
        }
        
        // 파일 선택을 위한 개선된 설정
        mobileImageInput.setAttribute('accept', 'image/*');
        mobileImageInput.setAttribute('capture', 'environment'); // 후면 카메라 우선
        
        // 이미지 업로드 버튼 클릭
        fabImage.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📷 이미지 업로드 버튼 클릭됨');
            
            // iOS에서 갤러리/카메라 선택을 위해 capture 속성 임시 제거
            if (this.isIOS()) {
                this.showImageSourceSelector();
            } else {
                mobileImageInput.click();
            }
        });
        
        // 파일 선택 이벤트
        mobileImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log('📷 이미지 파일 선택됨:', file.name, file.type, file.size);
                this.handleImageFile(file);
            } else {
                console.log('❌ 파일 선택 취소됨');
            }
            
            // 입력 초기화 (같은 파일 재선택 가능)
            e.target.value = '';
        });
        
        console.log('✅ 이미지 업로드 기능 설정 완료');
    }
    
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }
    
    showImageSourceSelector() {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-image-source-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;
        
        const dialog = document.createElement('div');
        dialog.className = 'mobile-image-source-dialog';
        dialog.style.cssText = `
            background: var(--card);
            border-radius: 12px;
            padding: 2rem;
            max-width: 300px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 1.5rem 0; color: var(--foreground);">이미지 선택</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <button id="selectCamera" style="padding: 1rem; border: none; border-radius: 8px; background: var(--primary); color: var(--primary-foreground); font-size: 1rem; cursor: pointer;">
                    📷 카메라로 촬영
                </button>
                <button id="selectGallery" style="padding: 1rem; border: none; border-radius: 8px; background: var(--muted); color: var(--foreground); font-size: 1rem; cursor: pointer;">
                    🖼️ 갤러리에서 선택
                </button>
                <button id="cancelSelection" style="padding: 0.75rem; border: none; border-radius: 8px; background: transparent; color: var(--muted-foreground); font-size: 0.9rem; cursor: pointer;">
                    취소
                </button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // 카메라 선택
        document.getElementById('selectCamera').addEventListener('click', () => {
            const input = document.getElementById('mobileImageInput');
            input.setAttribute('capture', 'environment');
            input.click();
            document.body.removeChild(overlay);
        });
        
        // 갤러리 선택
        document.getElementById('selectGallery').addEventListener('click', () => {
            const input = document.getElementById('mobileImageInput');
            input.removeAttribute('capture');
            input.click();
            document.body.removeChild(overlay);
        });
        
        // 취소
        document.getElementById('cancelSelection').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        // 배경 클릭으로 닫기
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }
    
    handleImageFile(file) {
        console.log('📷 이미지 파일 처리 시작:', {
            name: file.name,
            type: file.type,
            size: Math.round(file.size / 1024) + 'KB'
        });
        
        if (!file.type.startsWith('image/')) {
            this.showMessage('❌ 이미지 파일만 선택 가능합니다', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log('📷 FileReader 로딩 완료');
            this.loadImageToCanvas(e.target.result);
        };
        
        reader.onerror = (e) => {
            console.error('❌ FileReader 오류:', e);
            this.showMessage('❌ 이미지를 읽을 수 없습니다', 'error');
        };
        
        reader.readAsDataURL(file);
    }
    
    loadImageToCanvas(imageDataUrl) {
        console.log('🎨 캔버스에 이미지 로드 시작');
        
        const img = new Image();
        
        img.onload = () => {
            console.log('✅ 이미지 로드 완료:', img.width + 'x' + img.height);
            
            try {
                // 싱글 모드로 전환
                const canvasModeSelector = document.getElementById('canvasModeSelector');
                if (canvasModeSelector) {
                    canvasModeSelector.value = 'single';
                    canvasModeSelector.dispatchEvent(new Event('change'));
                }
                
                // main.js의 전역 변수와 함수 사용
                if (typeof window.currentImage !== 'undefined') {
                    window.currentImage = img;
                }
                
                // 리사이즈 함수 호출
                if (typeof window.resizeAndDrawImage === 'function') {
                    window.resizeAndDrawImage();
                } else if (typeof window.drawImageOnCanvas === 'function') {
                    window.drawImageOnCanvas(img);
                } else {
                    // 직접 캔버스에 그리기
                    this.drawImageDirectly(img);
                }
                
                this.showMessage('✅ 이미지가 로드되었습니다', 'success');
                
            } catch (error) {
                console.error('❌ 이미지 캔버스 로드 오류:', error);
                this.showMessage('❌ 이미지를 캔버스에 로드할 수 없습니다', 'error');
            }
        };
        
        img.onerror = (e) => {
            console.error('❌ 이미지 객체 로드 오류:', e);
            this.showMessage('❌ 잘못된 이미지 파일입니다', 'error');
        };
        
        img.src = imageDataUrl;
    }
    
    drawImageDirectly(img) {
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        
        if (!canvas || !ctx) {
            console.error('❌ 캔버스를 찾을 수 없음');
            return;
        }
        
        // 캔버스 크기를 이미지에 맞게 조정
        const maxWidth = window.innerWidth - 100;
        const maxHeight = window.innerHeight - 200;
        
        let { width, height } = this.calculateImageSize(img.width, img.height, maxWidth, maxHeight);
        
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        // 이미지 그리기
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        console.log('✅ 이미지를 캔버스에 직접 그림:', width + 'x' + height);
    }
    
    calculateImageSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight, 1);
        return {
            width: Math.floor(originalWidth * ratio),
            height: Math.floor(originalHeight * ratio)
        };
    }
    
    setupFloatingButtons() {
        const fabSave = document.getElementById('fabSave');
        const fabUndo = document.getElementById('fabUndo');
        const fabMode = document.getElementById('fabMode');
        
        if (fabSave) {
            fabSave.addEventListener('click', () => {
                const saveButton = document.getElementById('saveButton');
                if (saveButton) saveButton.click();
            });
        }
        
        if (fabUndo) {
            fabUndo.addEventListener('click', () => {
                const undoButton = document.getElementById('undoButton');
                if (undoButton) undoButton.click();
            });
        }
        
        if (fabMode) {
            fabMode.addEventListener('click', () => {
                this.showMobileModePanel();
            });
        }
        
        console.log('✅ 플로팅 버튼 설정 완료');
    }
    
    setupBottomToolbar() {
        const mobileToolbar = document.querySelector('.mobile-toolbar');
        if (mobileToolbar) {
            mobileToolbar.addEventListener('click', (e) => {
                const button = e.target.closest('.toolbar-button');
                if (button && button.dataset.mode) {
                    const modeSelector = document.getElementById('modeSelector');
                    if (modeSelector) {
                        modeSelector.value = button.dataset.mode;
                        modeSelector.dispatchEvent(new Event('change'));
                        this.updateToolbarState();
                    }
                }
            });
        }
        
        this.updateToolbarState();
        console.log('✅ 하단 툴바 설정 완료');
    }
    
    updateToolbarState() {
        const buttons = document.querySelectorAll('.mobile-toolbar .toolbar-button');
        const currentMode = document.getElementById('modeSelector')?.value;
        
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === currentMode) {
                btn.classList.add('active');
            }
        });
    }
    
    setupTouchEvents() {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) {
            console.error('❌ 캔버스를 찾을 수 없음');
            return;
        }
        
        console.log('👆 터치 이벤트 설정 시작');
        
        // 터치 이벤트 핸들러들
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        canvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });
        
        console.log('✅ 터치 이벤트 설정 완료');
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        this.touchActive = true;
        
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        console.log('👆 터치 시작:', x, y);
        
        // 기존 마우스 이벤트 시뮬레이션
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0,
            bubbles: true,
            cancelable: true
        });
        
        e.target.dispatchEvent(mouseEvent);
    }
    
    handleTouchMove(e) {
        if (!this.touchActive) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            bubbles: true,
            cancelable: true
        });
        
        e.target.dispatchEvent(mouseEvent);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.touchActive = false;
        
        const touch = e.changedTouches[0];
        
        const mouseEvent = new MouseEvent('mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0,
            bubbles: true,
            cancelable: true
        });
        
        e.target.dispatchEvent(mouseEvent);
        
        console.log('👆 터치 종료');
    }
    
    handleTouchCancel(e) {
        this.touchActive = false;
        console.log('👆 터치 취소');
    }
    
    optimizeForMobile() {
        // 리사이즈를 auto로 설정
        const resizeSelector = document.getElementById('resizeSelector');
        if (resizeSelector) {
            resizeSelector.value = 'auto';
            resizeSelector.dispatchEvent(new Event('change'));
        }
        
        console.log('⚙️ 모바일 최적화 설정 완료');
    }
    
    showMessage(message, type = 'info') {
        console.log('💬 메시지:', message);
        
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.style.display = 'block';
            messageDiv.className = type === 'success' ? 'success' : type === 'error' ? 'error' : '';
            
            setTimeout(() => {
                messageDiv.style.display = 'none';
                messageDiv.className = '';
            }, 3000);
        }
        
        // 모바일 전용 토스트 메시지도 표시
        this.showToast(message, type);
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 80vw;
            text-align: center;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
    
    showMobileModePanel() {
        const panel = document.getElementById('mobileModePanel');
        const overlay = document.getElementById('mobileOverlay');
        if (panel && overlay) {
            panel.classList.add('show');
            overlay.classList.add('show');
        }
    }
}

// 전역 함수들
window.toggleMobileMode = function() {
    const isMobileNow = document.body.classList.contains('mobile-device');
    if (isMobileNow) {
        document.body.classList.remove('mobile-device');
        document.body.classList.add('desktop-device');
        localStorage.setItem('dev-force-mobile', 'false');
        console.log('🖥️ 데스크톱 모드로 전환');
    } else {
        document.body.classList.remove('desktop-device');
        document.body.classList.add('mobile-device');
        localStorage.setItem('dev-force-mobile', 'true');
        console.log('📱 모바일 모드로 전환');
    }
    location.reload();
};

window.selectMobileMode = function(mode) {
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector) {
        modeSelector.value = mode;
        modeSelector.dispatchEvent(new Event('change'));
    }
    
    const panel = document.getElementById('mobileModePanel');
    const overlay = document.getElementById('mobileOverlay');
    if (panel && overlay) {
        panel.classList.remove('show');
        overlay.classList.remove('show');
    }
    
    if (window.mobileApp) {
        window.mobileApp.updateToolbarState();
    }
};

window.hideMobileModePanel = function() {
    const panel = document.getElementById('mobileModePanel');
    const overlay = document.getElementById('mobileOverlay');
    if (panel && overlay) {
        panel.classList.remove('show');
        overlay.classList.remove('show');
    }
};

// 자동 초기화
console.log('🚀 Mobile AnnotateShot 모듈 로딩 중...');
window.mobileApp = new MobileAnnotateShot();

// 디버그 정보
setTimeout(() => {
    console.log('=== 📱 Mobile AnnotateShot 최종 디버그 정보 ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('모바일 앱 상태:', {
        모바일감지: window.mobileApp?.isMobile,
        초기화완료: window.mobileApp?.isInitialized,
        강제모드: localStorage.getItem('dev-force-mobile') === 'true'
    });
    console.log('DOM 상태:', {
        body클래스: document.body.className,
        모바일요소표시: document.querySelector('.mobile-only')?.style.display,
        플로팅버튼: !!document.getElementById('fabImage'),
        하단툴바: !!document.querySelector('.mobile-toolbar'),
        Chrome링크숨김: document.querySelector('.chrome-extension-link')?.style.display === 'none'
    });
    console.log('화면 정보:', {
        너비: window.innerWidth,
        높이: window.innerHeight,
        터치지원: 'ontouchstart' in window,
        디바이스픽셀비: window.devicePixelRatio
    });
    console.log('===');
    console.log('iPhone Safari 문제 해결 테스트:');
    console.log('1. toggleMobileMode() - 강제 모바일 모드');
    console.log('2. 콘솔에서 위 정보 확인');
    console.log('3. 모바일 UI 요소들이 보이는지 확인');
    console.log('===============================================');
}, 2000);