const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('image-loader');
const emojiPicker = document.querySelector('.emoji-picker');
const sizeSlider = document.getElementById('size-slider');
const emojiPreview = document.getElementById('emoji-preview');
const downloadBtn = document.getElementById('download-btn');
const undoBtn = document.getElementById('undo-btn');

let image = null;
let emojis = [];
let emojiHistory = []; // To store states for undo
let selectedEmoji = null;
let activeEmoji = null;

let isDragging = false;
let draggedEmoji = null;
let dragStartX = 0;
let dragStartY = 0;
let emojiStartX = 0;
let emojiStartY = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image) {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
    emojis.forEach(emoji => {
        ctx.font = `${emoji.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji.text, emoji.x, emoji.y);
    });
}

function handleImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        image = new Image();
        image.onload = () => {
            const maxWidth = window.innerWidth * 0.6; // Use 60% of the window width as max
            let newWidth = image.width;
            let newHeight = image.height;

            if (newWidth > maxWidth) {
                const scale = maxWidth / newWidth;
                newWidth = maxWidth;
                newHeight = image.height * scale;
            }

            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // Clear emojis and history when new image is loaded
            emojis = [];
            emojiHistory = [];
            activeEmoji = null; // Reset active emoji

            // Ensure an emoji is selected after image load
            const initialEmoji = emojiPicker.querySelector('span');
            if (initialEmoji) {
                const lastSelected = emojiPicker.querySelector('.selected');
                if (lastSelected) {
                    lastSelected.classList.remove('selected');
                }
                initialEmoji.classList.add('selected');
                selectedEmoji = initialEmoji.textContent;
                updateEmojiPreview();
            }

            draw();
        };
        image.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateEmojiPreview() {
    if (selectedEmoji) {
        emojiPreview.textContent = selectedEmoji;
    }
    emojiPreview.style.fontSize = `${sizeSlider.value}px`;
}

// Paste image from clipboard
document.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            handleImage(blob);
            break;
        }
    }
});

// Load image from file input
imageLoader.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImage(e.target.files[0]);
    }
});

// Select emoji
emojiPicker.addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
        const lastSelected = emojiPicker.querySelector('.selected');
        if (lastSelected) {
            lastSelected.classList.remove('selected');
        }
        e.target.classList.add('selected');
        selectedEmoji = e.target.textContent;
        updateEmojiPreview(); // Update preview on new emoji selection
    }
});

// Handle mouse down for adding new emoji or starting drag
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if an existing emoji is clicked (iterate in reverse to check top-most first)
    for (let i = emojis.length - 1; i >= 0; i--) {
        const emoji = emojis[i];
        // Simple hit test: check if mouse is within a square around the emoji's center
        const hitRadius = emoji.size / 2; // Adjust as needed
        if (mouseX >= emoji.x - hitRadius && mouseX <= emoji.x + hitRadius &&
            mouseY >= emoji.y - hitRadius && mouseY <= emoji.y + hitRadius) {
            
            // Save current state for undo before dragging
            emojiHistory.push([...emojis]);

            isDragging = true;
            draggedEmoji = emoji;
            dragStartX = mouseX;
            dragStartY = mouseY;
            emojiStartX = emoji.x;
            emojiStartY = emoji.y;
            activeEmoji = emoji; // Make dragged emoji active for size adjustment
            return; // Stop checking after finding one
        }
    }

    // If no existing emoji is clicked, add a new one
    if (selectedEmoji) {
        const newEmoji = {
            text: selectedEmoji,
            x: mouseX,
            y: mouseY,
            size: parseInt(sizeSlider.value)
        };
        emojiHistory.push([...emojis]); // Save current state before adding new emoji
        emojis.push(newEmoji);
        activeEmoji = newEmoji;
        draw();
    } else {
        alert('먼저 이모지를 선택해주세요!');
    }
});

// Handle mouse move for dragging
canvas.addEventListener('mousemove', (e) => {
    if (isDragging && draggedEmoji) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        draggedEmoji.x = emojiStartX + (mouseX - dragStartX);
        draggedEmoji.y = emojiStartY + (mouseY - dragStartY);
        draw();
    }
});

// Handle mouse up to stop dragging
canvas.addEventListener('mouseup', () => {
    isDragging = false;
    draggedEmoji = null;
});

// Handle mouse out to stop dragging if mouse leaves canvas
canvas.addEventListener('mouseout', () => {
    isDragging = false;
    draggedEmoji = null;
});

// Adjust emoji size
sizeSlider.addEventListener('input', (e) => {
    updateEmojiPreview();
    if (activeEmoji) {
        activeEmoji.size = parseInt(e.target.value);
        draw();
    }
});

// Download image
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'emoji-sticker-image.png';
    link.href = canvas.toDataURL();
    link.click();
});

undoBtn.addEventListener('click', () => {
    if (emojiHistory.length > 0) {
        emojis = emojiHistory.pop(); // Revert to previous state
        if (emojis.length === 0) { // If no emojis left, clear active emoji
            activeEmoji = null;
        } else { // If emojis remain, set active emoji to the last one
            activeEmoji = emojis[emojis.length - 1];
        }
        draw();
    }
});

// Keyboard shortcut for undo (Ctrl+Z or Cmd+Z)
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault(); // Prevent default browser undo behavior
        undoBtn.click(); // Trigger the undo button click
    }
});

// Set initial emoji and update preview (runs only once on page load)
const initialEmojiOnLoad = emojiPicker.querySelector('span');
if (initialEmojiOnLoad) {
    initialEmojiOnLoad.classList.add('selected');
    selectedEmoji = initialEmojiOnLoad.textContent;
    updateEmojiPreview();
}