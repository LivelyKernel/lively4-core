# AI Workspace Tasks - To-Do List

## Overview

This document tracks tasks related to implementing task division between the voice agent and code agent, and improving the AI workspace architecture.

**Status:** Active Development
**Created:** 2026-02-09
**Last Updated:** 2026-02-09

---

## Current Status

### Completed ✅
- [x] Documented current architecture in `ai-workspace.md`
- [x] Created `ai-workspace-modes.md` with task division strategies
- [x] Created `ai-workspace-tasks.md` as to-do list
- [x] Identified voice agent has `evaluate_code` capability
- [x] Mapped current capabilities of both agents

### In Progress 🔄
- [ ] Review architecture proposal with code agent
- [ ] Investigate write tool "pending" issue reported by user

### Blocked ⛔
- None currently

---

## Phase 1: Foundation - Simple Local-First Mode

**Goal:** Voice agent handles simple evaluations, forwards complex tasks

### Tasks

#### Research & Analysis
- [ ] Audit all current task types sent to code agent
- [ ] Categorize by complexity (simple/medium/complex)
- [ ] Measure current latency for different task types
- [ ] Document success/failure patterns

#### Implementation
- [ ] Create `isSimpleExpression(message)` helper function
- [ ] Implement basic routing logic in voice agent
- [ ] Add `handleLocally(message)` method
- [ ] Wire up decision point in message handler

#### Testing
- [ ] Test math expressions: `3 + 4`, `Math.sqrt(16)`
- [ ] Test DOM queries: `document.querySelectorAll('lively-window').length`
- [ ] Test Lively API calls: `lively.components.list()`
- [ ] Test edge cases (syntax errors, undefined variables)
- [ ] Verify fallback to code agent works

#### Documentation
- [ ] Add inline comments explaining routing decisions
- [ ] Update CLAUDE.md with task division info
- [ ] Add examples to ai-workspace-modes.md

#### Metrics
- [ ] Add logging for routing decisions
- [ ] Track: local vs remote execution ratio
- [ ] Measure: latency improvements
- [ ] Monitor: error rates by handler

---

## Phase 2: Capability-Based Routing

**Goal:** Route based on required tools/capabilities

### Tasks

#### Design
- [ ] Create tool capability registry
  - [ ] Browser tools: `evaluate_code`, DOM, Lively APIs
  - [ ] MCP tools: `bash`, `read`, `write`, `grep`, `glob`, `git`
  - [ ] Coordination: workspace API methods
- [ ] Design `analyzeRequiredTools(message)` algorithm
- [ ] Define fallback strategies for ambiguous cases

#### Implementation
- [ ] Create `ToolCapabilityRegistry` class
- [ ] Implement `analyzeRequiredTools(message)` 
- [ ] Add capability-based routing logic
- [ ] Implement smart fallback handling

#### Testing
- [ ] Test browser-only tasks route locally
- [ ] Test MCP-required tasks route to code agent
- [ ] Test ambiguous tasks (verify fallback)
- [ ] Performance testing for analysis overhead

#### Documentation
- [ ] Document tool registry structure
- [ ] Add capability mapping table
- [ ] Document routing decision tree

---

## Phase 3: Advanced Heuristics

**Goal:** Add complexity estimation and multi-step detection

### Tasks

#### Design
- [ ] Define complexity levels (low/medium/high)
- [ ] Create multi-step task detection patterns
- [ ] Design heuristics for natural language analysis

#### Implementation
- [ ] Implement `estimateComplexity(message)`
- [ ] Add multi-step detection (keywords: "and then", "after that")
- [ ] Integrate complexity into routing decision
- [ ] Add performance profiling

#### Testing
- [ ] Test single-step queries (should be local)
- [ ] Test multi-step workflows (should forward)
- [ ] Test edge cases (complex single-step vs simple multi-step)
- [ ] Benchmark complexity estimation performance

---

## Phase 4: User Control & Transparency

**Goal:** Allow users to control and understand task routing

### Tasks

#### Design
- [ ] Design mode selection UI (Quick/Full/Auto)
- [ ] Design visual indicators for routing
- [ ] Create voice commands for mode switching
- [ ] Design feedback mechanism for routing decisions

#### Implementation
- [ ] Add `operationMode` property to workspace
- [ ] Implement mode switching logic
- [ ] Add visual mode indicator
- [ ] Implement voice command handlers
- [ ] Add routing decision logging to UI

#### Testing
- [ ] Test mode switching via UI
- [ ] Test mode switching via voice
- [ ] Verify mode persists across sessions
- [ ] Test visual indicators appear correctly

#### Documentation
- [ ] User guide for operation modes
- [ ] Explain when to use each mode
- [ ] Document voice commands

---

## Phase 5: Optimization & Refinement

**Goal:** Fine-tune performance and reliability

### Tasks

#### Performance
- [ ] Benchmark current vs. new implementation
- [ ] Identify bottlenecks
- [ ] Optimize routing decision speed
- [ ] Reduce overhead of analysis

#### Reliability
- [ ] Implement comprehensive error handling
- [ ] Add retry logic for failed local execution
- [ ] Add timeout handling
- [ ] Implement graceful degradation

#### Testing
- [ ] Load testing (many rapid queries)
- [ ] Stress testing (complex queries)
- [ ] Error injection testing
- [ ] Edge case testing

#### Documentation
- [ ] Performance benchmarks
- [ ] Known limitations
- [ ] Troubleshooting guide

---

## Bug Fixes & Issues

### High Priority 🔴
- [ ] **Investigate write tool pending issue**
  - User reports: "write still pending" after file write tasks
  - Check: Tool execution status not updating?
  - Check: EventSource connection issues?
  - Check: Server-side processing delays?
  - Test: Simple write operation end-to-end

### Medium Priority 🟡
- [ ] Verify consistency between voice and code agent results
  - Test same queries with both agents
  - Document any differences
  - Add validation for critical operations

### Low Priority 🟢
- [ ] Optimize event capture memory usage
  - Currently unbounded `_eventCapture` array
  - Add size limit or cleanup strategy
- [ ] Clean up commented code in components
  - Remove old debug logging
  - Remove disabled features or fix them

---

## Work Contexts (aka Context-Switching Prompts)

**Concept:** Selectable, named prompt snippets that inject dynamic working context into the agent at send-time, without editing files. Replaces the pattern of editing CLAUDE.md or FOCUS.md when switching focus between sub-tasks or bugs.

**Name candidates considered:** Focus Prompts, Prompt Presets, Agent Contexts → chosen: **Work Contexts**

**Existing seed:** `src/config/prompts/ai-workspace-audio-chat.txt` loaded via `lively.files.loadFile()` — already a file-based prompt system, but hardcoded, no UI.

**What's needed:**
- [ ] Define storage format — `.txt` files in `src/config/prompts/` (already exists) or structured JSON with name/description/content
- [ ] UI: dropdown/selector in `lively-opencode` and/or `lively-ai-workspace` toolbar to pick active context
- [ ] Injection point: prepend selected context to outgoing message (or set as system prefix)
- [ ] Use case: "I'm now working on the streaming rendering bug" → select "opencode-streaming-bug" context that tells the agent which files to look in, what the current hypothesis is, etc.
- [ ] Bonus: auto-suggest contexts based on current session topic

**Bug tracked via this feature:** Final "done" message not rendered during live streaming (renders fine on session switch). Root cause candidates: `step-finish` events ignored in `updateOpenCodePart()`, race between final text part update and async markdown init in `renderOpenCodeParts()`.

---

## Architecture Improvements & Refactoring

**See [refactoring.md](refactoring.md) for complete architecture refactoring tasks.**

Most architecture improvements have been completed:
- ✅ Extract `WorkspaceBlackboard` class
- ✅ Extract `MessageWidgetManager` class  
- ✅ Standardize event dispatching patterns
- ✅ Standardize container names (`#messagesContainer`)
- ✅ Standardize method names across components
- ✅ Removed duplicate `updateOpenCodeMessage` in workspace
- ✅ Renamed `updateOpenCodeMessagesDebugState` → `updateMessagesDebugState`

**Remaining tasks:**
- [ ] Unify `setMessage()` APIs in lively-chat-message
- [ ] Create extensible tool parser registry
- [ ] Make `isLocalFunction()` configurable
- [ ] Decompose `formatToolMessage()` method
- [ ] Unify terminology (workspace/conversation/session) in documentation

---

## Research Questions

### Decision Logic
- [ ] How to handle ambiguous tasks? (try local first? forward? parallel?)
- [ ] What's the threshold for "complex"? (LOC? keywords? AST analysis?)
- [ ] Should routing be visible to users? (transparent? hidden? optional?)

### Consistency
- [ ] Will agents give different answers? (how to test? how to handle?)
- [ ] Should results be validated? (cross-check? trust first? user choice?)
- [ ] What about non-deterministic operations? (time, random, etc.)

### Performance
- [ ] What's the overhead of routing analysis? (acceptable? optimize?)
- [ ] Is parallel execution worth it? (benchmark? measure? A/B test?)
- [ ] How to handle failures? (retry? fallback? report?)

### User Experience
- [ ] Should users understand the division? (educate? abstract? transparent?)
- [ ] How to explain "local" vs "remote"? (simple terms? technical? adaptive?)
- [ ] What if users prefer one mode? (preferences? per-task? global?)

---

## Testing Strategy

### Unit Tests
- [ ] Test `isSimpleExpression()` with various inputs
- [ ] Test `analyzeRequiredTools()` accuracy
- [ ] Test `estimateComplexity()` consistency
- [ ] Test routing decision logic with edge cases

### Integration Tests
- [ ] Test full flow: voice → routing → execution → response
- [ ] Test error handling and fallback paths
- [ ] Test mode switching affects routing
- [ ] Test workspace coordination with both agents

### Performance Tests
- [ ] Measure latency improvement for simple queries
- [ ] Measure overhead of routing analysis
- [ ] Test load handling (many concurrent requests)
- [ ] Compare old vs new architecture performance

### User Acceptance Tests
- [ ] Test with real users (collect feedback)
- [ ] Measure user satisfaction
- [ ] Track error reports
- [ ] Monitor usage patterns

---

## Documentation Needs

### For Developers
- [ ] Architecture decision records (ADRs)
- [ ] API documentation for routing functions
- [ ] Sequence diagrams for task flows
- [ ] Tool capability registry documentation

### For Users
- [ ] User guide for operation modes
- [ ] FAQ about task division
- [ ] Troubleshooting guide
- [ ] Best practices

### For System
- [ ] Inline code comments
- [ ] JSDoc for public APIs
- [ ] Update CLAUDE.md
- [ ] Update ai-workspace.md

---

## Milestones

### Milestone 1: Basic Local Execution ⏳
**Target:** Week 1
- Voice agent can handle math and simple expressions
- Proper fallback to code agent
- Basic logging and metrics

### Milestone 2: Capability Routing ⏳
**Target:** Week 2-3
- Tool capability registry implemented
- Smart routing based on required tools
- Comprehensive testing

### Milestone 3: Production Ready ⏳
**Target:** Week 4
- All modes implemented
- User control features
- Performance optimized
- Documentation complete

### Milestone 4: Refinement ⏳
**Target:** Ongoing
- Bug fixes
- Performance tuning
- User feedback incorporation
- Feature enhancements

---

## Open Questions for Discussion

1. **Should voice agent have direct MCP access?**
   - Currently: Only code agent has MCP tools
   - Alternative: Give voice agent read-only MCP access?
   - Trade-off: Capability vs. security/complexity

2. **How to handle long-running tasks?**
   - Voice agent is synchronous (eval blocks)
   - Code agent supports async workflows
   - Should voice agent delegate all long tasks?

3. **What about tool consistency?**
   - Same tool in both agents (lively4_evaluate-code)
   - Different contexts (voice in browser, code via MCP)
   - How to ensure consistent results?

4. **Performance vs. Simplicity trade-off?**
   - Complex routing = better performance
   - Simple forwarding = easier to maintain
   - What's the right balance?

5. **User education strategy?**
   - Do users need to know about task division?
   - How to explain without overwhelming?
   - Progressive disclosure vs. upfront explanation?

---

## Related Documents

- [AI Workspace Architecture](./ai-workspace.md) - Main architecture documentation
- [AI Workspace Modes](./ai-workspace-modes.md) - Task division strategies
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines
- [Realtime Chat Toolsets](browse://src/ai-workspace/components/realtime-chat-tools/)
- [AI Workspace Component](browse://src/components/tools/lively-ai-workspace.js)

---

## Notes

- Keep this document updated as tasks progress
- Mark completed tasks with ✅
- Add new tasks as they're discovered
- Link to relevant commits/PRs when completed
- Document blockers and dependencies


