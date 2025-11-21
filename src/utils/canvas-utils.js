/**
 * Canvas Utilities
 * Helper functions for canvas operations
 */

/**
 * Get device pixel ratio for high-DPI displays
 * @returns {number}
 */
function getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
}

/**
 * Setup canvas with proper resolution for high-DPI displays
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} width - Display width
 * @param {number} height - Display height
 * @returns {CanvasRenderingContext2D}
 */
function setupCanvas(canvas, width, height) {
    const dpr = getDevicePixelRatio();

    // Set display size
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Set actual size in memory (scaled for retina)
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Get context and scale for high-DPI
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    return ctx;
}

/**
 * Clear canvas completely
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
function clearCanvas(ctx, canvas) {
    const dpr = getDevicePixelRatio();
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
}

/**
 * Get mouse position relative to canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {MouseEvent} event - Mouse event
 * @returns {{x: number, y: number}}
 */
function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX / getDevicePixelRatio(),
        y: (event.clientY - rect.top) * scaleY / getDevicePixelRatio()
    };
}

/**
 * Create an offscreen canvas for caching
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}}
 */
function createOffscreenCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    return { canvas, ctx };
}

/**
 * Convert canvas to blob
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} type - Image type (e.g., 'image/png')
 * @param {number} quality - Image quality (0-1)
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas, type = 'image/png', quality = 1.0) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, type, quality);
    });
}

/**
 * Download canvas as image file
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} filename - Output filename
 * @param {string} type - Image type (e.g., 'image/png')
 */
function downloadCanvas(canvas, filename, type = 'image/png') {
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, type);
}

// Export functions globally
window.canvasUtils = {
    getDevicePixelRatio,
    setupCanvas,
    clearCanvas,
    getMousePos,
    createOffscreenCanvas,
    canvasToBlob,
    downloadCanvas
};
