# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AnnotateShot is a web-based image annotation tool that allows users to add numbers, shapes, text, and emojis to screenshots. It's a client-side only application built with vanilla JavaScript, hosted on GitHub Pages at alllogo.net.

## Development Commands

### Testing
- Open `test.html` in browser for automated feature testing
- No build process required - static files served directly

### Deployment
- Push to main branch triggers GitHub Pages deployment
- Custom domain configured via CNAME file (alllogo.net)

## Architecture Overview

### Core Application Structure
- **`index.html`**: Main application with embedded CSS and initialization scripts
- **`src/main.js`**: Core application logic (1,000+ lines of vanilla JavaScript)
- **Static hosting**: No backend, all processing client-side

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