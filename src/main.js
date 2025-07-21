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
        let layers = []; // New layer system: [{ type, data, visible, id }, ...]
        let layerIdCounter = 0;
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

        // 크롭 관련 변수
        let isCropping = false;
        let cropStartX = 0;
        let cropStartY = 0;
        let cropEndX = 0;
        let cropEndY = 0;
        let currentCropStyle = 'basic';
        let cropPreviewMode = false;

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
            
            // Create or update background image layer
            createBackgroundImageLayer();
            
            resetDrawingState();
            messageDiv.textContent = translate('imageLoaded', { width, height });
        }

        // Create background image layer
        function createBackgroundImageLayer() {
            createBackgroundImageLayerWithSize(canvas.width, canvas.height);
        }

        // Create background image layer with specific size (for undo functionality)
        function createBackgroundImageLayerWithSize(width, height) {
            // Remove existing background layer if any
            layers = layers.filter(layer => layer.type !== 'background');
            
            // Add new background layer
            const backgroundLayer = {
                id: layerIdCounter++,
                type: 'background',
                data: {
                    image: currentImage,
                    width: width,
                    height: height
                },
                visible: true,
                name: 'Background Image'
            };
            
            // Background layer should be at the bottom
            layers.unshift(backgroundLayer);
            
            // Update global reference
            window.layers = layers;
            
            // Debug log
            console.log('Created background layer with size:', width, height);
            console.log('Total layers after background:', layers.length);
            
            // Update layer list in UI
            if (typeof window.updateLayerList === 'function') {
                window.updateLayerList();
            }
        }

        // Add annotation to layer system
        function addAnnotationLayer(type, data) {
            const layer = {
                id: layerIdCounter++,
                type: type,
                data: data,
                visible: true,
                name: getLayerName(type, layers.filter(l => l.type === type).length + 1)
            };
            
            // Add to end (top of stack)
            layers.push(layer);
            
            // Update global reference
            window.layers = layers;
            
            // Debug log
            console.log('Added layer:', layer);
            console.log('Total layers:', layers.length);
        }

        // Get layer name based on type
        function getLayerName(type, index) {
            const typeNames = {
                'background': 'Background Image',
                'number': '숫자',
                'shape': '도형',
                'text': '텍스트',
                'emoji': '이모지'
            };
            return type === 'background' ? typeNames[type] : `${typeNames[type]} ${index}`;
        }

        // Rebuild layer system from clicks array (for undo functionality)
        function rebuildLayersFromClicks() {
            // Remove all annotation layers, keep only background
            layers = layers.filter(layer => layer.type === 'background');
            
            // Rebuild layers from clicks array
            clicks.forEach(click => {
                const layer = {
                    id: layerIdCounter++,
                    type: click.type,
                    data: click,
                    visible: true,
                    name: getLayerName(click.type, layers.filter(l => l.type === click.type).length + 1)
                };
                layers.push(layer);
            });
            
            // Update global reference
            window.layers = layers;
        }

        // Function to trigger canvas resize (exposed globally for sidebar interactions)
        function triggerCanvasResize() {
            if (currentImage && resizeSelector.value === 'default') {
                applyImageToCanvas();
            }
        }
        
        // Clear all annotations function (exposed globally for UI)
        function clearAllAnnotations() {
            console.log('Clearing all annotations from main.js');
            console.log('Clicks before:', clicks.length);
            console.log('Layers before:', layers.length);
            
            // Clear clicks array completely
            clicks.splice(0);
            clickCount = 0;
            maxClickCount = 0;
            
            // Clear layers except background
            layers = layers.filter(layer => layer.type === 'background');
            
            // Update global references
            window.clicks = clicks;
            window.layers = layers;
            window.clickCount = clickCount;
            
            console.log('Clicks after:', clicks.length);
            console.log('Layers after:', layers.length);
            
            redrawCanvas();
            
            // Update layer list
            if (typeof window.updateLayerList === 'function') {
                window.updateLayerList();
            }
            
            saveUserSettings();
        }

        // Expose functions and data globally
        window.triggerCanvasResize = triggerCanvasResize;
        window.layers = layers;
        window.clicks = clicks;
        window.redrawCanvas = redrawCanvas;
        window.clearAllAnnotations = clearAllAnnotations;

        // Helper functions to calculate sidebar widths
        function getSidebarWidth() {
            const sidebar = document.getElementById('sidebar');
            if (!sidebar) return 0;
            
            // Mobile: sidebar is hidden by default
            if (window.innerWidth <= 768) return 0;
            
            // Desktop: check if collapsed
            if (sidebar.classList.contains('collapsed')) return 60;
            return 280;
        }

        function getLayerSidebarWidth() {
            const layerSidebar = document.getElementById('layerSidebar');
            if (!layerSidebar) return 0;
            
            // Mobile: layer sidebar is hidden by default
            if (window.innerWidth <= 768) return 0;
            
            // Desktop: check if collapsed
            if (layerSidebar.classList.contains('collapsed')) return 50;
            return 280;
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
                    const sidebarWidth = getSidebarWidth();
                    const layerSidebarWidth = getLayerSidebarWidth();
                    const availableWidth = window.innerWidth - sidebarWidth - layerSidebarWidth - 64; // Subtract sidebars + padding
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
                } else if (currentMode === 'crop') {
                    startCropping(e); // Start crop selection
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
                } else if (currentMode === 'crop' && isCropping) {
                    updateCropPreview(e);
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
            } else if (currentMode === 'crop' && isCropping) {
                finishCropping(e); // Finish crop selection
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
            const numberAnnotation = { type: 'number', x, y, displayNumber, clickCount, color: currentColor, size: currentSize };
            clicks.push(numberAnnotation);
            
            // Also add to layer system
            addAnnotationLayer('number', numberAnnotation);
            
            // Update layer list
            if (typeof window.updateLayerList === 'function') {
                window.updateLayerList();
            }

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
                const textAnnotation = { type: 'text', x, y, text, color: currentColor, size: currentSize };
                clicks.push(textAnnotation);
                
                // Also add to layer system
                addAnnotationLayer('text', textAnnotation);
                
                // Update layer list
                if (typeof window.updateLayerList === 'function') {
                    window.updateLayerList();
                }
                redrawCanvas();
                messageDiv.textContent = translate('textAdded', { text, x: Math.round(x), y: Math.round(y) });
            }
        }

        function handleEmojiClick(e) {
            let [x, y] = getMousePos(canvas, e);
            const selectedEmoji = emojiSelector.value;
            if (selectedEmoji) {
                const emojiAnnotation = { type: 'emoji', x, y, emoji: selectedEmoji, size: currentSize };
                clicks.push(emojiAnnotation);
                
                // Also add to layer system
                addAnnotationLayer('emoji', emojiAnnotation);
                
                // Update layer list
                if (typeof window.updateLayerList === 'function') {
                    window.updateLayerList();
                }
                redrawCanvas();
                messageDiv.textContent = translate('emojiAdded', { emoji: selectedEmoji, x: Math.round(x), y: Math.round(y) });
            }
        }

        // 크롭 관련 함수들
        function startCropping(e) {
            if (currentMode !== 'crop') return;
            isCropping = true;
            cropPreviewMode = true;
            [cropStartX, cropStartY] = getMousePos(canvas, e);
            cropEndX = cropStartX;
            cropEndY = cropStartY;
            canvas.style.cursor = 'crosshair';
        }

        function updateCropPreview(e) {
            if (!isCropping || currentMode !== 'crop') return;
            [cropEndX, cropEndY] = getMousePos(canvas, e);
            redrawCanvas();
            drawCropOverlay();
        }

        function finishCropping(e) {
            if (!isCropping || currentMode !== 'crop') return;
            [cropEndX, cropEndY] = getMousePos(canvas, e);
            isCropping = false;
            canvas.style.cursor = 'default';
            
            // 최소 크기 체크 (10x10 픽셀)
            const width = Math.abs(cropEndX - cropStartX);
            const height = Math.abs(cropEndY - cropStartY);
            if (width < 10 || height < 10) {
                cropPreviewMode = false;
                redrawCanvas();
                updateCropButtonStates();
                messageDiv.textContent = translate('cropTooSmall');
                return;
            }
            
            // 크롭 영역이 선택되었으므로 미리보기 상태로 전환
            redrawCanvas();
            drawCropOverlay();
            updateCropButtonStates();
            messageDiv.textContent = translate('cropSelected');
        }

        function drawCropOverlay() {
            if (!cropPreviewMode) return;
            
            const minX = Math.min(cropStartX, cropEndX);
            const minY = Math.min(cropStartY, cropEndY);
            const maxX = Math.max(cropStartX, cropEndX);
            const maxY = Math.max(cropStartY, cropEndY);
            
            // 반투명 어두운 오버레이 (선택 영역 외부)
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            
            // 상단
            ctx.fillRect(0, 0, canvas.width, minY);
            // 하단
            ctx.fillRect(0, maxY, canvas.width, canvas.height - maxY);
            // 좌측
            ctx.fillRect(0, minY, minX, maxY - minY);
            // 우측
            ctx.fillRect(maxX, minY, canvas.width - maxX, maxY - minY);
            
            // 선택 영역 테두리
            ctx.strokeStyle = '#0066cc';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
            
            // 크기 정보 표시
            const width = Math.round(maxX - minX);
            const height = Math.round(maxY - minY);
            ctx.fillStyle = '#0066cc';
            ctx.font = '14px Arial';
            ctx.fillText(`${width} × ${height}`, minX + 5, minY - 5);
            
            ctx.restore();
        }

        function applyCrop() {
            if (!cropPreviewMode) return;
            
            // Undo 스택에 현재 상태 저장 (리사이즈 설정 포함)
            undoStack.push({
                image: currentImage,
                clicks: [...clicks],
                clickCount: clickCount,
                shapeCount: shapeCount,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                resizeOption: resizeSelector ? resizeSelector.value : 'default'
            });
            
            const minX = Math.min(cropStartX, cropEndX);
            const minY = Math.min(cropStartY, cropEndY);
            const maxX = Math.max(cropStartX, cropEndX);
            const maxY = Math.max(cropStartY, cropEndY);
            const width = maxX - minX;
            const height = maxY - minY;
            
            // 크롭된 이미지만 추출
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            
            // 기본 크롭 먼저 수행
            if (currentImage) {
                // 이미지 크기와 캔버스 크기 비율 계산
                const scaleX = currentImage.width / canvas.width;
                const scaleY = currentImage.height / canvas.height;
                
                // 실제 이미지 좌표로 변환
                const sourceX = minX * scaleX;
                const sourceY = minY * scaleY;
                const sourceWidth = width * scaleX;
                const sourceHeight = height * scaleY;
                
                // 캔버스 크기 설정 (찢어진 종이 효과의 경우 그림자 공간 추가)
                let canvasWidth = width;
                let canvasHeight = height;
                let imageOffsetX = 0;
                let imageOffsetY = 0;
                
                if (currentCropStyle === 'torn') {
                    const shadowOffset = 16;
                    canvasWidth = width + shadowOffset;
                    canvasHeight = height + shadowOffset;
                    imageOffsetX = 0;
                    imageOffsetY = 0;
                }
                
                croppedCanvas.width = canvasWidth;
                croppedCanvas.height = canvasHeight;
                
                // 찢어진 종이 효과의 경우 그림자 먼저 그리기
                if (currentCropStyle === 'torn') {
                    // 그림자 효과 (좌측 상단에서 빛이 와서 우측 하단에 그림자)
                    croppedCtx.save();
                    croppedCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    croppedCtx.translate(4, 4); // 그림자 위치 조정
                    
                    // 그림자용 클리핑 패스 생성
                    applyCropStyle(croppedCtx, width, height, imageOffsetX, imageOffsetY);
                    croppedCtx.fill();
                    croppedCtx.restore();
                }
                
                // 스타일별 클리핑 적용
                applyCropStyle(croppedCtx, width, height, imageOffsetX, imageOffsetY);
                
                // 원본 이미지 그리기
                croppedCtx.drawImage(currentImage, sourceX, sourceY, sourceWidth, sourceHeight, imageOffsetX, imageOffsetY, width, height);
                
                if (currentCropStyle === 'torn') {
                    croppedCtx.restore();
                }
                
                // 찢어진 종이에 검정 테두리 추가
                if (currentCropStyle === 'torn') {
                    croppedCtx.save();
                    
                    // 테두리 스타일 설정
                    croppedCtx.strokeStyle = '#000000';
                    croppedCtx.lineWidth = 1;
                    croppedCtx.globalCompositeOperation = 'source-over';
                    
                    // 시드 기반 랜덤 함수 (동일한 패턴 생성)
                    function seededRandom(seed) {
                        const x = Math.sin(seed) * 10000;
                        return x - Math.floor(x);
                    }
                    
                    // 찢어진 테두리 다시 그리기 (스트로크용)
                    croppedCtx.beginPath();
                    croppedCtx.moveTo(imageOffsetX, imageOffsetY);
                    
                    // 상단 가장자리 (직선)
                    croppedCtx.lineTo(imageOffsetX + width, imageOffsetY);
                    
                    // 우측 가장자리 (AWS 스타일 자연스러운 찢어진 효과)
                    const edgeDepth = Math.min(width * 0.008, 4); // 미묘한 깊이 (최대 4px)
                    for (let y = 0; y <= height; y += 2) {
                        const normalizedY = y / height;
                        const seed1 = y * 0.03;
                        const seed2 = y * 0.17;
                        
                        // 자연스러운 찢어진 패턴 (지역적 변화)
                        const baseNoise = seededRandom(seed1) * 0.7;
                        const detailNoise = seededRandom(seed2) * 0.3;
                        const regionVariation = Math.sin(normalizedY * Math.PI * 2.3) * 0.4;
                        
                        const wobble = (baseNoise + detailNoise + regionVariation) * edgeDepth;
                        croppedCtx.lineTo(imageOffsetX + width - wobble, imageOffsetY + y);
                    }
                    
                    // 하단 가장자리 (AWS 스타일 자연스러운 찢어진 효과)
                    for (let x = width; x >= 0; x -= 2) {
                        const normalizedX = x / width;
                        const seed1 = x * 0.03;
                        const seed2 = x * 0.17;
                        
                        // 자연스러운 찢어진 패턴 (지역적 변화)
                        const baseNoise = seededRandom(seed1) * 0.7;
                        const detailNoise = seededRandom(seed2) * 0.3;
                        const regionVariation = Math.sin(normalizedX * Math.PI * 1.7) * 0.4;
                        
                        const wobble = (baseNoise + detailNoise + regionVariation) * edgeDepth;
                        croppedCtx.lineTo(imageOffsetX + x, imageOffsetY + height - wobble);
                    }
                    
                    // 좌측 가장자리 (직선)
                    croppedCtx.lineTo(imageOffsetX, imageOffsetY);
                    croppedCtx.closePath();
                    croppedCtx.stroke();
                    croppedCtx.restore();
                }
            }
            
            // 새 이미지로 교체
            const newImage = new Image();
            newImage.onload = () => {
                currentImage = newImage;
                
                // 자동 리사이즈 재적용 (기존 applyImageToCanvas 로직 사용)
                const { width, height } = calculateImageDimensions(newImage.width, newImage.height);
                applyCanvasDimensions(width, height);
                
                // 크롭 모드 해제
                cropPreviewMode = false;
                isCropping = false;
                
                // 기존 주석들은 모두 제거 (크롭으로 위치가 변경되므로)
                clicks = [];
                clickCount = 0;
                shapeCount = 0;
                
                updateCropButtonStates();
                messageDiv.textContent = translate('cropApplied');
                saveUserSettings();
            };
            newImage.src = croppedCanvas.toDataURL();
        }

        function applyCropStyle(ctx, width, height, offsetX = 0, offsetY = 0) {
            const style = currentCropStyle;
            
            switch(style) {
                case 'torn':
                    // SVG 기반 찢어진 종이 효과 (오른쪽, 하단, 우하단 모서리만)
                    ctx.save();
                    
                    // 시드 기반 랜덤 함수 (일관된 패턴 생성)
                    function seededRandom(seed) {
                        const x = Math.sin(seed) * 10000;
                        return x - Math.floor(x);
                    }
                    
                    ctx.beginPath();
                    ctx.moveTo(offsetX, offsetY);
                    
                    // 상단 가장자리 (직선)
                    ctx.lineTo(offsetX + width, offsetY);
                    
                    // 우측 가장자리 (AWS 스타일 자연스러운 찢어진 효과)
                    const edgeDepth = Math.min(width * 0.008, 4); // 미묘한 깊이 (최대 4px)
                    for (let y = 0; y <= height; y += 2) {
                        const normalizedY = y / height;
                        const seed1 = y * 0.03;
                        const seed2 = y * 0.17;
                        
                        // 자연스러운 찢어진 패턴 (지역적 변화)
                        const baseNoise = seededRandom(seed1) * 0.7;
                        const detailNoise = seededRandom(seed2) * 0.3;
                        const regionVariation = Math.sin(normalizedY * Math.PI * 2.3) * 0.4;
                        
                        const wobble = (baseNoise + detailNoise + regionVariation) * edgeDepth;
                        ctx.lineTo(offsetX + width - wobble, offsetY + y);
                    }
                    
                    // 하단 가장자리 (AWS 스타일 자연스러운 찢어진 효과)
                    for (let x = width; x >= 0; x -= 2) {
                        const normalizedX = x / width;
                        const seed1 = x * 0.03;
                        const seed2 = x * 0.17;
                        
                        // 자연스러운 찢어진 패턴 (지역적 변화)
                        const baseNoise = seededRandom(seed1) * 0.7;
                        const detailNoise = seededRandom(seed2) * 0.3;
                        const regionVariation = Math.sin(normalizedX * Math.PI * 1.7) * 0.4;
                        
                        const wobble = (baseNoise + detailNoise + regionVariation) * edgeDepth;
                        ctx.lineTo(offsetX + x, offsetY + height - wobble);
                    }
                    
                    // 좌측 가장자리 (직선)
                    ctx.lineTo(offsetX, offsetY);
                    ctx.closePath();
                    ctx.clip();
                    break;
                    
                case 'basic':
                default:
                    // 기본 크롭 - 추가 스타일 없음
                    break;
            }
        }

        function cancelCrop() {
            cropPreviewMode = false;
            isCropping = false;
            redrawCanvas();
            updateCropButtonStates();
            messageDiv.textContent = translate('cropCancelled');
        }


        function undo() {
            // 크롭 미리보기 모드인 경우 크롭을 취소
            if (cropPreviewMode) {
                cancelCrop();
                return;
            }
            
            // undoStack에서 이전 상태 복원
            if (undoStack.length > 0) {
                const previousState = undoStack.pop();
                
                // 이미지가 있는 경우 이미지 복원
                if (previousState.image) {
                    currentImage = previousState.image;
                    
                    // 리사이즈 설정 복원
                    if (previousState.resizeOption && resizeSelector) {
                        resizeSelector.value = previousState.resizeOption;
                    }
                    
                    // 이전 이미지 크기로 캔버스 복원 (CSS 스타일 포함)
                    const dpr = window.devicePixelRatio || 1;
                    const displayWidth = previousState.canvasWidth / dpr;
                    const displayHeight = previousState.canvasHeight / dpr;
                    
                    canvas.width = previousState.canvasWidth;
                    canvas.height = previousState.canvasHeight;
                    canvas.style.width = `${displayWidth}px`;
                    canvas.style.height = `${displayHeight}px`;
                    
                    // Context scaling 복원
                    ctx.scale(dpr, dpr);
                    
                    ctx.drawImage(currentImage, 0, 0, displayWidth, displayHeight);
                    
                    // 배경 이미지 레이어 재생성 (복원된 크기 사용)
                    createBackgroundImageLayerWithSize(previousState.canvasWidth, previousState.canvasHeight);
                }
                
                // 주석 상태 복원
                clicks = previousState.clicks;
                clickCount = previousState.clickCount;
                shapeCount = previousState.shapeCount;
                maxClickCount = clicks.filter(c => c.type === 'number').reduce((max, c) => Math.max(max, c.displayNumber || 0), 0);
                
                // 레이어 시스템 재구축
                rebuildLayersFromClicks();
                
                // 전역 참조 업데이트
                window.clicks = clicks;
                window.layers = layers;
                
                redrawCanvas();
                
                // 레이어 UI 업데이트
                if (typeof window.updateLayerList === 'function') {
                    window.updateLayerList();
                }
                
                messageDiv.textContent = translate('undoPerformed');
                saveUserSettings();
                return;
            }
            
            // 일반 주석 요소 undo
            if (clicks.length === 0) {
                messageDiv.textContent = translate('noMoreUndo');
                return;
            }
            
            const removedClick = clicks.pop();
            
            // Also remove from layer system
            const layerIndex = layers.findIndex(layer => layer.data === removedClick);
            if (layerIndex !== -1) {
                layers.splice(layerIndex, 1);
            }
            
            // Update global references
            window.clicks = clicks;
            window.layers = layers;
            
            // Recalculate maxClickCount and shapeCount based on remaining clicks
            maxClickCount = clicks.filter(c => c.type === 'number').reduce((max, c) => Math.max(max, c.displayNumber || 0), 0);
            shapeCount = clicks.filter(c => c.type === 'shape').length;

            redrawCanvas();
            
            // Update layer list
            if (typeof window.updateLayerList === 'function') {
                window.updateLayerList();
            }
            
            messageDiv.textContent = translate('undoPerformed');
            saveUserSettings();
        }

        function undoLastClick() {
            undo(); // 통합된 undo 함수 사용
        }

        function resetDrawingState() {
            clicks = [];
            layers = layers.filter(layer => layer.type === 'background'); // Keep only background layer
            undoStack = [];
            clickCount = 0;
            maxClickCount = 0;
            initialX = null;
            initialY = null;
            
            // Update global references
            window.clicks = clicks;
            window.layers = layers;
            
            redrawCanvas();
        }

        function redrawCanvas() {
            // Clear canvas
            canvas.width = canvas.width;
            
            // Debug log
            console.log('Redrawing canvas with layers:', layers.length);
            
            // Draw all layers in order (bottom to top)
            layers.forEach((layer, index) => {
                console.log(`Drawing layer ${index}:`, layer.type, 'visible:', layer.visible);
                
                // Skip hidden layers
                if (layer.visible === false) return;
                
                if (layer.type === 'background') {
                    // Draw background image
                    if (layer.data.image) {
                        ctx.drawImage(layer.data.image, 0, 0, canvas.width, canvas.height);
                        console.log('Drew background image');
                    }
                } else {
                    // Draw annotation layer
                    const data = layer.data;
                    console.log('Drawing annotation layer:', data);
                    if (data.type === 'number') drawNumber(data);
                    else if (data.type === 'shape') drawShape(data.startX, data.startY, data.endX, data.endY, data.shape, data.color, data.fillType || 'none');
                    else if (data.type === 'text') drawText(data);
                    else if (data.type === 'emoji') drawEmoji(data);
                }
            });
            
            // Legacy support: also draw from clicks array for backward compatibility
            clicks.forEach((click) => {
                // Skip if already drawn via layer system
                if (layers.some(layer => layer.data === click)) return;
                
                // Skip hidden layers (default visible if not set)
                if (click.visible === false) return;
                
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
            const shapeAnnotation = { type: 'shape', shape: currentShape, startX, startY, endX: mouseX, endY: mouseY, color: currentColor, fillType: currentFill, id: shapeCount };
            clicks.push(shapeAnnotation);
            
            // Also add to layer system
            addAnnotationLayer('shape', shapeAnnotation);
            
            // Update layer list
            if (typeof window.updateLayerList === 'function') {
                window.updateLayerList();
            }
            
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
                cropStyle: currentCropStyle,
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
            currentCropStyle = settings.cropStyle || 'basic';
            if (document.getElementById('cropStyleSelector')) {
                document.getElementById('cropStyleSelector').value = currentCropStyle;
            }
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
            currentCropStyle = settings.cropStyle || 'basic';
            if (document.getElementById('cropStyleSelector')) {
                document.getElementById('cropStyleSelector').value = currentCropStyle;
            }
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
            // 크롭 모드에서 다른 모드로 변경 시 크롭 미리보기 해제
            if (currentMode === 'crop' && cropPreviewMode) {
                cropPreviewMode = false;
                redrawCanvas();
            }
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

        // 크롭 관련 이벤트 리스너들
        const cropStyleSelector = document.getElementById('cropStyleSelector');
        const applyCropButton = document.getElementById('applyCropButton');
        const cropInfo = document.getElementById('cropInfo');

        if (cropStyleSelector) {
            cropStyleSelector.addEventListener('change', () => {
                currentCropStyle = cropStyleSelector.value;
                saveUserSettings();
                if (cropPreviewMode) {
                    redrawCanvas();
                    drawCropOverlay();
                }
            });
        }

        if (applyCropButton) {
            applyCropButton.addEventListener('click', () => {
                if (cropPreviewMode) {
                    applyCrop();
                }
            });
        }

        // 크롭 버튼 상태 업데이트 함수
        function updateCropButtonStates() {
            if (applyCropButton && cropInfo) {
                if (currentMode === 'crop') {
                    if (cropPreviewMode) {
                        applyCropButton.disabled = false;
                        cropInfo.style.display = 'none';
                    } else {
                        applyCropButton.disabled = true;
                        cropInfo.style.display = 'block';
                    }
                } else {
                    applyCropButton.disabled = true;
                    cropInfo.style.display = 'none';
                }
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            applyLanguage();
            // DOM 로드 즉시 깨끗한 캔버스 표시 (이전 작업 내용 표시 방지)
            drawDefaultCanvasBackground();
        });