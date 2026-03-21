# AI Workspace Operation Modes - Task Division Strategies

## Overview

This document explores different operational modes for dividing labor between the voice agent (`openai-realtime-chat`) and the code agent (`lively-opencode`) within the AI workspace architecture.

**Current State:** Voice agent forwards all tasks to code agent, even simple operations that could be handled locally.

**Goal:** Define clear boundaries and strategies for task distribution to optimize performance, user experience, and resource utilization.

---

## Current Architecture Capabilities

### Voice Agent (`openai-realtime-chat`)

**Built-in Capabilities:**
- ✅ JavaScript execution via `evaluate_code` tool (BasicToolset)
- ✅ Direct DOM/API access (running in browser context)
- ✅ AI Workspace API access:
  - `workspace.sendMessageToOpenCode(message, requestId)`
  - `workspace.getOpenCodeStatus()`
  - `workspace.getOpenCodeHistory()`
  - `workspace.getRequestResponse(requestId)`
- ✅ Real-time audio interaction
- ✅ Function calling capabilities
- ✅ Browser environment access (Lively4 APIs, components)

**Limitations:**
- ❌ No file system access (no read/write files)
- ❌ No MCP tools (bash, glob, grep, git)
- ❌ No multi-step workflow orchestration
- ❌ Limited to synchronous JavaScript evaluation

### Code Agent (`lively-opencode`)

**Built-in Capabilities:**
- ✅ Full MCP tool suite (read, write, bash, glob, grep, git)
- ✅ File system operations
- ✅ Long-running task execution
- ✅ Multi-step workflows
- ✅ Complex debugging and refactoring
- ✅ Development tool integration

**Limitations:**
- ❌ No audio interaction
- ❌ Cannot directly access browser DOM (uses MCP bridge)
- ❌ Request/response latency (HTTP + SSE)

---

## Proposed Operation Modes

### Mode 1: **Full Delegation (Current)**

**Strategy:** Voice agent forwards everything to code agent.

**Pros:**
- ✅ Simple decision logic (no routing needed)
- ✅ Consistent behavior
- ✅ All tasks use same powerful tool suite
- ✅ Easy to reason about

**Cons:**
- ❌ Unnecessary latency for simple queries
- ❌ Overloads code agent with trivial tasks
- ❌ Voice agent underutilized
- ❌ No parallel task execution

**Example:**
```
User: "What's 3 + 4?"
Voice → Code Agent → bash: echo $((3 + 4)) → 7
```

---

### Mode 2: **Simple Local-First**

**Strategy:** Voice agent handles simple evaluations, forwards complex tasks.

**Decision Boundary:**
```javascript
if (taskRequiresMCP(message)) {
  await workspace.sendMessageToOpenCode(message, requestId);
} else {
  await this.toolset.execute('evaluate_code', { code: extractCode(message) });
}
```

**Local Tasks (Voice Agent):**
- Math calculations: `3 + 4`, `Math.sqrt(16)`
- DOM queries: `document.querySelectorAll('lively-window').length`
- Lively4 API calls: `lively.components.list()`
- Simple JavaScript expressions
- Workspace state queries: `workspace.getOpenCodeStatus()`

**Forwarded Tasks (Code Agent):**
- File operations: `ls`, `cat file.js`, `grep pattern`
- Git operations: `git status`, `git log`
- Multi-file operations
- Code editing and refactoring
- Complex debugging

**Pros:**
- ✅ Fast response for simple queries
- ✅ Reduces code agent load
- ✅ Better resource utilization
- ✅ Voice agent feels more capable

**Cons:**
- ❌ Need clear decision heuristics
- ❌ Potential inconsistency between agents
- ❌ Edge cases (which agent handles what?)

**Example:**
```
User: "What's 3 + 4?"
Voice → eval("3 + 4") → 7 (instant)

User: "List files in src/"
Voice → Code Agent → bash: ls src/ → [file list]
```

---

### Mode 3: **Capability-Based Routing**

**Strategy:** Analyze required tools/capabilities, route accordingly.

**Decision Logic:**
```javascript
const requiredTools = analyzeTask(message);

// MCP tools needed? → Code Agent
if (requiredTools.some(t => ['bash', 'read_file', 'write_file', 'grep', 'glob', 'git'].includes(t))) {
  await workspace.sendMessageToOpenCode(message, requestId);
}

// Browser-only tools? → Voice Agent
else if (requiredTools.every(t => ['evaluate_code', 'lively_api'].includes(t))) {
  await handleLocally(message);
}

// Ambiguous? → Forward to Code Agent (safe default)
else {
  await workspace.sendMessageToOpenCode(message, requestId);
}
```

**Tool Categories:**

| Category | Tools | Handler |
|----------|-------|---------|
| **Browser** | evaluate_code, DOM access, Lively APIs | Voice Agent |
| **File System** | read, write, glob, grep | Code Agent |
| **Shell** | bash, git, npm, build tools | Code Agent |
| **Coordination** | workspace API, status checks | Voice Agent |

**Pros:**
- ✅ Clear capability boundaries
- ✅ Extensible (new tools → update mapping)
- ✅ Explicit and testable
- ✅ Handles edge cases systematically

**Cons:**
- ❌ Requires accurate task analysis
- ❌ More complex implementation
- ❌ Maintenance overhead (tool registry)

---

### Mode 4: **Hybrid with Fallback**

**Strategy:** Try local first, forward to code agent if needed.

**Implementation:**
```javascript
async handleUserMessage(message) {
  // Quick check: Looks like simple eval?
  if (isSimpleExpression(message)) {
    try {
      const result = await this.toolset.execute('evaluate_code', { code: message });
      if (result.success) {
        return result;
      }
    } catch (error) {
      // Fall through to code agent
    }
  }

  // Otherwise or on failure → Code Agent
  return await workspace.sendMessageToOpenCode(message, requestId);
}
```

**Pros:**
- ✅ Optimistic local execution
- ✅ Safe fallback for edge cases
- ✅ Simple decision logic
- ✅ Self-correcting

**Cons:**
- ❌ Potential double latency on failures
- ❌ Wasted attempts on obvious MCP tasks
- ❌ Error handling complexity

---

### Mode 5: **Parallel Execution**

**Strategy:** Execute both simultaneously, use fastest/most appropriate result.

**Implementation:**
```javascript
async handleAmbiguousTask(message) {
  // Race both approaches
  const [localResult, remoteResult] = await Promise.race([
    this.tryLocalEvaluation(message),
    workspace.sendMessageToOpenCode(message, requestId)
  ]);

  // Use first successful result
  return localResult?.success ? localResult : remoteResult;
}
```

**Pros:**
- ✅ Always uses fastest approach
- ✅ No routing decisions needed
- ✅ Highest reliability

**Cons:**
- ❌ Wastes resources (runs both)
- ❌ Potential inconsistency (different answers?)
- ❌ Complex result reconciliation

---

### Mode 6: **User-Controlled Modes**

**Strategy:** Let user choose operational mode via UI/voice command.

**Modes:**
- **"Quick Mode"** - Local-first, forward only when necessary
- **"Full Power Mode"** - Always use code agent
- **"Auto Mode"** - Capability-based routing (recommended)

**UI Integration:**
```javascript
// Voice command:
"Switch to quick mode"
"Use full power for this task"

// UI toggle in workspace settings
this.operationMode = 'quick' | 'full' | 'auto'
```

**Pros:**
- ✅ User control and transparency
- ✅ Different workflows for different needs
- ✅ Easy to explain behavior

**Cons:**
- ❌ User has to understand modes
- ❌ More UI complexity
- ❌ Potential confusion

---

## Decision Heuristics

### Simple Expression Detection

```javascript
function isSimpleExpression(message) {
  // Math operations
  if (/^\s*[\d\+\-\*\/\(\)\s]+\s*$/.test(message)) return true;
  
  // Single function call
  if (/^\s*\w+\([^)]*\)\s*$/.test(message)) return true;
  
  // Simple variable access
  if (/^\s*\w+(\.\w+)*\s*$/.test(message)) return true;
  
  return false;
}
```

### MCP Tool Requirements

```javascript
function requiresMCPTools(message) {
  const mcpKeywords = [
    'file', 'read', 'write', 'list files', 'grep', 'search',
    'git', 'commit', 'diff', 'log',
    'bash', 'shell', 'command',
    'edit', 'refactor', 'debug'
  ];
  
  return mcpKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
}
```

### Complexity Estimation

```javascript
function estimateComplexity(message) {
  // Multi-step indicators
  if (/and then|after that|next|finally/.test(message)) {
    return 'high';
  }
  
  // File operation indicators
  if (/file|directory|folder|source code/.test(message)) {
    return 'medium';
  }
  
  // Simple query indicators
  if (/^(what|how many|count|list|show)/.test(message)) {
    return 'low';
  }
  
  return 'medium'; // Default to medium
}
```

---

## Task Categories & Routing

### Category 1: Instant Local (Voice Agent)

**Characteristics:**
- Synchronous JavaScript evaluation
- No external resources needed
- Result available immediately

**Examples:**
- Math: `3 + 4`, `Math.PI * 2`
- Time: `new Date().toISOString()`
- DOM queries: `document.querySelectorAll('lively-window').length`
- Lively API: `lively.components.list()`
- Workspace state: `workspace.blackboard.agentStatus`

**Implementation:**
```javascript
await this.toolset.execute('evaluate_code', { code });
```

---

### Category 2: Browser Context (Voice Agent)

**Characteristics:**
- Requires browser environment
- Access to Lively4 runtime
- Can manipulate DOM/components

**Examples:**
- Open component: `lively.openComponentInWindow('lively-inspector')`
- Query components: `document.querySelectorAll('lively-chat-message')`
- Check window state: `Array.from(document.querySelectorAll('lively-window')).map(w => w.getAttribute('title'))`

**Implementation:**
```javascript
await eval(extractLivelyAPICall(message));
```

---

### Category 3: File System (Code Agent)

**Characteristics:**
- Needs file read/write access
- May require directory traversal
- Uses MCP file tools

**Examples:**
- List files: `ls src/components/`
- Read file: `cat src/client/lively.js`
- Search code: `grep -r "evaluate_code" src/`
- Find files: `find src/ -name "*.js"`

**Implementation:**
```javascript
await workspace.sendMessageToOpenCode(message, requestId);
```

---

### Category 4: Development Tools (Code Agent)

**Characteristics:**
- Git operations
- Build tools (npm, webpack)
- Testing frameworks
- Shell commands

**Examples:**
- Git: `git status`, `git log`, `git diff`
- NPM: `npm install`, `npm test`
- Build: `npm run build`
- Shell: `ps aux | grep opencode`

**Implementation:**
```javascript
await workspace.sendMessageToOpenCode(message, requestId);
```

---

### Category 5: Complex Workflows (Code Agent)

**Characteristics:**
- Multi-step operations
- Requires reasoning and planning
- May need multiple tools
- Long-running tasks

**Examples:**
- "Refactor the message rendering to use a common base class"
- "Find all instances of deprecated methods and update them"
- "Debug why the replay feature isn't working"
- "Implement a new feature for tool filtering"

**Implementation:**
```javascript
await workspace.sendMessageToOpenCode(message, requestId);
```

---

### Category 6: Coordination (Either Agent)

**Characteristics:**
- Check agent status
- Read workspace state
- Query message history
- Manage sessions

**Examples:**
- "Is the code agent working on something?"
- "What's the current task?"
- "Show me the last message from the code agent"
- "List recent sessions"

**Voice Agent Can Handle:**
```javascript
workspace.getOpenCodeStatus()
workspace.getOpenCodeHistory()
workspace.blackboard.agentStatus
```

**Code Agent for Complex Queries:**
```javascript
// Multi-session analysis, complex filtering
await workspace.sendMessageToOpenCode(message, requestId);
```

---

## Implementation Roadmap

### Phase 1: Foundation (Simple Local-First)

**Goals:**
- Voice agent handles math and simple expressions
- Forward everything else to code agent
- Establish basic routing pattern

**Tasks:**
1. Add `isSimpleExpression(message)` helper
2. Implement try-local-first logic
3. Add logging to track routing decisions
4. Test with common queries

**Success Criteria:**
- Math queries answered instantly by voice agent
- File operations still routed to code agent
- No regressions in existing functionality

---

### Phase 2: Capability Mapping (Tool-Based Routing)

**Goals:**
- Map tools to handlers
- Implement capability-based routing
- Handle browser vs. MCP tool distinction

**Tasks:**
1. Create tool capability registry
2. Implement `analyzeRequiredTools(message)`
3. Add routing decision logic
4. Update logging to show tool requirements

**Success Criteria:**
- DOM queries handled by voice agent
- File operations routed to code agent
- Clear logging of routing decisions

---

### Phase 3: Advanced Heuristics (Complexity-Aware)

**Goals:**
- Estimate task complexity
- Route simple queries locally
- Forward complex workflows

**Tasks:**
1. Implement `estimateComplexity(message)`
2. Add multi-step detection
3. Refine routing based on complexity
4. Add performance metrics

**Success Criteria:**
- Single-step queries handled locally when possible
- Multi-step tasks routed to code agent
- Measurable latency improvements

---

### Phase 4: User Control (Mode Selection)

**Goals:**
- Allow user to choose operation mode
- Provide transparency in task routing
- Enable mode switching via voice/UI

**Tasks:**
1. Add operation mode property to workspace
2. Implement mode switching UI/voice commands
3. Update routing to respect mode setting
4. Add visual indicators for mode

**Success Criteria:**
- Users can switch modes easily
- Mode affects routing decisions
- Clear feedback on current mode

---

### Phase 5: Optimization (Parallel & Fallback)

**Goals:**
- Experiment with parallel execution
- Implement smart fallback strategies
- Optimize for speed and reliability

**Tasks:**
1. Test parallel execution for ambiguous tasks
2. Implement fallback on local failure
3. Add result validation and reconciliation
4. Performance benchmarking

**Success Criteria:**
- Best-case latency for all task types
- Reliable handling of edge cases
- Documented performance improvements

---

## Open Questions

### 1. Decision Transparency

**Question:** Should users see which agent handled their request?

**Options:**
- A) Silent routing (users don't know)
- B) Visual indicator (icon, color, label)
- C) Explicit announcement ("Handled by voice agent")

**Considerations:**
- User confusion vs. transparency
- Educational value
- Debug capability

---

### 2. Consistency Guarantees

**Question:** What if agents give different answers?

**Example:**
```
Voice Agent: eval("2 + 2") → 4
Code Agent: bash echo $((2 + 2)) → 4 ✅ Same

Voice Agent: eval("new Date().getDay()") → 1 (Monday)
Code Agent: bash date +%u → 1 ✅ Same

Voice Agent: eval("document.querySelectorAll('lively-window').length") → 4
Code Agent: lively4_evaluate-code → ? (different session?)
```

**Mitigation:**
- Test common queries with both agents
- Document known differences
- Prefer deterministic operations

---

### 3. Error Handling

**Question:** What happens when local execution fails?

**Options:**
- A) Show error to user, don't retry
- B) Automatically forward to code agent
- C) Ask user what to do

**Considerations:**
- User experience
- Latency on failure
- Debugging information

---

### 4. Tool Expansion

**Question:** What if voice agent needs new capabilities?

**Scenarios:**
- New MCP tools added
- New browser APIs available
- Custom tool development

**Strategy:**
- Capability registry must be updated
- Documentation of tool ownership
- Testing with both agents

---

### 5. Performance Monitoring

**Question:** How do we measure success of task division?

**Metrics:**
- Average latency by task type
- Agent utilization (% time busy)
- User satisfaction
- Error rates
- Routing accuracy

**Implementation:**
- Add telemetry to workspace
- Track routing decisions
- Log performance data
- Periodic analysis

---

## Comparison Matrix

| Aspect | Full Delegation | Local-First | Capability-Based | Hybrid | Parallel | User-Controlled |
|--------|----------------|-------------|------------------|--------|----------|-----------------|
| **Latency (Simple)** | Slow | Fast | Fast | Fast | Fast | Varies |
| **Latency (Complex)** | Normal | Normal | Normal | Normal | Normal | Varies |
| **Implementation** | Simple | Medium | Complex | Medium | Complex | Complex |
| **Reliability** | High | Medium | High | High | High | High |
| **Resource Usage** | Normal | Low | Low | Medium | High | Varies |
| **User Transparency** | Low | Low | Low | Low | Low | High |
| **Maintenance** | Easy | Medium | Hard | Medium | Hard | Hard |
| **Error Handling** | Simple | Medium | Medium | Complex | Complex | Medium |

---

## Recommendation

**Recommended Approach:** **Mode 2 (Simple Local-First)** → **Mode 3 (Capability-Based Routing)**

**Rationale:**
1. Start with simple local-first (easy to implement, quick wins)
2. Evolve to capability-based (more robust, maintainable)
3. Avoid over-engineering (parallel execution adds complexity)
4. Provide user control as optional enhancement

**Implementation Plan:**
1. **Phase 1** (Week 1): Simple local-first
   - Math and simple expressions → voice agent
   - Everything else → code agent
2. **Phase 2** (Week 2-3): Capability mapping
   - Tool registry and routing logic
   - Browser vs. MCP distinction
3. **Phase 3** (Week 4): Refinement
   - Add complexity heuristics
   - Performance monitoring
   - Edge case handling
4. **Phase 4** (Future): User control
   - Mode selection UI
   - Voice commands
   - Advanced features

---

## Next Steps

1. **Get code agent feedback** on this architectural proposal
2. **Prototype simple local-first** mode in a branch
3. **Test with common queries** and measure performance
4. **Document routing decisions** for transparency
5. **Iterate based on user testing** and feedback

---

## References

- [AI Workspace Architecture](./ai-workspace.md) - Main architecture documentation
- [Realtime Chat Toolsets](browse://src/ai-workspace/components/realtime-chat-tools/) - Voice agent toolset directory
- [AI Workspace Public API](browse://src/components/tools/lively-ai-workspace.js#1048) - Coordination API
- [BasicToolset](browse://src/ai-workspace/components/realtime-chat-tools/basic-toolset.js) - Voice agent tools
- [WorkspaceToolset](browse://src/ai-workspace/components/realtime-chat-tools/workspace-toolset.js) - Workspace integration tools

---

*Document created: 2026-02-09*
*Status: Draft for review*
