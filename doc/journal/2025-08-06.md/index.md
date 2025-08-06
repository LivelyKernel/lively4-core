## 2025-08-06 Real-time Collaboration Infrastructure #filewatch #agents #collaboration
*Author: @JensLincke with @BlindGoldie*

Implemented [`lively-change-watcher`](open://lively-change-watcher) component for real-time file system monitoring and automatic editor synchronization.

- **Added**: [src/components/widgets/lively-change-watcher.js](edit://src/components/widgets/lively-change-watcher.js), [.html](edit://src/components/widgets/lively-change-watcher.html)
- **Modified**: [src/client/contextmenu.js](edit://src/client/contextmenu.js) - added Tools menu entry
- **WebSocket**: Connection to `/_filewatch` endpoint for real-time file events
- **Auto-discovery**: Uses `SearchRoots.getSearchRoots()` + current `lively4url` directory
- **Container sync**: Updates `lively-container` elements without unsaved changes, warns for those with unsaved changes
- **Path resolution**: Uses `lively.files.resolve()` for `edit://` URLs with `..` navigation
- **UI**: Clickable file links, color-coded events (CREATE/DELETE/CHANGE), connection status

**TODO**: 

- [ ] #TODO Improve `container.setPath()` reload mechanism for better editor state preservation.