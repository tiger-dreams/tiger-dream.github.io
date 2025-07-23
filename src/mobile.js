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
        
        // 터치 감도 조절을 위한 변수들
        this.touchStartX = null;
        this.touchStartY = null;
        this.touchMoved = false;
        this.touchThreshold = 10; // 10px 이상 움직이면 스크롤로 간주
        
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
        
        // MVP 설정 - 숫자 모드로 기본 설정
        this.setupMVPDefaults();
        
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
        this.mobileLog('📷 MVP 이미지 업로드 설정 시작');
        
        const fabImage = document.getElementById('fabImage');
        const mobileImageInput = document.getElementById('mobileImageInput');
        
        if (!fabImage || !mobileImageInput) {
            this.mobileLog('❌ 이미지 업로드 요소를 찾을 수 없음');
            return;
        }
        
        // 파일 선택을 위한 단순한 설정
        mobileImageInput.setAttribute('accept', 'image/*');
        
        // 이미지 업로드 버튼 클릭 - 단순화
        fabImage.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.mobileLog('📷 이미지 업로드 버튼 클릭됨');
            
            // 단순하게 파일 선택만
            mobileImageInput.click();
        });
        
        // 파일 선택 이벤트
        mobileImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.mobileLog(`📷 파일선택: ${file.name} (${Math.round(file.size/1024)}KB)`);
                this.handleImageFileMVP(file);
            } else {
                this.mobileLog('❌ 파일 선택 취소됨');
            }
            
            // 입력 초기화
            e.target.value = '';
        });
        
        this.mobileLog('✅ MVP 이미지 업로드 설정 완료');
    }
    
    handleImageFileMVP(file) {
        this.mobileLog(`📷 MVP 이미지 처리 시작: ${file.name} (${Math.round(file.size/1024)}KB)`);
        
        if (!file.type.startsWith('image/')) {
            this.mobileLog('❌ 이미지 파일이 아닙니다');
            this.showToast('❌ 이미지 파일만 선택 가능합니다', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.mobileLog('📷 파일 읽기 완료');
            this.loadImageToCanvasMVP(e.target.result);
        };
        
        reader.onerror = (e) => {
            this.mobileLog(`❌ 파일 읽기 오류: ${e.message || 'Unknown error'}`);
            this.showToast('❌ 이미지를 읽을 수 없습니다', 'error');
        };
        
        reader.readAsDataURL(file);
    }
    
    loadImageToCanvasMVP(imageDataUrl) {
        this.mobileLog('🎨 MVP 캔버스 이미지 로드 시작');
        
        const img = new Image();
        
        img.onload = () => {
            this.mobileLog(`✅ 이미지 로드 완료: ${img.width}x${img.height}`);
            
            try {
                // 캔버스 찾기
                const canvas = document.getElementById('imageCanvas');
                const ctx = canvas.getContext('2d');
                
                if (!canvas || !ctx) {
                    this.mobileLog('❌ 캔버스를 찾을 수 없음');
                    return;
                }
                
                // MVP: 전체화면 캔버스 크기 계산
                const { width: canvasWidth, height: canvasHeight } = this.calculateImageSize(img.width, img.height);
                
                // 캔버스 크기를 화면에 맞춤
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                canvas.style.width = canvasWidth + 'px';
                canvas.style.height = canvasHeight + 'px';
                
                // 이미지를 캔버스에 맞춰 크롭하여 그리기
                const widthRatio = canvasWidth / img.width;
                const heightRatio = canvasHeight / img.height;
                const ratio = Math.max(widthRatio, heightRatio); // 캔버스를 채우는 비율
                
                const scaledWidth = img.width * ratio;
                const scaledHeight = img.height * ratio;
                
                // 중앙 정렬을 위한 오프셋 계산
                const offsetX = (canvasWidth - scaledWidth) / 2;
                const offsetY = (canvasHeight - scaledHeight) / 2;
                
                // 캔버스 지우고 이미지 그리기 (중앙 정렬, 크롭)
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
                
                this.mobileLog(`🎨 캔버스에 이미지 그리기: 캔버스=${canvasWidth}x${canvasHeight}, 이미지=${scaledWidth.toFixed(0)}x${scaledHeight.toFixed(0)}, 오프셋=(${offsetX.toFixed(0)},${offsetY.toFixed(0)})`);
                
                // 캔버스가 실제로 보이도록 강제 설정
                canvas.style.display = 'block';
                canvas.style.visibility = 'visible';
                canvas.style.position = 'absolute';
                canvas.style.top = '60px';
                canvas.style.left = '0';
                canvas.style.zIndex = '1';
                
                this.mobileLog(`📐 캔버스 스타일: display=${canvas.style.display}, visibility=${canvas.style.visibility}`);
                
                // 캔버스 컨테이너도 보이도록 설정
                const canvasContainer = document.querySelector('.canvas-container');
                if (canvasContainer) {
                    canvasContainer.style.display = 'block';
                    canvasContainer.style.visibility = 'visible';
                    this.mobileLog(`📦 캔버스 컨테이너 표시 설정`);
                }
                
                // 전역 변수 초기화 (MVP 버전에서만 필요한 것들)
                window.currentImage = img;
                window.clicks = [];
                window.clickCount = 0;
                
                this.mobileLog(`✅ MVP 이미지 로드 완료: ${width}x${height}`);
                this.showToast('✅ 이미지가 로드되었습니다', 'success');
                
            } catch (error) {
                this.mobileLog(`❌ 캔버스 로드 오류: ${error.message}`);
                this.showToast('❌ 이미지를 로드할 수 없습니다', 'error');
            }
        };
        
        img.onerror = (e) => {
            this.mobileLog('❌ 이미지 객체 로드 오류');
            this.showToast('❌ 잘못된 이미지 파일입니다', 'error');
        };
        
        img.src = imageDataUrl;
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
        
        // 인스타그램 스타일 전체화면 캔버스 크기 조정
        const maxWidth = window.innerWidth; // 전체 너비 사용
        const maxHeight = window.innerHeight - 180; // 상단바(60px) + 하단바(120px) 제외
        
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
        // MVP: 캔버스를 100% 채우도록 크기 조정
        const availableWidth = window.innerWidth; // 전체 너비 사용
        const availableHeight = window.innerHeight - 120; // 상단바(60px) + 하단 플로팅버튼(60px) 제외
        
        // 가로세로 비율을 유지하면서 캔버스를 최대한 채우도록 계산
        const widthRatio = availableWidth / originalWidth;
        const heightRatio = availableHeight / originalHeight;
        
        // 더 큰 비율을 사용하여 캔버스를 완전히 채움 (크롭될 수 있음)
        const ratio = Math.max(widthRatio, heightRatio);
        
        const result = {
            width: Math.floor(originalWidth * ratio),
            height: Math.floor(originalHeight * ratio)
        };
        
        // 캔버스 크기는 사용 가능한 공간에 맞춤
        const canvasSize = {
            width: availableWidth,
            height: availableHeight
        };
        
        this.mobileLog('📏 MVP 이미지 크기 계산:', {
            original: `${originalWidth}x${originalHeight}`,
            available: `${availableWidth}x${availableHeight}`,
            image: `${result.width}x${result.height}`,
            canvas: `${canvasSize.width}x${canvasSize.height}`,
            ratio: ratio.toFixed(2)
        });
        
        return canvasSize; // 캔버스 크기 반환 (이미지는 중앙 정렬로 크롭)
    }
    
    setupFloatingButtons() {
        const fabSave = document.getElementById('fabSave');
        const fabUndo = document.getElementById('fabUndo');
        const fabSettings = document.getElementById('fabSettings');
        
        if (fabSave) {
            fabSave.addEventListener('click', () => {
                this.saveImageMVP();
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
        
        const fabDebug = document.getElementById('fabDebug');
        if (fabDebug) {
            fabDebug.addEventListener('click', () => {
                this.toggleMobileDebugPanel();
            });
        }
        
        // 설정 패널 이벤트 설정
        this.setupSettingsPanel();
        
        console.log('✅ 플로팅 버튼 설정 완료');
    }
    
    toggleMobileDebugPanel() {
        const panel = document.getElementById('mobileDebugPanel');
        if (panel) {
            const isVisible = panel.style.display === 'block' && panel.classList.contains('show');
            
            if (!isVisible) {
                panel.style.display = 'block';
                panel.classList.add('show');
                panel.style.position = 'fixed';
                panel.style.bottom = '140px';
                panel.style.left = '10px';
                panel.style.right = '10px';
                panel.style.zIndex = '9999';
                panel.style.background = '#000';
                panel.style.color = '#fff';
                panel.style.padding = '10px';
                panel.style.borderRadius = '8px';
                panel.style.maxHeight = '200px';
                panel.style.overflow = 'auto';
                this.mobileLog('🐛 모바일 디버그 패널 활성화');
            } else {
                panel.style.display = 'none';
                panel.classList.remove('show');
                console.log('🐛 모바일 디버그 패널 비활성화');
            }
        } else {
            console.error('❌ mobileDebugPanel을 찾을 수 없음');
        }
    }
    
    mobileLog(message) {
        // 콘솔에도 로그
        console.log(message);
        
        // 모바일 화면에 표시 (패널이 열려있을 때만)
        const panel = document.getElementById('mobileDebugPanel');
        const logDiv = document.getElementById('mobileDebugLog');
        
        if (logDiv) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = `[${timestamp}] ${message}\n`;
            logDiv.textContent += logEntry;
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        // 자동 패널 표시 제거 - 수동으로만 열도록 변경
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
        
        // 터치 이벤트 핸들러들 (스크롤 방지를 위해 preventDefault 사용)
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 스크롤 방지
            this.handleTouchStart(e);
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            if (!this.touchMoved) {
                e.preventDefault(); // 주석 모드에서만 스크롤 방지
            }
            this.handleTouchMove(e);
        }, { passive: false });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
        
        canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchCancel(e);
        }, { passive: false });
        
        console.log('✅ 터치 이벤트 설정 완료');
    }
    
    handleTouchStart(e) {
        this.mobileLog('👆 터치 시작 감지됨');
        this.touchActive = true;
        this.touchMoved = false;
        
        const touch = e.touches[0];
        const canvas = e.target;
        
        // 터치 시작 좌표 저장 (스크롤 감지용)
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        
        this.mobileLog(`📊 터치 초기: touches=${e.touches.length}, target=${canvas.id}`);
        
        // 캔버스 좌표 정확히 계산 (스케일링 고려)
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const rawX = touch.clientX - rect.left;
        const rawY = touch.clientY - rect.top;
        const x = rawX * scaleX;
        const y = rawY * scaleY;
        
        // 터치 좌표 저장 (터치 종료시 사용)
        this.pendingTouchX = x;
        this.pendingTouchY = y;
        
        this.mobileLog(`📐 좌표계산: raw(${rawX.toFixed(1)},${rawY.toFixed(1)}) → final(${x.toFixed(1)},${y.toFixed(1)}) scale(${scaleX.toFixed(2)},${scaleY.toFixed(2)})`);
        
        // touchstart에서는 주석 추가하지 않음 (touchend에서 처리)
    }
    
    triggerCanvasClick(x, y) {
        this.mobileLog(`🎯 캔버스클릭 트리거 시작: x=${x}, y=${y}, 타입: x=${typeof x}, y=${typeof y}`);
        
        // 입력 파라미터 유효성 검사
        if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
            this.mobileLog(`❌ 입력 좌표가 유효하지 않음: x=${typeof x}(${x}), y=${typeof y}(${y})`);
            return;
        }
        
        // main.js의 캔버스 클릭 이벤트와 동일한 로직 실행
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) {
            this.mobileLog('❌ 캔버스를 찾을 수 없음');
            return;
        }
        
        this.mobileLog(`✅ 좌표 검증 통과: (${x.toFixed(1)},${y.toFixed(1)})`);
        
        // MVP 버전에서는 숫자 모드만 처리 - 직접 호출
        try {
            this.mobileLog(`🚀 MVP 숫자 모드 직접 처리`);
            this.handleNumberMode(x, y);
        } catch (error) {
            this.mobileLog(`❌ 터치 액션 처리 오류: ${error.message}`);
            console.error('❌ 상세 오류:', error);
        }
    }
    
    handleNumberMode(x, y) {
        this.mobileLog(`🔢 MVP 숫자모드 처리: (${x.toFixed(1)},${y.toFixed(1)})`);
        
        // MVP 버전에서는 간단하게 처리
        if (!window.clicks) {
            window.clicks = [];
            this.mobileLog('✅ clicks 배열 초기화');
        }
        if (!window.clickCount) {
            window.clickCount = 0;
            this.mobileLog('✅ clickCount 초기화');
        }
        
        // 간단한 설정값
        const currentColor = '#FF0000'; // 빨간색 고정
        const currentSize = '20'; // 20px 고정
        
        // 숫자 객체 생성
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
        
        this.mobileLog(`✅ MVP 숫자추가: #${numberObj.number} at (${x.toFixed(1)},${y.toFixed(1)})`);
        this.mobileLog(`📊 총 주석수: ${window.clicks.length}`);
        
        // 직접 캔버스에 그리기 (MVP 버전)
        this.drawNumberDirectly(x, y, numberObj.number, currentColor, currentSize);
    }
    
    drawNumberDirectly(x, y, number, color, size) {
        this.mobileLog(`🎨 MVP 숫자 직접 그리기: #${number} at (${x.toFixed(1)},${y.toFixed(1)})`);
        
        try {
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
            
            if (!canvas || !ctx) {
                this.mobileLog('❌ 캔버스를 찾을 수 없음');
                return;
            }
            
            const radius = parseInt(size) || 20;
            
            // 배경 원 그리기
            ctx.save();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
            
            // 숫자 텍스트
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${radius}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(number.toString(), x, y);
            ctx.restore();
            
            this.mobileLog(`✅ MVP 숫자 그리기 완료: #${number}`);
            
        } catch (error) {
            this.mobileLog(`❌ 숫자 그리기 오류: ${error.message}`);
        }
    }
    
    saveImageMVP() {
        this.mobileLog('💾 MVP 이미지 저장 시작');
        
        try {
            const canvas = document.getElementById('imageCanvas');
            if (!canvas) {
                this.mobileLog('❌ 캔버스를 찾을 수 없음');
                this.showToast('❌ 저장할 이미지가 없습니다', 'error');
                return;
            }
            
            // 캔버스를 이미지로 변환
            canvas.toBlob((blob) => {
                if (!blob) {
                    this.mobileLog('❌ 이미지 변환 실패');
                    this.showToast('❌ 이미지 저장에 실패했습니다', 'error');
                    return;
                }
                
                // 다운로드 링크 생성
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `annotateshot_${new Date().getTime()}.png`;
                
                // 자동 다운로드 실행
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                this.mobileLog('✅ MVP 이미지 저장 완료');
                this.showToast('✅ 이미지가 저장되었습니다', 'success');
                
            }, 'image/png');
            
        } catch (error) {
            this.mobileLog(`❌ 저장 오류: ${error.message}`);
            this.showToast('❌ 이미지 저장에 실패했습니다', 'error');
        }
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
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
            
            if (!canvas || !ctx) {
                console.error('❌ 캔버스 또는 컨텍스트를 찾을 수 없음');
                return;
            }
            
            console.log('📊 캔버스 상태:', {
                canvas: !!canvas,
                context: !!ctx,
                width: canvas.width,
                height: canvas.height,
                currentImage: !!window.currentImage,
                clicks: window.clicks ? window.clicks.length : 0
            });
            
            // main.js의 currentImage가 있는지 확인
            if (!window.currentImage) {
                console.warn('⚠️ currentImage가 없어서 배경 이미지를 건너뜁니다');
                // 이미지가 없어도 주석은 그려보자
            } else {
                // 캔버스 지우고 이미지 다시 그리기
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(window.currentImage, 0, 0, canvas.width, canvas.height);
                console.log('✅ 배경 이미지 다시 그리기 완료');
            }
            
            // 모든 주석 다시 그리기
            if (window.clicks && Array.isArray(window.clicks) && window.clicks.length > 0) {
                console.log(`🎯 ${window.clicks.length}개의 주석 그리기 시작`);
                window.clicks.forEach((click, index) => {
                    console.log(`📝 주석 ${index + 1} 그리기:`, click);
                    this.drawAnnotation(ctx, click);
                });
                console.log('✅ 모든 주석 그리기 완료');
            } else {
                console.log('ℹ️ 그릴 주석이 없습니다');
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
        console.log('🔢 숫자 그리기 시작:', annotation);
        
        const size = parseInt(annotation.size) || 20;
        const radius = size;
        
        try {
            // 배경 원 그리기
            ctx.save(); // 현재 컨텍스트 상태 저장
            ctx.fillStyle = annotation.color;
            ctx.beginPath();
            ctx.arc(annotation.x, annotation.y, radius, 0, 2 * Math.PI);
            ctx.fill();
            console.log(`✅ 배경 원 그리기: (${annotation.x}, ${annotation.y}), 반지름: ${radius}, 색상: ${annotation.color}`);
            
            // 숫자 텍스트
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(annotation.number.toString(), annotation.x, annotation.y);
            console.log(`✅ 숫자 텍스트 그리기: "${annotation.number}" at (${annotation.x}, ${annotation.y})`);
            
            ctx.restore(); // 컨텍스트 상태 복원
            
        } catch (error) {
            console.error('❌ 숫자 그리기 오류:', error, annotation);
        }
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
        
        const touch = e.touches[0];
        
        // 터치 이동 거리 계산
        if (this.touchStartX !== null && this.touchStartY !== null) {
            const deltaX = Math.abs(touch.clientX - this.touchStartX);
            const deltaY = Math.abs(touch.clientY - this.touchStartY);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // 임계값을 초과하면 스크롤/드래그로 간주
            if (distance > this.touchThreshold) {
                this.touchMoved = true;
                this.mobileLog(`📱 터치 이동 감지: ${distance.toFixed(1)}px (임계값: ${this.touchThreshold}px)`);
            }
        }
        
        // MVP에서는 도형 드래그 기능 생략
        // 필요시 향후 추가 가능
    }
    
    handleTouchEnd(e) {
        this.touchActive = false;
        
        // 터치가 이동하지 않았다면 주석 추가 (탭으로 간주)
        if (!this.touchMoved && this.pendingTouchX !== null && this.pendingTouchY !== null) {
            this.mobileLog('👆 터치 탭 감지 - 주석 추가');
            
            try {
                this.mobileLog(`🚀 triggerCanvasClick 호출 시작`);
                this.triggerCanvasClick(this.pendingTouchX, this.pendingTouchY);
                this.mobileLog(`✅ triggerCanvasClick 호출 완료`);
            } catch (error) {
                this.mobileLog(`❌ triggerCanvasClick 오류: ${error.message}`);
                console.error('triggerCanvasClick 상세 오류:', error);
            }
        } else if (this.touchMoved) {
            this.mobileLog('👆 터치 이동 감지됨 - 주석 추가 취소 (스크롤로 간주)');
        }
        
        // 상태 초기화
        this.touchStartX = null;
        this.touchStartY = null;
        this.touchMoved = false;
        this.pendingTouchX = null;
        this.pendingTouchY = null;
        
        this.mobileLog('👆 터치 종료');
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
    
    setupMVPDefaults() {
        this.mobileLog('🚀 MVP 기본 설정 시작');
        
        // 숫자 모드로 강제 설정
        const modeSelector = document.getElementById('modeSelector');
        if (modeSelector) {
            modeSelector.value = 'number';
            this.mobileLog('✅ 숫자 모드로 설정');
        }
        
        // MVP에서는 하단 툴바 숨기기 (모드 전환 불필요)
        const mobileToolbar = document.querySelector('.mobile-toolbar');
        if (mobileToolbar) {
            mobileToolbar.style.display = 'none';
            this.mobileLog('🔧 하단 툴바 숨김 (MVP)');
        }
        
        // 기본 변수 초기화
        window.clicks = [];
        window.clickCount = 0;
        window.currentColor = '#FF0000';
        window.currentSize = '20';
        
        this.mobileLog('✅ MVP 기본 설정 완료 - 숫자 모드 전용');
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

window.hideMobileDebugPanel = function() {
    const panel = document.getElementById('mobileDebugPanel');
    if (panel) {
        panel.style.display = 'none';
        panel.classList.remove('show');
    }
};

window.clearMobileDebugLog = function() {
    const logDiv = document.getElementById('mobileDebugLog');
    if (logDiv) {
        logDiv.textContent = '';
    }
};

window.copyMobileDebugLog = function() {
    console.log('🔧 Copy 버튼 클릭됨');
    const logDiv = document.getElementById('mobileDebugLog');
    
    if (!logDiv) {
        console.error('❌ 로그 DIV를 찾을 수 없음');
        return;
    }
    
    const logText = logDiv.textContent.trim();
    console.log('📝 복사할 텍스트 길이:', logText.length);
    
    if (logText) {
        // 즉시 시각적 피드백
        const originalText = logDiv.textContent;
        logDiv.textContent = '🔄 복사 중...\n\n' + originalText;
        
        // 클립보드 복사 시도
        if (navigator.clipboard && navigator.clipboard.writeText) {
            console.log('📋 navigator.clipboard 사용');
            navigator.clipboard.writeText(logText).then(() => {
                console.log('✅ 클립보드 복사 성공');
                logDiv.textContent = '✅ 클립보드에 복사 완료!\n\n' + originalText;
                setTimeout(() => {
                    logDiv.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('❌ 클립보드 복사 실패:', err);
                logDiv.textContent = '❌ 복사 실패. 텍스트 선택됨.\n\n' + originalText;
                selectAllText(logDiv);
                setTimeout(() => {
                    logDiv.textContent = originalText;
                }, 3000);
            });
        } else {
            console.log('📋 구형 브라우저 - 텍스트 선택 사용');
            selectAllText(logDiv);
        }
    } else {
        console.log('❌ 복사할 로그가 없습니다');
        logDiv.textContent = '❌ 복사할 로그가 없습니다';
        setTimeout(() => {
            logDiv.textContent = '';
        }, 2000);
    }
};

function selectAllText(element) {
    if (window.getSelection && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // 모바일에서 텍스트 선택 알림
        const originalText = element.textContent;
        element.textContent = '📋 텍스트가 선택되었습니다. 길게 눌러서 복사하세요!\n\n' + originalText;
        setTimeout(() => {
            element.textContent = originalText;
        }, 3000);
    }
}

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