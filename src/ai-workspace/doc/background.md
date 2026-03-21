# Background

## State of the Art: Code Agents

Modern AI code agents (e.g., Claude Code, Cursor, Copilot Workspace) operate through message-based dialog with users:

**Interaction Model:**
- **Turn-based conversation**: User sends message, agent responds
- **Slow turnaround**: Typical response time measured in minutes, not seconds
- **Extended reasoning**: Agents "think" by generating internal reasoning chains
- **Tool-based actions**: Agents affect the world through tool calls

**Tool Execution Pattern:**
Code agents use tools as structured function calls with parameters. The system executes the tool and returns results to the agent, which continues generating its response. Common tools include:
- Reading and writing files
- Executing code
- Running tests
- Git operations
- File system navigation

**User Experience:**
From the user's perspective, the agent appears to continuously generate a response. The back-and-forth between agent and system (tool calls and results) is hidden behind the streaming text output. The user can only watch as the agent reasons and acts.

**Performance Characteristics:**
- This iterative tool use is time and cost intensive
- Multiple tool calls per response are common
- Each tool call adds latency and token usage
- Despite costs, this approach produces exceptional results and drives the current hype around agentic computing

## Realtime Voice Agents

In contrast, realtime voice agents (e.g., OpenAI Realtime API) enable natural conversational interaction:

**Interaction Model:**
- **Fluent conversation**: Natural turn-taking with minimal latency
- **Immediate reactions**: Response times in seconds for conversational flow
- **User interruptions**: User can interrupt the agent at any time
- **Streaming audio**: Real-time audio processing without transcription delay

**Asynchronous Tool Calls:**
To maintain conversational flow, realtime agents use asynchronous tool execution:
- Agent can call tools while continuing the conversation
- User keeps talking, unaware of background tool execution
- Tool results arrive later and influence subsequent conversation
- No blocking wait for tool completion

**User Experience:**
The conversation feels natural and responsive. The agent reacts immediately to user input, and background operations don't interrupt the flow.

**Performance Characteristics:**
- Optimized for speed over depth
- Minimal thinking/planning to maintain conversational pace
- Real-time audio streaming incurs significant costs
- Using realtime models for extended coding sessions and deep reasoning may not be cost-effective (#ToBeEvaluated)
- Less suitable for complex reasoning tasks

## The Gap: Conversational Coding

**The Challenge:**
Current AI-assisted programming forces a choice:

- **Code agents**: Excellent coding capability, poor conversational experience (slow, one-way)
- **Voice agents**: Excellent conversational experience, poor coding capability (shallow reasoning)

**Motivation for Hybrid Approach:**
We want both:
1. **Fluent conversation** with immediate feedback and natural turn-taking
2. **Agentic code generation** with deep reasoning and tool-based file manipulation

A hybrid system could allow developers to discuss code naturally via voice while delegating substantial implementation work to specialized code agents - combining the conversational strengths of realtime models with the coding capabilities of agentic systems.

This is the core motivation behind the AI Workspace architecture.
