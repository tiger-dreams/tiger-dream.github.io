/**
 * AnnotateShot Mobile UI Module
 * 모바일 기기 전용 UI/UX 기능 모듈
 * 완전히 독립적으로 동작하며 main.js와 분리됨
 */

class MobileAnnotateShot {
    constructor() {
        // 데스크톱에서 모바일 모드 비활성화
        if (window.DISABLE_MOBILE_MODE) {
            return;
        }
        
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
        
        // 드래그 앤 드롭을 위한 변수들
        this.isDragging = false;
        this.dragTarget = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
        // 모바일 감지
        this.detectMobile();
        
        if (this.isMobile) {
            this.init();
        }
    }
    
    detectMobile() {
        const userAgent = navigator.userAgent;
        
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
        
        if (this.isMobile) {
            document.body.classList.remove('desktop-device');
            document.body.classList.add('mobile-device');
        } else {
            document.body.classList.remove('mobile-device');
            document.body.classList.add('desktop-device');
        }
    }
    
    init() {
        if (this.isInitialized) return;
        
        
        // 즉시 실행 (스크립트가 body 하단에 있으므로 DOM이 준비됨)
        this.setupMobileUI();
        
        this.isInitialized = true;
    }
    
    setupMobileUI() {
        
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
        
        // 모바일에서 설정 변경으로 인한 캔버스 리셋 방지
        this.preventCanvasReset();
        
    }
    
    showMobileElements() {
        const mobileElements = document.querySelector('.mobile-only');
        if (mobileElements) {
            mobileElements.style.display = 'block';
            mobileElements.style.visibility = 'visible';
            mobileElements.style.opacity = '1';
            
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
        this.mobileLog(`🔍 기기 감지: iOS=${this.isIOS()}, Android=${this.isAndroid()}`);
        
        const fabImage = document.getElementById('fabImage');
        const mobileImageInput = document.getElementById('mobileImageInput');
        
        if (!fabImage || !mobileImageInput) {
            this.mobileLog('❌ 이미지 업로드 요소를 찾을 수 없음');
            return;
        }
        
        // 파일 선택을 위한 기본 설정
        mobileImageInput.setAttribute('accept', 'image/*');
        mobileImageInput.setAttribute('multiple', 'false'); // 단일 파일만
        
        // 이미지 업로드 버튼 클릭 - 갤러리/카메라 선택
        fabImage.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.mobileLog('📷 이미지 업로드 버튼 클릭됨');
            
            // 모든 모바일 기기에서 갤러리/카메라 선택 다이얼로그 표시
            this.showImageSourceSelector();
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
                canvas.style.top = '40px';
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
                
                this.mobileLog(`✅ MVP 이미지 로드 완료: ${canvasWidth}x${canvasHeight}`);
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
    
    isAndroid() {
        return /Android/.test(navigator.userAgent);
    }
    
    showImageSourceSelector() {
        this.mobileLog('📱 이미지 소스 선택 다이얼로그 표시');
        
        const overlay = document.createElement('div');
        overlay.className = 'mobile-image-source-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;
        
        const dialog = document.createElement('div');
        dialog.className = 'mobile-image-source-dialog';
        dialog.style.cssText = `
            background: #fff;
            border-radius: 16px;
            padding: 1.5rem;
            max-width: 280px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;
        
        const galleryText = this.isIOS() ? '🖼️ 사진 보관함' : '🖼️ 갤러리';
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 1.5rem 0; color: #333; font-size: 1.2rem;">이미지 가져오기</h3>
            <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                <button id="selectCamera" style="padding: 1rem; border: none; border-radius: 10px; background: #007AFF; color: white; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background 0.2s;">
                    📷 카메라로 촬영
                </button>
                <button id="selectGallery" style="padding: 1rem; border: none; border-radius: 10px; background: #34C759; color: white; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background 0.2s;">
                    ${galleryText}
                </button>
                <button id="cancelSelection" style="padding: 0.8rem; border: none; border-radius: 10px; background: #F2F2F7; color: #8E8E93; font-size: 0.9rem; cursor: pointer; margin-top: 0.5rem;">
                    취소
                </button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // 카메라 선택
        document.getElementById('selectCamera').addEventListener('click', () => {
            this.mobileLog('📷 카메라 선택됨');
            const input = document.getElementById('mobileImageInput');
            
            // 안드로이드와 iOS 모두 지원하는 카메라 설정
            if (this.isIOS()) {
                input.setAttribute('capture', 'environment');
            } else {
                // 안드로이드에서는 capture="camera" 사용
                input.setAttribute('capture', 'camera');
            }
            input.setAttribute('accept', 'image/*');
            input.click();
            document.body.removeChild(overlay);
        });
        
        // 갤러리 선택
        document.getElementById('selectGallery').addEventListener('click', () => {
            this.mobileLog('🖼️ 갤러리 선택됨');
            const input = document.getElementById('mobileImageInput');
            input.removeAttribute('capture');
            input.setAttribute('accept', 'image/*');
            input.click();
            document.body.removeChild(overlay);
        });
        
        // 취소
        document.getElementById('cancelSelection').addEventListener('click', () => {
            this.mobileLog('❌ 이미지 선택 취소됨');
            document.body.removeChild(overlay);
        });
        
        // 배경 클릭으로 닫기
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.mobileLog('❌ 배경 클릭으로 선택 취소됨');
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
        const availableHeight = window.innerHeight - 100; // 상단바(40px) + 하단 플로팅버튼(60px) 제외
        
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
                // 디버그 로그 함수
                const logDebug = (message) => {
                    const logDiv = document.getElementById('mobileDebugLog');
                    if (logDiv) {
                        const time = new Date().toLocaleTimeString();
                        logDiv.textContent += `[${time}] ${message}\n`;
                        logDiv.scrollTop = logDiv.scrollHeight;
                    }
                    console.log(message);
                };
                
                logDebug('🔄 Undo 버튼 클릭됨');
                
                // 1. 현재 상태 저장
                const beforeClicksLength = window.clicks ? window.clicks.length : 0;
                const beforeUndoStackLength = window.undoStack ? window.undoStack.length : 0;
                logDebug(`🔍 Undo 전 상태: clicks=${beforeClicksLength}, undoStack=${beforeUndoStackLength}`);
                
                // 2. 모바일 전용 undo 로직 구현
                if (window.undoStack && window.undoStack.length > 0) {
                    try {
                        // undoStack에서 이전 상태 복원
                        const previousState = window.undoStack.pop();
                        
                        // 상태 복원
                        window.clicks = previousState.clicks || [];
                        window.clickCount = previousState.clickCount || 0;
                        
                        logDebug(`🔄 모바일 undo 실행: clicks=${window.clicks.length}, undoStack=${window.undoStack.length}`);
                        
                        // 캔버스 다시 그리기
                        const canvas = document.getElementById('imageCanvas');
                        const ctx = canvas.getContext('2d');
                        
                        // 현재 이미지 다시 그리기
                        if (window.currentImage) {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(window.currentImage, 0, 0, canvas.width, canvas.height);
                            
                            // 모든 주석 다시 그리기
                            const self = this;
                            window.clicks.forEach(click => {
                                if (click.type === 'number') {
                                    self.drawNumberDirectly(click.x, click.y, click.number, click.color, click.size);
                                } else if (click.type === 'emoji') {
                                    self.drawEmojiDirectly(click.x, click.y, click.emoji, click.size);
                                }
                            });
                            
                            logDebug('✅ 모바일 캔버스 복원 완료');
                        }
                        
                        // 3. 변화 확인
                        const afterClicksLength = window.clicks ? window.clicks.length : 0;
                        const afterUndoStackLength = window.undoStack ? window.undoStack.length : 0;
                        logDebug(`🔍 Undo 후 상태: clicks=${afterClicksLength}, undoStack=${afterUndoStackLength}`);
                        
                    } catch (error) {
                        logDebug(`❌ 모바일 undo 에러: ${error.message}`);
                    }
                } else {
                    logDebug('❌ undoStack 비어있음 - undo 불가');
                }
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
            this.mobileLog('⚙️ 설정 패널 열기 시작');
            
            // 현재 모드에 따라 패널 내용 조정
            this.updateSettingsPanelForCurrentMode();
            
            panel.classList.add('show');
            overlay.classList.add('show');
            
            this.mobileLog('✅ 설정 패널 표시 완료');
            
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
        
        this.mobileLog(`⚙️ 설정 패널 모드 조정: ${currentMode}`);
        this.mobileLog(`📋 UI 요소 상태: emojiSection=${!!emojiSection}`);
        
        // 모든 섹션 숨기기
        if (emojiSection) {
            emojiSection.style.display = 'none';
            this.mobileLog('🔧 이모지 섹션 숨김');
        }
        
        // 현재 모드에 따라 관련 섹션 표시
        switch(currentMode) {
            case 'emoji':
                if (emojiSection) {
                    emojiSection.style.display = 'block';
                    this.mobileLog('✅ 이모지 섹션 표시');
                } else {
                    this.mobileLog('❌ 이모지 섹션을 찾을 수 없음');
                }
                break;
            case 'number':
                this.mobileLog('📱 숫자 모드 - 기본 설정만 표시');
                break;
        }
        
        this.mobileLog(`✅ 설정 패널 조정 완료: ${currentMode} 모드`);
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
        this.mobileLog(`🎨 모바일 색상 변경: ${color}`);
        
        // main.js의 전역 변수 업데이트 (이벤트 발생 방지)
        if (typeof window.currentColor !== 'undefined') {
            window.currentColor = color;
            this.mobileLog(`✅ currentColor 업데이트: ${color}`);
        }
        
        // 색상 선택기는 업데이트하지만 change 이벤트는 발생시키지 않음
        const colorSelector = document.getElementById('colorSelector');
        if (colorSelector) {
            // 이벤트 리스너를 일시적으로 제거
            const originalValue = colorSelector.value;
            colorSelector.value = color;
            
            this.mobileLog(`🔧 colorSelector 업데이트: ${originalValue} → ${color}`);
            
            // main.js의 change 이벤트를 발생시키지 않음 (캔버스 리셋 방지)
            // colorSelector.dispatchEvent(new Event('change')); // 주석 처리
        }
        
        this.showToast('색상이 변경되었습니다', 'success');
    }
    
    changeSize(size) {
        this.mobileLog(`📏 모바일 크기 변경: ${size}px`);
        
        // main.js의 전역 변수 업데이트 (이벤트 발생 방지)
        if (typeof window.currentSize !== 'undefined') {
            window.currentSize = size;
            this.mobileLog(`✅ currentSize 업데이트: ${size}px`);
        }
        
        // 크기 선택기는 업데이트하지만 change 이벤트는 발생시키지 않음
        const sizeSelector = document.getElementById('sizeSelector');
        if (sizeSelector) {
            const originalValue = sizeSelector.value;
            sizeSelector.value = size;
            
            this.mobileLog(`🔧 sizeSelector 업데이트: ${originalValue} → ${size}`);
            
            // main.js의 change 이벤트를 발생시키지 않음 (캔버스 리셋 방지)
            // sizeSelector.dispatchEvent(new Event('change')); // 주석 처리
        }
        
        this.showToast(`크기가 ${size}px로 변경되었습니다`, 'success');
    }
    
    changeEmoji(emoji) {
        this.mobileLog(`😀 모바일 이모지 변경: ${emoji}`);
        
        // main.js의 전역 변수 강제 업데이트
        window.currentEmoji = emoji;
        this.mobileLog(`✅ currentEmoji 강제 업데이트: ${emoji}`);
        
        // 이모지 선택기는 업데이트하지만 change 이벤트는 발생시키지 않음
        const emojiSelector = document.getElementById('emojiSelector');
        if (emojiSelector) {
            const originalValue = emojiSelector.value;
            emojiSelector.value = emoji;
            
            this.mobileLog(`🔧 emojiSelector 업데이트: ${originalValue} → ${emoji}`);
            
            // main.js의 change 이벤트를 발생시키지 않음 (캔버스 리셋 방지)
            // emojiSelector.dispatchEvent(new Event('change')); // 주석 처리
        }
        
        this.showToast(`이모지가 ${emoji}로 변경되었습니다`, 'success');
    }
    
    changeFillType(fill) {
        this.mobileLog(`🎨 모바일 채우기 옵션 변경: ${fill}`);
        
        // main.js의 전역 변수 업데이트 (이벤트 발생 방지)
        if (typeof window.currentFill !== 'undefined') {
            window.currentFill = fill;
            this.mobileLog(`✅ currentFill 업데이트: ${fill}`);
        }
        
        // 채우기 선택기는 업데이트하지만 change 이벤트는 발생시키지 않음
        const fillSelector = document.getElementById('fillSelector');
        if (fillSelector) {
            const originalValue = fillSelector.value;
            fillSelector.value = fill;
            
            this.mobileLog(`🔧 fillSelector 업데이트: ${originalValue} → ${fill}`);
            
            // main.js의 change 이벤트를 발생시키지 않음 (캔버스 리셋 방지)
            // fillSelector.dispatchEvent(new Event('change')); // 주석 처리
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
                    // 이모지 모드 클릭 시 레이어 표시
                    if (button.dataset.mode === 'emoji') {
                        this.showEmojiLayer();
                        return;
                    }
                    
                    // 다른 모드들은 기존대로 처리
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
        
        // 이모지 레이어 이벤트 설정
        this.setupEmojiLayer();
    }
    
    // 이모지 선택 레이어 표시
    showEmojiLayer() {
        const emojiLayer = document.getElementById('emojiLayer');
        if (emojiLayer) {
            emojiLayer.style.display = 'block';
            this.mobileLog('😀 이모지 선택 레이어 표시');
            
            // 이모지 모드로 전환
            const modeSelector = document.getElementById('modeSelector');
            if (modeSelector) {
                modeSelector.value = 'emoji';
                modeSelector.dispatchEvent(new Event('change'));
                this.updateToolbarState();
            }
        }
    }
    
    // 이모지 선택 레이어 숨김
    hideEmojiLayer() {
        const emojiLayer = document.getElementById('emojiLayer');
        if (emojiLayer) {
            emojiLayer.style.display = 'none';
            this.mobileLog('😀 이모지 선택 레이어 숨김');
        }
    }
    
    // 이모지 레이어 이벤트 설정
    setupEmojiLayer() {
        // 닫기 버튼 이벤트
        const closeBtn = document.getElementById('emojiCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideEmojiLayer();
            });
        }
        
        // 이모지 버튼들 이벤트
        const emojiButtons = document.querySelectorAll('.emoji-layer-btn');
        emojiButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 모든 버튼에서 selected 클래스 제거
                emojiButtons.forEach(b => b.classList.remove('selected'));
                // 클릭된 버튼에 selected 클래스 추가
                btn.classList.add('selected');
                
                const emoji = btn.dataset.emoji;
                this.mobileLog(`😀 이모지 선택: ${emoji}`);
                
                // 현재 이모지 설정
                this.changeEmoji(emoji);
                
                // 짧은 지연 후 레이어 닫기 (사용자가 선택을 확인할 수 있도록)
                setTimeout(() => {
                    this.hideEmojiLayer();
                }, 300);
            });
        });
        
        this.mobileLog('✅ 이모지 레이어 이벤트 설정 완료');
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
            this.mobileLog('❌ imageCanvas를 찾을 수 없음 - 재시도 중...');
            // 잠시 후 재시도
            setTimeout(() => {
                this.setupTouchEvents();
            }, 100);
            return;
        }
        
        this.mobileLog('👆 터치 이벤트 설정 시작: ' + canvas.tagName + '#' + canvas.id);
        
        // 기존 이벤트 리스너 제거 (중복 방지)
        canvas.removeEventListener('touchstart', this.boundTouchStart);
        canvas.removeEventListener('touchmove', this.boundTouchMove);
        canvas.removeEventListener('touchend', this.boundTouchEnd);
        canvas.removeEventListener('touchcancel', this.boundTouchCancel);
        
        // 바인딩된 함수 저장 (제거를 위해)
        this.boundTouchStart = (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        };
        this.boundTouchMove = (e) => {
            if (!this.touchMoved) {
                e.preventDefault();
            }
            this.handleTouchMove(e);
        };
        this.boundTouchEnd = (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        };
        this.boundTouchCancel = (e) => {
            e.preventDefault();
            this.handleTouchCancel(e);
        };
        
        // 터치 이벤트 핸들러들 등록
        canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', this.boundTouchCancel, { passive: false });
        
        this.mobileLog('✅ 터치 이벤트 설정 완료: ' + canvas.id);
    }
    
    handleTouchStart(e) {
        this.mobileLog('👆 터치 시작 감지됨');
        this.touchActive = true;
        this.touchMoved = false;
        this.isDragging = false;
        this.dragTarget = null;
        
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
        
        // 기존 주석과 히트 테스트 수행
        const hitResult = this.hitTestAnnotation(x, y);
        if (hitResult) {
            // 주석을 터치한 경우 - 드래그 준비
            this.dragTarget = hitResult;
            this.dragOffsetX = x - hitResult.annotation.x;
            this.dragOffsetY = y - hitResult.annotation.y;
            this.mobileLog(`🫱 드래그 타겟 설정: ${hitResult.annotation.type} #${hitResult.annotation.number || 'N/A'}`);
        }
        
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
        
        // 현재 모드에 따라 적절한 핸들러 호출
        const currentMode = document.getElementById('modeSelector')?.value || 'number';
        try {
            this.mobileLog(`🚀 모드별 핸들러 호출: ${currentMode}`);
            switch(currentMode) {
                case 'number':
                    this.handleNumberMode(x, y);
                    break;
                case 'emoji':
                    this.handleEmojiMode(x, y);
                    break;
                case 'text':
                    this.handleTextMode(x, y);
                    break;
                default:
                    this.mobileLog(`❓ 지원하지 않는 모드: ${currentMode} - 숫자 모드로 처리`);
                    this.handleNumberMode(x, y);
            }
        } catch (error) {
            this.mobileLog(`❌ 터치 액션 처리 오류: ${error.message}`);
            console.error('❌ 상세 오류:', error);
        }
    }
    
    handleNumberMode(x, y) {
        this.mobileLog(`🔢 MVP 숫자모드 처리: (${x.toFixed(1)},${y.toFixed(1)})`);
        
        // undoStack에 현재 상태 저장 (추가 전)
        if (!window.undoStack) {
            window.undoStack = [];
            this.mobileLog('✅ undoStack 초기화');
        }
        
        // 현재 상태를 undoStack에 저장
        const currentState = {
            clicks: window.clicks ? [...window.clicks] : [],
            clickCount: window.clickCount || 0,
            image: window.currentImage || null
        };
        window.undoStack.push(currentState);
        this.mobileLog(`💾 undoStack에 상태 저장: clicks=${currentState.clicks.length}, total=${window.undoStack.length}`);
        
        // MVP 버전에서는 간단하게 처리
        if (!window.clicks) {
            window.clicks = [];
            this.mobileLog('✅ clicks 배열 초기화');
        }
        if (!window.clickCount) {
            window.clickCount = 0;
            this.mobileLog('✅ clickCount 초기화');
        }
        
        // 현재 설정된 값 사용 (더 이상 고정값 사용 안함)
        const currentColor = window.currentColor || '#FF0000';
        const currentSize = window.currentSize || '20';
        
        this.mobileLog(`🎨 사용할 설정: 색상=${currentColor}, 크기=${currentSize}px`);
        
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
    
    // 터치 위치에 주석이 있는지 확인하는 히트 테스트
    hitTestAnnotation(x, y) {
        if (!window.clicks || !Array.isArray(window.clicks)) {
            return null;
        }
        
        // 역순으로 검사 (최신 주석이 위에 있으므로)
        for (let i = window.clicks.length - 1; i >= 0; i--) {
            const annotation = window.clicks[i];
            
            if (this.isPointInAnnotation(x, y, annotation)) {
                this.mobileLog(`🎯 주석 히트: #${annotation.number || annotation.text || annotation.emoji} at (${annotation.x.toFixed(1)},${annotation.y.toFixed(1)})`);
                return { annotation, index: i };
            }
        }
        
        return null;
    }
    
    // 점이 주석 영역 안에 있는지 확인
    isPointInAnnotation(x, y, annotation) {
        const size = parseInt(annotation.size) || 20;
        
        switch (annotation.type) {
            case 'number':
                // 원형 영역 (반지름 = size)
                const radius = size;
                const distance = Math.sqrt(
                    Math.pow(x - annotation.x, 2) + 
                    Math.pow(y - annotation.y, 2)
                );
                return distance <= radius;
                
            case 'text':
                // 텍스트 영역 (개선된 사각형 계산)
                const textWidth = annotation.text.length * size * 0.7; // 더 정확한 너비
                const textHeight = size * 1.2; // 높이도 조금 더 크게
                return (
                    x >= annotation.x - textWidth/2 - 10 && 
                    x <= annotation.x + textWidth/2 + 10 &&
                    y >= annotation.y - textHeight/2 - 10 && 
                    y <= annotation.y + textHeight/2 + 10
                );
                
            case 'emoji':
                // 이모지 영역 (실제 이모지 크기에 맞춰 조정)
                // 이모지는 fontSize = radius * 3.0으로 그려지므로 히트 영역도 크게 설정
                const emojiRadius = size * 1.5; // 더 큰 히트 영역
                const emojiDistance = Math.sqrt(
                    Math.pow(x - annotation.x, 2) + 
                    Math.pow(y - annotation.y, 2)
                );
                return emojiDistance <= emojiRadius;
                
            default:
                return false;
        }
    }
    
    // 캔버스와 모든 주석을 다시 그리는 함수
    redrawCanvasWithAnnotations() {
        try {
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
            
            if (!canvas || !ctx || !window.currentImage) {
                this.mobileLog('❌ 캔버스 재그리기 실패: 필요한 요소 없음');
                return;
            }
            
            // 캔버스 지우기
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 배경 이미지 다시 그리기 (현재 설정된 크기로)
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const img = window.currentImage;
            
            // 이미지를 캔버스에 맞춰 크롭하여 그리기 (이전과 동일한 방식)
            const widthRatio = canvasWidth / img.width;
            const heightRatio = canvasHeight / img.height;
            const ratio = Math.max(widthRatio, heightRatio);
            
            const scaledWidth = img.width * ratio;
            const scaledHeight = img.height * ratio;
            const offsetX = (canvasWidth - scaledWidth) / 2;
            const offsetY = (canvasHeight - scaledHeight) / 2;
            
            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
            
            // 모든 주석 다시 그리기
            if (window.clicks && Array.isArray(window.clicks)) {
                window.clicks.forEach((annotation, index) => {
                    this.drawAnnotation(ctx, annotation);
                });
            }
            
        } catch (error) {
            this.mobileLog(`❌ 캔버스 재그리기 오류: ${error.message}`);
        }
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
            
            // 배경 색상에 따른 텍스트 색상 결정 (대비 개선)
            const textColor = this.getContrastTextColor(color);
            
            // 숫자 텍스트
            ctx.fillStyle = textColor;
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
    
    // 배경 색상에 따른 대비 텍스트 색상 계산
    getContrastTextColor(backgroundColor) {
        try {
            // hex 색상을 RGB로 변환
            let color = backgroundColor;
            if (color.startsWith('#')) {
                color = color.slice(1);
            }
            
            // 3자리 hex를 6자리로 확장
            if (color.length === 3) {
                color = color.split('').map(c => c + c).join('');
            }
            
            // RGB 값 추출
            const r = parseInt(color.substr(0, 2), 16);
            const g = parseInt(color.substr(2, 2), 16);
            const b = parseInt(color.substr(4, 2), 16);
            
            // 상대적 휘도 계산 (WCAG 가이드라인)
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            
            // 휘도가 0.5보다 크면 어두운 텍스트, 작으면 밝은 텍스트
            const textColor = luminance > 0.5 ? '#000000' : '#FFFFFF';
            
            this.mobileLog(`🎨 대비 색상 계산: 배경=${backgroundColor} → 텍스트=${textColor} (휘도=${luminance.toFixed(2)})`);
            
            return textColor;
            
        } catch (error) {
            this.mobileLog(`❌ 대비 색상 계산 오류: ${error.message}`);
            return '#FFFFFF'; // 기본값으로 흰색 반환
        }
    }
    
    drawEmojiDirectly(x, y, emoji, size) {
        this.mobileLog(`😀 이모지 직접 그리기: ${emoji} at (${x.toFixed(1)},${y.toFixed(1)})`);
        
        try {
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
            
            if (!canvas || !ctx) {
                this.mobileLog('❌ 캔버스를 찾을 수 없음');
                return;
            }
            
            // 숫자 모드와 크기를 맞추기 위해 반지름 크기를 폰트 크기로 변환
            // 숫자 모드는 원 배경이 있어서 시각적으로 크므로, 이모지는 더 크게 설정
            const radius = parseInt(size) || 20;
            const fontSize = Math.round(radius * 3.0);
            
            this.mobileLog(`📏 크기 변환: 반지름=${radius}px → 폰트크기=${fontSize}px`);
            
            // 이모지 그리기
            ctx.save();
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, x, y);
            ctx.restore();
            
            this.mobileLog(`✅ 이모지 그리기 완료: ${emoji} (크기: ${fontSize}px)`);
            
        } catch (error) {
            this.mobileLog(`❌ 이모지 그리기 오류: ${error.message}`);
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
            
            // 모바일 환경에서 최적화된 저장 방법 선택
            if (this.isMobile) {
                this.saveImageMobile(canvas);
            } else {
                this.saveImageDesktop(canvas);
            }
            
        } catch (error) {
            this.mobileLog(`❌ 저장 오류: ${error.message}`);
            this.showToast('❌ 이미지 저장에 실패했습니다', 'error');
        }
    }
    
    saveImageMobile(canvas) {
        this.mobileLog('📱 모바일 이미지 저장 방식 시작');
        
        // iOS와 Android에서 갤러리 저장을 위한 최적화된 방법
        if (navigator.share && this.canUseWebShare()) {
            // Web Share API 사용 (iOS Safari 지원)
            this.saveWithWebShare(canvas);
        } else if (this.isIOS() && this.canUseLongPress()) {
            // iOS에서 길게 누르기 저장 방식
            this.saveWithLongPress(canvas);
        } else {
            // 기본 다운로드 방식 (fallback)
            this.saveWithDownload(canvas);
        }
    }
    
    canUseWebShare() {
        // Web Share API가 파일 공유를 지원하는지 확인
        return navigator.share && navigator.canShare && 
               typeof navigator.canShare === 'function';
    }
    
    canUseLongPress() {
        // iOS에서 길게 누르기 저장이 가능한지 확인
        return this.isIOS() && 'ontouchstart' in window;
    }
    
    async saveWithWebShare(canvas) {
        this.mobileLog('🔗 Web Share API를 사용한 저장 시작');
        
        try {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    this.mobileLog('❌ 이미지 변환 실패');
                    this.saveWithDownload(canvas);
                    return;
                }
                
                const fileName = `annotateshot_${new Date().getTime()}.png`;
                const file = new File([blob], fileName, { type: 'image/png' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'AnnotateShot 이미지',
                            text: 'AnnotateShot으로 편집한 이미지입니다.'
                        });
                        this.mobileLog('✅ Web Share로 공유 완료');
                        this.showToast('✅ 이미지 공유 완료', 'success');
                    } catch (shareError) {
                        this.mobileLog(`❌ Web Share 오류: ${shareError.message}`);
                        this.saveWithLongPress(canvas);
                    }
                } else {
                    this.mobileLog('❌ Web Share 파일 공유 미지원');
                    this.saveWithLongPress(canvas);
                }
            }, 'image/png');
            
        } catch (error) {
            this.mobileLog(`❌ Web Share 처리 오류: ${error.message}`);
            this.saveWithLongPress(canvas);
        }
    }
    
    saveWithLongPress(canvas) {
        this.mobileLog('👆 길게 누르기 저장 방식 시작');
        
        try {
            // 이미지를 새 창에서 열어서 길게 누르기로 저장할 수 있도록 함
            const dataURL = canvas.toDataURL('image/png');
            
            // 저장 안내 모달 표시
            this.showSaveInstructionsModal(dataURL);
            
        } catch (error) {
            this.mobileLog(`❌ 길게 누르기 저장 오류: ${error.message}`);
            this.saveWithDownload(canvas);
        }
    }
    
    showSaveInstructionsModal(dataURL) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 10001;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;
        
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 1rem;
            max-width: 90%;
            max-height: 70%;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;
        
        const img = document.createElement('img');
        img.src = dataURL;
        img.style.cssText = `
            max-width: 100%;
            max-height: 300px;
            border-radius: 8px;
        `;
        
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            margin-top: 1rem;
            color: #333;
            font-size: 0.9rem;
            line-height: 1.4;
        `;
        
        const deviceInstructions = this.isIOS() 
            ? '📱 이미지를 길게 눌러서 "사진에 저장"을 선택하세요'
            : '📱 이미지를 길게 눌러서 "이미지 저장"을 선택하세요';
            
        instructions.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 0.5rem;">갤러리에 저장하기</div>
            <div>${deviceInstructions}</div>
        `;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '닫기';
        closeButton.style.cssText = `
            margin-top: 1rem;
            padding: 0.8rem 2rem;
            border: none;
            border-radius: 8px;
            background: #007AFF;
            color: white;
            font-size: 1rem;
            cursor: pointer;
        `;
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(instructions);
        imageContainer.appendChild(closeButton);
        overlay.appendChild(imageContainer);
        
        document.body.appendChild(overlay);
        
        this.mobileLog('📋 갤러리 저장 안내 모달 표시됨');
        this.showToast('💡 이미지를 길게 눌러서 갤러리에 저장하세요', 'info');
    }
    
    saveWithDownload(canvas) {
        this.mobileLog('💾 기본 다운로드 방식으로 저장');
        
        canvas.toBlob((blob) => {
            if (!blob) {
                this.mobileLog('❌ 이미지 변환 실패');
                this.showToast('❌ 이미지 저장에 실패했습니다', 'error');
                return;
            }
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `annotateshot_${new Date().getTime()}.png`;
            
            // 모바일에서는 새 탭에서 열기
            if (this.isMobile) {
                link.target = '_blank';
                this.showToast('💡 새 탭에서 이미지를 길게 눌러 저장하세요', 'info');
            }
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.mobileLog('✅ 다운로드 링크 실행 완료');
        }, 'image/png');
    }
    
    saveImageDesktop(canvas) {
        // 데스크톱에서는 기존 방식 사용
        this.saveWithDownload(canvas);
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
        this.mobileLog(`😀 이모지 모드 처리: (${x.toFixed(1)},${y.toFixed(1)})`);
        
        // undoStack에 현재 상태 저장 (추가 전)
        if (!window.undoStack) {
            window.undoStack = [];
            this.mobileLog('✅ undoStack 초기화');
        }
        
        // 현재 상태를 undoStack에 저장
        const currentState = {
            clicks: window.clicks ? [...window.clicks] : [],
            clickCount: window.clickCount || 0,
            image: window.currentImage || null
        };
        window.undoStack.push(currentState);
        this.mobileLog(`💾 undoStack에 상태 저장: clicks=${currentState.clicks.length}, total=${window.undoStack.length}`);
        
        if (!window.clicks) {
            window.clicks = [];
            this.mobileLog('✅ clicks 배열 초기화');
        }
        
        const currentEmoji = window.currentEmoji || '😀';
        const currentSize = window.currentSize || '20';
        
        this.mobileLog(`🎨 사용할 설정: 이모지=${currentEmoji}, 크기=${currentSize}px`);
        
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
        
        this.mobileLog(`✅ 이모지 추가: ${currentEmoji} at (${x.toFixed(1)},${y.toFixed(1)}) 크기:${currentSize}px`);
        this.mobileLog(`📊 총 주석수: ${window.clicks.length}`);
        
        // 직접 캔버스에 그리기
        this.drawEmojiDirectly(x, y, currentEmoji, currentSize);
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
            
            // 배경 색상에 따른 텍스트 색상 결정 (대비 개선)
            const textColor = this.getContrastTextColor(annotation.color);
            
            // 숫자 텍스트
            ctx.fillStyle = textColor;
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
        // drawEmojiDirectly와 동일한 크기 계산 적용
        const fontSize = Math.round(size * 3.0);
        
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(annotation.emoji, annotation.x, annotation.y);
        
        console.log(`✅ 이모지 다시그리기: ${annotation.emoji} 크기=${fontSize}px (원본=${size}px)`);
    }
    
    
    
    handleTouchMove(e) {
        if (!this.touchActive) return;
        
        const touch = e.touches[0];
        const canvas = e.target;
        
        // 터치 이동 거리 계산
        if (this.touchStartX !== null && this.touchStartY !== null) {
            const deltaX = Math.abs(touch.clientX - this.touchStartX);
            const deltaY = Math.abs(touch.clientY - this.touchStartY);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // 임계값을 초과하면 이동으로 간주
            if (distance > this.touchThreshold) {
                this.touchMoved = true;
                
                // 드래그 타겟이 있으면 드래그 모드로 전환
                if (this.dragTarget && !this.isDragging) {
                    this.isDragging = true;
                    this.mobileLog(`🫱 드래그 시작: ${this.dragTarget.annotation.type} #${this.dragTarget.annotation.number || 'N/A'}`);
                }
                
                // 드래그 중이면 주석 위치 업데이트
                if (this.isDragging && this.dragTarget) {
                    // 캔버스 좌표 계산
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    
                    const rawX = touch.clientX - rect.left;
                    const rawY = touch.clientY - rect.top;
                    const newX = rawX * scaleX - this.dragOffsetX;
                    const newY = rawY * scaleY - this.dragOffsetY;
                    
                    // 주석 위치 업데이트
                    this.dragTarget.annotation.x = newX;
                    this.dragTarget.annotation.y = newY;
                    
                    // 캔버스 다시 그리기
                    this.redrawCanvasWithAnnotations();
                    
                    this.mobileLog(`🫱 드래그 중: (${newX.toFixed(1)},${newY.toFixed(1)})`);
                } else if (!this.dragTarget) {
                    this.mobileLog(`📱 일반 터치 이동 감지: ${distance.toFixed(1)}px (임계값: ${this.touchThreshold}px)`);
                }
            }
        }
    }
    
    handleTouchEnd(e) {
        this.touchActive = false;
        
        // 드래그 완료 처리
        if (this.isDragging && this.dragTarget) {
            this.mobileLog(`🫱 드래그 완료: ${this.dragTarget.annotation.type} #${this.dragTarget.annotation.number || 'N/A'} → (${this.dragTarget.annotation.x.toFixed(1)},${this.dragTarget.annotation.y.toFixed(1)})`);
            this.showToast('✅ 주석이 이동되었습니다', 'success');
        }
        // 터치가 이동하지 않았고 드래그 타겟이 없다면 새 주석 추가
        else if (!this.touchMoved && !this.dragTarget && this.pendingTouchX !== null && this.pendingTouchY !== null) {
            this.mobileLog('👆 터치 탭 감지 - 새 주석 추가');
            
            try {
                this.mobileLog(`🚀 triggerCanvasClick 호출 시작`);
                this.triggerCanvasClick(this.pendingTouchX, this.pendingTouchY);
                this.mobileLog(`✅ triggerCanvasClick 호출 완료`);
            } catch (error) {
                this.mobileLog(`❌ triggerCanvasClick 오류: ${error.message}`);
                console.error('triggerCanvasClick 상세 오류:', error);
            }
        }
        // 터치 이동이 있었지만 드래그가 아닌 경우
        else if (this.touchMoved && !this.isDragging) {
            this.mobileLog('👆 터치 이동 감지됨 - 주석 추가 취소 (스크롤로 간주)');
        }
        // 기존 주석을 탭했지만 이동하지 않은 경우
        else if (!this.touchMoved && this.dragTarget) {
            this.mobileLog('👆 기존 주석 탭 - 이동 없음');
        }
        
        // 드래그 상태 초기화
        this.isDragging = false;
        this.dragTarget = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
        // 터치 상태 초기화
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
        
        // MVP에서도 하단 툴바 표시 (숫자, 이모지 모드 지원)
        const mobileToolbar = document.querySelector('.mobile-toolbar');
        if (mobileToolbar) {
            mobileToolbar.style.display = 'flex';
            this.mobileLog('🔧 하단 툴바 표시 (숫자, 이모지 모드 지원)');
        }
        
        // 기본 변수 초기화
        window.clicks = [];
        window.clickCount = 0;
        window.currentColor = '#FF0000';
        window.currentSize = '20';
        
        this.mobileLog('✅ MVP 기본 설정 완료 - 숫자 모드 전용');
        
        // 모바일용 초기 텍스트 적용
        setTimeout(() => {
            const uploadPromptElement = document.getElementById('uploadPromptText');
            if (uploadPromptElement && typeof window.translate === 'function') {
                const mobileText = window.translate('mobileUploadImagePrompt');
                uploadPromptElement.innerHTML = mobileText.replace(/\n/g, '<br>');
                this.mobileLog('📱 모바일 초기 텍스트 적용 완료');
            }
        }, 300);
    }
    
    // 캔버스 ID 변경 후 터치 이벤트 재등록
    reinitializeAfterCanvasSwap() {
        this.mobileLog('🔄 캔버스 교체 후 터치 이벤트 재등록 시작');
        
        // 기존 이벤트 리스너 제거 (필요한 경우)
        const oldCanvas = document.getElementById('pcImageCanvas');
        if (oldCanvas) {
            // 기존 PC 캔버스의 이벤트 리스너는 그대로 두고
            this.mobileLog('🗑️ 기존 PC 캔버스 유지');
        }
        
        // 새로운 캔버스에 터치 이벤트 설정
        this.setupTouchEvents();
        
        // 기타 모바일 최적화 재적용
        this.optimizeForMobile();
        
        this.mobileLog('✅ 캔버스 교체 후 재초기화 완료');
    }
    
    preventCanvasReset() {
        this.mobileLog('🛡️ 캔버스 리셋 방지 설정 시작');
        
        // main.js의 캔버스 리셋을 일으키는 이벤트들을 모니터링
        const selectors = ['#colorSelector', '#sizeSelector', '#emojiSelector', '#fillSelector', '#modeSelector'];
        
        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                // 기존 이벤트 리스너들을 확인하고 모바일에서는 캔버스 보존
                element.addEventListener('change', (e) => {
                    if (this.isMobile) {
                        this.mobileLog(`🛡️ 모바일에서 ${selector} 변경 감지 - 캔버스 보존 모드`);
                        
                        // 모바일에서는 이미지와 주석을 보존하며 설정만 변경
                        if (window.currentImage && window.clicks) {
                            this.mobileLog(`🛡️ 이미지와 주석 보존: 이미지=${!!window.currentImage}, 주석=${window.clicks.length}개`);
                            
                            // 설정 변경 후 캔버스 재그리기
                            setTimeout(() => {
                                this.redrawCanvasWithAnnotations();
                                this.mobileLog('🛡️ 캔버스 보존 재그리기 완료');
                            }, 50);
                        }
                    }
                });
            }
        });
        
        this.mobileLog('✅ 캔버스 리셋 방지 설정 완료');
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
window.mobileApp = new MobileAnnotateShot();

// 디버그 정보
setTimeout(() => {
}, 2000);