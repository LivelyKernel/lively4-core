# Voice Agent Exploration (Wizard-of-Oz)

Internal iterative testing to gather feedback on voice agent capabilities. Human simulates the voice agent while real Claude Code acts as code agent.

**Simple setup:**
- Human plays voice agent role (talk/text with user, coordinate with code agent)
- Real Claude Code as code agent (full tool access)
- User can be yourself or someone else

## Things to Try

### 1. Direct File Access

Currently voice agent has no file tools - everything gets delegated to code agent. Try giving voice agent direct file access:

**Try this:**
- "What's in file X?" → Read file directly, answer immediately
- Read files to build context before delegating complex task to code agent
- Handle simple config edits without delegation

**Notice:**
- When do you naturally use direct access vs. delegation?
- Where's the boundary between simple and complex?

### 2. Planning Mode

Currently everything executes immediately. Try planning first:

**Try this:**
1. Listen to user's goal
2. Verbally summarize planned steps
3. Wait for confirmation
4. Delegate to code agent
5. Give status updates as work progresses

**Notice:**
- Does planning help or get in the way?
- How much detail feels right?
- Does it break conversational flow?

### 3. Code Agent Awareness

Currently voice agent can't see what code agent is doing. Try different awareness levels:

**Minimal:** Only know if code agent is busy or idle

**Status:** See which tools/files code agent is using

**Summary:** See brief summaries like "Modified 3 files: X.js, Y.js, Z.js"

**Full:** See complete code agent output

**Try answering:**
- "How far are you?" (status query)
- "Did you modify file X?" (clarification)
- Proactively notice when code agent hits errors

**Notice:**
- Which level feels most useful?
- When does awareness become overwhelming?

## Combined Scenarios to Try

**Planning with file access:**
- User asks for feature implementation
- Read relevant files first
- Create plan based on file content
- Get confirmation, then delegate with context

**Handling interruptions:**
- Code agent working on task
- User asks question about the code
- Use awareness to answer without interrupting code agent
- Resume smoothly

**Error recovery:**
- Code agent hits error
- Notice it via awareness
- Proactively ask user for help/clarification
- Forward solution to code agent

## After Each Session

Quick notes on:
- What worked?
- What didn't?
- Surprises?
- What to change next time?
