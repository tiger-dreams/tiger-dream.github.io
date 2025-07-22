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
        this.shapeDragging = false;
        this.shapeStartX = null;
        this.shapeStartY = null;
        
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
        // 모바일에서는 화면 전체 너비를 최대한 활용 (좌우 1rem 여백만)
        const availableWidth = window.innerWidth - 16; // 1rem = 16px 좌우 여백
        const availableHeight = window.innerHeight - 200; // 상하 UI 공간 제외
        
        const finalMaxWidth = Math.min(maxWidth || availableWidth, availableWidth);
        const finalMaxHeight = Math.min(maxHeight || availableHeight, availableHeight);
        
        const ratio = Math.min(finalMaxWidth / originalWidth, finalMaxHeight / originalHeight, 1);
        
        const result = {
            width: Math.floor(originalWidth * ratio),
            height: Math.floor(originalHeight * ratio)
        };
        
        console.log('📏 모바일 이미지 크기 계산:', {
            original: `${originalWidth}x${originalHeight}`,
            available: `${availableWidth}x${availableHeight}`,
            final: `${result.width}x${result.height}`,
            ratio: ratio.toFixed(2)
        });
        
        return result;
    }
    
    setupFloatingButtons() {
        const fabSave = document.getElementById('fabSave');
        const fabUndo = document.getElementById('fabUndo');
        const fabSettings = document.getElementById('fabSettings');
        
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
        
        if (fabSettings) {
            fabSettings.addEventListener('click', () => {
                this.showMobileSettingsPanel();
            });
        }
        
        // 설정 패널 이벤트 설정
        this.setupSettingsPanel();
        
        console.log('✅ 플로팅 버튼 설정 완료');
    }
    
    setupSettingsPanel() {
        console.log('⚙️ 설정 패널 이벤트 설정 중...');
        
        // 색상 버튼 이벤트
        const colorButtons = document.querySelectorAll('.mobile-color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 기존 active 제거
                colorButtons.forEach(b => b.classList.remove('active'));
                // 새로운 active 추가
                btn.classList.add('active');
                
                const color = btn.dataset.color;
                this.changeColor(color);
            });
        });
        
        // 크기 슬라이더 이벤트
        const sizeSlider = document.getElementById('mobileSizeSlider');
        const sizeValue = document.getElementById('mobileSizeValue');
        if (sizeSlider && sizeValue) {
            sizeSlider.addEventListener('input', (e) => {
                const size = e.target.value;
                sizeValue.textContent = size + 'px';
                this.changeSize(size);
            });
        }
        
        // 이모지 버튼 이벤트
        const emojiButtons = document.querySelectorAll('.mobile-emoji-btn');
        emojiButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                emojiButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const emoji = btn.dataset.emoji;
                this.changeEmoji(emoji);
            });
        });
        
        // 채우기 옵션 버튼 이벤트
        const fillButtons = document.querySelectorAll('.mobile-fill-btn');
        fillButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                fillButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const fill = btn.dataset.fill;
                this.changeFillType(fill);
            });
        });
        
        console.log('✅ 설정 패널 이벤트 설정 완료');
    }
    
    showMobileSettingsPanel() {
        console.log('⚙️ 모바일 설정 패널 열기');
        
        const panel = document.getElementById('mobileSettingsPanel');
        const overlay = document.getElementById('mobileOverlay');
        
        if (panel && overlay) {
            // 현재 모드에 따라 패널 내용 조정
            this.updateSettingsPanelForCurrentMode();
            
            panel.classList.add('show');
            overlay.classList.add('show');
            
            // 현재 설정값들로 UI 초기화
            this.syncSettingsPanelWithCurrentValues();
            
            // 오버레이 클릭으로 닫기 (기존 이벤트 제거 후 새로 추가)
            overlay.replaceWith(overlay.cloneNode(true));
            const newOverlay = document.getElementById('mobileOverlay');
            newOverlay.addEventListener('click', (e) => {
                if (e.target === newOverlay) {
                    window.hideMobileSettingsPanel();
                }
            });
        }
    }
    
    updateSettingsPanelForCurrentMode() {
        const currentMode = document.getElementById('modeSelector')?.value || 'number';
        
        const emojiSection = document.getElementById('emojiSection');
        const shapeSection = document.getElementById('shapeSection');
        
        // 모든 섹션 숨기기
        if (emojiSection) emojiSection.style.display = 'none';
        if (shapeSection) shapeSection.style.display = 'none';
        
        // 현재 모드에 따라 관련 섹션 표시
        switch(currentMode) {
            case 'emoji':
                if (emojiSection) emojiSection.style.display = 'block';
                break;
            case 'shape':
                if (shapeSection) shapeSection.style.display = 'block';
                break;
        }
        
        console.log('⚙️ 설정 패널을 모드에 맞게 조정:', currentMode);
    }
    
    syncSettingsPanelWithCurrentValues() {
        // 현재 색상 동기화
        const currentColor = window.currentColor || '#FF0000';
        const colorButtons = document.querySelectorAll('.mobile-color-btn');
        colorButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.color === currentColor) {
                btn.classList.add('active');
            }
        });
        
        // 현재 크기 동기화
        const currentSize = window.currentSize || '20';
        const sizeSlider = document.getElementById('mobileSizeSlider');
        const sizeValue = document.getElementById('mobileSizeValue');
        if (sizeSlider && sizeValue) {
            sizeSlider.value = currentSize;
            sizeValue.textContent = currentSize + 'px';
        }
        
        // 현재 채우기 옵션 동기화
        const currentFill = window.currentFill || 'none';
        const fillButtons = document.querySelectorAll('.mobile-fill-btn');
        fillButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.fill === currentFill) {
                btn.classList.add('active');
            }
        });
        
        console.log('🔄 설정 패널 현재값 동기화 완료');
    }
    
    changeColor(color) {
        console.log('🎨 색상 변경:', color);
        
        // main.js의 전역 변수 업데이트
        if (typeof window.currentColor !== 'undefined') {
            window.currentColor = color;
        }
        
        // 색상 선택기 업데이트
        const colorSelector = document.getElementById('colorSelector');
        if (colorSelector) {
            colorSelector.value = color;
            colorSelector.dispatchEvent(new Event('change'));
        }
        
        this.showToast('색상이 변경되었습니다', 'success');
    }
    
    changeSize(size) {
        console.log('📏 크기 변경:', size);
        
        // main.js의 전역 변수 업데이트
        if (typeof window.currentSize !== 'undefined') {
            window.currentSize = size;
        }
        
        // 크기 선택기 업데이트
        const sizeSelector = document.getElementById('sizeSelector');
        if (sizeSelector) {
            sizeSelector.value = size;
            sizeSelector.dispatchEvent(new Event('change'));
        }
    }
    
    changeEmoji(emoji) {
        console.log('😀 이모지 변경:', emoji);
        
        // main.js의 전역 변수 업데이트
        if (typeof window.currentEmoji !== 'undefined') {
            window.currentEmoji = emoji;
        }
        
        // 이모지 선택기 업데이트
        const emojiSelector = document.getElementById('emojiSelector');
        if (emojiSelector) {
            emojiSelector.value = emoji;
            emojiSelector.dispatchEvent(new Event('change'));
        }
        
        this.showToast(`이모지가 ${emoji}로 변경되었습니다`, 'success');
    }
    
    changeFillType(fill) {
        console.log('🎨 채우기 옵션 변경:', fill);
        
        // main.js의 전역 변수 업데이트
        if (typeof window.currentFill !== 'undefined') {
            window.currentFill = fill;
        }
        
        // 채우기 선택기 업데이트
        const fillSelector = document.getElementById('fillSelector');
        if (fillSelector) {
            fillSelector.value = fill;
            fillSelector.dispatchEvent(new Event('change'));
        }
        
        const fillNames = {
            'none': '테두리만',
            'solid': '채우기',
            'blur': '흐림',
            'mosaic': '모자이크'
        };
        
        this.showToast(`${fillNames[fill]}로 변경되었습니다`, 'success');
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
        const canvas = e.target;
        
        // 캔버스 좌표 정확히 계산 (스케일링 고려)
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        console.log('👆 터치 시작:', {
            raw: { x: touch.clientX - rect.left, y: touch.clientY - rect.top },
            scaled: { x, y },
            scale: { scaleX, scaleY },
            mode: document.getElementById('modeSelector')?.value
        });
        
        // main.js의 마우스 이벤트와 동일한 방식으로 처리
        this.triggerCanvasClick(x, y);
    }
    
    triggerCanvasClick(x, y) {
        console.log('🎯 캔버스 클릭 트리거:', x, y);
        
        // main.js의 캔버스 클릭 이벤트와 동일한 로직 실행
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) {
            console.error('❌ 캔버스를 찾을 수 없음');
            return;
        }
        
        // main.js의 전역 변수들 확인
        const currentMode = document.getElementById('modeSelector')?.value || 'number';
        
        // 마우스 이벤트 객체를 만들어서 main.js의 기존 이벤트 핸들러 호출
        const mouseEvent = {
            preventDefault: () => {},
            clientX: x + canvas.getBoundingClientRect().left,
            clientY: y + canvas.getBoundingClientRect().top,
            offsetX: x,
            offsetY: y,
            target: canvas
        };
        
        // main.js의 getMousePos 함수가 있다면 사용
        let canvasX, canvasY;
        if (typeof window.getMousePos === 'function') {
            const pos = window.getMousePos(canvas, mouseEvent);
            canvasX = pos.x;
            canvasY = pos.y;
        } else {
            // 직접 계산
            canvasX = x;
            canvasY = y;
        }
        
        console.log('📍 최종 캔버스 좌표:', { canvasX, canvasY, mode: currentMode });
        
        // 현재 모드에 따라 적절한 main.js 함수 호출
        try {
            switch(currentMode) {
                case 'number':
                    this.handleNumberMode(canvasX, canvasY);
                    break;
                case 'text':
                    this.handleTextMode(canvasX, canvasY);
                    break;
                case 'emoji':
                    this.handleEmojiMode(canvasX, canvasY);
                    break;
                case 'shape':
                    this.handleShapeMode(canvasX, canvasY);
                    break;
                default:
                    console.log('❓ 알 수 없는 모드:', currentMode);
            }
        } catch (error) {
            console.error('❌ 터치 액션 처리 오류:', error);
        }
    }
    
    handleNumberMode(x, y) {
        console.log('🔢 숫자 모드 처리:', x, y);
        
        // main.js의 전역 변수들 사용
        if (typeof window.clicks === 'undefined') window.clicks = [];
        if (typeof window.clickCount === 'undefined') window.clickCount = 0;
        
        const currentColor = window.currentColor || '#FF0000';
        const currentSize = window.currentSize || '20';
        
        // 숫자 객체 생성 (main.js와 동일한 구조)
        const numberObj = {
            type: 'number',
            x: x,
            y: y,
            number: window.clickCount + 1,
            color: currentColor,
            size: currentSize,
            id: Date.now()
        };
        
        window.clicks.push(numberObj);
        window.clickCount++;
        
        console.log('✅ 숫자 추가됨:', numberObj);
        
        // 캔버스 다시 그리기 - 더 안전한 방법
        this.safeRedrawCanvas();
    }
    
    handleTextMode(x, y) {
        console.log('📝 텍스트 모드 처리:', x, y);
        
        // 텍스트 입력 프롬프트
        const text = prompt('텍스트를 입력하세요:');
        if (!text || text.trim() === '') {
            console.log('❌ 텍스트 입력이 취소되었습니다');
            return;
        }
        
        if (typeof window.clicks === 'undefined') window.clicks = [];
        
        const currentColor = window.currentColor || '#FF0000';
        const currentSize = window.currentSize || '20';
        
        // 텍스트 객체 생성
        const textObj = {
            type: 'text',
            x: x,
            y: y,
            text: text.trim(),
            color: currentColor,
            size: currentSize,
            id: Date.now()
        };
        
        window.clicks.push(textObj);
        
        console.log('✅ 텍스트 추가됨:', textObj);
        
        // 캔버스 다시 그리기 - 더 안전한 방법
        this.safeRedrawCanvas();
    }
    
    handleEmojiMode(x, y) {
        console.log('😀 이모지 모드 처리:', x, y);
        
        if (typeof window.clicks === 'undefined') window.clicks = [];
        
        const currentEmoji = window.currentEmoji || '😀';
        const currentSize = window.currentSize || '20';
        
        // 이모지 객체 생성
        const emojiObj = {
            type: 'emoji',
            x: x,
            y: y,
            emoji: currentEmoji,
            size: currentSize,
            id: Date.now()
        };
        
        window.clicks.push(emojiObj);
        
        console.log('✅ 이모지 추가됨:', emojiObj);
        
        // 캔버스 다시 그리기 - 더 안전한 방법
        this.safeRedrawCanvas();
    }
    
    handleShapeMode(x, y) {
        console.log('🔷 도형 모드 처리 (드래그 시작):', x, y);
        
        // 도형은 드래그로 그려야 하므로 시작 좌표만 저장
        this.shapeStartX = x;
        this.shapeStartY = y;
        this.shapeDragging = true;
        
        console.log('🔷 도형 드래그 시작점 설정:', { x, y });
    }
    
    safeRedrawCanvas() {
        console.log('🎨 안전한 캔버스 다시 그리기 시작');
        
        try {
            // main.js의 currentImage가 있는지 확인
            if (!window.currentImage) {
                console.warn('⚠️ currentImage가 없어서 캔버스 다시 그리기를 건너뜁니다');
                return;
            }
            
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
            
            if (!canvas || !ctx) {
                console.error('❌ 캔버스 또는 컨텍스트를 찾을 수 없음');
                return;
            }
            
            // 캔버스 지우고 이미지 다시 그리기
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(window.currentImage, 0, 0, canvas.width, canvas.height);
            
            // 모든 주석 다시 그리기
            if (window.clicks && Array.isArray(window.clicks)) {
                window.clicks.forEach(click => {
                    this.drawAnnotation(ctx, click);
                });
            }
            
            console.log('✅ 안전한 캔버스 다시 그리기 완료');
            
        } catch (error) {
            console.error('❌ 캔버스 다시 그리기 오류:', error);
            
            // 실패 시 기존 방법으로 fallback
            if (typeof window.redrawCanvas === 'function') {
                console.log('🔄 기존 redrawCanvas 함수로 fallback');
                window.redrawCanvas();
            }
        }
    }
    
    drawAnnotation(ctx, annotation) {
        try {
            switch(annotation.type) {
                case 'number':
                    this.drawNumber(ctx, annotation);
                    break;
                case 'text':
                    this.drawText(ctx, annotation);
                    break;
                case 'emoji':
                    this.drawEmoji(ctx, annotation);
                    break;
                case 'shape':
                    this.drawShape(ctx, annotation);
                    break;
            }
        } catch (error) {
            console.error('❌ 주석 그리기 오류:', error, annotation);
        }
    }
    
    drawNumber(ctx, annotation) {
        const size = parseInt(annotation.size) || 20;
        const radius = size;
        
        // 배경 원 그리기
        ctx.fillStyle = annotation.color;
        ctx.beginPath();
        ctx.arc(annotation.x, annotation.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 숫자 텍스트
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(annotation.number.toString(), annotation.x, annotation.y);
    }
    
    drawText(ctx, annotation) {
        const size = parseInt(annotation.size) || 20;
        
        ctx.fillStyle = annotation.color;
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(annotation.text, annotation.x, annotation.y);
    }
    
    drawEmoji(ctx, annotation) {
        const size = parseInt(annotation.size) || 20;
        
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(annotation.emoji, annotation.x, annotation.y);
    }
    
    drawShape(ctx, annotation) {
        const width = annotation.endX - annotation.startX;
        const height = annotation.endY - annotation.startY;
        
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.lineWidth === 'thin' ? 1 : annotation.lineWidth === 'thick' ? 5 : 3;
        
        switch(annotation.shape) {
            case 'rectangle':
                ctx.strokeRect(annotation.startX, annotation.startY, width, height);
                if (annotation.fill === 'solid') {
                    ctx.fillStyle = annotation.color;
                    ctx.fillRect(annotation.startX, annotation.startY, width, height);
                }
                break;
            case 'circle':
                const radius = Math.sqrt(width * width + height * height) / 2;
                const centerX = annotation.startX + width / 2;
                const centerY = annotation.startY + height / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.stroke();
                if (annotation.fill === 'solid') {
                    ctx.fillStyle = annotation.color;
                    ctx.fill();
                }
                break;
        }
    }
    
    
    handleTouchMove(e) {
        if (!this.touchActive) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const canvas = e.target;
        
        // 캔버스 좌표 계산 (스케일링 고려)
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        // 도형 모드에서 드래그 중인 경우 미리보기 처리
        if (this.shapeDragging && typeof this.shapeStartX !== 'undefined') {
            console.log('🔷 도형 드래그 중:', { startX: this.shapeStartX, startY: this.shapeStartY, currentX: x, currentY: y });
            
            // main.js의 도형 미리보기 함수가 있다면 호출
            if (typeof window.drawShapePreview === 'function') {
                window.drawShapePreview(this.shapeStartX, this.shapeStartY, x, y);
            }
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.touchActive = false;
        
        // 도형 드래그가 완료된 경우
        if (this.shapeDragging && typeof this.shapeStartX !== 'undefined') {
            const touch = e.changedTouches[0];
            const canvas = e.target;
            
            // 캔버스 좌표 계산 (스케일링 고려)
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const endX = (touch.clientX - rect.left) * scaleX;
            const endY = (touch.clientY - rect.top) * scaleY;
            
            console.log('🔷 도형 드래그 완료:', { 
                startX: this.shapeStartX, 
                startY: this.shapeStartY, 
                endX, 
                endY 
            });
            
            // 도형 생성
            this.createShape(this.shapeStartX, this.shapeStartY, endX, endY);
            
            // 드래그 상태 초기화
            this.shapeDragging = false;
            delete this.shapeStartX;
            delete this.shapeStartY;
        }
        
        console.log('👆 터치 종료');
    }
    
    createShape(startX, startY, endX, endY) {
        console.log('🔷 도형 생성:', { startX, startY, endX, endY });
        
        if (typeof window.clicks === 'undefined') window.clicks = [];
        
        const currentShape = window.currentShape || 'rectangle';
        const currentColor = window.currentColor || '#FF0000';
        const currentLineWidth = window.currentLineWidth || 'medium';
        const currentFill = window.currentFill || 'none';
        
        // 도형 객체 생성 (main.js와 동일한 구조)
        const shapeObj = {
            type: 'shape',
            shape: currentShape,
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            color: currentColor,
            lineWidth: currentLineWidth,
            fill: currentFill,
            id: Date.now()
        };
        
        window.clicks.push(shapeObj);
        
        console.log('✅ 도형 추가됨:', shapeObj);
        
        // 캔버스 다시 그리기 - 더 안전한 방법
        this.safeRedrawCanvas();
    }
    
    handleTouchCancel(e) {
        this.touchActive = false;
        
        // 도형 드래그 상태 초기화
        if (this.shapeDragging) {
            this.shapeDragging = false;
            delete this.shapeStartX;
            delete this.shapeStartY;
            console.log('🔷 도형 드래그 취소');
        }
        
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

window.hideMobileSettingsPanel = function() {
    const panel = document.getElementById('mobileSettingsPanel');
    const overlay = document.getElementById('mobileOverlay');
    if (panel && overlay) {
        panel.classList.remove('show');
        overlay.classList.remove('show');
        console.log('⚙️ 모바일 설정 패널 닫기');
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