## 2025-08-18 #Caching and #Terminal

## File Content Caching Performance Fix #optimization #git #performance
*Author: @JensLincke [with @BlindGoldie]*

Implemented file content caching mechanism to eliminate redundant file loads during typing sessions.

- **Modified**: [lively-editor.js](edit://src/components/tools/lively-editor.js) - Added file content caching system
- **Modified**: [lively-change-watcher.js](edit://src/components/widgets/lively-change-watcher.js) - SYNC cache invalidation
- **Feature**: `getCachedFileContent(url, branch)` method with Map-based multi-entry cache
- **Feature**: Cache invalidation on URL changes and SYNC events

**Technical details:**
- Cache keyed by `URL:branch` combination using Map for multiple entries
- `getLineChangeStatus()` now uses cached content instead of `files.loadFile()` calls
- `invalidateFileContentCache()` method for explicit cache clearing
- SYNC events trigger cache invalidation before git status updates

**Performance improvement:**
- Eliminated redundant file loads on every keystroke during git status updates
- First call loads and caches HEAD + remote branch versions
- Subsequent typing uses cached content for instant git status calculation
- SYNC events properly invalidate cache to ensure accurate remote status

**Integration points:**
- `setURL()` automatically invalidates cache when file changes
- `updateGitStatusForFile()` clears cache before SYNC-triggered status updates
- Maintains compatibility with existing git status color indicators

## Terminal Service Enhancement and Authentication Refactoring #terminal #auth #refactoring
*Author: @JensLincke [with @BlindGoldie]*

Implemented major enhancements to the Lively4 terminal service infrastructure, adding non-interactive command execution capabilities and consolidating authentication code across multiple components.

### Terminal Service Non-Interactive Run Functionality

**Added**: [terminal.js](edit://src/services/terminal.js) - New `run` and `runCommand` methods
**Added**: [server-auth.js](edit://src/client/server-auth.js) - Centralized authentication utilities
**Modified**: [terminal.js](edit://src/client/terminal.js) - Client-side non-interactive terminal interface


**Feature**: Non-interactive command execution via HTTP POST to `/_terminal/run`
- Uses `child_process.exec` for direct command execution without PTY sessions
- Returns `{stdout, stderr, error}` format matching `utils.js` pattern
- Same session-based authentication as interactive terminal endpoints
- Large buffer support (1024 * 2000 * 100) for handling extensive output

**Technical details:**
- Server endpoint: `POST /_terminal/run` with `{command: "..."}` JSON body
- Client API: `terminal.run(command)` and `terminal.exec(command)` methods
- Authentication handled via existing GitHub OAuth + server session flow
- Comprehensive test suite covering stdout/stderr, exit codes, pipes, error handling

### Authentication Refactoring

**Created**: [server-auth.js](edit://src/client/server-auth.js) - Centralized authentication module
**Refactored**: [terminal.js](edit://src/client/terminal.js), [lively-xterm.js](edit://src/components/tools/lively-xterm.js), [lively-sync.js](edit://src/components/tools/lively-sync.js)

**Major consolidation**: Eliminated ~180 lines of duplicate authentication code across three components by extracting common patterns into `ServerAuth` class.

**ServerAuth API**:
- `ensureAuthenticated(serverUrl)` - Full GitHub OAuth + server login flow
- `getAuthHeaders(cwd)` - Get cached credentials for requests
- `loadCredentials()` / `storeCredentials()` - Credential management
- `clearCredentials()` - Logout functionality
- `extractServerBaseURL(url)` - Static utility for URL processing
- Supports both silent (headless) and UI notification modes

**Component updates**:
- **terminal.js**: Now uses `ServerAuth` in silent mode, 60+ lines removed
- **lively-xterm.js**: Uses `ServerAuth` with UI notifications, 80+ lines removed  
- **lively-sync.js**: Refactored login method to use `ServerAuth`, 40+ lines removed

**Integration**: All components maintain backwards compatibility while sharing common authentication infrastructure. Same storage keys (`LivelySync_githubUsername`, etc.) and GitHub OAuth flow preserved.

**Testing**: 
- Server endpoint verified on port 9005: `curl -X POST http://localhost:9005/_terminal/run -H "Content-Type: application/json" -d '{"command": "echo test"}'`
- Client-side functionality tested in browser environment with MCP evaluation
- All terminal test suites passing (15 tests, 0 failures)

**TODO**: 
- [ ] Consider adding MCP tools for special URL schemes (`open://`, `edit://`, `browse://`) to support direct file operations
- [ ] Explore extending non-interactive terminal for batch operations

This enhancement provides both programmatic command execution capabilities and cleaner, more maintainable authentication code across the Lively4 ecosystem.

