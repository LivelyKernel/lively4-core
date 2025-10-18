## 2025-08-07 File Change System Refactoring and Container-Independent Updates #refactoring #file-watcher #changes #collaboration

*Author: @JensLincke [with @BlindGoldie]*

Completed major refactoring of file change handling system to support container-independent updates and improved UI controls for collaborative development workflows.

- **Added**: [src/client/changes.js](edit://src/client/changes.js) - Centralized file change management
- **Modified**: [src/components/tools/lively-container.js](edit://src/components/tools/lively-container.js) - Extracted logic, added reloadContent() with undo history preservation
- **Modified**: [src/components/widgets/lively-change-watcher.js](edit://src/components/widgets/lively-change-watcher.js) - Added apply mode dropdown UI and container-independent change handling
- **Modified**: [src/components/widgets/lively-change-watcher.html](edit://src/components/widgets/lively-change-watcher.html) - Added dropdown controls and styling
- **Feature**: Container-independent file change application using `LivelyChanges.applyContainerChanges(null, url, sourceCode, false)`
- **Feature**: Smart undo history preservation in `reloadContent()` by comparing content before reload
- **UI**: Dropdown control with "Off | Only Open | All" modes for file change behavior

**Technical details:**
- Extracted `calculateContentHash()`, `updateOtherContainers()`, and file-type specific update methods to `changes.js`
- Implemented SHA-1 content hashing for change deduplication using `crypto.subtle.digest('SHA-1', data)`
- Added `applyContainerChanges(container, url, sourceCode, force)` method that works with or without container context
- File type detection via `getFileType()` and `isTestFile()` for routing updates appropriately
- Template updates now work without open containers using `lively.updateTemplate(sourceCode, url)`
- System-wide container synchronization through centralized `updateOtherContainers(url, excludeContainer)`
- Content comparison in `reloadContent()` to skip unnecessary editor reloads and preserve CodeMirror undo history

**Container-independent update modes:**
- **off**: No automatic file change processing
- **only-open**: Updates only containers with open files (original behavior) 
- **all**: Updates open containers AND applies changes to files without containers (templates, modules, etc.)

**TODO**: 
- [ ] #TODO Extend module loading capabilities for container-independent JavaScript updates
- [ ] #TODO Add CSS hot-reloading without container context