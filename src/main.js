// 전역 상수 및 변수
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 900;
        const DEFAULT_IMAGE_URL = './src/default-image.jpg';
        const imageLoader = document.getElementById('imageLoader');
        const clipboardButton = document.getElementById('clipboardButton');
        const saveButton = document.getElementById('saveButton');
        const undoButton = document.getElementById('undoButton');
        const colorSelector = document.getElementById('colorSelector');
        const sizeSelector = document.getElementById('sizeSelector');
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        const messageDiv = document.getElementById('message');
        const modeSelector = document.getElementById('modeSelector');
        const shapeSelector = document.getElementById('shapeSelector');
        const lineWidthSelector = document.getElementById('lineWidthSelector');
        const resizeSelector = document.getElementById('resizeSelector');

        let currentImage = null;
        let currentColor = "#FF0000";
        let currentSize = "medium";
        let currentMode = 'number';
        let currentShape = 'rectangle';
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

        function applyImageToCanvas() {
            const { width, height } = calculateImageDimensions(currentImage.width, currentImage.height);
            applyCanvasDimensions(width, height);
            resetDrawingState();
        }

        function calculateImageDimensions(width, height) {
            switch (resizeSelector.value) {
                case "original": return { width, height };
                case "300": return { width: 300, height: Math.floor(height * (300 / width)) };
                case "600": return { width: 600, height: Math.floor(height * (600 / width)) };
                case "900": return { width: 900, height: Math.floor(height * (900 / width)) };
                case "scale30": return { width: Math.floor(width * 0.3), height: Math.floor(height * 0.3) };
                case "scale50": return { width: Math.floor(width * 0.5), height: Math.floor(height * 0.5) };
                case "scale70": return { width: Math.floor(width * 0.7), height: Math.floor(height * 0.7) };
                default:
                    const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                    return { width: Math.floor(width * scale), height: Math.floor(height * scale) };
            }
        }

        function applyCanvasDimensions(width, height) {
            canvas.width = width;
            canvas.height = height;
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

        // 초기화 및 이벤트 설정
        window.onload = () => {
            loadImageFromUrl(DEFAULT_IMAGE_URL);
            loadUserSettings();
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
            const clickedObject = isMouseOverObject(e); // Check if an existing object is clicked

            if (clickedObject) {
                // If an object is clicked, initiate dragging
                isDragging = true;
                draggedObject = clickedObject;
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

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
                }
            }
        });
        canvas.addEventListener('mousemove', e => {
            if (isDragging) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Update object position based on type
                if (draggedObject.type === 'number' || draggedObject.type === 'text') {
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
                if (e.key === 'H' || e.key === 'h') {
                    isHorizontalLock = true;
                } else if (e.key === 'V' || e.key === 'v') {
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
                if (e.key === 'H' || e.key === 'h') {
                    isHorizontalLock = false;
                } else if (e.key === 'V' || e.key === 'v') {
                    isVerticalLock = false;
                }
            }
        });

        // 주요 로직 함수
        function handleNumberClick(e) {
            const rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            // 플래그에 따라 좌표 고정
            if (isHorizontalLock && initialY !== null) {
                y = initialY;
            }
            if (isVerticalLock && initialX !== null) {
                x = initialX;
            }

            // 숫자 계산 로직
            let displayNumber;
            if (isWaitingForClick && pendingNumber !== null) {
                displayNumber = pendingNumber;
                maxClickCount = pendingNumber; // maxClickCount를 업데이트하여 이후 숫자가 이어지도록 설정
                isWaitingForClick = false;
                pendingNumber = null;
            } else {
                displayNumber = maxClickCount + 1; // maxClickCount를 기준으로 숫자를 증가
            }

            clickCount++;
            maxClickCount = Math.max(maxClickCount, displayNumber); // maxClickCount를 최신 상태로 유지
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
            if (!currentImage) return;
            canvas.width = canvas.width;
            ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
            clicks.forEach((click, index) => {
                if (click.type === 'number') drawNumber(click, index);
                else if (click.type === 'shape') drawShape(click.startX, click.startY, click.endX, click.endY, click.shape, click.color);
                else if (click.type === 'text') drawText(click);
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
            clicks.push({ type: 'shape', shape: currentShape, startX, startY, endX: mouseX, endY: mouseY, color: currentColor, id: shapeCount });
            
            redrawCanvas();
            saveUserSettings();
        }

        function getAdjustedMousePos(canvas, e) {
            const [x, y] = getMousePos(canvas, e);
            return [x, y];
        }

        function getMousePos(canvas, e) {
            const rect = canvas.getBoundingClientRect();
            return [e.clientX - rect.left, e.clientY - rect.top];
        }

        function drawNumber(click, index) {
            let circleSize = click.size === 'small' ? 10 : click.size === 'large' ? 20 : 15;
            ctx.beginPath();
            ctx.arc(click.x, click.y, circleSize, 0, 2 * Math.PI);
            ctx.fillStyle = click.color;
            ctx.fill();
            ctx.fillStyle = 'white';
            const fontSize = click.size === 'small' ? 10 : click.size === 'large' ? 20 : 15;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(click.displayNumber, click.x, click.y);
        }

        function drawText(click) {
            ctx.fillStyle = click.color;
            ctx.font = `${click.size === 'small' ? 12 : click.size === 'large' ? 24 : 16}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(click.text, click.x, click.y);
        }

        function drawShape(x1, y1, x2, y2, shape, color) {
            ctx.strokeStyle = color || currentColor;
            ctx.lineWidth = currentLineWidth;
            if (shape === 'arrow') drawArrow(ctx, x1, y1, x2, y2, color);
            else if (shape === 'rectangle') ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            else if (shape === 'circle') {
                const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                ctx.beginPath();
                ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }

        function isMouseOverObject(e) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            for (let i = clicks.length - 1; i >= 0; i--) {
                const click = clicks[i];
                if (click.type === 'number') {
                    const circleSize = (click.size === 'small' ? 10 : click.size === 'large' ? 20 : 15);
                    const distance = Math.sqrt(Math.pow(mouseX - click.x, 2) + Math.pow(mouseY - click.y, 2));
                    if (distance <= circleSize) {
                        return click;
                    }
                } else if (click.type === 'shape') {
                    // Add a small tolerance for easier selection of shapes
                    const tolerance = 5; // pixels

                    if (click.shape === 'rectangle') {
                        const minX = Math.min(click.startX, click.endX);
                        const maxX = Math.max(click.startX, click.endX);
                        const minY = Math.min(click.startY, click.endY);
                        const maxY = Math.max(click.startY, click.endY);
                        if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
                            return click;
                        }
                    } else if (click.shape === 'circle') {
                        const centerX = click.startX; // Circle is drawn from center to edge
                        const centerY = click.startY;
                        const radius = Math.sqrt(Math.pow(click.endX - click.startX, 2) + Math.pow(click.endY - click.startY, 2));
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
                    const fontSize = click.size === 'small' ? 12 : click.size === 'large' ? 24 : 16;
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
            else drawShape(x1, y1, x2, y2, currentShape, currentColor);
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
                'shortcutGuide2': '숫자 모드 특수키: H + 클릭 - 마지막 클릭과 동일한 Y 좌표로 고정',
                'shortcutGuide3': '숫자 모드 특수키: V + 클릭 - 마지막 클릭과 동일한 X 좌표로 고정',
                'shortcutGuide4': '숫자 모드 특수키: Shift + 클릭 - 마지막 클릭한 숫자와 동일한 숫자가 기록됨',
                'clickToStartFrom': '{number}부터 시작하려면 캔버스을 클릭하세요.',
                'undoPerformedWithCount': '마지막 동작 취소됨. 현재 숫자 클릭 수: {clickCount}, 도형 수: {shapeCount}',
                'allActionsUndone': '모든 동작이 취소되었습니다.',
                'noMoreUndo': '취소할 동작이 없습니다.'
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
            sizeSelector.value = settings.size;
            shapeSelector.value = settings.shape;
            lineWidthSelector.value = settings.lineWidth || "2"; // 기본값 보장
            currentColor = settings.color;
            currentSize = settings.size;
            currentShape = settings.shape;
            currentLineWidth = parseInt(settings.lineWidth) || 2;
            clicks = settings.clicks || [];
            clickCount = settings.clickCount || 0;
            shapeCount = settings.shapeCount || 0;
            updateUIForMode(currentMode);
            redrawCanvas();
        }

        function updateUIForMode(mode) {
            currentMode = mode;
            // Hide all mode-specific selectors first
            shapeSelector.style.display = 'none';
            lineWidthSelector.style.display = 'none';

            if (mode === 'shape') {
                shapeSelector.style.display = 'inline-block';
                lineWidthSelector.style.display = 'inline-block';
            }
        }

        modeSelector.addEventListener('change', () => {
            updateUIForMode(modeSelector.value);
            saveUserSettings();
        });

        shapeSelector.addEventListener('change', () => {
            currentShape = shapeSelector.value;
            saveUserSettings();
        });

        window.addEventListener('DOMContentLoaded', () => {
            loadUserSettings();
            applyLanguage();
        });