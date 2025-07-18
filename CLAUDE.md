# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AnnotateShot is a web-based image annotation tool that allows users to add numbers, shapes, text, and emojis to screenshots. It's a client-side only application built with vanilla JavaScript, hosted on GitHub Pages at alllogo.net.

## Development Commands

### Testing
- Open `test.html` in browser for automated feature testing
- Use VS Code Live Server (Go Live) extension for local testing
- No build process required - static files served directly

### Deployment
- Push to main branch triggers GitHub Pages deployment
- Custom domain configured via CNAME file (alllogo.net)

## Architecture Overview

### Core Application Structure
- **`index.html`**: Main application with embedded CSS and initialization scripts
- **`src/main.js`**: Core application logic (1,000+ lines of vanilla JavaScript)
- **`extension/`**: Chrome extension for webpage capture functionality
- **Static hosting**: No backend, all processing client-side

## Chrome Extension Architecture

### File Structure
```
extension/
├── manifest.json       # Extension configuration
├── popup.html         # Extension UI
├── popup.js          # UI event handling
├── background.js     # Service worker (background tasks)
└── content-script.js # Web page interaction
```

### Key Components

#### Manifest Configuration (manifest.json)
- **Manifest V3** for Chrome extensions
- **Permissions**: activeTab, tabs, scripting for capture functionality
- **Keyboard shortcuts**: 
  - Ctrl+Shift+V: Current view capture
  - Ctrl+Shift+S: Partial area capture  
  - Ctrl+Shift+F: Full page capture
- **Content Security Policy**: Ensures secure script execution

#### Background Script (background.js)
**Core Functions:**
- `captureVisibleArea()`: Captures current viewport using chrome.tabs.captureVisibleTab
- `captureFullPage()`: Coordinates scrolling capture with content script
- `capturePartialArea()`: Initiates drag-to-select functionality
- `openAnnotateShot()`: Opens editor with captured image data

**Key Features:**
- Service worker architecture for persistent background tasks
- Automatic content script injection with ping/pong verification
- Cross-tab communication using chrome.runtime.sendMessage
- localStorage-based image transfer to editor
- Error handling for restricted pages (chrome://, extension pages)

#### Content Script (content-script.js)
**Partial Capture Implementation:**
- Creates overlay with semi-transparent background (rgba(0,0,0,0.3))
- Implements drag-to-select with visual selection box
- Real-time selection rectangle updates during mouse movement
- Device pixel ratio consideration for high-DPI displays
- ESC key cancellation support

**Full Page Capture Implementation:**
- Calculates total document height vs viewport height
- Performs incremental scrolling with 300ms delays
- Captures each viewport section using background script
- Vertically stitches images using HTML5 Canvas
- Restores original scroll position after completion

**Image Processing:**
- `cropImage()`: Extracts selected area from full screenshot
- `mergeVerticalImages()`: Combines multiple screenshots into single image
- Canvas-based image manipulation with proper scaling

#### Popup Interface (popup.html + popup.js)
**UI Components:**
- Three capture buttons with icons and descriptions
- Real-time status messages with auto-hide functionality
- Platform-specific keyboard shortcut display (Ctrl vs Cmd)
- Responsive design with hover states and transitions

**User Experience:**
- Immediate feedback for all capture operations
- Automatic popup closure after successful captures
- Error handling with user-friendly messages

### Extension Integration with Main App

#### Loading Message System
- Extension-captured images detected via localStorage flag
- `showExtensionLoadingMessage()` displays user-friendly loading indicator
- Automatic message removal when image loading completes
- Multilingual support for loading messages

#### Communication Flow
1. **User triggers capture** (keyboard shortcut or popup button)
2. **Background script** coordinates capture type
3. **Content script** handles UI overlay and image processing
4. **Background script** opens AnnotateShot with captured data
5. **Main app** detects extension source and shows loading message
6. **Image loads** and editing begins normally

### Key Technical Concepts

**Canvas-Based Drawing System**
- HTML5 Canvas for all image manipulation and annotation rendering
- Device pixel ratio handling for high-DPI displays
- Efficient redrawing system that clears and redraws entire canvas on state changes

**State Management**
- Global variables for current modes, colors, sizes
- `clicks` array stores all annotation objects with type, position, and style data
- localStorage for user preference persistence
- Undo system via `undoStack` array

**Event-Driven Architecture**
- Mouse events (mousedown/mousemove/mouseup) drive drawing and dragging
- Keyboard shortcuts for power users (H/V for coordinate locking, Shift for number repetition)
- Mode switching changes available UI controls and event behavior

**Annotation Types**
- **Numbers**: Circular backgrounds with sequential numbering
- **Shapes**: Rectangles, circles, arrows with fill options (solid, blur, mosaic)
- **Text**: Prompted text input with font styling
- **Emojis**: Predefined set of 12 emojis

### Drawing Implementation Details

**Coordinate System**
- Uses `getMousePos()` to convert screen coordinates to canvas coordinates
- Accounts for canvas scaling and device pixel ratio
- Supports coordinate locking for precise alignment

**Drag and Drop System**
- `isMouseOverObject()` performs hit-testing on existing annotations
- Separate drag state management with offset calculations
- Works across all annotation types with type-specific positioning

**Image Processing**
- Supports multiple image sources: file upload, clipboard paste, default background
- Dynamic resizing with multiple preset options
- Mosaic effect implementation using ImageData pixel manipulation

## Multi-Language Support

**Translation System**
- Korean (ko) as primary language, English (en) as fallback
- Browser language detection with localStorage override
- `translate()` function with parameter interpolation
- Language selector updates both UI text and internal state

## Development Patterns

**Error Handling**
- Try-catch blocks around critical operations (image loading, canvas operations)
- Graceful fallbacks for unsupported features (clipboard access)
- User-friendly error messages via `messageDiv.textContent`

**Performance Optimizations**
- Debounced drawing during shape preview
- Conditional UI updates based on current mode
- Memory management for temporary canvas operations

**Mobile Responsiveness**
- Responsive sidebar that collapses on mobile
- Touch event compatibility
- Mobile-specific menu overlay system

## File Relationships

### Core Dependencies
- `index.html` loads `src/main.js` and contains all styling
- Material Icons and Google Fonts loaded from CDN
- No package management or build tools

### Supporting Tools
- `test.html`: Automated testing interface with `src/test-automation-v2.js`
- `delcodelinenum.html`: Standalone utility for removing line numbers from code
- `changelog.html`: Version history and release notes

### Configuration Files
- `CNAME`: Custom domain configuration
- `ads.txt`: Google AdSense verification
- No package.json, webpack, or other build configuration

## User Settings and Persistence

**localStorage Schema**
```javascript
{
  mode: string,           // Current annotation mode
  color: string,          // Selected color
  size: string,           // Annotation size
  shape: string,          // Selected shape type
  fillType: string,       // Fill option for shapes
  lineWidth: string,      // Line thickness
  clicks: Array,          // All annotation objects
  clickCount: number,     // Total clicks made
  shapeCount: number      // Total shapes drawn
}
```

**Theme System**
- CSS custom properties for light/dark themes
- Theme preference saved to localStorage
- Dynamic theme switching without page reload

## Common Development Tasks

### Adding New Annotation Types
1. Add new mode option to `modeSelector` in index.html
2. Implement drawing function following existing patterns
3. Add hit-testing logic in `isMouseOverObject()`
4. Update mode control visibility in `updateControlsVisibility()`
5. Add translations for new mode

### Modifying Drawing Behavior
- Core drawing logic in `redrawCanvas()` function
- Shape-specific rendering in individual draw functions
- Mouse event handling in canvas event listeners
- Preview drawing for shapes in `drawShapePreview()`

### Styling Updates
- CSS custom properties for consistent theming
- Mode-specific control visibility managed by JavaScript
- Responsive design handled through CSS media queries