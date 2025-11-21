/**
 * Scroll Utilities
 * Centralized scroll management functions
 */

/**
 * Reset canvas container scroll position to top-left
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {boolean} disableScrollRestoration - Whether to disable browser scroll restoration
 */
function resetCanvasScroll(canvas, disableScrollRestoration = false) {
    const scrollToTop = () => {
        const canvasContainer = canvas.parentElement;
        if (canvasContainer && canvasContainer.classList.contains('canvas-container')) {
            // Strong scroll reset
            canvasContainer.scrollTop = 0;
            canvasContainer.scrollLeft = 0;

            // Disable browser scroll restoration feature
            if (disableScrollRestoration && 'scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
            }
        }

        // Reset all possible scroll containers
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        window.scrollTo(0, 0);

        const canvasArea = document.querySelector('.canvas-area');
        if (canvasArea) {
            canvasArea.scrollTop = 0;
            canvasArea.scrollLeft = 0;
        }

        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTop = 0;
            mainContent.scrollLeft = 0;
        }
    };

    // Execute multiple times to ensure scroll reset
    scrollToTop();
    setTimeout(scrollToTop, 10);
    setTimeout(scrollToTop, 50);
    setTimeout(scrollToTop, 100);
}

/**
 * Simple scroll to top for all containers
 */
function scrollToTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo(0, 0);
}

/**
 * Scroll specific element to top-left
 * @param {HTMLElement} element - Element to scroll
 */
function scrollElementToTop(element) {
    if (element) {
        element.scrollTop = 0;
        element.scrollLeft = 0;
    }
}

// Export functions globally for backwards compatibility
window.resetCanvasScroll = resetCanvasScroll;
window.scrollToTop = scrollToTop;
window.scrollElementToTop = scrollElementToTop;
