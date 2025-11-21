/**
 * Extension Bridge
 * Handles communication between AnnotateShot web app and Chrome Extension
 */

class ExtensionBridge {
    constructor() {
        this.messageStartTime = null;
    }

    /**
     * Show loading message when extension captures an image
     */
    showExtensionLoadingMessage() {
        console.log('🔧 showExtensionLoadingMessage 함수 시작');
        console.log('🔍 document.body 상태:', document.body ? 'exists' : 'null');
        console.log('🔍 document.readyState:', document.readyState);

        // 기존 메시지가 있으면 제거
        const existingMessage = document.getElementById('extension-loading-message');
        if (existingMessage) {
            console.log('🗑️ 기존 로딩 메시지 제거');
            existingMessage.remove();
        }

        // 언어 감지 (navigator.language 사용)
        const isKorean = navigator.language && navigator.language.startsWith('ko');
        const loadingText = isKorean ? '이미지 로딩 중...' : 'Loading image...';
        const waitText = isKorean ? '잠시만 기다려주세요' : 'Please wait';

        console.log('🌐 언어 감지 결과:', { isKorean, loadingText, waitText });

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
                    🖼️ ${loadingText}
                </div>
                <div style="font-size: 14px; color: #94a3b8;">
                    ${waitText}
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        console.log('📦 로딩 메시지 요소 생성 완료');

        // document.body가 준비되지 않았으면 대기
        if (!document.body) {
            console.log('⏳ document.body 준비 대기 중...');
            const addWhenReady = () => {
                if (document.body) {
                    console.log('✅ document.body 준비됨, 메시지 추가');
                    document.body.appendChild(loadingMessage);
                } else {
                    console.log('⏳ document.body 아직 준비 안됨, 10ms 후 재시도');
                    setTimeout(addWhenReady, 10);
                }
            };
            addWhenReady();
        } else {
            console.log('✅ document.body 이미 준비됨, 즉시 메시지 추가');
            document.body.appendChild(loadingMessage);
        }

        // 이미지 크기 기반 로딩 메시지 제거
        this.messageStartTime = Date.now();
        const removeMessage = this.removeExtensionLoadingMessage.bind(this);

        // 이미지 로드 완료 이벤트 감지
        const checkImageLoaded = () => {
            if (window.currentImage && window.currentImage.complete) {
                removeMessage();
            } else {
                setTimeout(checkImageLoaded, 100);
            }
        };

        // 이미지 로드 체크 시작
        setTimeout(checkImageLoaded, 500);

        // 전역 함수로 노출
        window.removeExtensionLoadingMessage = removeMessage;

        // 최대 10초 후 강제 제거
        setTimeout(() => removeMessage(0), 10000);
    }

    /**
     * Remove extension loading message
     * @param {number} imageSizeKB - Image size in KB for adaptive timing
     */
    removeExtensionLoadingMessage(imageSizeKB = 0) {
        const message = document.getElementById('extension-loading-message');
        if (message) {
            const elapsedTime = Date.now() - this.messageStartTime;

            // 이미지 크기에 따른 최소 표시 시간 계산
            let minDisplayTime = 1000; // 기본 1초
            if (imageSizeKB > 2000) {
                minDisplayTime = 2000; // 2MB 이상: 2초
            } else if (imageSizeKB > 500) {
                minDisplayTime = 1500; // 500KB-2MB: 1.5초
            }

            const removeNow = () => {
                console.log(`🗑️ Extension 로딩 메시지 제거 중... (이미지: ${imageSizeKB}KB, 표시시간: ${Date.now() - this.messageStartTime}ms)`);
                message.style.opacity = '0';
                message.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (message.parentNode) {
                        message.parentNode.removeChild(message);
                        console.log('✅ Extension 로딩 메시지 제거 완료');
                    }
                }, 300);
            };

            if (elapsedTime < minDisplayTime) {
                const remainingTime = minDisplayTime - elapsedTime;
                console.log(`⏳ 이미지 크기 ${imageSizeKB}KB -> 최소 ${minDisplayTime}ms 표시, ${remainingTime}ms 추가 대기`);
                setTimeout(removeNow, remainingTime);
            } else {
                removeNow();
            }
        }
    }

    /**
     * Show extension update notification
     * @param {Object} params - Update notification parameters
     * @param {string} params.fromVersion - Previous version
     * @param {string} params.toVersion - New version
     * @param {string} params.changelog - Changelog key
     */
    showUpdateNotification({ fromVersion, toVersion, changelog }) {
        console.log('🔔 Extension 업데이트 알림 표시:', { fromVersion, toVersion, changelog });

        // 기존 업데이트 알림이 있으면 제거
        const existingNotification = document.getElementById('update-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 언어 감지
        const isKorean = navigator.language && navigator.language.startsWith('ko');

        // 업데이트 메시지 생성
        let updateMessage = '';
        if (fromVersion && toVersion) {
            updateMessage = isKorean
                ? `AnnotateShot 확장 프로그램이 v${fromVersion}에서 v${toVersion}로 업데이트되었습니다!`
                : `AnnotateShot Extension updated from v${fromVersion} to v${toVersion}!`;
        } else {
            updateMessage = isKorean
                ? 'AnnotateShot 확장 프로그램이 업데이트되었습니다!'
                : 'AnnotateShot Extension has been updated!';
        }

        // 변경사항 메시지
        let changelogMessage = '';
        if (changelog) {
            const changelogMap = {
                'bug-fixes': isKorean ? '버그 수정' : 'Bug fixes',
                'performance-improvements': isKorean ? '성능 개선' : 'Performance improvements',
                'new-features': isKorean ? '새로운 기능' : 'New features',
                'ui-improvements': isKorean ? 'UI 개선' : 'UI improvements',
                'security-updates': isKorean ? '보안 업데이트' : 'Security updates'
            };
            changelogMessage = changelogMap[changelog] || changelog;
        }

        // 알림 요소 생성
        const notification = document.createElement('div');
        notification.id = 'update-notification';
        notification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 16px 20px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideDown 0.3s ease-out;
            cursor: pointer;
        `;

        // 애니메이션 키프레임 추가
        if (!document.getElementById('update-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'update-notification-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
                @keyframes slideUp {
                    from { transform: translateY(0); }
                    to { transform: translateY(-100%); }
                }
                .update-notification-hide {
                    animation: slideUp 0.3s ease-in forwards;
                }
            `;
            document.head.appendChild(style);
        }

        // 메시지 내용 구성
        let content = `<div style="font-size: 16px; margin-bottom: 4px;">${updateMessage}</div>`;
        if (changelogMessage) {
            content += `<div style="font-size: 12px; opacity: 0.9;">✨ ${changelogMessage}</div>`;
        }
        content += `<div style="font-size: 11px; opacity: 0.8; margin-top: 8px;">${isKorean ? '클릭하면 닫힙니다 · 10초 후 자동으로 사라집니다' : 'Click to dismiss · Auto-hide in 10 seconds'}</div>`;

        notification.innerHTML = content;

        // 클릭 시 닫기
        notification.addEventListener('click', () => {
            notification.classList.add('update-notification-hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });

        // DOM에 추가
        document.body.appendChild(notification);

        // 10초 후 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('update-notification-hide');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 10000);

        console.log('✅ 업데이트 알림 표시 완료');
    }

    /**
     * Check if user came from extension and show appropriate UI
     */
    checkExtensionSource() {
        try {
            const urlParams = new URLSearchParams(window.location.search);

            // 업데이트 알림 체크
            if (urlParams.get('update_notification') === 'true') {
                const fromVersion = urlParams.get('from');
                const toVersion = urlParams.get('to');
                const changelog = urlParams.get('changelog');

                console.log('Extension 업데이트 알림 감지');
                this.showUpdateNotification({ fromVersion, toVersion, changelog });
                return;
            }

            // 기존 Extension 캡처 이미지 로직
            const imageSource = localStorage.getItem('annotateshot_image_source');
            const capturedImage = localStorage.getItem('annotateshot_captured_image');

            // Extension에서 온 이미지가 있으면 즉시 로딩 메시지 표시
            if (imageSource === 'extension' && capturedImage) {
                console.log('Extension 유입 감지, 로딩 메시지 표시');
                console.log('🔍 showExtensionLoadingMessage 함수 타입:', typeof this.showExtensionLoadingMessage);
                console.log('🔍 함수 호출 시도 중...');
                try {
                    this.showExtensionLoadingMessage();
                    console.log('✅ showExtensionLoadingMessage 호출 완료');
                } catch (error) {
                    console.error('❌ showExtensionLoadingMessage 호출 실패:', error);
                }
            }
        } catch (error) {
            console.warn('Extension 유입 조기 감지 실패:', error);
        }
    }
}

// Create singleton instance
const extensionBridge = new ExtensionBridge();

// Export to window for backwards compatibility
window.extensionBridge = extensionBridge;
window.showExtensionLoadingMessage = () => extensionBridge.showExtensionLoadingMessage();
window.showUpdateNotification = (params) => extensionBridge.showUpdateNotification(params);

// Auto-check on script load
extensionBridge.checkExtensionSource();
