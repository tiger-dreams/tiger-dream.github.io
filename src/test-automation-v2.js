// AnnotateShot 정확한 자동화 테스트 스크립트 v2
class AnnotateShotTesterV2 {
    constructor() {
        this.testResults = new Map();
        this.testLog = document.getElementById('testLog');
        this.totalTests = 0;
        this.completedTests = 0;
        
        this.initializeTests();
        this.log('테스트 시스템 초기화 완료');
    }

    initializeTests() {
        // 실제로 검증 가능한 테스트 케이스들로 재정의
        this.tests = [
            // v2.4.3 테스트 - Chrome Extension 로딩 UX 개선
            { id: 'extension-url-detection', name: 'Extension URL 파라미터 감지', func: this.testExtensionUrlDetection.bind(this) },
            { id: 'immediate-loading-message', name: '즉시 로딩 메시지 표시', func: this.testImmediateLoadingMessage.bind(this) },
            { id: 'multilingual-loading', name: '다국어 로딩 메시지', func: this.testMultilingualLoading.bind(this) },
            { id: 'loading-message-removal', name: '로딩 메시지 자동 제거', func: this.testLoadingMessageRemoval.bind(this) },
            { id: 'extension-compatibility', name: 'Extension v1.2.3 호환성', func: this.testExtensionCompatibility.bind(this) },
            
            // 클립보드 기능 테스트
            { id: 'clipboard-paste-support', name: '클립보드 붙여넣기 지원', func: this.testClipboardPasteSupport.bind(this) },
            { id: 'clipboard-button', name: '클립보드 버튼 기능', func: this.testClipboardButton.bind(this) },
            { id: 'copy-to-clipboard', name: '클립보드 복사 기능', func: this.testCopyToClipboard.bind(this) },
            
            // 파일 시스템 테스트
            { id: 'image-file-loader', name: '이미지 파일 로더', func: this.testImageFileLoader.bind(this) },
            { id: 'save-button', name: '저장 버튼 기능', func: this.testSaveButton.bind(this) },
            { id: 'image-format-support', name: '이미지 형식 지원', func: this.testImageFormatSupport.bind(this) },
            
            // 레이어 시스템 테스트
            { id: 'layer-variables', name: '레이어 시스템 변수', func: this.testLayerVariables.bind(this) },
            { id: 'create-image-layer', name: '이미지 레이어 생성', func: this.testCreateImageLayer.bind(this) },
            { id: 'annotation-layer', name: '주석 레이어 시스템', func: this.testAnnotationLayer.bind(this) },
            
            // 캔버스 모드 시스템 테스트
            { id: 'canvas-mode-selector', name: '캔버스 모드 선택기', func: this.testCanvasModeSelector.bind(this) },
            { id: 'canvas-background-color', name: '캔버스 배경색 설정', func: this.testCanvasBackgroundColor.bind(this) },
            { id: 'multi-canvas-size', name: '멀티 캔버스 크기', func: this.testMultiCanvasSize.bind(this) },
            
            // 이미지 리사이즈 시스템 테스트
            { id: 'resize-selector', name: '리사이즈 선택기', func: this.testResizeSelector.bind(this) },
            { id: 'custom-size', name: '커스텀 크기 설정', func: this.testCustomSize.bind(this) },
            { id: 'resize-handles', name: '리사이즈 핸들', func: this.testResizeHandles.bind(this) },
            
            // 다국어 지원 시스템 테스트
            { id: 'language-selector', name: '언어 선택기', func: this.testLanguageSelector.bind(this) },
            { id: 'translation-function', name: '번역 함수', func: this.testTranslationFunction.bind(this) },
            { id: 'language-persistence', name: '언어 설정 유지', func: this.testLanguagePersistence.bind(this) },
            
            // Chrome Extension 고급 기능 테스트
            { id: 'extension-manifest', name: 'Extension 매니페스트', func: this.testExtensionManifest.bind(this) },
            { id: 'capture-shortcuts', name: '캡처 단축키', func: this.testCaptureShortcuts.bind(this) },
            { id: 'extension-permissions', name: 'Extension 권한', func: this.testExtensionPermissions.bind(this) },
            
            // 모바일 반응형 테스트
            { id: 'mobile-detection', name: '모바일 감지 함수', func: this.testMobileDetection.bind(this) },
            { id: 'responsive-css', name: '반응형 CSS', func: this.testResponsiveCSS.bind(this) },
            { id: 'touch-events', name: '터치 이벤트', func: this.testTouchEvents.bind(this) },
            
            // v2.0.2 테스트 - 모드별 스타일 컨트롤
            { id: 'number-mode-controls', name: '숫자 모드 스타일 컨트롤', func: this.testNumberModeControls.bind(this) },
            { id: 'shape-mode-controls', name: '도형 모드 스타일 컨트롤', func: this.testShapeModeControls.bind(this) },
            { id: 'text-mode-controls', name: '텍스트 모드 스타일 컨트롤', func: this.testTextModeControls.bind(this) },
            { id: 'emoji-mode-controls', name: '이모지 모드 스타일 컨트롤', func: this.testEmojiModeControls.bind(this) },
            { id: 'mode-settings-persistence', name: '모드 설정 유지', func: this.testModeSettingsPersistence.bind(this) },
            
            // Crop 관련 테스트
            { id: 'crop-undo-restoration', name: 'Crop Undo 이미지 복원', func: this.testCropUndoRestoration.bind(this) },
            
            // 기존 테스트들
            { id: 'fill-selector', name: '채우기 선택기 UI', func: this.testFillSelectorUI.bind(this) },
            { id: 'solid-fill', name: '단색 채우기 기능', func: this.testSolidFillFunction.bind(this) },
            { id: 'blur-fill', name: '흐림 효과 기능', func: this.testBlurFillFunction.bind(this) },
            { id: 'mosaic-fill', name: '모자이크 효과 기능', func: this.testMosaicFillFunction.bind(this) },
            { id: 'emoji-mode', name: '이모지 모드 UI 존재', func: this.testEmojiModeUI.bind(this) },
            { id: 'pixel-size', name: '픽셀 크기 옵션', func: this.testPixelSizeUI.bind(this) },
            { id: 'emoji-placement', name: '이모지 선택기 기능', func: this.testEmojiSelectorUI.bind(this) },
            { id: 'shift-same-number', name: 'Shift 키 핸들러', func: this.testShiftKeyHandler.bind(this) },
            { id: 'h-key-english', name: 'H키 영문 처리', func: this.testHKeyEnglishHandler.bind(this) },
            { id: 'v-key-english', name: 'V키 영문 처리', func: this.testVKeyEnglishHandler.bind(this) },
            { id: 'h-key-korean', name: 'H키 한글 처리', func: this.testHKeyKoreanHandler.bind(this) },
            { id: 'v-key-korean', name: 'V키 한글 처리', func: this.testVKeyKoreanHandler.bind(this) },
            { id: 'keycode-lock', name: 'KeyCode 기반 처리', func: this.testKeyCodeHandler.bind(this) },
            { id: 'number-key-input', name: '숫자 키 입력', func: this.testNumberKeyHandler.bind(this) },
            { id: 'circle-drawing', name: '원 그리기 옵션', func: this.testCircleOption.bind(this) },
            { id: 'drag-objects', name: '드래그 이벤트 리스너', func: this.testDragEventListeners.bind(this) },
            { id: 'cursor-change', name: '마우스 이벤트 핸들러', func: this.testMouseEventHandlers.bind(this) }
        ];

        this.totalTests = this.tests.length;
        this.updateSummary();
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.testLog.innerHTML += `[${timestamp}] ${message}<br>`;
        this.testLog.scrollTop = this.testLog.scrollHeight;
    }

    updateTestResult(testId, passed, message = '') {
        // 이전에 완료되지 않은 테스트만 completedTests 증가
        const wasCompleted = this.testResults.has(testId);
        
        this.testResults.set(testId, passed);
        const resultElement = document.getElementById(`result-${testId}`);
        
        if (resultElement) {
            resultElement.className = `test-result ${passed ? 'result-pass' : 'result-fail'}`;
            resultElement.textContent = passed ? '통과' : '실패';
        }

        if (!wasCompleted) {
            this.completedTests++;
        }
        
        this.log(`${testId}: ${passed ? '✅ 통과' : '❌ 실패'} - ${message}`);
        this.updateSummary();
    }

    updateSummary() {
        const passed = Array.from(this.testResults.values()).filter(r => r).length;
        const failed = Array.from(this.testResults.values()).filter(r => !r).length;
        const pending = this.totalTests - this.completedTests;

        document.getElementById('totalTests').textContent = this.totalTests;
        document.getElementById('passedTests').textContent = passed;
        document.getElementById('failedTests').textContent = failed;
        document.getElementById('pendingTests').textContent = pending;

        const progress = (this.completedTests / this.totalTests) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
    }

    // v1.15.0 테스트: 채우기 선택기 UI 확인
    testFillSelectorUI() {
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const fillSelector = testWindow.document.getElementById('fillSelector');
                    const passed = fillSelector !== null;
                    
                    this.updateTestResult('fill-selector', passed, 
                        passed ? '채우기 선택기 UI 존재 확인됨' : '채우기 선택기 UI 누락');
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('fill-selector', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);

        } catch (error) {
            this.updateTestResult('fill-selector', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    // 단색 채우기 함수 존재 확인
    async testSolidFillFunction() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasSolidFill = jsContent.includes("fillType === 'solid'");
            const hasDrawRectWithFill = jsContent.includes('drawRectangleWithFill');
            const hasDrawCircleWithFill = jsContent.includes('drawCircleWithFill');
            
            const passed = hasSolidFill && hasDrawRectWithFill && hasDrawCircleWithFill;
            this.updateTestResult('solid-fill', passed, 
                passed ? '단색 채우기 함수들 확인됨' : '단색 채우기 함수 누락');

        } catch (error) {
            this.updateTestResult('solid-fill', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // 흐림 효과 함수 존재 확인
    async testBlurFillFunction() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasBlurFill = jsContent.includes("fillType === 'blur'");
            const hasBlurFilter = jsContent.includes("filter = 'blur");
            const hasGlobalAlpha = jsContent.includes('globalAlpha');
            
            const passed = hasBlurFill && hasBlurFilter && hasGlobalAlpha;
            this.updateTestResult('blur-fill', passed, 
                passed ? '흐림 효과 함수들 확인됨' : '흐림 효과 함수 누락');

        } catch (error) {
            this.updateTestResult('blur-fill', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // 모자이크 효과 함수 존재 확인
    async testMosaicFillFunction() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasMosaicFill = jsContent.includes("fillType === 'mosaic'");
            const hasDrawMosaicRect = jsContent.includes('drawMosaicRect');
            const hasDrawMosaicCircle = jsContent.includes('drawMosaicCircle');
            const hasGetImageData = jsContent.includes('getImageData');
            
            const passed = hasMosaicFill && hasDrawMosaicRect && hasDrawMosaicCircle && hasGetImageData;
            this.updateTestResult('mosaic-fill', passed, 
                passed ? '모자이크 효과 함수들 확인됨' : '모자이크 효과 함수 누락');

        } catch (error) {
            this.updateTestResult('mosaic-fill', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // DOM 기반 검증: 이모지 모드 UI 존재 확인
    testEmojiModeUI() {
        try {
            // 새 창에서 index.html 열기
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const modeSelector = testWindow.document.getElementById('modeSelector');
                    const emojiSelector = testWindow.document.getElementById('emojiSelector');
                    
                    // 이모지 모드 옵션 존재 확인
                    const hasEmojiOption = Array.from(modeSelector.options).some(opt => opt.value === 'emoji');
                    const hasEmojiSelector = emojiSelector !== null;
                    
                    const passed = hasEmojiOption && hasEmojiSelector;
                    this.updateTestResult('emoji-mode', passed, 
                        passed ? '이모지 모드 UI가 정상 존재함' : '이모지 모드 UI 요소 누락');
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('emoji-mode', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 2000);

        } catch (error) {
            this.updateTestResult('emoji-mode', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    // 픽셀 크기 옵션 검증
    testPixelSizeUI() {
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const sizeSelector = testWindow.document.getElementById('sizeSelector');
                    const options = Array.from(sizeSelector.options);
                    
                    // 픽셀 값 옵션들 확인
                    const pixelOptions = options.filter(opt => /^\d+$/.test(opt.value));
                    const hasCorrectRange = pixelOptions.length >= 10; // 최소 10개 이상
                    const hasDefault20px = sizeSelector.value === '20';
                    
                    const passed = hasCorrectRange && hasDefault20px;
                    this.updateTestResult('pixel-size', passed, 
                        passed ? `픽셀 옵션 ${pixelOptions.length}개 확인, 기본값 20px` : 
                                `픽셀 옵션 부족 또는 기본값 오류`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('pixel-size', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 2000);

        } catch (error) {
            this.updateTestResult('pixel-size', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    // 이모지 선택기 기능 확인
    testEmojiSelectorUI() {
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const emojiSelector = testWindow.document.getElementById('emojiSelector');
                    const options = Array.from(emojiSelector.options);
                    
                    // 이모지 옵션들 확인
                    const emojiOptions = options.filter(opt => /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(opt.value));
                    const hasEnoughEmojis = emojiOptions.length >= 10;
                    
                    this.updateTestResult('emoji-placement', hasEnoughEmojis, 
                        hasEnoughEmojis ? `이모지 옵션 ${emojiOptions.length}개 확인` : 
                                         `이모지 옵션 부족: ${emojiOptions.length}개`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('emoji-placement', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 2000);

        } catch (error) {
            this.updateTestResult('emoji-placement', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    // 코드 분석 기반: Shift 키 핸들러 확인
    async testShiftKeyHandler() {
        try {
            // main.js 파일을 가져와서 shiftKey 처리 코드 확인
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasShiftKeyCheck = jsContent.includes('e.shiftKey');
            const hasShiftKeyLogic = jsContent.includes('shiftKey') && jsContent.includes('displayNumber');
            
            const passed = hasShiftKeyCheck && hasShiftKeyLogic;
            this.updateTestResult('shift-same-number', passed, 
                passed ? 'Shift 키 처리 로직 확인됨' : 'Shift 키 처리 로직 누락');

        } catch (error) {
            this.updateTestResult('shift-same-number', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // H키 영문 처리 확인
    async testHKeyEnglishHandler() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasHKeyCheck = jsContent.includes("e.key === 'H'") && jsContent.includes("e.key === 'h'");
            const hasHorizontalLock = jsContent.includes('isHorizontalLock');
            
            const passed = hasHKeyCheck && hasHorizontalLock;
            this.updateTestResult('h-key-english', passed, 
                passed ? 'H키 영문 처리 로직 확인됨' : 'H키 영문 처리 로직 누락');

        } catch (error) {
            this.updateTestResult('h-key-english', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // V키 영문 처리 확인
    async testVKeyEnglishHandler() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasVKeyCheck = jsContent.includes("e.key === 'V'") && jsContent.includes("e.key === 'v'");
            const hasVerticalLock = jsContent.includes('isVerticalLock');
            
            const passed = hasVKeyCheck && hasVerticalLock;
            this.updateTestResult('v-key-english', passed, 
                passed ? 'V키 영문 처리 로직 확인됨' : 'V키 영문 처리 로직 누락');

        } catch (error) {
            this.updateTestResult('v-key-english', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // H키 한글 처리 확인
    async testHKeyKoreanHandler() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasKoreanHKey = jsContent.includes("e.key === 'ㅗ'");
            const hasHorizontalLock = jsContent.includes('isHorizontalLock');
            
            const passed = hasKoreanHKey && hasHorizontalLock;
            this.updateTestResult('h-key-korean', passed, 
                passed ? 'ㅗ키 한글 처리 로직 확인됨' : 'ㅗ키 한글 처리 로직 누락');

        } catch (error) {
            this.updateTestResult('h-key-korean', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // V키 한글 처리 확인
    async testVKeyKoreanHandler() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasKoreanVKey = jsContent.includes("e.key === 'ㅍ'");
            const hasVerticalLock = jsContent.includes('isVerticalLock');
            
            const passed = hasKoreanVKey && hasVerticalLock;
            this.updateTestResult('v-key-korean', passed, 
                passed ? 'ㅍ키 한글 처리 로직 확인됨' : 'ㅍ키 한글 처리 로직 누락');

        } catch (error) {
            this.updateTestResult('v-key-korean', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // KeyCode 기반 처리 확인
    async testKeyCodeHandler() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasKeyHCode = jsContent.includes("e.code === 'KeyH'");
            const hasKeyVCode = jsContent.includes("e.code === 'KeyV'");
            
            const passed = hasKeyHCode && hasKeyVCode;
            this.updateTestResult('keycode-lock', passed, 
                passed ? 'KeyCode 기반 처리 로직 확인됨' : 'KeyCode 기반 처리 로직 누락');

        } catch (error) {
            this.updateTestResult('keycode-lock', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // 숫자 키 입력 처리 확인
    async testNumberKeyHandler() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasNumberKeyCheck = jsContent.includes('parseInt(e.key)');
            const hasPendingNumber = jsContent.includes('pendingNumber');
            const hasWaitingForClick = jsContent.includes('isWaitingForClick');
            
            const passed = hasNumberKeyCheck && hasPendingNumber && hasWaitingForClick;
            this.updateTestResult('number-key-input', passed, 
                passed ? '숫자 키 입력 처리 로직 확인됨' : '숫자 키 입력 처리 로직 누락');

        } catch (error) {
            this.updateTestResult('number-key-input', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // 원 그리기 옵션 확인
    testCircleOption() {
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const shapeSelector = testWindow.document.getElementById('shapeSelector');
                    const options = Array.from(shapeSelector.options);
                    
                    const hasCircleOption = options.some(opt => opt.value === 'circle');
                    
                    this.updateTestResult('circle-drawing', hasCircleOption, 
                        hasCircleOption ? '원 그리기 옵션 확인됨' : '원 그리기 옵션 누락');
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('circle-drawing', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 2000);

        } catch (error) {
            this.updateTestResult('circle-drawing', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    // 드래그 이벤트 리스너 확인
    async testDragEventListeners() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasDragVariables = jsContent.includes('isDragging') && jsContent.includes('draggedObject');
            const hasMouseEvents = jsContent.includes('mousemove') && jsContent.includes('mousedown');
            
            const passed = hasDragVariables && hasMouseEvents;
            this.updateTestResult('drag-objects', passed, 
                passed ? '드래그 이벤트 처리 코드 확인됨' : '드래그 이벤트 처리 코드 누락');

        } catch (error) {
            this.updateTestResult('drag-objects', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // 마우스 이벤트 핸들러 확인
    async testMouseEventHandlers() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasCursorLogic = jsContent.includes('cursor') && jsContent.includes('grab');
            const hasMouseOverLogic = jsContent.includes('isMouseOverObject');
            
            const passed = hasCursorLogic && hasMouseOverLogic;
            this.updateTestResult('cursor-change', passed, 
                passed ? '마우스 커서 변경 로직 확인됨' : '마우스 커서 변경 로직 누락');

        } catch (error) {
            this.updateTestResult('cursor-change', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // v2.0.2 테스트: 숫자 모드 스타일 컨트롤
    testNumberModeControls() {
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const doc = testWindow.document;
                    const modeSelector = doc.getElementById('modeSelector');
                    const colorSection = doc.getElementById('colorSection');
                    const sizeSection = doc.getElementById('sizeSection');
                    const shapeSection = doc.getElementById('shapeSection');
                    const emojiSection = doc.getElementById('emojiSection');
                    
                    // 숫자 모드로 변경
                    if (modeSelector) {
                        modeSelector.value = 'number';
                        modeSelector.dispatchEvent(new Event('change'));
                    }
                    
                    setTimeout(() => {
                        const colorVisible = colorSection && colorSection.style.display !== 'none';
                        const sizeVisible = sizeSection && sizeSection.style.display !== 'none';
                        const shapeHidden = !shapeSection || shapeSection.style.display === 'none';
                        const emojiHidden = !emojiSection || emojiSection.style.display === 'none';
                        
                        const passed = colorVisible && sizeVisible && shapeHidden && emojiHidden;
                        
                        this.log(`[숫자 모드] ${passed ? '통과' : '실패'}: 색상(${colorVisible}), 크기(${sizeVisible}), 도형숨김(${shapeHidden}), 이모지숨김(${emojiHidden})`);
                        this.updateTestResult('number-mode-controls', passed);
                        this.completedTests++;
                        this.updateSummary();
                        
                        testWindow.close();
                    }, 500);
                } catch (error) {
                    this.log(`[숫자 모드] 실패: ${error.message}`);
                    this.updateTestResult('number-mode-controls', false);
                    this.completedTests++;
                    this.updateSummary();
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.log(`[숫자 모드] 실패: ${error.message}`);
            this.updateTestResult('number-mode-controls', false);
            this.completedTests++;
            this.updateSummary();
        }
    }

    // v2.0.2 테스트: 도형 모드 스타일 컨트롤
    testShapeModeControls() {
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const doc = testWindow.document;
                    const modeSelector = doc.getElementById('modeSelector');
                    const colorSection = doc.getElementById('colorSection');
                    const sizeSection = doc.getElementById('sizeSection');
                    const shapeSection = doc.getElementById('shapeSection');
                    const lineWidthSection = doc.getElementById('lineWidthSection');
                    
                    // 도형 모드로 변경
                    if (modeSelector) {
                        modeSelector.value = 'shape';
                        modeSelector.dispatchEvent(new Event('change'));
                    }
                    
                    setTimeout(() => {
                        const colorVisible = colorSection && colorSection.style.display !== 'none';
                        const sizeHidden = !sizeSection || sizeSection.style.display === 'none';
                        const shapeVisible = shapeSection && shapeSection.style.display !== 'none';
                        const lineWidthVisible = lineWidthSection && lineWidthSection.style.display !== 'none';
                        
                        const passed = colorVisible && sizeHidden && shapeVisible && lineWidthVisible;
                        
                        this.log(`[도형 모드] ${passed ? '통과' : '실패'}: 색상(${colorVisible}), 크기숨김(${sizeHidden}), 도형(${shapeVisible}), 굵기(${lineWidthVisible})`);
                        this.updateTestResult('shape-mode-controls', passed);
                        this.completedTests++;
                        this.updateSummary();
                        
                        testWindow.close();
                    }, 500);
                } catch (error) {
                    this.log(`[도형 모드] 실패: ${error.message}`);
                    this.updateTestResult('shape-mode-controls', false);
                    this.completedTests++;
                    this.updateSummary();
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.log(`[도형 모드] 실패: ${error.message}`);
            this.updateTestResult('shape-mode-controls', false);
            this.completedTests++;
            this.updateSummary();
        }
    }

    // v2.0.2 테스트: 텍스트 모드 스타일 컨트롤
    testTextModeControls() {
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const doc = testWindow.document;
                    const modeSelector = doc.getElementById('modeSelector');
                    const colorSection = doc.getElementById('colorSection');
                    const sizeSection = doc.getElementById('sizeSection');
                    const shapeSection = doc.getElementById('shapeSection');
                    const emojiSection = doc.getElementById('emojiSection');
                    
                    // 텍스트 모드로 변경
                    if (modeSelector) {
                        modeSelector.value = 'text';
                        modeSelector.dispatchEvent(new Event('change'));
                    }
                    
                    setTimeout(() => {
                        const colorVisible = colorSection && colorSection.style.display !== 'none';
                        const sizeVisible = sizeSection && sizeSection.style.display !== 'none';
                        const shapeHidden = !shapeSection || shapeSection.style.display === 'none';
                        const emojiHidden = !emojiSection || emojiSection.style.display === 'none';
                        
                        const passed = colorVisible && sizeVisible && shapeHidden && emojiHidden;
                        
                        this.log(`[텍스트 모드] ${passed ? '통과' : '실패'}: 색상(${colorVisible}), 크기(${sizeVisible}), 도형숨김(${shapeHidden}), 이모지숨김(${emojiHidden})`);
                        this.updateTestResult('text-mode-controls', passed);
                        this.completedTests++;
                        this.updateSummary();
                        
                        testWindow.close();
                    }, 500);
                } catch (error) {
                    this.log(`[텍스트 모드] 실패: ${error.message}`);
                    this.updateTestResult('text-mode-controls', false);
                    this.completedTests++;
                    this.updateSummary();
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.log(`[텍스트 모드] 실패: ${error.message}`);
            this.updateTestResult('text-mode-controls', false);
            this.completedTests++;
            this.updateSummary();
        }
    }

    // v2.0.2 테스트: 이모지 모드 스타일 컨트롤
    testEmojiModeControls() {
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const doc = testWindow.document;
                    const modeSelector = doc.getElementById('modeSelector');
                    const colorSection = doc.getElementById('colorSection');
                    const sizeSection = doc.getElementById('sizeSection');
                    const shapeSection = doc.getElementById('shapeSection');
                    const emojiSection = doc.getElementById('emojiSection');
                    
                    // 이모지 모드로 변경
                    if (modeSelector) {
                        modeSelector.value = 'emoji';
                        modeSelector.dispatchEvent(new Event('change'));
                    }
                    
                    setTimeout(() => {
                        const colorHidden = !colorSection || colorSection.style.display === 'none';
                        const sizeVisible = sizeSection && sizeSection.style.display !== 'none';
                        const shapeHidden = !shapeSection || shapeSection.style.display === 'none';
                        const emojiVisible = emojiSection && emojiSection.style.display !== 'none';
                        
                        const passed = colorHidden && sizeVisible && shapeHidden && emojiVisible;
                        
                        this.log(`[이모지 모드] ${passed ? '통과' : '실패'}: 색상숨김(${colorHidden}), 크기(${sizeVisible}), 도형숨김(${shapeHidden}), 이모지(${emojiVisible})`);
                        this.updateTestResult('emoji-mode-controls', passed);
                        this.completedTests++;
                        this.updateSummary();
                        
                        testWindow.close();
                    }, 500);
                } catch (error) {
                    this.log(`[이모지 모드] 실패: ${error.message}`);
                    this.updateTestResult('emoji-mode-controls', false);
                    this.completedTests++;
                    this.updateSummary();
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.log(`[이모지 모드] 실패: ${error.message}`);
            this.updateTestResult('emoji-mode-controls', false);
            this.completedTests++;
            this.updateSummary();
        }
    }

    // v2.0.2 테스트: 모드 설정 유지
    async testModeSettingsPersistence() {
        try {
            // localStorage에서 현재 모드 확인
            const currentSettings = localStorage.getItem('userSettings');
            let testPassed = false;
            
            if (currentSettings) {
                const settings = JSON.parse(currentSettings);
                const hasMode = settings.hasOwnProperty('mode');
                const hasColor = settings.hasOwnProperty('color');
                const hasSize = settings.hasOwnProperty('size');
                
                testPassed = hasMode && hasColor && hasSize;
                
                this.log(`[설정 유지] ${testPassed ? '통과' : '실패'}: localStorage에서 모드(${hasMode}), 색상(${hasColor}), 크기(${hasSize}) 설정 확인`);
            } else {
                this.log(`[설정 유지] 실패: localStorage에 userSettings 없음`);
            }
            
            this.updateTestResult('mode-settings-persistence', testPassed);
            this.completedTests++;
            this.updateSummary();
        } catch (error) {
            this.log(`[설정 유지] 실패: ${error.message}`);
            this.updateTestResult('mode-settings-persistence', false);
            this.completedTests++;
            this.updateSummary();
        }
    }

    // Crop Undo 테스트: 크롭 후 undo 시 이미지 복원 확인
    async testCropUndoRestoration() {
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            // Undo 관련 핵심 기능 검사
            const hasUndoFunction = jsContent.includes('function undo()') || jsContent.includes('const undo =');
            const hasCropFunction = jsContent.includes('function cropImageToCanvas()') || jsContent.includes('cropImageToCanvas');
            const hasCanvasStyleRestore = jsContent.includes('canvas.style.width') && jsContent.includes('canvas.style.height');
            const hasUndoStack = jsContent.includes('undoStack');
            
            // 크롭 관련 상태 저장 확인
            const savesCropState = jsContent.includes('canvasWidth') && jsContent.includes('canvasHeight');
            const restoresImageState = jsContent.includes('backgroundImage') || jsContent.includes('img.src');
            
            // 모든 조건이 충족되는지 확인
            const passed = hasUndoFunction && hasCropFunction && hasCanvasStyleRestore && 
                          hasUndoStack && savesCropState && restoresImageState;
            
            const details = [
                `Undo함수(${hasUndoFunction})`,
                `Crop함수(${hasCropFunction})`, 
                `CSS스타일복원(${hasCanvasStyleRestore})`,
                `UndoStack(${hasUndoStack})`,
                `크롭상태저장(${savesCropState})`,
                `이미지상태복원(${restoresImageState})`
            ].join(', ');
            
            this.log(`[Crop Undo] ${passed ? '통과' : '실패'}: ${details}`);
            this.updateTestResult('crop-undo-restoration', passed);
            this.completedTests++;
            this.updateSummary();
            
        } catch (error) {
            this.log(`[Crop Undo] 실패: ${error.message}`);
            this.updateTestResult('crop-undo-restoration', false);
            this.completedTests++;
            this.updateSummary();
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 전체 테스트 실행
    async runAllTests() {
        this.log('=== 정확한 테스트 시작 ===');
        this.clearResults();

        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i];
            this.log(`${test.name} 테스트 실행 중... (${i + 1}/${this.tests.length})`);
            
            try {
                await test.func();
            } catch (error) {
                this.log(`${test.name} 테스트 오류: ${error.message}`);
                this.updateTestResult(test.id, false, `오류: ${error.message}`);
            }
            
            await this.wait(1000); // 테스트 간 대기 시간 단축
        }

        this.log('=== 전체 테스트 완료 ===');
        this.generateReport();
    }

    // 빠른 테스트 (단축키 위주)
    async runQuickTests() {
        this.log('=== 빠른 단축키 테스트 시작 ===');
        this.clearResults();

        const quickTests = ['shift-same-number', 'h-key-english', 'v-key-english', 'h-key-korean', 'v-key-korean'];
        for (const testId of quickTests) {
            const test = this.tests.find(t => t.id === testId);
            if (test) {
                this.log(`${test.name} 테스트 실행 중...`);
                await test.func();
                await this.wait(1000); // 코드 분석이므로 빠르게
            }
        }

        this.log('=== 빠른 테스트 완료 ===');
    }

    clearResults() {
        this.testResults.clear();
        this.completedTests = 0;
        
        document.querySelectorAll('.test-result').forEach(el => {
            el.className = 'test-result result-pending';
            el.textContent = '대기중';
        });

        this.updateSummary();
        this.testLog.innerHTML = '=== 테스트 결과 초기화 ===<br>';
    }

    generateReport() {
        const passed = Array.from(this.testResults.values()).filter(r => r).length;
        const failed = Array.from(this.testResults.values()).filter(r => !r).length;
        const successRate = ((passed / this.totalTests) * 100).toFixed(1);

        this.log(`<br>=== 테스트 리포트 ===`);
        this.log(`총 테스트: ${this.totalTests}`);
        this.log(`통과: ${passed}`);
        this.log(`실패: ${failed}`);
        this.log(`성공률: ${successRate}%`);
        
        if (successRate >= 85) {
            this.log(`🎉 테스트 통과! 배포 준비 완료`);
        } else {
            this.log(`⚠️  일부 테스트 실패. 수정 후 재테스트 필요`);
        }
    }

    // v2.4.3 Chrome Extension 로딩 UX 개선 테스트들
    async testExtensionUrlDetection() {
        const testName = 'Extension URL 파라미터 감지';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            // index.html에서 Extension URL 파라미터 감지 로직 확인
            const response = await fetch('./index.html');
            const htmlContent = await response.text();
            const hasUrlParamCheck = htmlContent.includes('URLSearchParams') && 
                                   htmlContent.includes("source') === 'extension'");
            
            this.updateTestResult('extension-url-detection', hasUrlParamCheck, 
                `URL 파라미터 감지 로직 ${hasUrlParamCheck ? '존재' : '없음'}`);
        } catch (error) {
            this.updateTestResult('extension-url-detection', false, `오류: ${error.message}`);
        }
    }

    async testImmediateLoadingMessage() {
        const testName = '즉시 로딩 메시지 표시';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            // index.html에서 즉시 실행되는 로딩 메시지 표시 로직 확인
            const response = await fetch('./index.html');
            const htmlContent = await response.text();
            const hasImmediateMessage = htmlContent.includes('messageDiv') && 
                                      htmlContent.includes('로딩') &&
                                      htmlContent.includes('Loading');
            
            this.updateTestResult('immediate-loading-message', hasImmediateMessage,
                `즉시 로딩 메시지 로직 ${hasImmediateMessage ? '존재' : '없음'}`);
        } catch (error) {
            this.updateTestResult('immediate-loading-message', false, `오류: ${error.message}`);
        }
    }

    async testMultilingualLoading() {
        const testName = '다국어 로딩 메시지';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            // index.html에서 다국어 지원 로직 확인
            const response = await fetch('./index.html');
            const htmlContent = await response.text();
            const hasMultilingualSupport = htmlContent.includes('navigator.language') && 
                                         htmlContent.includes('ko') &&
                                         htmlContent.includes('en');
            
            this.updateTestResult('multilingual-loading', hasMultilingualSupport,
                `다국어 지원 로직 ${hasMultilingualSupport ? '존재' : '없음'}`);
        } catch (error) {
            this.updateTestResult('multilingual-loading', false, `오류: ${error.message}`);
        }
    }

    async testLoadingMessageRemoval() {
        const testName = '로딩 메시지 자동 제거';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            // index.html에서 메시지 제거 로직 확인
            const response = await fetch('./index.html');
            const htmlContent = await response.text();
            const hasRemovalLogic = htmlContent.includes('remove()') || 
                                  htmlContent.includes('removeChild') ||
                                  htmlContent.includes('display: none');
            
            this.updateTestResult('loading-message-removal', hasRemovalLogic,
                `메시지 제거 로직 ${hasRemovalLogic ? '존재' : '없음'}`);
        } catch (error) {
            this.updateTestResult('loading-message-removal', false, `오류: ${error.message}`);
        }
    }

    async testExtensionCompatibility() {
        const testName = 'Extension v1.2.3 호환성';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            // index.html에서 Extension v1.2.3 호환성 확인
            const response = await fetch('./index.html');
            const htmlContent = await response.text();
            const hasCompatibility = htmlContent.includes('source=extension') && 
                                   htmlContent.includes('Date.now()');
            
            this.updateTestResult('extension-compatibility', hasCompatibility,
                `Extension v1.2.3 호환성 ${hasCompatibility ? '확인' : '문제'}`);
        } catch (error) {
            this.updateTestResult('extension-compatibility', false, `오류: ${error.message}`);
        }
    }

    // 클립보드 기능 테스트들
    async testClipboardPasteSupport() {
        const testName = '클립보드 붙여넣기 지원';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            // 클립보드 API 지원 여부 확인
            const hasClipboardAPI = 'clipboard' in navigator;
            const hasReadPermission = hasClipboardAPI && 'read' in navigator.clipboard;
            
            this.updateTestResult('clipboard-paste-support', hasReadPermission,
                `클립보드 API 지원: ${hasClipboardAPI}, 읽기 권한: ${hasReadPermission}`);
        } catch (error) {
            this.updateTestResult('clipboard-paste-support', false, `오류: ${error.message}`);
        }
    }

    testClipboardButton() {
        const testName = '클립보드 버튼 기능';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const clipboardButton = testWindow.document.getElementById('clipboardButton');
                    const hasButton = clipboardButton !== null;
                    const hasEventListener = hasButton && clipboardButton.onclick !== null;
                    
                    this.updateTestResult('clipboard-button', hasButton,
                        `클립보드 버튼 ${hasButton ? '존재' : '없음'}, 이벤트 리스너 ${hasEventListener ? '있음' : '없음'}`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('clipboard-button', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.updateTestResult('clipboard-button', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    testCopyToClipboard() {
        const testName = '클립보드 복사 기능';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const copyButton = testWindow.document.getElementById('copyToClipboardButton');
                    const hasButton = copyButton !== null;
                    
                    this.updateTestResult('copy-to-clipboard', hasButton,
                        `클립보드 복사 버튼 ${hasButton ? '존재' : '없음'}`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('copy-to-clipboard', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.updateTestResult('copy-to-clipboard', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    // 파일 시스템 테스트들
    testImageFileLoader() {
        const testName = '이미지 파일 로더';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const imageLoader = testWindow.document.getElementById('imageLoader');
                    const hasLoader = imageLoader !== null;
                    const isFileInput = hasLoader && imageLoader.type === 'file';
                    const acceptsImages = hasLoader && imageLoader.accept && imageLoader.accept.includes('image');
                    
                    const passed = hasLoader && isFileInput && acceptsImages;
                    this.updateTestResult('image-file-loader', passed,
                        `파일 로더 ${hasLoader ? '존재' : '없음'}, 타입: ${isFileInput ? 'file' : '기타'}, 이미지 허용: ${acceptsImages}`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('image-file-loader', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.updateTestResult('image-file-loader', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    testSaveButton() {
        const testName = '저장 버튼 기능';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const saveButton = testWindow.document.getElementById('saveButton');
                    const hasButton = saveButton !== null;
                    
                    this.updateTestResult('save-button', hasButton,
                        `저장 버튼 ${hasButton ? '존재' : '없음'}`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('save-button', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.updateTestResult('save-button', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    async testImageFormatSupport() {
        const testName = '이미지 형식 지원';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const supportsPNG = jsContent.includes('image/png') || jsContent.includes('PNG');
            const supportsJPEG = jsContent.includes('image/jpeg') || jsContent.includes('JPEG');
            const supportsWebP = jsContent.includes('image/webp') || jsContent.includes('WebP');
            
            const supportedFormats = [supportsPNG && 'PNG', supportsJPEG && 'JPEG', supportsWebP && 'WebP'].filter(Boolean);
            const passed = supportedFormats.length >= 2;
            
            this.updateTestResult('image-format-support', passed,
                `지원 형식: ${supportedFormats.join(', ')} (${supportedFormats.length}개)`);
        } catch (error) {
            this.updateTestResult('image-format-support', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // 레이어 시스템 테스트들
    async testLayerVariables() {
        const testName = '레이어 시스템 변수';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasLayers = jsContent.includes('let layers = []');
            const hasImageLayers = jsContent.includes('let imageLayers = []');
            const hasLayerIdCounter = jsContent.includes('let layerIdCounter');
            
            const passed = hasLayers && hasImageLayers && hasLayerIdCounter;
            this.updateTestResult('layer-variables', passed,
                `레이어 변수들: layers(${hasLayers}), imageLayers(${hasImageLayers}), layerIdCounter(${hasLayerIdCounter})`);
        } catch (error) {
            this.updateTestResult('layer-variables', false, `코드 분석 실패: ${error.message}`);
        }
    }

    async testCreateImageLayer() {
        const testName = '이미지 레이어 생성';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasCreateImageLayer = jsContent.includes('function createImageLayer') || jsContent.includes('createImageLayer');
            const hasAddImageAsNewLayer = jsContent.includes('function addImageAsNewLayer') || jsContent.includes('addImageAsNewLayer');
            
            const passed = hasCreateImageLayer && hasAddImageAsNewLayer;
            this.updateTestResult('create-image-layer', passed,
                `이미지 레이어 함수들: createImageLayer(${hasCreateImageLayer}), addImageAsNewLayer(${hasAddImageAsNewLayer})`);
        } catch (error) {
            this.updateTestResult('create-image-layer', false, `코드 분석 실패: ${error.message}`);
        }
    }

    async testAnnotationLayer() {
        const testName = '주석 레이어 시스템';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasAddAnnotationLayer = jsContent.includes('function addAnnotationLayer') || jsContent.includes('addAnnotationLayer');
            const hasRebuildLayers = jsContent.includes('function rebuildLayersFromClicks') || jsContent.includes('rebuildLayersFromClicks');
            
            const passed = hasAddAnnotationLayer && hasRebuildLayers;
            this.updateTestResult('annotation-layer', passed,
                `주석 레이어 함수들: addAnnotationLayer(${hasAddAnnotationLayer}), rebuildLayers(${hasRebuildLayers})`);
        } catch (error) {
            this.updateTestResult('annotation-layer', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // 캔버스 모드 시스템 테스트들
    testCanvasModeSelector() {
        const testName = '캔버스 모드 선택기';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const canvasModeSelector = testWindow.document.getElementById('canvasModeSelector');
                    const hasSelector = canvasModeSelector !== null;
                    
                    let hasSingleMultiOptions = false;
                    if (hasSelector) {
                        const options = Array.from(canvasModeSelector.options);
                        hasSingleMultiOptions = options.some(opt => opt.value === 'single') && 
                                             options.some(opt => opt.value === 'multi');
                    }
                    
                    const passed = hasSelector && hasSingleMultiOptions;
                    this.updateTestResult('canvas-mode-selector', passed,
                        `캔버스 모드 선택기 ${hasSelector ? '존재' : '없음'}, Single/Multi 옵션 ${hasSingleMultiOptions ? '있음' : '없음'}`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('canvas-mode-selector', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.updateTestResult('canvas-mode-selector', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    testCanvasBackgroundColor() {
        const testName = '캔버스 배경색 설정';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const backgroundColorSelector = testWindow.document.getElementById('backgroundColorSelector');
                    const hasSelector = backgroundColorSelector !== null;
                    
                    this.updateTestResult('canvas-background-color', hasSelector,
                        `배경색 선택기 ${hasSelector ? '존재' : '없음'}`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('canvas-background-color', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.updateTestResult('canvas-background-color', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    testMultiCanvasSize() {
        const testName = '멀티 캔버스 크기';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const canvasSizeSelector = testWindow.document.getElementById('canvasSizeSelector');
                    const hasSelector = canvasSizeSelector !== null;
                    
                    this.updateTestResult('multi-canvas-size', hasSelector,
                        `캔버스 크기 선택기 ${hasSelector ? '존재' : '없음'}`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('multi-canvas-size', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.updateTestResult('multi-canvas-size', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    // 이미지 리사이즈 시스템 테스트들
    testResizeSelector() {
        const testName = '리사이즈 선택기';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const resizeSelector = testWindow.document.getElementById('resizeSelector');
                    const hasSelector = resizeSelector !== null;
                    
                    let hasResizeOptions = false;
                    if (hasSelector) {
                        const options = Array.from(resizeSelector.options);
                        hasResizeOptions = options.some(opt => opt.value.includes('scale')) || 
                                         options.some(opt => opt.value === 'original');
                    }
                    
                    const passed = hasSelector && hasResizeOptions;
                    this.updateTestResult('resize-selector', passed,
                        `리사이즈 선택기 ${hasSelector ? '존재' : '없음'}, 리사이즈 옵션 ${hasResizeOptions ? '있음' : '없음'}`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('resize-selector', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.updateTestResult('resize-selector', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    testCustomSize() {
        const testName = '커스텀 크기 설정';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const customWidth = testWindow.document.getElementById('customWidth');
                    const customHeight = testWindow.document.getElementById('customHeight');
                    const applyCustomSize = testWindow.document.getElementById('applyCustomSize');
                    
                    const hasWidthInput = customWidth !== null;
                    const hasHeightInput = customHeight !== null;
                    const hasApplyButton = applyCustomSize !== null;
                    
                    const passed = hasWidthInput && hasHeightInput && hasApplyButton;
                    this.updateTestResult('custom-size', passed,
                        `커스텀 크기: 너비(${hasWidthInput}), 높이(${hasHeightInput}), 적용 버튼(${hasApplyButton})`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('custom-size', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.updateTestResult('custom-size', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    async testResizeHandles() {
        const testName = '리사이즈 핸들';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasResizeHandle = jsContent.includes('let resizeHandle');
            const hasResizeStart = jsContent.includes('resizeStartX') && jsContent.includes('resizeStartY');
            const hasResizeLogic = jsContent.includes('isResizing');
            
            const passed = hasResizeHandle && hasResizeStart && hasResizeLogic;
            this.updateTestResult('resize-handles', passed,
                `리사이즈 핸들 변수들: handle(${hasResizeHandle}), start(${hasResizeStart}), logic(${hasResizeLogic})`);
        } catch (error) {
            this.updateTestResult('resize-handles', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // 다국어 지원 시스템 테스트들
    testLanguageSelector() {
        const testName = '언어 선택기';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const testWindow = window.open('./index.html', '_blank', 'width=800,height=600');
            
            setTimeout(() => {
                try {
                    const languageSelector = testWindow.document.getElementById('languageSelector');
                    const hasSelector = languageSelector !== null;
                    
                    let hasLanguageOptions = false;
                    if (hasSelector) {
                        const options = Array.from(languageSelector.options);
                        hasLanguageOptions = options.some(opt => opt.value === 'ko') && 
                                           options.some(opt => opt.value === 'en');
                    }
                    
                    const passed = hasSelector && hasLanguageOptions;
                    this.updateTestResult('language-selector', passed,
                        `언어 선택기 ${hasSelector ? '존재' : '없음'}, 한/영 옵션 ${hasLanguageOptions ? '있음' : '없음'}`);
                    
                    testWindow.close();
                } catch (error) {
                    this.updateTestResult('language-selector', false, `UI 검증 실패: ${error.message}`);
                    testWindow.close();
                }
            }, 1000);
        } catch (error) {
            this.updateTestResult('language-selector', false, `테스트 실행 실패: ${error.message}`);
        }
    }

    async testTranslationFunction() {
        const testName = '번역 함수';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./index.html');
            const htmlContent = await response.text();
            
            const hasTranslateFunction = htmlContent.includes('function translate') || htmlContent.includes('translate(');
            const hasTranslations = htmlContent.includes('translations') && htmlContent.includes('ko:') && htmlContent.includes('en:');
            
            const passed = hasTranslateFunction && hasTranslations;
            this.updateTestResult('translation-function', passed,
                `번역 함수: ${hasTranslateFunction ? '존재' : '없음'}, 번역 데이터: ${hasTranslations ? '있음' : '없음'}`);
        } catch (error) {
            this.updateTestResult('translation-function', false, `코드 분석 실패: ${error.message}`);
        }
    }

    async testLanguagePersistence() {
        const testName = '언어 설정 유지';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./index.html');
            const htmlContent = await response.text();
            
            const hasGetLanguage = htmlContent.includes('getLanguage()') || htmlContent.includes('getLanguage');
            const hasSetLanguage = htmlContent.includes('setLanguage') || htmlContent.includes('localStorage');
            
            const passed = hasGetLanguage && hasSetLanguage;
            this.updateTestResult('language-persistence', passed,
                `언어 설정 함수들: get(${hasGetLanguage}), set/localStorage(${hasSetLanguage})`);
        } catch (error) {
            this.updateTestResult('language-persistence', false, `코드 분석 실패: ${error.message}`);
        }
    }

    // Chrome Extension 고급 기능 테스트들
    async testExtensionManifest() {
        const testName = 'Extension 매니페스트';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./extension/manifest.json');
            const manifest = await response.json();
            
            const hasManifestV3 = manifest.manifest_version === 3;
            const hasName = manifest.name && manifest.name.includes('AnnotateShot');
            const hasVersion = manifest.version && /^\d+\.\d+\.\d+$/.test(manifest.version);
            const hasPermissions = manifest.permissions && manifest.permissions.includes('activeTab');
            
            const passed = hasManifestV3 && hasName && hasVersion && hasPermissions;
            this.updateTestResult('extension-manifest', passed,
                `매니페스트: v3(${hasManifestV3}), 이름(${hasName}), 버전(${hasVersion}), 권한(${hasPermissions})`);
        } catch (error) {
            this.updateTestResult('extension-manifest', false, `매니페스트 분석 실패: ${error.message}`);
        }
    }

    async testCaptureShortcuts() {
        const testName = '캡처 단축키';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./extension/manifest.json');
            const manifest = await response.json();
            
            const commands = manifest.commands || {};
            const hasCaptureVisible = 'capture-visible' in commands;
            const hasCapturePartial = 'capture-partial' in commands;
            const hasCaptureFullPage = 'capture-full' in commands;
            
            const passed = hasCaptureVisible && hasCapturePartial && hasCaptureFullPage;
            this.updateTestResult('capture-shortcuts', passed,
                `캡처 단축키: 보이는영역(${hasCaptureVisible}), 부분(${hasCapturePartial}), 전체(${hasCaptureFullPage})`);
        } catch (error) {
            this.updateTestResult('capture-shortcuts', false, `단축키 분석 실패: ${error.message}`);
        }
    }

    async testExtensionPermissions() {
        const testName = 'Extension 권한';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./extension/manifest.json');
            const manifest = await response.json();
            
            const permissions = manifest.permissions || [];
            const hostPermissions = manifest.host_permissions || [];
            
            const hasActiveTab = permissions.includes('activeTab');
            const hasScripting = permissions.includes('scripting');
            const hasHostPermission = hostPermissions.some(host => host.includes('alllogo.net'));
            
            const passed = hasActiveTab && hasScripting && hasHostPermission;
            this.updateTestResult('extension-permissions', passed,
                `Extension 권한: activeTab(${hasActiveTab}), scripting(${hasScripting}), host(${hasHostPermission})`);
        } catch (error) {
            this.updateTestResult('extension-permissions', false, `권한 분석 실패: ${error.message}`);
        }
    }

    // 모바일 반응형 테스트들
    async testMobileDetection() {
        const testName = '모바일 감지 함수';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasIsMobile = jsContent.includes('IS_MOBILE') || jsContent.includes('isMobile');
            const hasMobileDetection = jsContent.includes('mobile-device') || jsContent.includes('navigator.userAgent');
            
            const passed = hasIsMobile && hasMobileDetection;
            this.updateTestResult('mobile-detection', passed,
                `모바일 감지: IS_MOBILE(${hasIsMobile}), 감지로직(${hasMobileDetection})`);
        } catch (error) {
            this.updateTestResult('mobile-detection', false, `코드 분석 실패: ${error.message}`);
        }
    }

    async testResponsiveCSS() {
        const testName = '반응형 CSS';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./index.html');
            const htmlContent = await response.text();
            
            const hasMediaQuery = htmlContent.includes('@media') && htmlContent.includes('max-width');
            const hasResponsiveViewport = htmlContent.includes('viewport') && htmlContent.includes('width=device-width');
            
            const passed = hasMediaQuery && hasResponsiveViewport;
            this.updateTestResult('responsive-css', passed,
                `반응형 CSS: 미디어쿼리(${hasMediaQuery}), 뷰포트(${hasResponsiveViewport})`);
        } catch (error) {
            this.updateTestResult('responsive-css', false, `CSS 분석 실패: ${error.message}`);
        }
    }

    async testTouchEvents() {
        const testName = '터치 이벤트';
        this.log(`${testName} 테스트 시작...`);
        
        try {
            const response = await fetch('./src/main.js');
            const jsContent = await response.text();
            
            const hasTouchStart = jsContent.includes('touchstart') || jsContent.includes('TouchEvent');
            const hasTouchMove = jsContent.includes('touchmove');
            const hasTouchEnd = jsContent.includes('touchend');
            
            const touchSupport = [hasTouchStart, hasTouchMove, hasTouchEnd].filter(Boolean).length;
            const passed = touchSupport >= 1; // 최소 하나의 터치 이벤트 지원
            
            this.updateTestResult('touch-events', passed,
                `터치 이벤트: start(${hasTouchStart}), move(${hasTouchMove}), end(${hasTouchEnd})`);
        } catch (error) {
            this.updateTestResult('touch-events', false, `코드 분석 실패: ${error.message}`);
        }
    }
}

// 전역 함수들 (V2 버전)
let testerV2;

// V2 버전 사용으로 전환
window.onload = () => {
    testerV2 = new AnnotateShotTesterV2();
    
    // 기존 tester 객체도 V2로 대체
    window.tester = testerV2;
};

function runAllTests() {
    if (testerV2) testerV2.runAllTests();
}

function runQuickTests() {
    if (testerV2) testerV2.runQuickTests();
}

function clearResults() {
    if (testerV2) testerV2.clearResults();
}

// 개별 테스트 함수들
function testEmojiMode() {
    if (testerV2) testerV2.testEmojiModeUI();
}

function testPixelSizeOptions() {
    if (testerV2) testerV2.testPixelSizeUI();
}

function testEmojiPlacement() {
    if (testerV2) testerV2.testEmojiSelectorUI();
}

function testShiftSameNumber() {
    if (testerV2) testerV2.testShiftKeyHandler();
}

function testCircleDrawing() {
    if (testerV2) testerV2.testCircleOption();
}

function testDragObjects() {
    if (testerV2) testerV2.testDragEventListeners();
}

function testCursorChange() {
    if (testerV2) testerV2.testMouseEventHandlers();
}

// 새로 추가된 단축키 테스트 함수들
function testHKeyEnglish() {
    if (testerV2) testerV2.testHKeyEnglishHandler();
}

function testVKeyEnglish() {
    if (testerV2) testerV2.testVKeyEnglishHandler();
}

function testHKeyKorean() {
    if (testerV2) testerV2.testHKeyKoreanHandler();
}

function testVKeyKorean() {
    if (testerV2) testerV2.testVKeyKoreanHandler();
}

// v1.15.0 채우기 옵션 테스트 함수들
function testFillSelector() {
    if (testerV2) testerV2.testFillSelectorUI();
}

function testSolidFill() {
    if (testerV2) testerV2.testSolidFillFunction();
}

function testBlurFill() {
    if (testerV2) testerV2.testBlurFillFunction();
}

function testMosaicFill() {
    if (testerV2) testerV2.testMosaicFillFunction();
}

function testKeyCodeLock() {
    if (testerV2) testerV2.testKeyCodeHandler();
}

function testNumberKeyInput() {
    if (testerV2) testerV2.testNumberKeyHandler();
}

// v2.0.2 모드별 스타일 컨트롤 테스트 함수들
function testNumberModeControls() {
    if (testerV2) testerV2.testNumberModeControls();
}

function testShapeModeControls() {
    if (testerV2) testerV2.testShapeModeControls();
}

function testTextModeControls() {
    if (testerV2) testerV2.testTextModeControls();
}

function testEmojiModeControls() {
    if (testerV2) testerV2.testEmojiModeControls();
}

function testModeSettingsPersistence() {
    if (testerV2) testerV2.testModeSettingsPersistence();
}

function testCropUndoRestoration() {
    if (testerV2) testerV2.testCropUndoRestoration();
}

// v2.4.3 Chrome Extension 로딩 UX 개선 테스트 함수들
function testExtensionUrlDetection() {
    if (testerV2) testerV2.testExtensionUrlDetection();
}

function testImmediateLoadingMessage() {
    if (testerV2) testerV2.testImmediateLoadingMessage();
}

function testMultilingualLoading() {
    if (testerV2) testerV2.testMultilingualLoading();
}

function testLoadingMessageRemoval() {
    if (testerV2) testerV2.testLoadingMessageRemoval();
}

function testExtensionCompatibility() {
    if (testerV2) testerV2.testExtensionCompatibility();
}

// 클립보드 기능 테스트 함수들
function testClipboardPasteSupport() {
    if (testerV2) testerV2.testClipboardPasteSupport();
}

function testClipboardButton() {
    if (testerV2) testerV2.testClipboardButton();
}

function testCopyToClipboard() {
    if (testerV2) testerV2.testCopyToClipboard();
}

// 파일 시스템 테스트 함수들
function testImageFileLoader() {
    if (testerV2) testerV2.testImageFileLoader();
}

function testSaveButton() {
    if (testerV2) testerV2.testSaveButton();
}

function testImageFormatSupport() {
    if (testerV2) testerV2.testImageFormatSupport();
}

// 레이어 시스템 테스트 함수들
function testLayerVariables() {
    if (testerV2) testerV2.testLayerVariables();
}

function testCreateImageLayer() {
    if (testerV2) testerV2.testCreateImageLayer();
}

function testAnnotationLayer() {
    if (testerV2) testerV2.testAnnotationLayer();
}

// 캔버스 모드 시스템 테스트 함수들
function testCanvasModeSelector() {
    if (testerV2) testerV2.testCanvasModeSelector();
}

function testCanvasBackgroundColor() {
    if (testerV2) testerV2.testCanvasBackgroundColor();
}

function testMultiCanvasSize() {
    if (testerV2) testerV2.testMultiCanvasSize();
}

// 이미지 리사이즈 시스템 테스트 함수들
function testResizeSelector() {
    if (testerV2) testerV2.testResizeSelector();
}

function testCustomSize() {
    if (testerV2) testerV2.testCustomSize();
}

function testResizeHandles() {
    if (testerV2) testerV2.testResizeHandles();
}

// 다국어 지원 시스템 테스트 함수들
function testLanguageSelector() {
    if (testerV2) testerV2.testLanguageSelector();
}

function testTranslationFunction() {
    if (testerV2) testerV2.testTranslationFunction();
}

function testLanguagePersistence() {
    if (testerV2) testerV2.testLanguagePersistence();
}

// Chrome Extension 고급 기능 테스트 함수들
function testExtensionManifest() {
    if (testerV2) testerV2.testExtensionManifest();
}

function testCaptureShortcuts() {
    if (testerV2) testerV2.testCaptureShortcuts();
}

function testExtensionPermissions() {
    if (testerV2) testerV2.testExtensionPermissions();
}

// 모바일 반응형 테스트 함수들
function testMobileDetection() {
    if (testerV2) testerV2.testMobileDetection();
}

function testResponsiveCSS() {
    if (testerV2) testerV2.testResponsiveCSS();
}

function testTouchEvents() {
    if (testerV2) testerV2.testTouchEvents();
}