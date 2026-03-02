# Tasks

For Human/Agent team:


- [X] fix test running tool "run-tests tool failed: Error: Failed to run tests: Cannot read properties of null (reading 'length')"
- [X] in opencode get rid of "No messages yet. Start the conversation!" after first message
- [X] find out how permissions work in opencode server mode and if wee need to implement something
- [ ] continue work on [AI/Workspace](doc/ai-workspace-tasks.md)
- [ ] follow up on [ideas](doc/ideas.md)
- [X] normalize links in lively agent board
- [X] don't show the URL Project Focus in the board anyway
- [X] tally tool usages and files written/read
- [X] rendering in agent-board: components/lively-chat-sessions.js [object Object]
- [X] when writing in opencode, always show details
- [X] Tom's suggestion: use positive examples instead of negative ones, e.g. "don't use git revert"
- [X] in lively-opencode: start server, should check if server is actually running.... 
- [ ] auto-commit current agent changes and provides points to jump back
- [X] implement auto session naming again.... 

## Refactoring & Bug Fixes

See [doc/refactoring.md](doc/refactoring.md) for detailed refactoring tasks and architecture improvements.

**Current open refactoring tasks:**
- [ ] Message rendering duplication (#6, #7 in refactoring.md)
- [ ] Auto-scroll message container (#16 in refactoring.md)
- [ ] Session metadata sync (#17 in refactoring.md)
- [ ] Method render double bug (#18 in refactoring.md)
- [ ] Voice chat timestamp issues (#19 in refactoring.md)


- [] Issue with lots of "Bye" etc... in chat: Overly Sensitive VAD (Voice Activity Detection) 
  - The "server_vad" mode might be interpreting short pauses or background noise as the end of your turn, leading it to conclude the conversation prematurey. 
  - Solution: Adjust the silence threshold in your server_vad settings if you are using the API, or speak more continuously.
  - docs: https://developers.openai.com/api/docs/guides/realtime-vad/