# Tasks


<lively-import src="_navigation.html"></lively-import>


For Human/Agent team:

- [x] **Fix MCP test runner reporting**: Reports only subset of tests (e.g., 8 out of 31 tests in openai-realtime-chat-test.js). Tests execute correctly but count is wrong. Need to investigate test result collection in lively-mcp component or MCP server test handler.
- [x] fix test running tool "run-tests tool failed: Error: Failed to run tests: Cannot read properties of null (reading 'length')"
- [x] in opencode get rid of "No messages yet. Start the conversation!" after first message
- [x] find out how permissions work in opencode server mode and if wee need to implement something
- [ ] continue work on [AI/Workspace](doc/ai-workspace-tasks.md)
- [X] Fix ESC behavior: should interrupt tool calls and halt at correct position (not halting at right position currently)
- [x] normalize links in lively agent board
- [x] tally tool usages and files written/read
- [x] rendering in agent-board: components/lively-chat-sessions.js [object Object]
- [x] when writing in opencode, always show details
- [x] Tom's suggestion: use positive examples instead of negative ones, e.g. "don't use git revert"
- [x] in lively-opencode: start server, should check if server is actually running....
- [x] auto-commit current agent changes and provides points to jump back
- [x] implement auto session naming again....
- [x] the diff view in file edit tool calls don't show the whitespace at the moment
- [X] render startTask
  
  ``` 
  types step-start, reasoning, tool, step-finish
  ▶️ step-start
  💭 Thinking...
  📖 openai-realtime-chat.js (from line 1524)
  ⏹️ step-finish
  ```
- preview one line of details in 💭 Thinking...



## API Development

### lively.search Implementation

**Goal:** Create unified search API following lively.files conventions

#### lively.search.files - Filename Search
- [ ] Implement `lively.search.files(pattern, options)` for searching filenames
  - **Focus:** Filename search only (NOT content search)
  - **Default behavior:** Search in `lively4url` (current working directory)
  - **Options:**
    - `paths` - array of root directories to search (default: `[lively4url]`)
    - `recursive` - search subdirectories (default: `true`)
    - `type` - filter by 'file', 'directory', or 'both'
    - Pattern matching: support glob patterns and regex
  - **Conventions:** Follow lively-index-search patterns
    - Sensible defaults for ordering (alphabetical or by modification time)
    - Automatic filtering of common excludes (e.g., `_marker/`, `_trash/`)
    - Support for `ExtraSearchRoots` preference
    - Return `ResultSet` for composability
  - **Integration:** Use `lively.files.walkDir()` for filesystem traversal
  - **Naming:** Follow lively.files conventions (no redundant prefixes)

#### Future: Content and Structure Search
- [ ] `lively.search.content(query, options)` - Search file contents
- [ ] `lively.search.classes(query, options)` - Search class definitions
- [ ] `lively.search.methods(query, options)` - Search methods
- [ ] `lively.search.functions(query, options)` - Search functions

---


## Refactoring & Bug Fixes

See [doc/refactoring.md](doc/refactoring.md) for detailed refactoring tasks and architecture improvements.

**Current open refactoring tasks:**
- [X] Message rendering duplication (#6, #7 in refactoring.md)
- [X] Auto-scroll message container (#16 in refactoring.md)
- [X] Session metadata sync (#17 in refactoring.md)
- [X] Method render double bug (#18 in refactoring.md)
- [X] Voice chat timestamp issues (#19 in refactoring.md)


- [] Issue with lots of "Bye" etc... in chat: Overly Sensitive VAD (Voice Activity Detection) 
  - The "server_vad" mode might be interpreting short pauses or background noise as the end of your turn, leading it to conclude the conversation prematurey. 
  - Solution: Adjust the silence threshold in your server_vad settings if you are using the API, or speak more continuously.
  - docs: https://developers.openai.com/api/docs/guides/realtime-vad/