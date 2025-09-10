# Journal Entry: 2025-09-10

## 2025-09-10 Added Zooming Support #zooming #html-utils #claude-conversations
*Author: @JensLincke with @BlindGoldie*

Added CTRL+scroll zooming functionality to Lively4 components. Components can now be zoomed in/out using CTRL+mouse wheel.

- **Added**: [html.js](edit://src/client/html.js) - New `Zooming` class for reusable zoom functionality
- **Modified**: [lively-claude-conversations.js](edit://src/components/tools/lively-claude-conversations.js) - First component to use the new zooming feature

**Feature**: CTRL+scroll wheel zooming with configurable zoom bounds and automatic state preservation during live reloading.