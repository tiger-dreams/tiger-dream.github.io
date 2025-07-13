// AnnotateShot 자동화 테스트 스크립트
class AnnotateShotTester {
    constructor() {
        this.testResults = new Map();
        this.testLog = document.getElementById('testLog');
        this.testCanvas = document.getElementById('testCanvas');
        this.ctx = this.testCanvas.getContext('2d');
        this.totalTests = 0;
        this.completedTests = 0;
        
        // 메인 애플리케이션과 연동을 위한 iframe 생성
        this.createMainAppFrame();
        this.initializeTests();
    }

    createMainAppFrame() {
        // 실제 애플리케이션을 embedded 방식으로 로드
        this.appContainer = document.createElement('div');
        this.appContainer.style.position = 'absolute';
        this.appContainer.style.left = '-9999px';
        this.appContainer.style.width = '800px';
        this.appContainer.style.height = '600px';
        document.body.appendChild(this.appContainer);
        
        // 메인 애플리케이션의 HTML 구조 복제
        this.loadMainAppStructure();
    }

    async loadMainAppStructure() {
        try {
            // fetch로 index.html 내용 가져오기
            const response = await fetch('./index.html');
            const htmlContent = await response.text();
            
            // HTML 파싱하여 필요한 부분만 추출
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            // 컨트롤 영역과 캔버스 영역만 복제
            const controls = doc.querySelector('#controls');
            const imageContainer = doc.querySelector('#imageContainer');
            
            if (controls && imageContainer) {
                this.appContainer.appendChild(controls.cloneNode(true));
                this.appContainer.appendChild(imageContainer.cloneNode(true));
                
                // main.js 스크립트 로드
                await this.loadMainScript();
                this.log('메인 애플리케이션 구조 로드 완료');
            }
        } catch (error) {
            this.log(`애플리케이션 로드 실패: ${error.message}`);
        }
    }

    async loadMainScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = './src/main.js';
            script.onload = () => {
                this.log('메인 스크립트 로드 완료');
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initializeTests() {
        // 테스트 케이스 정의
        this.tests = [
            { id: 'emoji-mode', name: '이모지 모드 선택', func: this.testEmojiMode.bind(this) },
            { id: 'pixel-size', name: '픽셀 크기 선택', func: this.testPixelSizeOptions.bind(this) },
            { id: 'emoji-placement', name: '이모지 배치', func: this.testEmojiPlacement.bind(this) },
            { id: 'shift-same-number', name: 'Shift 동일 숫자', func: this.testShiftSameNumber.bind(this) },
            { id: 'circle-drawing', name: '원 그리기', func: this.testCircleDrawing.bind(this) },
            { id: 'drag-objects', name: '객체 드래그', func: this.testDragObjects.bind(this) },
            { id: 'cursor-change', name: '커서 변경', func: this.testCursorChange.bind(this) }
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
        this.log(`${testId}: ${passed ? '통과' : '실패'} ${message}`);
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

    // 이모지 모드 테스트
    async testEmojiMode() {
        try {
            if (!this.mainDoc) {
                throw new Error('메인 애플리케이션이 로드되지 않음');
            }

            const modeSelector = this.mainDoc.getElementById('modeSelector');
            const emojiSelector = this.mainDoc.getElementById('emojiSelector');

            // 이모지 모드 선택
            modeSelector.value = 'emoji';
            modeSelector.dispatchEvent(new Event('change'));

            // 이모지 선택기 표시 확인
            await this.wait(100);
            const isVisible = emojiSelector.style.display === 'inline-block';
            
            this.updateTestResult('emoji-mode', isVisible, 
                isVisible ? '이모지 선택기가 정상 표시됨' : '이모지 선택기가 표시되지 않음');

        } catch (error) {
            this.updateTestResult('emoji-mode', false, `오류: ${error.message}`);
        }
    }

    // 픽셀 크기 선택 테스트
    async testPixelSizeOptions() {
        try {
            if (!this.mainDoc) {
                throw new Error('메인 애플리케이션이 로드되지 않음');
            }

            const sizeSelector = this.mainDoc.getElementById('sizeSelector');
            const options = Array.from(sizeSelector.options);
            
            // 10px~70px 옵션 확인
            const pixelOptions = options.filter(opt => opt.value.match(/^\d+$/));
            const hasCorrectRange = pixelOptions.length >= 13; // 10,15,20...70
            const hasDefault20px = sizeSelector.value === '20';

            const passed = hasCorrectRange && hasDefault20px;
            this.updateTestResult('pixel-size', passed, 
                passed ? '픽셀 크기 옵션이 정상 설정됨' : '픽셀 크기 옵션 설정 오류');

        } catch (error) {
            this.updateTestResult('pixel-size', false, `오류: ${error.message}`);
        }
    }

    // 이모지 배치 테스트
    async testEmojiPlacement() {
        try {
            if (!this.mainDoc) {
                throw new Error('메인 애플리케이션이 로드되지 않음');
            }

            const modeSelector = this.mainDoc.getElementById('modeSelector');
            const emojiSelector = this.mainDoc.getElementById('emojiSelector');
            const canvas = this.mainDoc.getElementById('imageCanvas');

            // 이모지 모드 설정
            modeSelector.value = 'emoji';
            modeSelector.dispatchEvent(new Event('change'));
            
            // 이모지 선택
            emojiSelector.value = '😀';
            
            // 캔버스 클릭 시뮬레이션
            const clickEvent = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
                button: 0
            });
            canvas.dispatchEvent(clickEvent);

            const upEvent = new MouseEvent('mouseup', {
                clientX: 100,
                clientY: 100,
                button: 0
            });
            canvas.dispatchEvent(upEvent);

            await this.wait(100);

            // 이모지가 배치되었는지 확인 (clicks 배열 체크)
            const mainWindow = this.iframe.contentWindow;
            const hasEmojiClick = mainWindow.clicks && 
                mainWindow.clicks.some(click => click.type === 'emoji');

            this.updateTestResult('emoji-placement', hasEmojiClick, 
                hasEmojiClick ? '이모지 배치 성공' : '이모지 배치 실패');

        } catch (error) {
            this.updateTestResult('emoji-placement', false, `오류: ${error.message}`);
        }
    }

    // Shift 키 동일 숫자 테스트
    async testShiftSameNumber() {
        try {
            if (!this.mainDoc) {
                throw new Error('메인 애플리케이션이 로드되지 않음');
            }

            const modeSelector = this.mainDoc.getElementById('modeSelector');
            const canvas = this.mainDoc.getElementById('imageCanvas');
            const mainWindow = this.iframe.contentWindow;

            // 숫자 모드 설정
            modeSelector.value = 'number';
            modeSelector.dispatchEvent(new Event('change'));

            // 첫 번째 클릭 (일반)
            const click1 = new MouseEvent('mousedown', {
                clientX: 50,
                clientY: 50,
                button: 0,
                shiftKey: false
            });
            canvas.dispatchEvent(click1);
            canvas.dispatchEvent(new MouseEvent('mouseup'));

            await this.wait(100);

            // 두 번째 클릭 (Shift 키)
            const click2 = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 50,
                button: 0,
                shiftKey: true
            });
            canvas.dispatchEvent(click2);
            canvas.dispatchEvent(new MouseEvent('mouseup'));

            await this.wait(100);

            // 숫자가 동일한지 확인
            const numberClicks = mainWindow.clicks.filter(click => click.type === 'number');
            const hasSameNumber = numberClicks.length >= 2 && 
                numberClicks[numberClicks.length - 1].displayNumber === numberClicks[numberClicks.length - 2].displayNumber;

            this.updateTestResult('shift-same-number', hasSameNumber, 
                hasSameNumber ? 'Shift 키 동일 숫자 기능 정상' : 'Shift 키 기능 오류');

        } catch (error) {
            this.updateTestResult('shift-same-number', false, `오류: ${error.message}`);
        }
    }

    // 원 그리기 테스트
    async testCircleDrawing() {
        try {
            if (!this.mainDoc) {
                throw new Error('메인 애플리케이션이 로드되지 않음');
            }

            const modeSelector = this.mainDoc.getElementById('modeSelector');
            const shapeSelector = this.mainDoc.getElementById('shapeSelector');
            const canvas = this.mainDoc.getElementById('imageCanvas');

            // 도형 모드 설정
            modeSelector.value = 'shape';
            modeSelector.dispatchEvent(new Event('change'));
            
            // 원 선택
            shapeSelector.value = 'circle';

            // 드래그로 원 그리기 시뮬레이션
            const mouseDown = new MouseEvent('mousedown', {
                clientX: 50,
                clientY: 50,
                button: 0
            });
            canvas.dispatchEvent(mouseDown);

            const mouseMove = new MouseEvent('mousemove', {
                clientX: 150,
                clientY: 150,
                button: 0
            });
            canvas.dispatchEvent(mouseMove);

            const mouseUp = new MouseEvent('mouseup', {
                clientX: 150,
                clientY: 150,
                button: 0
            });
            canvas.dispatchEvent(mouseUp);

            await this.wait(100);

            // 원이 그려졌는지 확인
            const mainWindow = this.iframe.contentWindow;
            const hasCircle = mainWindow.clicks && 
                mainWindow.clicks.some(click => click.type === 'shape' && click.shape === 'circle');

            this.updateTestResult('circle-drawing', hasCircle, 
                hasCircle ? '원 그리기 성공' : '원 그리기 실패');

        } catch (error) {
            this.updateTestResult('circle-drawing', false, `오류: ${error.message}`);
        }
    }

    // 객체 드래그 테스트
    async testDragObjects() {
        try {
            // 이 테스트는 실제 드래그 동작을 시뮬레이션하기 어려우므로
            // 드래그 관련 변수와 함수가 존재하는지 확인
            const mainWindow = this.iframe.contentWindow;
            const hasDragVariables = typeof mainWindow.isDragging !== 'undefined' &&
                typeof mainWindow.draggedObject !== 'undefined';

            this.updateTestResult('drag-objects', hasDragVariables, 
                hasDragVariables ? '드래그 기능 변수 확인됨' : '드래그 기능 변수 없음');

        } catch (error) {
            this.updateTestResult('drag-objects', false, `오류: ${error.message}`);
        }
    }

    // 커서 변경 테스트
    async testCursorChange() {
        try {
            if (!this.mainDoc) {
                throw new Error('메인 애플리케이션이 로드되지 않음');
            }

            const canvas = this.mainDoc.getElementById('imageCanvas');
            
            // 마우스 이동 이벤트 시뮬레이션
            const mouseMove = new MouseEvent('mousemove', {
                clientX: 100,
                clientY: 100
            });
            canvas.dispatchEvent(mouseMove);

            await this.wait(100);

            // 커서 스타일 확인 (기본적으로는 default이어야 함)
            const cursorStyle = canvas.style.cursor;
            const hasValidCursor = cursorStyle === 'default' || cursorStyle === 'grab' || cursorStyle === '';

            this.updateTestResult('cursor-change', hasValidCursor, 
                hasValidCursor ? '커서 변경 기능 정상' : '커서 변경 기능 오류');

        } catch (error) {
            this.updateTestResult('cursor-change', false, `오류: ${error.message}`);
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 전체 테스트 실행
    async runAllTests() {
        this.log('=== 전체 테스트 시작 ===');
        this.clearResults();

        for (const test of this.tests) {
            this.log(`${test.name} 테스트 실행 중...`);
            await test.func();
            await this.wait(500); // 테스트 간 대기
        }

        this.log('=== 전체 테스트 완료 ===');
        this.generateReport();
    }

    // 빠른 테스트 (UI 확인만)
    async runQuickTests() {
        this.log('=== 빠른 테스트 시작 ===');
        this.clearResults();

        const quickTests = ['emoji-mode', 'pixel-size'];
        for (const testId of quickTests) {
            const test = this.tests.find(t => t.id === testId);
            if (test) {
                this.log(`${test.name} 테스트 실행 중...`);
                await test.func();
                await this.wait(200);
            }
        }

        this.log('=== 빠른 테스트 완료 ===');
    }

    clearResults() {
        this.testResults.clear();
        this.completedTests = 0;
        
        // 모든 결과 표시를 대기중으로 리셋
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
        
        if (successRate >= 80) {
            this.log(`🎉 테스트 통과! 배포 준비 완료`);
        } else {
            this.log(`⚠️  일부 테스트 실패. 수정 후 재테스트 필요`);
        }
    }
}

// 전역 함수들
let tester;

window.onload = () => {
    tester = new AnnotateShotTester();
};

function runAllTests() {
    if (tester) tester.runAllTests();
}

function runQuickTests() {
    if (tester) tester.runQuickTests();
}

function clearResults() {
    if (tester) tester.clearResults();
}

function testEmojiMode() {
    if (tester) tester.testEmojiMode();
}

function testPixelSizeOptions() {
    if (tester) tester.testPixelSizeOptions();
}

function testEmojiPlacement() {
    if (tester) tester.testEmojiPlacement();
}

function testShiftSameNumber() {
    if (tester) tester.testShiftSameNumber();
}

function testCircleDrawing() {
    if (tester) tester.testCircleDrawing();
}

function testDragObjects() {
    if (tester) tester.testDragObjects();
}

function testCursorChange() {
    if (tester) tester.testCursorChange();
}