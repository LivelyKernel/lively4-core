## 2025-08-11 # Documentation and Git Line Status Feature Design
*Author: @JensLincke [with @BlindGoldie]*

- update lively server documentation: terminal and auth 
- create corresponding auth doc

## Git Line Status Visualization Feature Design
*Added: Design for line-level git change indicators in lively-editor*

**Objective**: Add color-coded gutter indicators showing:
- 🔴 **Red**: Unsaved changes (editor vs last saved)
- 🟠 **Orange**: Uncommitted changes (saved vs HEAD) 
- 🟢 **Green**: Unpushed changes (HEAD vs origin/branch)

**Technical Approach**:
- **Client-side diff-match-patch** instead of server-side git diff
- Leverage existing `lively4-server` file versioning via `fileversion` headers
- Integrate with existing `lively-code-mirror.js` gutter system
- Hook into current change detection in `lively-editor.js`

**Key Components**:
- **lively-editor.js**: Add `getLineChangeStatus()`, `getCommittedVersion()`, `getRemoteVersion()` 
- **lively-code-mirror.js**: Extend gutter with change markers using `setGutterMarker()`
- **Data sources**: `this.getText()`, `this.lastText`, `fetch(url, {headers: {fileversion: "HEAD"}})`, `fetch(url, {headers: {fileversion: "origin/branch"}})`

**Implementation Strategy**:
```javascript
// New methods in lively-editor.js
async getLineChangeStatus() {
  const dmp = new diff.diff_match_patch();
  const currentText = this.getText();
  const savedText = this.lastText || "";
  const committedText = await this.getCommittedVersion();
  const remoteText = await this.getRemoteVersion();
  
  return {
    unsaved: this.parseLineDiffs(dmp.diff_main(savedText, currentText)),
    uncommitted: this.parseLineDiffs(dmp.diff_main(committedText, savedText)), 
    unpushed: this.parseLineDiffs(dmp.diff_main(remoteText, committedText))
  };
}
```

**Advantages**:
- Uses existing `diff-match-patch.js` (already integrated)
- No new server endpoints needed (uses `git show` via `readFileVersion`)
- Client-side performance, no shell command overhead
- Integrates with existing change detection (`updateChangeIndicator()`)
- Works with current file watching system (`lively-change-watcher.js`)

**CodeMirror Integration Research**:
- ✅ **Analyzed existing gutter usage**: `leftgutter`, `rightgutter`, `CodeMirror-linenumbers`, `CodeMirror-lint-markers`
- ✅ **Found VSCode-style approach**: Use colored left borders on line numbers instead of separate gutter
- **API Methods**: `editor.setGutterMarker()`, `editor.clearGutter()` for traditional approach
- **Better approach**: Direct CSS styling of `.CodeMirror-linenumber` elements with colored borders

**Updated Implementation Strategy (VSCode-style)**:
```css
/* Add to lively-code-mirror.html */
.git-status-unsaved { border-left: 3px solid #ff4444 !important; }
.git-status-uncommitted { border-left: 3px solid #ff8800 !important; }  
.git-status-unpushed { border-left: 3px solid #00aa00 !important; }
```

```javascript
// In lively-code-mirror.js - style line numbers directly
updateGitStatusIndicators(changes) {
  // Clear existing classes
  this.editor.display.lineDiv.querySelectorAll('.CodeMirror-linenumber')
    .forEach(el => el.classList.remove('git-status-unsaved', 'git-status-uncommitted', 'git-status-unpushed'));
  
  // Apply git status classes
  changes.unsaved.forEach(lineNum => {
    const lineEl = this.editor.display.lineDiv.querySelector(`[data-line="${lineNum}"] .CodeMirror-linenumber`);
    if (lineEl) lineEl.classList.add('git-status-unsaved');
  });
}
```

**Benefits**:
- Matches VSCode user expectations
- No gutter configuration changes needed
- Clean CSS-only styling approach
- Better performance than DOM manipulation

**Implementation Progress**:
- [x] Research CodeMirror gutter API implementation details
- [x] Update design to use VSCode-style line number border approach  
- [x] **Added CSS styles** to `lively-code-mirror.html` for git status indicators
- [x] **Added JavaScript methods** to `lively-code-mirror.js`: `updateGitStatus()`, `updateGitStatusIndicators()`
- [x] **Added diff-match-patch integration** to `lively-editor.js`: `getLineChangeStatus()`, `parseLineDiffs()`
- [x] **Implemented unsaved changes detection** (red indicators)
- [x] **Created test file** `demos/claude/git-status-test.js` for verification

**Files Modified**:
- **Added**: [demos/claude/git-status-test.js](edit://demos/claude/git-status-test.js) - Test file for git status feature
- **Modified**: [src/components/widgets/lively-code-mirror.html](edit://src/components/widgets/lively-code-mirror.html) - Added CSS for git status styling
- **Modified**: [src/components/widgets/lively-code-mirror.js](edit://src/components/widgets/lively-code-mirror.js) - Added git status update methods, hooked into change events
- **Modified**: [src/components/tools/lively-editor.js](edit://src/components/tools/lively-editor.js) - Added line-level diff analysis and git version fetching methods

**Feature Status**: 
- ✅ **Unsaved changes** (red borders) - **WORKING** 🎉
- 🔶 **Uncommitted changes** (orange borders) - Scaffolded, ready for `getCommittedVersion()` integration
- 🔶 **Unpushed changes** (green borders) - Scaffolded, ready for `getRemoteVersion()` integration

**Implementation Complete**: 
- ✅ **VSCode-style red line indicators** now appear on unsaved changes
- ✅ **Real-time updates** trigger 500ms after editing
- ✅ **Clean production code** with debugging removed
- ✅ **Proper parent-child communication** between lively-code-mirror and lively-editor

**Debugging Issues Resolved**:
- Fixed parent component lookup (`lively.query(this, "lively-editor")`)
- Fixed diff parsing iteration bug in `parseLineDiffs()`  
- Fixed CSS class application to CodeMirror line numbers
- Confirmed module reloading picks up new methods

**Next Steps**:
- [x] Test initial implementation with live editing - **WORKING**
- [ ] Extend to uncommitted changes (implement `getCommittedVersion()` integration)  
- [ ] Add unpushed changes (implement `getRemoteVersion()` integration)
- [ ] Performance optimization and error handling
- [ ] Integration testing with existing editor features
