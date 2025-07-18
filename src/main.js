// 전역 상수 및 변수
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 900;
        const imageLoader = document.getElementById('imageLoader');
        const clipboardButton = document.getElementById('clipboardButton');
        const saveButton = document.getElementById('saveButton');
        const copyToClipboardButton = document.getElementById('copyToClipboardButton');
        const undoButton = document.getElementById('undoButton');
        const colorSelector = document.getElementById('colorSelector');
        const sizeSelector = document.getElementById('sizeSelector');
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        const messageDiv = document.getElementById('message');
        const modeSelector = document.getElementById('modeSelector');
        const shapeSelector = document.getElementById('shapeSelector');
        const emojiSelector = document.getElementById('emojiSelector');
        const fillSelector = document.getElementById('fillSelector');
        const lineWidthSelector = document.getElementById('lineWidthSelector');
        const resizeSelector = document.getElementById('resizeSelector');

        let currentImage = null;
        let currentColor = "#FF0000";
        let currentSize = "20";
        let currentMode = 'number';
        let currentShape = 'rectangle';
        let currentFill = 'none';
        let isDrawing = false;
        let startX, startY;
        let shapeCount = 0;
        let clicks = [];
        let undoStack = [];
        let clickCount = 0;
        let maxClickCount = 0;
        let isWaitingForClick = false;
        let pendingNumber = null;
        let currentLineWidth = 2; // 기본값: 보통
        let isHorizontalLock = false;
        let isVerticalLock = false;
        let initialX = null;
        let initialY = null;

        // 드래그 관련 변수
        let isDragging = false;
        let draggedObject = null;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        // 디바운싱 유틸리티 함수
        function debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }

        // 이미지 로드 관련 함수
        function loadImageFromUrl(url) {
            const storageKey = 'cachedImage_' + url;
            const cachedImage = localStorage.getItem(storageKey);
            if (cachedImage) {
                loadImageFromDataUrl(cachedImage);
                return;
            }
            currentImage = new Image();
            currentImage.crossOrigin = "anonymous";
            currentImage.onload = () => {
                applyImageToCanvas();
                cacheImageToLocalStorage(currentImage, url);
            };
            currentImage.onerror = () => {
                console.error("Image load failed:", url);
                messageDiv.textContent = translate('defaultImageLoadFailed');
            };
            currentImage.src = url;
        }

        function loadImageFromDataUrl(dataUrl) {
            currentImage = new Image();
            currentImage.onload = applyImageToCanvas;
            currentImage.src = dataUrl;
        }

        function drawDefaultCanvasBackground() {
            canvas.width = MAX_WIDTH; // Set a default size for the blank canvas
            canvas.height = MAX_HEIGHT;
            canvas.classList.add('default-canvas'); // Add class for responsive styling
            ctx.fillStyle = '#f5f7fa'; // Light background color
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const text = translate('uploadImagePrompt');
            const lines = text.split('\n');
            
            ctx.fillStyle = '#888';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const lineHeight = 35;
            const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
            
            lines.forEach((line, index) => {
                ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
            });
        }

        function applyImageToCanvas() {
            if (!currentImage) {
                drawDefaultCanvasBackground();
                messageDiv.textContent = translate('noImageLoaded');
                resetDrawingState();
                return;
            }

            const { width, height } = calculateImageDimensions(currentImage.width, currentImage.height);
            applyCanvasDimensions(width, height);
            resetDrawingState();
            messageDiv.textContent = translate('imageLoaded', { width, height });
        }

        function calculateImageDimensions(width, height) {
            switch (resizeSelector.value) {
                case "original": 
                    return { width, height };
                case "300": 
                    return { width: 300, height: Math.floor(height * (300 / width)) };
                case "600": 
                    return { width: 600, height: Math.floor(height * (600 / width)) };
                case "900": 
                    return { width: 900, height: Math.floor(height * (900 / width)) };
                case "scale30": 
                    return { width: Math.floor(width * 0.3), height: Math.floor(height * 0.3) };
                case "scale50": 
                    return { width: Math.floor(width * 0.5), height: Math.floor(height * 0.5) };
                case "scale70": 
                    return { width: Math.floor(width * 0.7), height: Math.floor(height * 0.7) };
                default:
                    // Auto-resize: fit to viewport while maintaining aspect ratio
                    const availableWidth = window.innerWidth - 320; // Subtract sidebar width
                    const availableHeight = window.innerHeight - 100; // Subtract header and padding
                    
                    // Use the smaller of MAX dimensions or available viewport space
                    const maxWidth = Math.min(MAX_WIDTH, Math.max(400, availableWidth));
                    const maxHeight = Math.min(MAX_HEIGHT, Math.max(300, availableHeight));
                    
                    const scale = Math.min(maxWidth / width, maxHeight / height, 1); // Don't scale up
                    return { width: Math.floor(width * scale), height: Math.floor(height * scale) };
            }
        }

        function applyCanvasDimensions(width, height) {
            const dpr = window.devicePixelRatio || 1;
            
            // Remove default canvas class when loading an actual image
            canvas.classList.remove('default-canvas');
            
            // Set the internal canvas resolution (drawing buffer size)
            canvas.width = width * dpr;
            canvas.height = height * dpr;

            // Set the CSS display size of the canvas to the original dimensions
            // This ensures the canvas is displayed at the intended size,
            // while the internal resolution is higher for sharp rendering on high-DPI screens.
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            // Scale the drawing context to match the CSS size,
            // so all drawing operations (e.g., ctx.fillRect, ctx.arc)
            // are still done in terms of CSS pixels.
            ctx.scale(dpr, dpr);

            // Draw the image at the exact calculated dimensions
            ctx.drawImage(currentImage, 0, 0, width, height);
            messageDiv.textContent = translate('imageLoaded', { width, height });
        }

        function cacheImageToLocalStorage(img, url) {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0);
            try {
                const dataURL = tempCanvas.toDataURL('image/jpeg');
                localStorage.setItem('cachedImage_' + url, dataURL);
            } catch (e) {
                console.error("Failed to cache image:", e);
            }
        }

        // 확장 프로그램에서 캡처한 이미지 확인 및 로드
        function loadCapturedImage() {
            const capturedImage = localStorage.getItem('annotateshot_captured_image');
            const imageSource = localStorage.getItem('annotateshot_image_source');
            
            if (capturedImage) {
                console.log('확장 프로그램에서 캡처한 이미지 발견');
                
                // Extension에서 온 이미지인 경우 로딩 메시지 표시
                if (imageSource === 'extension') {
                    showExtensionLoadingMessage();
                }
                
                loadImageFromDataUrl(capturedImage);
                
                // 사용 후 정리
                localStorage.removeItem('annotateshot_captured_image');
                localStorage.removeItem('annotateshot_image_source');
                return true;
            }
            return false;
        }

        // Extension 이미지 로딩 메시지 표시
        function showExtensionLoadingMessage() {
            // 기존 메시지가 있으면 제거
            const existingMessage = document.getElementById('extension-loading-message');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            // 로딩 메시지 요소 생성
            const loadingMessage = document.createElement('div');
            loadingMessage.id = 'extension-loading-message';
            loadingMessage.innerHTML = `
                <div style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 30px 40px;
                    border-radius: 12px;
                    z-index: 10000;
                    text-align: center;
                    font-family: 'Inter', system-ui, sans-serif;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 3px solid #3b82f6;
                        border-top: 3px solid transparent;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">
                        🖼️ ${translate('extensionImageLoading')}
                    </div>
                    <div style="font-size: 14px; color: #94a3b8;">
                        ${translate('pleaseWait')}
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            
            document.body.appendChild(loadingMessage);
            
            // 이미지 로드 완료 후 메시지 제거 (최대 10초 후 자동 제거)
            const removeMessage = () => {
                const message = document.getElementById('extension-loading-message');
                if (message) {
                    message.style.opacity = '0';
                    message.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => {
                        if (message.parentNode) {
                            message.parentNode.removeChild(message);
                        }
                    }, 300);
                }
            };
            
            // 이미지 로드 완료 이벤트 감지
            const checkImageLoaded = () => {
                if (currentImage && currentImage.complete) {
                    removeMessage();
                } else {
                    setTimeout(checkImageLoaded, 100);
                }
            };
            
            // 이미지 로드 체크 시작
            setTimeout(checkImageLoaded, 500);
            
            // 최대 10초 후 강제 제거
            setTimeout(removeMessage, 10000);
        }

        // 전역 함수로 내보내기 (확장 프로그램에서 호출 가능)
        window.loadCapturedImage = loadCapturedImage;

        // 초기화 및 이벤트 설정
        window.onload = () => {
            // 확장 프로그램에서 캡처한 이미지가 있는지 먼저 확인
            if (!loadCapturedImage()) {
                // 캡처된 이미지가 없으면 기본 캔버스 표시
                drawDefaultCanvasBackground();
            }
            // 설정은 로드하되, 이전 작업 내용은 초기화
            loadUserSettingsWithoutHistory();
        };

        imageLoader.addEventListener('change', e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = event => loadImageFromDataUrl(event.target.result);
                reader.readAsDataURL(file);
            }
        });

        clipboardButton.addEventListener('click', () => {
            navigator.clipboard.read().then(items => {
                for (let item of items) {
                    if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                        item.getType('image/png').then(loadImageFromBlob).catch(() => {
                            item.getType('image/jpeg').then(loadImageFromBlob);
                        });
                        return;
                    }
                }
                messageDiv.textContent = translate('noClipboardImage');
            }).catch(err => {
                console.error("Clipboard error:", err);
                messageDiv.textContent = translate('clipboardError');
            });
        });

        function loadImageFromBlob(blob) {
            const reader = new FileReader();
            reader.onload = event => loadImageFromDataUrl(event.target.result);
            reader.readAsDataURL(blob);
        }

        resizeSelector.addEventListener('change', () => {
            if (currentImage) loadImageFromDataUrl(currentImage.src);
        });

        saveButton.addEventListener('click', saveImage);
        copyToClipboardButton.addEventListener('click', copyToClipboard);
        undoButton.addEventListener('click', undoLastClick);
        colorSelector.addEventListener('change', e => {
            currentColor = e.target.value;
            saveUserSettings();
            redrawCanvas();
        });
        sizeSelector.addEventListener('change', e => {
            currentSize = e.target.value;
            saveUserSettings();
            redrawCanvas();
        });
        lineWidthSelector.addEventListener('change', e => {
            currentLineWidth = parseInt(e.target.value);
            saveUserSettings();
            redrawCanvas();
        });

        // 캔버스 이벤트
        // Refactored mousedown to allow dragging of existing objects in any mode,
        // and drawing new objects if no existing object is clicked.
        canvas.addEventListener('mousedown', e => {
            // 좌클릭(마우스 왼쪽 버튼)만 처리
            if (e.button !== 0) {
                console.log('좌클릭이 아닌 이벤트는 무시됩니다.');
                return;
            }
        
            const clickedObject = isMouseOverObject(e); // Check if an existing object is clicked
        
            if (clickedObject) {
                // If an object is clicked, initiate dragging
                isDragging = true;
                draggedObject = clickedObject;
                // Get mouse coordinates in canvas's internal pixel space
                const [mouseX, mouseY] = getMousePos(canvas, e);
        
                // Calculate offset based on object type (number/text use x,y; shapes use startX,startY)
                dragOffsetX = mouseX - (draggedObject.x !== undefined ? draggedObject.x : draggedObject.startX);
                dragOffsetY = mouseY - (draggedObject.y !== undefined ? draggedObject.y : draggedObject.startY);
                canvas.style.cursor = 'grabbing';
            } else {
                // If no object is clicked, proceed with drawing new elements based on mode
                if (currentMode === 'shape') {
                    startDrawing(e); // Start drawing a new shape
                } else if (currentMode === 'number') {
                    handleNumberClick(e); // Add a new number
                } else if (currentMode === 'text') {
                    handleTextClick(e); // Add new text
                } else if (currentMode === 'emoji') {
                    handleEmojiClick(e); // Add new emoji
                }
            }
        });
        
        canvas.addEventListener('mousemove', e => {
            if (isDragging) {
                // Get mouse coordinates in canvas's internal pixel space
                const [mouseX, mouseY] = getMousePos(canvas, e);

                // Update object position based on type
                if (draggedObject.type === 'number' || draggedObject.type === 'text' || draggedObject.type === 'emoji') {
                    draggedObject.x = mouseX - dragOffsetX;
                    draggedObject.y = mouseY - dragOffsetY;
                } else if (draggedObject.type === 'shape') {
                    // For shapes, update start and end points relative to the drag
                    const newStartX = mouseX - dragOffsetX;
                    const newStartY = mouseY - dragOffsetY;
                    const deltaX = newStartX - draggedObject.startX;
                    const deltaY = newStartY - draggedObject.startY;
                    draggedObject.startX = newStartX;
                    draggedObject.startY = newStartY;
                    draggedObject.endX += deltaX;
                    draggedObject.endY += deltaY;
                }
                redrawCanvas();
            } else {
                // Handle cursor change for hovering over objects
                const hoveredObject = isMouseOverObject(e);
                canvas.style.cursor = hoveredObject ? 'grab' : 'default';

                // Handle shape drawing preview (only if currently drawing a new shape)
                if (currentMode === 'shape' && isDrawing) {
                    debounce(draw, 16)(e);
                }
            }
        });
        canvas.addEventListener('mouseup', e => {
            if (isDragging) {
                isDragging = false;
                draggedObject = null;
                canvas.style.cursor = 'default';
                saveUserSettings(); // Save state after dragging
            } else if (currentMode === 'shape' && isDrawing) { // Only stop drawing if currently drawing a new shape
                stopDrawing(e); // Finalize drawing a new shape
            }
        });
        canvas.addEventListener('mouseout', e => {
            if (isDragging) {
                isDragging = false;
                draggedObject = null;
                canvas.style.cursor = 'default';
                saveUserSettings(); // Save state if drag ends by leaving canvas
            } else { // Only reset cursor if not dragging
                canvas.style.cursor = 'default';
            }
            if (currentMode === 'shape' && isDrawing) { // Only stop drawing if currently drawing a new shape
                stopDrawing(e); // Finalize drawing a new shape
            }
        });

        // 키보드 이벤트 처리
        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
                return;
            }

            if (currentMode === 'number') {
                // 키코드 기반으로 물리적 키 위치 확인 (언어 무관)
                if (e.key === 'H' || e.key === 'h' || e.key === 'ㅗ' || e.code === 'KeyH') {
                    isHorizontalLock = true;
                } else if (e.key === 'V' || e.key === 'v' || e.key === 'ㅍ' || e.code === 'KeyV') {
                    isVerticalLock = true;
                } else if (!isNaN(parseInt(e.key))) { // 숫자 키 입력 처리
                    pendingNumber = parseInt(e.key);
                    maxClickCount = pendingNumber - 1; // maxClickCount를 입력한 숫자 바로 이전으로 설정
                    isWaitingForClick = true;
                    messageDiv.textContent = translate('clickToStartFrom', { number: pendingNumber });
                }
            }
        });

        document.addEventListener('keyup', e => {
            if (currentMode === 'number') {
                // 키코드 기반으로 물리적 키 위치 확인 (언어 무관)
                if (e.key === 'H' || e.key === 'h' || e.key === 'ㅗ' || e.code === 'KeyH') {
                    isHorizontalLock = false;
                } else if (e.key === 'V' || e.key === 'v' || e.key === 'ㅍ' || e.code === 'KeyV') {
                    isVerticalLock = false;
                }
            }
        });

        // 주요 로직 함수
        function handleNumberClick(e) {
            let [x, y] = getMousePos(canvas, e);

            //console.log('화면상 마우스 좌표:', mouseX, mouseY);
            //console.log('캔버스 실제 좌표:', x, y);

            // 플래그에 따라 좌표 고정
            if (isHorizontalLock && initialY !== null) {
                y = initialY;
            }
            if (isVerticalLock && initialX !== null) {
                x = initialX;
            }

            // 숫자 계산 로직
            let displayNumber;
            if (e.shiftKey && clicks.length > 0) {
                // Shift 키가 눌린 상태: 마지막 숫자와 동일한 숫자 사용
                const lastNumberClick = clicks.filter(click => click.type === 'number').pop();
                displayNumber = lastNumberClick ? lastNumberClick.displayNumber : 1;
            } else if (isWaitingForClick && pendingNumber !== null) {
                displayNumber = pendingNumber;
                maxClickCount = pendingNumber; // maxClickCount를 업데이트하여 이후 숫자가 이어지도록 설정
                isWaitingForClick = false;
                pendingNumber = null;
            } else {
                displayNumber = maxClickCount + 1; // maxClickCount를 기준으로 숫자를 증가
            }

            clickCount++;
            // Shift 키가 눌린 상태가 아닐 때만 maxClickCount 업데이트
            if (!e.shiftKey) {
                maxClickCount = Math.max(maxClickCount, displayNumber);
            }
            clicks.push({ type: 'number', x, y, displayNumber, clickCount, color: currentColor, size: currentSize });

            redrawCanvas();
            messageDiv.textContent = translate('clickAdded', { number: displayNumber, x: Math.round(x), y: Math.round(y) });

            // 마지막 클릭 좌표 저장
            initialX = x;
            initialY = y;
        }

        function handleTextClick(e) {
            const rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            const text = prompt(translate('enterText'));
            if (text) {
                clicks.push({ type: 'text', x, y, text, color: currentColor, size: currentSize });
                redrawCanvas();
                messageDiv.textContent = translate('textAdded', { text, x: Math.round(x), y: Math.round(y) });
            }
        }

        function handleEmojiClick(e) {
            let [x, y] = getMousePos(canvas, e);
            const selectedEmoji = emojiSelector.value;
            if (selectedEmoji) {
                clicks.push({ type: 'emoji', x, y, emoji: selectedEmoji, size: currentSize });
                redrawCanvas();
                messageDiv.textContent = translate('emojiAdded', { emoji: selectedEmoji, x: Math.round(x), y: Math.round(y) });
            }
        }


        function undo() {
            if (clicks.length === 0) return;
            const removedClick = clicks.pop();
            undoStack.push(removedClick);
            redrawCanvas();
            maxClickCount = clicks.length > 0 ? Math.max(...clicks.map(click => click.displayNumber)) : 0;
        }

        function undoLastClick() {
            if (clicks.length === 0) {
                messageDiv.textContent = translate('noMoreUndo');
                return;
            }
            clicks.pop(); // Simply remove the last item

            // Recalculate maxClickCount and shapeCount based on remaining clicks
            maxClickCount = clicks.filter(c => c.type === 'number').reduce((max, c) => Math.max(max, c.displayNumber), 0);
            shapeCount = clicks.filter(c => c.type === 'shape').length;

            redrawCanvas();
            messageDiv.textContent = clicks.length > 0 // Update message with current counts
                ? translate('undoPerformedWithCount', { clickCount, shapeCount })
                : translate('allActionsUndone');
        }

        function resetDrawingState() {
            clicks = [];
            undoStack = [];
            clickCount = 0;
            maxClickCount = 0;
            initialX = null;
            initialY = null;
            redrawCanvas();
        }

        function redrawCanvas() {
            if (!currentImage) {
                drawDefaultCanvasBackground();
            } else {
                canvas.width = canvas.width;
                ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
            }
            clicks.forEach((click) => {
                if (click.type === 'number') drawNumber(click);
                else if (click.type === 'shape') drawShape(click.startX, click.startY, click.endX, click.endY, click.shape, click.color, click.fillType || 'none');
                else if (click.type === 'text') drawText(click);
                else if (click.type === 'emoji') drawEmoji(click);
            });
        }

        // 그리기 관련 함수
        function startDrawing(e) {
            if (currentMode !== 'shape') return;
            isDrawing = true;
            [startX, startY] = getMousePos(canvas, e);
            initialX = startX;
            initialY = initialY;
        }

        function draw(e) {
            if (!isDrawing || currentMode !== 'shape') return;
            const [mouseX, mouseY] = getAdjustedMousePos(canvas, e);
            redrawCanvas();
            drawShapePreview(startX, startY, mouseX, mouseY);
        }

        function stopDrawing(e) {
            if (!isDrawing || currentMode !== 'shape') return;
            isDrawing = false;
            const [mouseX, mouseY] = getAdjustedMousePos(canvas, e);
            shapeCount++;
            clicks.push({ type: 'shape', shape: currentShape, startX, startY, endX: mouseX, endY: mouseY, color: currentColor, fillType: currentFill, id: shapeCount });
            
            redrawCanvas();
            saveUserSettings();
        }

        function getAdjustedMousePos(canvas, e) {
            const [x, y] = getMousePos(canvas, e);
            return [x, y];
        }

        function getMousePos(canvas, e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return [
                (e.clientX - rect.left) * scaleX,
                (e.clientY - rect.top) * scaleY
            ];
        }

        function drawNumber(click) {
            const fontSize = parseInt(click.size) || 20;
            const circleSize = fontSize;
            ctx.beginPath();
            ctx.arc(click.x, click.y, circleSize, 0, 2 * Math.PI);
            ctx.fillStyle = click.color;
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(click.displayNumber, click.x, click.y);
        }

        function drawText(click) {
            ctx.fillStyle = click.color;
            const fontSize = parseInt(click.size) || 20;
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(click.text, click.x, click.y);
        }

        function drawEmoji(click) {
            const fontSize = parseInt(click.size) || 20;
            // 숫자 모드 원의 지름에 맞게 이모지 크기 조정 (반지름 × 2)
            const emojiSize = fontSize * 2;
            ctx.font = `${emojiSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(click.emoji, click.x, click.y);
        }

        function drawShape(x1, y1, x2, y2, shape, color, fillType = 'none') {
            ctx.strokeStyle = color || currentColor;
            ctx.lineWidth = currentLineWidth;
            
            if (shape === 'arrow') {
                drawArrow(ctx, x1, y1, x2, y2, color);
            } else if (shape === 'rectangle') {
                // 드래그 방향에 관계없이 올바른 좌표 계산
                const rectX = Math.min(x1, x2);
                const rectY = Math.min(y1, y2);
                const rectWidth = Math.abs(x2 - x1);
                const rectHeight = Math.abs(y2 - y1);
                drawRectangleWithFill(rectX, rectY, rectWidth, rectHeight, color, fillType);
            } else if (shape === 'circle') {
                // 시작점(x1, y1)에서 끝점(x2, y2)까지가 지름이 되도록 원을 그림
                const centerX = (x1 + x2) / 2; // 중심점 X는 시작점과 끝점의 중점
                const centerY = (y1 + y2) / 2; // 중심점 Y는 시작점과 끝점의 중점
                const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2; // 반지름은 지름의 절반
                drawCircleWithFill(centerX, centerY, radius, color, fillType);
            }
        }

        function drawRectangleWithFill(x, y, width, height, color, fillType) {
            ctx.strokeStyle = color || currentColor;
            ctx.fillStyle = color || currentColor;
            
            if (fillType === 'solid') {
                ctx.fillRect(x, y, width, height);
                ctx.strokeRect(x, y, width, height);
            } else if (fillType === 'blur') {
                // 블러 효과: 반투명 채우기
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.filter = 'blur(3px)';
                ctx.fillRect(x, y, width, height);
                ctx.restore();
                ctx.strokeRect(x, y, width, height);
            } else if (fillType === 'mosaic') {
                // 모자이크 효과: 작은 사각형들로 채우기
                drawMosaicRect(x, y, width, height, color);
                ctx.strokeRect(x, y, width, height);
            } else {
                // 테두리만
                ctx.strokeRect(x, y, width, height);
            }
        }

        function drawCircleWithFill(centerX, centerY, radius, color, fillType) {
            ctx.strokeStyle = color || currentColor;
            ctx.fillStyle = color || currentColor;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            
            if (fillType === 'solid') {
                ctx.fill();
                ctx.stroke();
            } else if (fillType === 'blur') {
                // 블러 효과: 반투명 채우기
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.filter = 'blur(3px)';
                ctx.fill();
                ctx.restore();
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (fillType === 'mosaic') {
                // 모자이크 효과: 원 영역에 작은 사각형들로 채우기
                drawMosaicCircle(centerX, centerY, radius, color);
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else {
                // 테두리만
                ctx.stroke();
            }
        }

        function drawMosaicRect(x, y, width, height, color) {
            const mosaicSize = 15; // 모자이크 블록 크기
            
            try {
                // 현재 영역의 이미지 데이터 가져오기 (경계 확인)
                const safeX = Math.max(0, Math.floor(x));
                const safeY = Math.max(0, Math.floor(y));
                const safeWidth = Math.min(Math.abs(width), canvas.width - safeX);
                const safeHeight = Math.min(Math.abs(height), canvas.height - safeY);
                
                if (safeWidth <= 0 || safeHeight <= 0) return;
                
                const imageData = ctx.getImageData(safeX, safeY, safeWidth, safeHeight);
                const pixels = imageData.data;
                
                // 모자이크 효과 적용
                for (let blockY = 0; blockY < safeHeight; blockY += mosaicSize) {
                    for (let blockX = 0; blockX < safeWidth; blockX += mosaicSize) {
                        // 블록의 중앙 픽셀 색상 가져오기
                        const centerX = Math.min(blockX + Math.floor(mosaicSize / 2), safeWidth - 1);
                        const centerY = Math.min(blockY + Math.floor(mosaicSize / 2), safeHeight - 1);
                        const centerIndex = (centerY * safeWidth + centerX) * 4;
                        
                        const r = pixels[centerIndex] !== undefined ? pixels[centerIndex] : 245;
                        const g = pixels[centerIndex + 1] !== undefined ? pixels[centerIndex + 1] : 247;
                        const b = pixels[centerIndex + 2] !== undefined ? pixels[centerIndex + 2] : 250;
                        
                        // 블록 전체를 중앙 픽셀 색상으로 채우기
                        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                        ctx.fillRect(
                            safeX + blockX, 
                            safeY + blockY, 
                            Math.min(mosaicSize, safeWidth - blockX), 
                            Math.min(mosaicSize, safeHeight - blockY)
                        );
                    }
                }
            } catch (error) {
                console.error('모자이크 처리 오류:', error);
                // 오류 시 반투명 채우기로 대체
                ctx.fillStyle = color || currentColor;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(x, y, width, height);
                ctx.globalAlpha = 1.0;
            }
        }

        function drawMosaicCircle(centerX, centerY, radius, color) {
            const mosaicSize = 15; // 모자이크 블록 크기
            
            try {
                // 원 영역의 이미지 데이터 처리
                const startX = Math.max(0, Math.floor(centerX - radius));
                const startY = Math.max(0, Math.floor(centerY - radius));
                const endX = Math.min(canvas.width, Math.ceil(centerX + radius));
                const endY = Math.min(canvas.height, Math.ceil(centerY + radius));
                
                if (endX <= startX || endY <= startY) return;
                
                const imageData = ctx.getImageData(startX, startY, endX - startX, endY - startY);
                const pixels = imageData.data;
                const imgWidth = endX - startX;
                
                // 모자이크 효과 적용 (원 영역만)
                for (let blockY = 0; blockY < endY - startY; blockY += mosaicSize) {
                    for (let blockX = 0; blockX < endX - startX; blockX += mosaicSize) {
                        const actualX = startX + blockX + Math.floor(mosaicSize / 2);
                        const actualY = startY + blockY + Math.floor(mosaicSize / 2);
                        
                        // 원 내부인지 확인 (블록 중심점 기준)
                        const distance = Math.sqrt((actualX - centerX) ** 2 + (actualY - centerY) ** 2);
                        if (distance <= radius) {
                            // 블록의 중앙 픽셀 색상 가져오기
                            const centerBlockX = Math.min(blockX + Math.floor(mosaicSize / 2), imgWidth - 1);
                            const centerBlockY = Math.min(blockY + Math.floor(mosaicSize / 2), endY - startY - 1);
                            const centerIndex = (centerBlockY * imgWidth + centerBlockX) * 4;
                            
                            const r = pixels[centerIndex] !== undefined ? pixels[centerIndex] : 128;
                            const g = pixels[centerIndex + 1] !== undefined ? pixels[centerIndex + 1] : 128;
                            const b = pixels[centerIndex + 2] !== undefined ? pixels[centerIndex + 2] : 128;
                            
                            // 블록 전체를 중앙 픽셀 색상으로 채우기 (원 영역만)
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                            
                            const blockEndX = Math.min(blockX + mosaicSize, endX - startX);
                            const blockEndY = Math.min(blockY + mosaicSize, endY - startY);
                            
                            for (let py = blockY; py < blockEndY; py++) {
                                for (let px = blockX; px < blockEndX; px++) {
                                    const pixelX = startX + px;
                                    const pixelY = startY + py;
                                    const pixelDistance = Math.sqrt((pixelX - centerX) ** 2 + (pixelY - centerY) ** 2);
                                    if (pixelDistance <= radius) {
                                        ctx.fillRect(pixelX, pixelY, 1, 1);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('원 모자이크 처리 오류:', error);
                // 오류 시 반투명 채우기로 대체
                ctx.fillStyle = color || currentColor;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        function isMouseOverObject(e) {
            // Get mouse coordinates in canvas's internal pixel space
            const [mouseX, mouseY] = getMousePos(canvas, e);

            for (let i = clicks.length - 1; i >= 0; i--) {
                const click = clicks[i];
                if (click.type === 'number') {
                    const circleSize = parseInt(click.size) || 20;
                    const distance = Math.sqrt(Math.pow(mouseX - click.x, 2) + Math.pow(mouseY - click.y, 2));
                    if (distance <= circleSize) {
                        return click;
                    }
                } else if (click.type === 'shape') {
                    // Add a small tolerance for easier selection of shapes
                    const tolerance = 5; // pixels

                    if (click.shape === 'rectangle') {
                        const tolerance = 5; // pixels
                        const minX = Math.min(click.startX, click.endX);
                        const maxX = Math.max(click.startX, click.endX);
                        const minY = Math.min(click.startY, click.endY);
                        const maxY = Math.max(click.startY, click.endY);
                        
                        // Check if the mouse is near the border of the rectangle, not inside it.
                        const isWithinOuterBox = mouseX >= minX - tolerance && mouseX <= maxX + tolerance && mouseY >= minY - tolerance && mouseY <= maxY + tolerance;
                        const isWithinInnerBox = mouseX >= minX + tolerance && mouseX < maxX - tolerance && mouseY >= minY + tolerance && mouseY < maxY - tolerance;

                        if (isWithinOuterBox && !isWithinInnerBox) {
                            return click;
                        }
                    } else if (click.shape === 'circle') {
                        // 새로운 원 그리기 방식에 맞게 중심점과 반지름 계산
                        const centerX = (click.startX + click.endX) / 2; // 중심점은 시작점과 끝점의 중점
                        const centerY = (click.startY + click.endY) / 2;
                        const radius = Math.sqrt(Math.pow(click.endX - click.startX, 2) + Math.pow(click.endY - click.startY, 2)) / 2; // 반지름은 지름의 절반
                        const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
                        if (distance <= radius + tolerance && distance >= radius - tolerance) { // Check if near the circle's circumference
                            return click;
                        }
                    } else if (click.shape === 'arrow') {
                        // For arrows, check if mouse is near the line segment (simplified bounding box with padding)
                        const minX = Math.min(click.startX, click.endX) - tolerance;
                        const maxX = Math.max(click.startX, click.endX) + tolerance;
                        const minY = Math.min(click.startY, click.endY) - tolerance;
                        const maxY = Math.max(click.startY, click.endY) + tolerance;
                        if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
                            return click;
                        }
                    }
                } else if (click.type === 'text') {
                    // 텍스트의 경우, 간단한 바운딩 박스 체크 (폰트 크기 고려)
                    const fontSize = parseInt(click.size) || 20;
                    // To get accurate text width, we need to set font and then use ctx.measureText.
                    // For simplicity, using a rough estimate or relying on the stored width if available.
                    // Assuming text is drawn from top-left (as per drawText function)
                    // A more accurate hit-test would involve measuring text width dynamically.
                    // For now, let's use a reasonable estimate for width or rely on the origin.
                    // The current implementation of drawText uses textAlign = 'left', textBaseline = 'top'.
                    // Let's estimate width based on font size and length, or use a fixed small bounding box.
                    // For now, keep the existing rough estimate.
                    const textWidth = click.text.length * (fontSize * 0.6); // Rough estimate
                    const textHeight = fontSize;

                    if (mouseX >= click.x && mouseX <= click.x + textWidth && mouseY >= click.y && mouseY <= click.y + textHeight) {
                        return click;
                    }
                } else if (click.type === 'emoji') {
                    // 이모지의 경우, 중앙 정렬된 이모지 주변 영역 체크
                    const fontSize = parseInt(click.size) || 20;
                    // 실제 이모지 크기는 fontSize * 2 (숫자 모드 원의 지름에 맞춤)
                    const emojiSize = fontSize * 2;
                    const halfSize = emojiSize / 2;

                    if (mouseX >= click.x - halfSize && mouseX <= click.x + halfSize && 
                        mouseY >= click.y - halfSize && mouseY <= click.y + halfSize) {
                        return click;
                    }
                }
            }
            return null; // No object found at mouse position
        }

        function drawArrow(ctx, x1, y1, x2, y2, color) {
            const headLength = 10;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const angle = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = currentLineWidth;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
            ctx.lineTo(x2, y2);
            ctx.fillStyle = color;
            ctx.fill();
        }

        function drawShapePreview(x1, y1, x2, y2) {
            if (currentShape === 'arrow') drawArrow(ctx, x1, y1, x2, y2, currentColor);
            else drawShape(x1, y1, x2, y2, currentShape, currentColor, currentFill);
        }

        // 저장 함수
        function saveImage() {
            if (!currentImage) {
                messageDiv.textContent = translate('noImageToSave');
                return;
            }
            try {
                let fileName = prompt(translate('enterFileName'), "interactive_image") || "interactive_image";
                fileName += ".png";
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    downloadImage(url, fileName);
                    messageDiv.textContent = translate('imageSavedAs', { fileName });
                }, 'image/png');
            } catch (err) {
                console.error("Save error:", err);
                messageDiv.textContent = translate('saveImageError');
            }
        }

        // 클립보드에 복사 함수
        async function copyToClipboard() {
            if (!currentImage) {
                messageDiv.textContent = translate('noImageToSave') || '저장할 이미지가 없습니다.';
                return;
            }
            
            try {
                const dataUrl = canvas.toDataURL('image/png');
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': blob
                    })
                ]);
                
                messageDiv.textContent = '클립보드에 복사되었습니다!';
                setTimeout(() => messageDiv.textContent = '', 3000);
            } catch (error) {
                console.error('클립보드 복사 실패:', error);
                messageDiv.textContent = '클립보드 복사에 실패했습니다.';
                setTimeout(() => messageDiv.textContent = '', 3000);
            }
        }

        function downloadImage(url, fileName) {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        // 다국어 지원
        const languages = {
            'ko': {
                'clipboard': '클립보드에서 가져오기',
                'save': '저장하기',
                'undo': '뒤로가기',
                'red': '빨간색',
                'orange': '주황색',
                'green': '녹색',
                'blue': '파랑색',
                'small': '작게',
                'medium': '보통',
                'large': '크게',
                'numberMode': '숫자 입력 모드',
                'shapeMode': '도형 모드',
                'textMode': '텍스트 모드',
                'emojiMode': '이모지 모드', // New translation
                'emojiAdded': '이모지 "{emoji}" 추가됨: ({x}, {y})', // New translation
                'rectangle': '사각형',
                'circle': '원',
                'arrow': '화살표',
                'thin': '얇음',
                'normal': '보통',
                'thick': '두꺼움',
                'defaultImageLoaded': '기본 이미지가 로드되었습니다. 크기: {width}x{height}',
                'imageLoaded': '이미지가 로드되었습니다. 크기: {width}x{height}',
                'noImageLoaded': '클릭하기 전에 먼저 이미지를 로드해주세요.',
                'clickAdded': '클릭 {number}: ({x}, {y})',
                'textAdded': '텍스트 "{text}" 추가됨: ({x}, {y})',
                'noClipboardImage': '클립보드에서 이미지를 찾을 수 없습니다.',
                'clipboardError': '클립보드 접근에 실패했습니다. 브라우저 설정을 확인해주세요.',
                'noImageToSave': '저장할 이미지가 없습니다. 먼저 이미지를 로드해주세요.',
                'saveImageError': '이미지 저장 중 오류가 발생했습니다.',
                'enterFileName': '저장할 파일명을 입력하세요 (확장자 제외):',
                'enterText': '추가할 텍스트를 입력하세요:',
                'imageSavedAs': '이미지가 "{fileName}" 이름으로 성공적으로 저장되었습니다.',
                'defaultImageLoadFailed': '기본 이미지 로드에 실패했습니다.',
                'shortcutGuide': '단축키: Ctrl+Z (Mac: Command+Z) - 마지막 클릭 취소',
                'shortcutGuide2': '숫자 모드 특수키: H(ㅗ) + 클릭 - 마지막 클릭과 동일한 Y 좌표로 고정',
                'shortcutGuide3': '숫자 모드 특수키: V(ㅍ) + 클릭 - 마지막 클릭과 동일한 X 좌표로 고정',
                'shortcutGuide4': '숫자 모드 특수키: Shift + 클릭 - 마지막 클릭한 숫자와 동일한 숫자가 기록됨',
                'clickToStartFrom': '{number}부터 시작하려면 캔버스을 클릭하세요.',
                'undoPerformedWithCount': '마지막 동작 취소됨. 현재 숫자 클릭 수: {clickCount}, 도형 수: {shapeCount}',
                'allActionsUndone': '모든 동작이 취소되었습니다.',
                'noMoreUndo': '취소할 동작이 없습니다.',
                'extensionImageLoading': '캡처된 이미지를 로딩 중...',
                'pleaseWait': '잠시만 기다려주세요',
                'uploadImagePrompt': 'AnnotateShot 서비스 이용 방법\n1. 번호, 도형, 텍스트를 입력해야하는 이미지를 불러오세요. 클립보드 이미지도 가능합니다.\n2. 아무곳이나 클릭해보세요.\n3. 저장이 필요하면 저장하기 버튼을 눌러서 로컬 PC로 저장할 수 있습니다. 혹은 이미지 우측 클릭 후 이미지 복사를 하셔도 괜찮습니다.'
            }
            // 'ja'와 'en' 생략
        };

        function getLanguage() {
            const lang = navigator.language.split('-')[0];
            return ['ko', 'ja', 'en'].includes(lang) ? lang : 'en';
        }

        function applyLanguage() {
            const lang = getLanguage();
            document.querySelectorAll('[data-lang-key]').forEach(element => {
                const key = element.getAttribute('data-lang-key');
                if (languages[lang] && languages[lang][key]) {
                    element.textContent = element.tagName === 'OPTION' ? languages[lang][key] : languages[lang][key];
                }
            });
        }

        function translate(key, params = {}) {
            const lang = getLanguage();
            let text = languages[lang][key] || languages['en'][key] || key;
            Object.keys(params).forEach(param => text = text.replace(`{${param}}`, params[param]));
            return text;
        }

        // 설정 관리
        function saveUserSettings() {
            const settings = {
                mode: currentMode,
                color: colorSelector.value,
                size: sizeSelector.value,
                shape: shapeSelector.value,
                fillType: fillSelector.value,
                lineWidth: lineWidthSelector.value,
                clicks, // clicks array already contains emoji objects
                clickCount,
                shapeCount
            };
            localStorage.setItem('userSettings', JSON.stringify(settings));
        }

        function loadUserSettings() {
            const savedSettings = localStorage.getItem('userSettings');
            if (!savedSettings) return;
            const settings = JSON.parse(savedSettings);
            currentMode = settings.mode;
            modeSelector.value = currentMode;
            colorSelector.value = settings.color;
            sizeSelector.value = settings.size || "20";
            shapeSelector.value = settings.shape;
            fillSelector.value = settings.fillType || 'none';
            lineWidthSelector.value = settings.lineWidth || "2";
            currentColor = settings.color;
            currentSize = settings.size || "20";
            currentShape = settings.shape;
            currentFill = settings.fillType || 'none';
            currentLineWidth = parseInt(settings.lineWidth) || 2;
            clicks = settings.clicks || [];
            clickCount = settings.clickCount || 0;
            shapeCount = settings.shapeCount || 0;
            updateUIForMode(currentMode);
            redrawCanvas();
        }

        function loadUserSettingsWithoutHistory() {
            const savedSettings = localStorage.getItem('userSettings');
            if (!savedSettings) return;
            const settings = JSON.parse(savedSettings);
            currentMode = settings.mode;
            modeSelector.value = currentMode;
            colorSelector.value = settings.color;
            sizeSelector.value = settings.size || "20";
            shapeSelector.value = settings.shape;
            fillSelector.value = settings.fillType || 'none';
            lineWidthSelector.value = settings.lineWidth || "2";
            currentColor = settings.color;
            currentSize = settings.size || "20";
            currentShape = settings.shape;
            currentFill = settings.fillType || 'none';
            currentLineWidth = parseInt(settings.lineWidth) || 2;
            // 이전 작업 내용은 로드하지 않음 - 깨끗한 상태 유지
            clicks = [];
            clickCount = 0;
            shapeCount = 0;
            updateUIForMode(currentMode);
            // redrawCanvas 호출하지 않음 - 이미 깨끗한 캔버스가 표시되어 있음
        }

        function updateUIForMode(mode) {
            currentMode = mode;
            // HTML의 updateControlsVisibility 함수를 호출하여 모드별 컨트롤 관리
            if (typeof updateControlsVisibility === 'function') {
                updateControlsVisibility();
            } else {
                // 기존 로직 유지 (fallback)
                const shapeSection = document.getElementById('shapeSection');
                const emojiSection = document.getElementById('emojiSection');
                const fillSection = document.getElementById('fillSection');
                const lineWidthSection = document.getElementById('lineWidthSection');
                const sizeSection = document.getElementById('sizeSection');
                
                if (shapeSection) shapeSection.style.display = 'none';
                if (emojiSection) emojiSection.style.display = 'none';
                if (fillSection) fillSection.style.display = 'none';
                if (lineWidthSection) lineWidthSection.style.display = 'none';
                if (sizeSection && mode === 'shape') sizeSection.style.display = 'none';

                if (mode === 'shape') {
                    if (shapeSection) shapeSection.style.display = 'block';
                    if (lineWidthSection) lineWidthSection.style.display = 'block';
                    updateFillSelectorVisibility();
                } else if (mode === 'emoji') {
                    if (emojiSection) emojiSection.style.display = 'block';
                    if (sizeSection) sizeSection.style.display = 'block';
                }
            }
        }

        function updateFillSelectorVisibility() {
            // 원과 사각형일 때만 채우기 옵션 표시 (화살표는 제외)
            const fillSection = document.getElementById('fillSection');
            if (fillSection) {
                if (currentShape === 'rectangle' || currentShape === 'circle') {
                    fillSection.style.display = 'block';
                } else {
                    fillSection.style.display = 'none';
                }
            }
        }

        modeSelector.addEventListener('change', () => {
            updateUIForMode(modeSelector.value);
            saveUserSettings();
        });

        shapeSelector.addEventListener('change', () => {
            currentShape = shapeSelector.value;
            updateFillSelectorVisibility();
            saveUserSettings();
        });

        fillSelector.addEventListener('change', () => {
            currentFill = fillSelector.value;
            saveUserSettings();
        });

        window.addEventListener('DOMContentLoaded', () => {
            applyLanguage();
            // DOM 로드 즉시 깨끗한 캔버스 표시 (이전 작업 내용 표시 방지)
            drawDefaultCanvasBackground();
        });