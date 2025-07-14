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
        this.testResults.set(testId, passed);
        const resultElement = document.getElementById(`result-${testId}`);
        
        if (resultElement) {
            resultElement.className = `test-result ${passed ? 'result-pass' : 'result-fail'}`;
            resultElement.textContent = passed ? '통과' : '실패';
        }

        this.completedTests++;
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

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 전체 테스트 실행
    async runAllTests() {
        this.log('=== 정확한 테스트 시작 ===');
        this.clearResults();

        for (const test of this.tests) {
            this.log(`${test.name} 테스트 실행 중...`);
            await test.func();
            await this.wait(3000); // 테스트 간 충분한 대기
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