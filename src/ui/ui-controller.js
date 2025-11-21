        // Theme Toggle Functionality
        function initializeTheme() {
            const themeToggle = document.getElementById('themeToggle');
            const body = document.body;
            const themeIcon = themeToggle.querySelector('.material-icons');
            
            // Check for saved theme or default to dark
            const savedTheme = localStorage.getItem('theme') || 'dark';
            if (savedTheme === 'dark') {
                body.classList.add('dark');
                themeIcon.textContent = 'light_mode';
            } else {
                themeIcon.textContent = 'dark_mode';
            }
            
            themeToggle.addEventListener('click', () => {
                body.classList.toggle('dark');
                const isDark = body.classList.contains('dark');
                themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });
        }

        // Mobile Sidebar Functionality - User Agent 기반
        function initializeSidebar() {
            const sidebar = document.getElementById('sidebar');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileOverlay = document.getElementById('mobileOverlay');
            
            // User Agent 기반 모바일 감지 (main.js에서 이미 설정됨)
            function isMobileDevice() {
                const userAgent = navigator.userAgent.toLowerCase();
                const mobileKeywords = [
                    'android', 'webos', 'iphone', 'ipad', 'ipod', 
                    'blackberry', 'windows phone', 'mobile', 'opera mini'
                ];
                return mobileKeywords.some(keyword => userAgent.includes(keyword));
            }
            
            const isMobile = isMobileDevice();
            
            // 모바일 기기에서만 모바일 UI 활성화
            if (isMobile) {
                console.log('모바일 UI 활성화 - 사이드바 기능 초기화');
                
                mobileMenuBtn.addEventListener('click', () => {
                    sidebar.classList.toggle('mobile-open');
                    mobileOverlay.classList.toggle('show');
                });
                
                mobileOverlay.addEventListener('click', () => {
                    sidebar.classList.remove('mobile-open');
                    mobileOverlay.classList.remove('show');
                });
                
                // 모바일에서 뒤로가기 버튼으로 사이드바 닫기
                window.addEventListener('popstate', () => {
                    sidebar.classList.remove('mobile-open');
                    mobileOverlay.classList.remove('show');
                });
            }
            
            // 캔버스 리사이즈는 모든 기기에서 동작 (브라우저 크기 변경 시)
            window.addEventListener('resize', () => {
                // Canvas resize trigger는 유지
                if (typeof window.triggerCanvasResize === 'function') {
                    clearTimeout(window.resizeTimeout);
                    window.resizeTimeout = setTimeout(() => {
                        window.triggerCanvasResize();
                    }, 100);
                }
            });
        }

        // Layer Sidebar Functionality
        function initializeLayerSidebar() {
            const layerSidebar = document.getElementById('layerSidebar');
            const layerList = document.getElementById('layerList');
            const clearAllLayersBtn = document.getElementById('clearAllLayers');
            
            // Initialize background layer visibility toggle
            const backgroundLayerToggle = layerList.querySelector('.background-layer .layer-visibility-toggle');
            if (backgroundLayerToggle) {
                backgroundLayerToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleBackgroundLayerVisibility();
                });
            }
            
            // Clear all layers functionality
            clearAllLayersBtn.addEventListener('click', () => {
                if (confirm('모든 주석을 삭제하시겠습니까?')) {
                    if (typeof window.clearAllAnnotations === 'function') {
                        window.clearAllAnnotations();
                    } else {
                        console.error('clearAllAnnotations function not available');
                    }
                }
            });
            
            // Update layer list based on new layer system
            function updateLayerList() {
                // Clear existing layers
                const existingLayers = layerList.querySelectorAll('.layer-item');
                existingLayers.forEach(item => item.remove());
                
                // Get data from main.js
                const layers = window.layers || [];
                const imageLayers = window.imageLayers || [];
                
                // 1. Add background layer (solid color)
                addBackgroundLayer();
                
                // 2. Add image layers
                imageLayers.forEach((imageLayer, index) => {
                    addImageLayerToUI(imageLayer, index);
                });
                
                // 3. Add annotation layers in reverse order (top layer first in UI)
                const annotationLayers = layers.filter(layer => layer.type !== 'background');
                for (let i = annotationLayers.length - 1; i >= 0; i--) {
                    const layer = annotationLayers[i];
                    addAnnotationLayerToUI(layer, i);
                }
            }
            
            function addBackgroundLayer() {
                const backgroundItem = document.createElement('div');
                backgroundItem.className = 'layer-item background-layer';
                backgroundItem.setAttribute('data-layer-type', 'background');
                
                const layerContent = document.createElement('div');
                layerContent.className = 'layer-info';
                
                const icon = document.createElement('span');
                icon.className = 'material-icons layer-icon';
                icon.textContent = 'layers';
                
                const name = document.createElement('span');
                name.className = 'layer-name';
                name.textContent = '배경';
                
                const controls = document.createElement('div');
                controls.className = 'layer-controls';
                
                // 배경 레이어는 항상 보임, 삭제 불가
                const visibilityBtn = document.createElement('button');
                visibilityBtn.className = 'layer-visibility-toggle';
                visibilityBtn.innerHTML = '<span class="material-icons">visibility</span>';
                visibilityBtn.disabled = true;
                visibilityBtn.style.opacity = '0.3';
                
                controls.appendChild(visibilityBtn);
                
                layerContent.appendChild(icon);
                layerContent.appendChild(name);
                backgroundItem.appendChild(layerContent);
                backgroundItem.appendChild(controls);
                
                layerList.appendChild(backgroundItem);
            }
            
            function addImageLayerToUI(imageLayer, index) {
                const layerItem = document.createElement('div');
                layerItem.className = 'layer-item image-layer';
                layerItem.setAttribute('data-image-layer-id', imageLayer.id);
                
                const layerContent = document.createElement('div');
                layerContent.className = 'layer-info';
                
                const icon = document.createElement('span');
                icon.className = 'material-icons layer-icon';
                icon.textContent = 'image';
                
                const name = document.createElement('span');
                name.className = 'layer-name';
                name.textContent = `이미지 레이어 ${index + 1}`;
                
                const controls = document.createElement('div');
                controls.className = 'layer-controls';
                
                // Visibility toggle
                const visibilityBtn = document.createElement('button');
                visibilityBtn.className = 'layer-visibility-toggle';
                const visibilityIcon = imageLayer.visible !== false ? 'visibility' : 'visibility_off';
                visibilityBtn.innerHTML = `<span class="material-icons">${visibilityIcon}</span>`;
                if (imageLayer.visible === false) {
                    visibilityBtn.classList.add('hidden');
                }
                visibilityBtn.onclick = (e) => {
                    e.stopPropagation();
                    toggleImageLayerVisibility(imageLayer.id);
                };
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'layer-visibility-toggle';
                deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteImageLayer(imageLayer.id);
                };
                
                controls.appendChild(visibilityBtn);
                controls.appendChild(deleteBtn);
                
                layerContent.appendChild(icon);
                layerContent.appendChild(name);
                layerItem.appendChild(layerContent);
                layerItem.appendChild(controls);
                
                layerList.appendChild(layerItem);
            }
            
            function addAnnotationLayerToUI(layer, index) {
                const layerItem = createLayerItem(layer, index);
                layerList.appendChild(layerItem);
            }
            
            function createLayerItem(layer, displayIndex) {
                const layerItem = document.createElement('div');
                layerItem.className = 'layer-item annotation-layer';
                layerItem.dataset.layerId = layer.id;
                
                const layerInfo = document.createElement('div');
                layerInfo.className = 'layer-info';
                
                const icon = document.createElement('span');
                icon.className = 'material-icons layer-icon';
                icon.textContent = getLayerIcon(layer.type);
                
                const name = document.createElement('span');
                name.className = 'layer-name';
                name.textContent = layer.name || getLayerName(layer, displayIndex);
                
                const controls = document.createElement('div');
                controls.className = 'layer-controls';
                
                const visibilityToggle = document.createElement('button');
                visibilityToggle.className = 'layer-visibility-toggle';
                if (layer.visible === false) {
                    visibilityToggle.classList.add('hidden');
                }
                const visibilityIcon = layer.visible === false ? 'visibility_off' : 'visibility';
                visibilityToggle.innerHTML = `<span class="material-icons">${visibilityIcon}</span>`;
                visibilityToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                });
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'layer-visibility-toggle';
                deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                });
                
                layerInfo.appendChild(icon);
                layerInfo.appendChild(name);
                controls.appendChild(visibilityToggle);
                controls.appendChild(deleteBtn);
                layerItem.appendChild(layerInfo);
                layerItem.appendChild(controls);
                
                // Layer click to select
                layerItem.addEventListener('click', () => {
                    selectLayerById(layer.id);
                });
                
                return layerItem;
            }
            
            function getLayerIcon(type) {
                const icons = {
                    number: 'looks_one',
                    shape: 'crop_square',
                    text: 'text_fields',
                    emoji: 'emoji_emotions'
                };
                return icons[type] || 'layers';
            }
            
            function getLayerName(annotation, index) {
                const typeNames = {
                    number: '숫자',
                    shape: '도형',
                    text: '텍스트',
                    emoji: '이모지'
                };
                const baseName = typeNames[annotation.type] || '요소';
                return `${baseName} ${index + 1}`;
            }
            
            function selectLayer(index) {
                // Remove previous selection
                document.querySelectorAll('.layer-item.selected').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Select new layer
                const layerItem = document.querySelector(`[data-index="${index}"]`);
                if (layerItem) {
                    layerItem.classList.add('selected');
                }
            }
            
            function toggleAnnotationVisibility(index) {
                if (clicks[index]) {
                    clicks[index].visible = clicks[index].visible !== false ? false : true;
                    redrawCanvas();
                    updateLayerList();
                }
            }
            
            function deleteAnnotation(index) {
                if (clicks[index]) {
                    clicks.splice(index, 1);
                    redrawCanvas();
                    updateLayerList();
                }
            }
            
            
            // Background layer visibility toggle
            function toggleBackgroundLayerVisibility() {
                if (window.layers) {
                    const backgroundLayer = window.layers.find(layer => layer.type === 'background');
                    if (backgroundLayer) {
                        backgroundLayer.visible = !backgroundLayer.visible;
                        if (typeof window.redrawCanvas === 'function') {
                            window.redrawCanvas();
                        }
                        updateLayerList();
                    }
                }
            }
            
            // Layer visibility toggle by ID
            function toggleLayerVisibility(layerId) {
                if (window.layers) {
                    const layer = window.layers.find(l => l.id === layerId);
                    if (layer) {
                        layer.visible = !layer.visible;
                        if (typeof window.redrawCanvas === 'function') {
                            window.redrawCanvas();
                        }
                        updateLayerList();
                    }
                }
            }
            
            // Delete layer by ID
            function deleteLayer(layerId) {
                if (window.layers) {
                    const layerIndex = window.layers.findIndex(l => l.id === layerId);
                    if (layerIndex !== -1) {
                        const layer = window.layers[layerIndex];
                        
                        // Also remove from clicks array
                        const clickIndex = window.clicks.findIndex(click => click === layer.data);
                        
                        if (clickIndex !== -1) {
                            window.clicks.splice(clickIndex, 1);
                        }
                        
                        window.layers.splice(layerIndex, 1);
                        
                        if (typeof window.redrawCanvas === 'function') {
                            window.redrawCanvas();
                        }
                        updateLayerList();
                    }
                }
            }
            
            // Image layer control functions
            function toggleImageLayerVisibility(imageLayerId) {
                if (window.imageLayers) {
                    const imageLayer = window.imageLayers.find(layer => layer.id === imageLayerId);
                    if (imageLayer) {
                        imageLayer.visible = !imageLayer.visible;
                        if (typeof window.redrawCanvas === 'function') {
                            window.redrawCanvas();
                        }
                        updateLayerList();
                    }
                }
            }
            
            function deleteImageLayer(imageLayerId) {
                if (window.imageLayers) {
                    const layerIndex = window.imageLayers.findIndex(layer => layer.id === imageLayerId);
                    if (layerIndex !== -1) {
                        window.imageLayers.splice(layerIndex, 1);
                        
                        // Also remove from legacy layers system
                        if (window.layers) {
                            const legacyIndex = window.layers.findIndex(l => l.type === 'background');
                            if (legacyIndex !== -1) {
                                window.layers.splice(legacyIndex, 1);
                            }
                        }
                        
                        if (typeof window.redrawCanvas === 'function') {
                            window.redrawCanvas();
                        }
                        updateLayerList();
                    }
                }
            }
            
            // Select layer by ID
            function selectLayerById(layerId) {
                // Remove previous selection
                document.querySelectorAll('.layer-item.selected').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Select new layer
                const layerItem = document.querySelector(`[data-layer-id="${layerId}"]`);
                if (layerItem) {
                    layerItem.classList.add('selected');
                }
            }
            
            // Expose updateLayerList globally for main.js to call
            window.updateLayerList = updateLayerList;
        }

        // Canvas Container State Management
        function updateCanvasContainer() {
            const canvas = document.getElementById('imageCanvas');
            const container = document.getElementById('canvasContainer');
            const emptyState = document.getElementById('emptyState');
            
            if (canvas.width > 0 && canvas.height > 0) {
                container.classList.remove('empty');
                emptyState.style.display = 'none';
                canvas.style.display = 'block';
            } else {
                container.classList.add('empty');
                emptyState.style.display = 'block';
                canvas.style.display = 'none';
            }
        }

        // Mode-specific control visibility
        function updateControlsVisibility() {
            const modeSelector = document.getElementById('modeSelector');
            const colorSection = document.getElementById('colorSection');
            const sizeSection = document.getElementById('sizeSection');
            const lineWidthSection = document.getElementById('lineWidthSection');
            const shapeSection = document.getElementById('shapeSection');
            const fillSection = document.getElementById('fillSection');
            const emojiSection = document.getElementById('emojiSection');
            const cropSection = document.getElementById('cropSection');
            const cropControlsSection = document.getElementById('cropControlsSection');
            const shapeSelector = document.getElementById('shapeSelector');
            const stylePanel = document.querySelector('.tool-panel:has(#colorSection)');
            
            const currentMode = modeSelector.value;
            
            // Hide all sections first
            colorSection.style.display = 'none';
            sizeSection.style.display = 'none';
            lineWidthSection.style.display = 'none';
            shapeSection.style.display = 'none';
            fillSection.style.display = 'none';
            emojiSection.style.display = 'none';
            cropSection.style.display = 'none';
            cropControlsSection.style.display = 'none';
            
            // Reorder and show sections based on current mode
            switch(currentMode) {
                case 'number':
                    // 숫자 모드: 색상, 크기
                    stylePanel.appendChild(colorSection);
                    stylePanel.appendChild(sizeSection);
                    colorSection.style.display = 'block';
                    sizeSection.style.display = 'block';
                    break;
                    
                case 'shape':
                    // 도형 모드: 모양, 색상, 굵기, 채우기 (화살표 제외)
                    stylePanel.appendChild(shapeSection);
                    stylePanel.appendChild(colorSection);
                    stylePanel.appendChild(lineWidthSection);
                    stylePanel.appendChild(fillSection);
                    
                    shapeSection.style.display = 'block';
                    colorSection.style.display = 'block';
                    lineWidthSection.style.display = 'block';
                    
                    // Show fill section only if not arrow
                    const currentShape = shapeSelector.value;
                    if (currentShape !== 'arrow') {
                        fillSection.style.display = 'block';
                    }
                    break;
                    
                case 'text':
                    // 텍스트 모드: 색상, 크기
                    stylePanel.appendChild(colorSection);
                    stylePanel.appendChild(sizeSection);
                    colorSection.style.display = 'block';
                    sizeSection.style.display = 'block';
                    break;
                    
                case 'emoji':
                    // 이모지 모드: 이모지 종류, 크기 (색상 제외)
                    stylePanel.appendChild(emojiSection);
                    stylePanel.appendChild(sizeSection);
                    emojiSection.style.display = 'block';
                    sizeSection.style.display = 'block';
                    break;
                    
                case 'crop':
                    // 크롭 모드: 크롭 스타일, 컨트롤
                    stylePanel.appendChild(cropSection);
                    stylePanel.appendChild(cropControlsSection);
                    cropSection.style.display = 'block';
                    cropControlsSection.style.display = 'block';
                    
                    // 크롭 버튼 상태 업데이트
                    if (typeof updateCropButtonStates === 'function') {
                        updateCropButtonStates();
                    }
                    break;
            }
        }

        // Handle shape selector changes to update fill selector visibility
        function initializeModeControls() {
            const modeSelector = document.getElementById('modeSelector');
            const shapeSelector = document.getElementById('shapeSelector');
            
            // Update controls when mode changes
            modeSelector.addEventListener('change', () => {
                updateControlsVisibility();
                // Force sync with main.js mode variable
                if (window.currentMode !== undefined) {
                    window.currentMode = modeSelector.value;
                }
            });
            
            // Update fill section when shape changes
            shapeSelector.addEventListener('change', () => {
                const fillSection = document.getElementById('fillSection');
                const currentShape = shapeSelector.value;
                
                // Hide fill section for arrows since they don't support fill
                if (currentShape === 'arrow') {
                    fillSection.style.display = 'none';
                } else if (modeSelector.value === 'shape') {
                    fillSection.style.display = 'block';
                }
                
                // Force sync with main.js shape variable
                if (window.currentShape !== undefined) {
                    window.currentShape = shapeSelector.value;
                }
            });
            
            // Sync initial state with main.js variables
            if (window.currentMode !== undefined) {
                modeSelector.value = window.currentMode;
            }
            if (window.currentShape !== undefined) {
                shapeSelector.value = window.currentShape;
            }
            
            // Initialize visibility
            updateControlsVisibility();
        }

        // Status logging functionality
        function updateStatus(message) {
            const statusText = document.getElementById('statusText');
            if (statusText) {
                statusText.textContent = message;
            }
        }

        function initializeStatusLogging() {
            const canvas = document.getElementById('imageCanvas');
            const canvasContainer = document.getElementById('canvasContainer');
            
            // Track mouse movement on canvas area only (not on top-bar)
            canvasContainer.addEventListener('mousemove', (e) => {
                // Check if mouse is over top-bar area
                const topBar = document.querySelector('.top-bar');
                const topBarRect = topBar.getBoundingClientRect();
                
                if (e.clientY >= topBarRect.top && e.clientY <= topBarRect.bottom) {
                    return; // Don't track if mouse is over top-bar
                }
                
                const rect = canvas.getBoundingClientRect();
                const x = Math.round(e.clientX - rect.left);
                const y = Math.round(e.clientY - rect.top);
                
                if (x >= 0 && y >= 0 && x <= canvas.width && y <= canvas.height) {
                    updateStatus(`좌표: (${x}, ${y})`);
                } else {
                    updateStatus('캔버스 영역 외부');
                }
            });

            // Track mouse leave
            canvasContainer.addEventListener('mouseleave', () => {
                updateStatus('대기 중');
            });

            // Track canvas clicks
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = Math.round(e.clientX - rect.left);
                const y = Math.round(e.clientY - rect.top);
                const modeSelector = document.getElementById('modeSelector');
                const currentMode = modeSelector.value;
                
                updateStatus(`${getModeDisplayName(currentMode)} 추가됨: (${x}, ${y})`);
                
                // Clear status after 3 seconds
                setTimeout(() => {
                    updateStatus('대기 중');
                }, 3000);
            });

            // Track mode changes
            const modeSelector = document.getElementById('modeSelector');
            modeSelector.addEventListener('change', () => {
                const modeName = getModeDisplayName(modeSelector.value);
                updateStatus(`모드 변경: ${modeName}`);
                
                setTimeout(() => {
                    updateStatus('대기 중');
                }, 2000);
            });

            // Track emoji selector changes
            const emojiSelector = document.getElementById('emojiSelector');
            emojiSelector.addEventListener('change', () => {
                updateStatus(`이모지 선택: ${emojiSelector.value}`);
                
                setTimeout(() => {
                    updateStatus('대기 중');
                }, 2000);
            });

            // Track shape selector changes
            const shapeSelector = document.getElementById('shapeSelector');
            shapeSelector.addEventListener('change', () => {
                const shapeName = getShapeDisplayName(shapeSelector.value);
                updateStatus(`도형 선택: ${shapeName}`);
                
                setTimeout(() => {
                    updateStatus('대기 중');
                }, 2000);
            });

            // Track color changes
            const colorSelector = document.getElementById('colorSelector');
            colorSelector.addEventListener('change', () => {
                const colorName = getColorDisplayName(colorSelector.value);
                updateStatus(`색상 변경: ${colorName}`);
                
                setTimeout(() => {
                    updateStatus('대기 중');
                }, 2000);
            });

            // Track save action
            const saveButton = document.getElementById('saveButton');
            saveButton.addEventListener('click', () => {
                updateStatus('이미지 저장됨');
                
                setTimeout(() => {
                    updateStatus('대기 중');
                }, 3000);
            });

            // Track undo action
            const undoButton = document.getElementById('undoButton');
            undoButton.addEventListener('click', () => {
                updateStatus('실행 취소됨');
                
                setTimeout(() => {
                    updateStatus('대기 중');
                }, 2000);
            });
        }

        // Multi-language support functions consolidated in src/main.js

        // Initialize all functionality when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            initializeTheme();
            initializeSidebar();
            initializeLayerSidebar();
            initializeModeControls();
            initializeStatusLogging();
            updateCanvasContainer();
            
            // Initialize language selector
            const languageSelector = document.getElementById('languageSelector');
            languageSelector.addEventListener('change', (e) => {
                setLanguage(e.target.value);
            });

            // Set initial language
            updateUILanguage();
            
            // Ensure initial mode controls are properly displayed
            setTimeout(() => {
                updateControlsVisibility();
            }, 100);
            
            // Watch for canvas changes
            const canvas = document.getElementById('imageCanvas');
            const observer = new MutationObserver(updateCanvasContainer);
            observer.observe(canvas, { attributes: true, attributeFilter: ['width', 'height'] });
        });

        // 모바일 UI는 별도 mobile.js에서 처리됨
