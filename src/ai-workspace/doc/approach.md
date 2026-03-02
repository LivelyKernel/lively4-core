# AI Workspace Approach

## The Problem with Traditional Audio-to-Text Approaches

The conventional approach to voice-driven coding is straightforward:
1. Record audio message
2. Transcribe with specialized speech-to-text model (e.g., Whisper)
3. Send transcribed text to code agent
4. Agent executes task

We initially experimented with this approach in `lively-claude-code`, connecting a Claude Code terminal with an audio model. However, we encountered significant limitations:

- **Jargon misunderstanding**: Technical terms frequently mistranscribed ("Jet GPT" instead of "ChatGPT")
- **Context loss**: Audio models lack domain knowledge to disambiguate programming terminology
- **Fragile pipeline**: Success depends on code agent correctly interpreting transcription errors
- **No conversational flow**: Each interaction requires complete audio recording before processing

## Discovery: Native Audio Understanding

We explored an alternative: models that understand audio directly, without intermediate transcription. OpenAI's Realtime API emerged as a promising solution:

**Key Capabilities:**
- **Native audio processing**: Model processes speech directly, understanding context and intent
- **Streaming interaction**: Real-time conversation with natural turn-taking
- **Async tool calling**: Can execute code and interact with environment during conversation
- **Natural jargon handling**: Better understanding of technical terminology in context

**Early Success:**
We successfully used the Realtime model for live JavaScript coding in interactive sessions, demonstrating the potential for natural voice-driven programming.

## The Realtime Model Limitation

Despite these advantages, the Realtime models proved insufficient as standalone coding agents:

- **Cost**: Expensive for extended coding sessions
- **Capability limits**: Not optimized for complex code generation and reasoning
- **Specialization gap**: Dedicated code models (Claude Code, etc.) significantly outperform on actual coding tasks

## Key Insight: The Speed-Depth Tradeoff

A fundamental conflict emerged between the two model types:

**Realtime Models: Optimized for Speed**
- Fast response times (seconds) for natural conversation flow
- Minimal thinking and planning - respond quickly
- Necessary for conversational feel and turn-taking

**Code Agent Models: Optimized for Depth**
- Extensive reasoning and planning capabilities
- Slow response times (minutes) for complex tasks
- Necessary for quality code generation and problem-solving

**The Conflict:**
You cannot have both in a single model. Natural conversation requires fast feedback, but quality coding requires deep thinking. Using a code agent for casual conversation feels painfully slow. Using a realtime model for complex coding produces poor results.

## The AI Workspace Solution: Hybrid Architecture

The approach: **combine the strengths of both models** in a coordinated system, letting each do what it does best.

**Architecture:**
- **Realtime Voice Agent**: Natural voice interface for conversation and intent understanding
- **Code Agent (Claude Code via OpenCode)**: Specialized coding capabilities for complex implementation tasks
- **Coordination Layer**: Manages communication and task delegation between agents

**Design Principle:**
The user converses naturally with the Realtime model, which can delegate substantial coding tasks to the specialized Code Agent. The Realtime model acts as an intelligent voice interface that understands when to handle queries directly versus when to invoke the Code Agent for implementation.

**Tool-Based Integration:**
The Realtime model uses async function calling to:
- Send coding tasks to the Code Agent
- Query task status and completion
- Relay results back to the user in natural language

## Implementation Status

We built a working prototype that combines:
- `openai-realtime-chat`: WebRTC-based voice interface with OpenAI Realtime API
- `lively-opencode`: UI wrapper for Claude Code terminal agent (OpenCode server)
- `lively-ai-workspace`: Coordinator managing both agents with shared conversation history

The system supports configurable agent roles through system prompts and tool availability settings.

See [implementation.md](implementation.md) for technical details.

## Current Exploration: Exploring the System

We are currently using the system ourselves to explore what works and what doesn't. We want to discover design problems and promising directions.

**Questions We're Exploring:**
1. What division of responsibilities between agents feels natural?
2. How does conversation flow with the dual-agent setup?
3. What interaction patterns emerge in practice?
4. What are the current showstoppers and limitations?

**Design Space to Explore:**

Multiple dimensions need exploration to understand viable approaches:

### 1. Agent Responsibility Models

Different configurations for dividing work between agents:

**Model A: Voice as Proxy**
- Realtime agent primarily forwards requests to Code Agent
- Minimal processing, acts as voice-to-text interface with context
- Code Agent handles all technical decisions

**Model B: Voice as First Responder**
- Realtime agent handles quick queries and simple tasks directly
- Only delegates complex coding tasks to Code Agent
- Requires defining boundary between "simple" and "complex"

**Model C: Voice as Coordinator**
- Realtime agent maintains conversation context and planning
- Breaks down tasks and coordinates Code Agent execution
- Acts as project manager directing the coding agent

### 2. Interaction Patterns

Different modes of interaction to explore:

**Direct Execution Mode:** (Experimented)
- Voice commands immediately trigger agent actions
- Minimal confirmation, optimized for flow
- Risk: accidental execution of unintended commands

**Mixed Mode:** (Experimented)
- Small queries execute immediately
- Significant changes require confirmation
- Challenge: defining the "significant" threshold

**Planning Mode:** (#FutureWork - Not Yet Implemented)
- Casual conversation builds up a plan
- Explicit confirmation before execution
- Requires dedicated planning support in UI
- Would be safer but potentially interrupts conversational flow
- Similar to Claude Code's planning mode, but needs design and implementation

### 3. Capability Distribution

**Current Setup (Very Simple):**
- Voice agent can only forward requests to code agent and wait for answers
- Voice agent does NOT see what the code agent generates (user sees it in UI)
- Code agent has full MCP tool access (file operations, code execution, etc.)

**Limitations:**
- No shared context visibility between agents
- Voice agent cannot track code agent progress
- User sees more than voice agent knows

**Potential Improvements to Explore:**
- System reminders to voice agent about code agent actions
- Blackboard pattern for shared state visibility
- Voice agent direct access to some quick tools (file reading, simple queries)
- Defining which operations benefit from voice agent awareness

### 4. Context Sharing

How much context each agent needs:

**Code Agent Awareness:**
- Should Code Agent know about voice conversation?
- How much voice context to include in delegated tasks?
- Full transcript vs. summarized intent?

**Voice Agent Awareness:**
- Should Realtime agent see Code Agent's internal reasoning?
- How detailed should status updates be?
- Raw tool execution vs. summarized progress?

### 5. Conversation Flow

Investigating natural interaction patterns:

**Turn-Taking:**
- How do interruptions work?
- Can user interrupt Code Agent execution via voice?
- How to handle overlapping responses?

**Context Continuity:**
- Pronoun resolution across agents ("fix that bug" - which bug?)
- Maintaining conversation thread across task delegation
- Handling context switches

**Error Recovery:**
- Voice correction of Code Agent mistakes
- Clarification requests from either agent
- Rollback and retry mechanisms

## Infrastructure for Exploration

The system provides basic infrastructure for experimentation:

**Event Capture & Replay:**
- All interactions recorded with source tagging
- Sessions can be replayed for analysis
- Useful for debugging and comparing different configurations

**Configuration Management:**
- System prompts stored in `src/config/prompts/`
- Can experiment with different agent roles by changing prompts

## Next Steps

### Immediate Exploration

1. **Document Current Configurations**: 
   - What agent responsibility models have we tried?
   - What prompts and tool settings did we use?
   - What worked and what didn't?

2. **Map Interaction Patterns**:
   - Document common voice commands and how they're handled
   - Identify awkward or problematic interactions
   - Note where conversation flow breaks down

3. **Identify Showstoppers**:
   - What prevents hands-free usage currently?
   - Where does the system fail or confuse users?
   - What capabilities are critically missing?

### Future Work

1. **Planning Mode Design & Implementation**:
   - Design UI for plan building and confirmation
   - Implement planning state in workspace
   - Develop prompts for planning vs. execution modes

2. **Context Sharing Improvements**:
   - Explore blackboard pattern for shared visibility
   - System reminders to voice agent about code agent actions
   - Define what information voice agent needs to see

3. **VR Integration**:
   - Test current system in VR environment
   - Identify VR-specific requirements
   - Optimize for fully hands-free operation

## References

**Documentation:**
- [Introduction](introduction.md) - Motivation and document structure
- [Implementation](implementation.md) - Technical details
- [AI Workspace Architecture](ai-workspace.md) - Detailed component APIs
- [Refactoring Guide](refactoring.md) - Current improvement tasks

**Configuration:**
- System prompts: `src/config/prompts/ai-workspace-*.txt`
- Tool definitions: `../lively4-server/tools.json`
- Component files: `src/ai-workspace/components/`

