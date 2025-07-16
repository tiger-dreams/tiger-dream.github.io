// popup.js - 팝업 UI 이벤트 처리

document.addEventListener('DOMContentLoaded', () => {
    const captureBtn = document.getElementById('capture-visible');
    const capturePartialBtn = document.getElementById('capture-partial');
    const captureFullBtn = document.getElementById('capture-full');
    const statusDiv = document.getElementById('status');
    
    // 상태 메시지 표시 함수
    function showStatus(message, duration = 2000) {
        statusDiv.textContent = message;
        statusDiv.classList.add('show');
        setTimeout(() => {
            statusDiv.classList.remove('show');
        }, duration);
    }
    
    // 현재 화면 캡처 버튼 클릭
    captureBtn.addEventListener('click', () => {
        showStatus('현재 화면을 캡처 중...');
        
        // 백그라운드 스크립트에 캡처 요청
        chrome.runtime.sendMessage({
            action: 'captureVisible'
        }, (response) => {
            if (response && response.success) {
                showStatus('캡처 완료! 편집기로 이동합니다.');
                setTimeout(() => window.close(), 500);
            } else {
                showStatus('캡처 실패: ' + (response?.error || '알 수 없는 오류'));
            }
        });
    });
    
    // 부분 영역 캡처 버튼 클릭
    capturePartialBtn.addEventListener('click', () => {
        showStatus('영역을 드래그하여 선택하세요.');
        
        // 백그라운드 스크립트에 부분 캡처 요청
        chrome.runtime.sendMessage({
            action: 'capturePartial'
        }, (response) => {
            if (response && response.success) {
                showStatus('캡처 완료! 편집기로 이동합니다.');
                setTimeout(() => window.close(), 500);
            } else {
                showStatus('캡처 실패: ' + (response?.error || '알 수 없는 오류'));
            }
        });
        
        // 팝업 닫기 (사용자가 영역을 선택할 수 있도록)
        setTimeout(() => window.close(), 100);
    });
    
    // 전체 페이지 캡처 버튼 클릭
    captureFullBtn.addEventListener('click', () => {
        showStatus('전체 페이지를 캡처 중...');
        
        // 백그라운드 스크립트에 전체 페이지 캡처 요청
        chrome.runtime.sendMessage({
            action: 'captureFullPage'
        }, (response) => {
            if (response && response.success) {
                showStatus('캡처 완료! 편집기로 이동합니다.');
                setTimeout(() => window.close(), 500);
            } else {
                showStatus('캡처 실패: ' + (response?.error || '알 수 없는 오류'));
            }
        });
    });
    
    // 단축키 표시 (Mac에서는 Cmd 표시)
    if (navigator.platform.indexOf('Mac') > -1) {
        document.querySelectorAll('.shortcut').forEach(shortcut => {
            shortcut.textContent = shortcut.textContent.replace('Ctrl', 'Cmd');
        });
    }
});