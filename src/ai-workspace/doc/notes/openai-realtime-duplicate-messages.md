# OpenAI Realtime API - Duplicate Message Problem

## Event Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant API as OpenAI API
    participant WS as WebSocket Handler
    participant Component as openai-realtime-chat
    participant DB as IndexedDB

    Note over API,DB: User speaks: "Hi there!"

    API->>WS: input_audio_buffer.speech_started
    WS->>Component: createLiveUserMessage()

    API->>WS: input_audio_buffer.speech_stopped

    API->>WS: conversation.item.input_audio_transcription.completed<br/>transcript: "Hi there!"
    WS->>Component: updateLiveUserMessage()
    Component->>DB: saveMessageToDb({role: user, content: "Hi there!"})

    Note over API,DB: Assistant responds with audio + transcript

    API->>WS: response.audio_transcript.delta<br/>response_id: resp_xyz, item_id: item_abc
    WS->>Component: createLiveAssistantMessage()<br/>currentAssistantTranscript = ""

    API->>WS: response.audio_transcript.delta<br/>delta: "Hi "
    WS->>Component: currentAssistantTranscript += "Hi "

    API->>WS: response.audio_transcript.delta<br/>delta: "there! How..."
    WS->>Component: currentAssistantTranscript += "there! How..."

    rect rgb(255, 200, 200)
        Note over API,DB: RACE CONDITION - Both events arrive ~4ms apart

        API->>WS: response.audio_transcript.done<br/>response_id: resp_xyz, item_id: item_abc<br/>transcript: "Hi there! How can I help..."
        API->>WS: response.done<br/>response_id: resp_xyz<br/>response.output[0].id: item_abc

        par Handler 1: audio_transcript.done
            WS->>Component: Check: currentLiveMessageElement? YES
            Note over Component: Flag not set yet
            Component->>Component: Set transcriptDoneHandled flag
            Component->>Component: Clear currentLiveMessageElement
            Component->>DB: saveMessageToDb(seq=1, timestamp=...501)
        and Handler 2: response.done
            WS->>Component: Check: currentAssistantTranscript? YES
            WS->>Component: Check: transcriptDoneHandled? FALSE
            Component->>DB: saveMessageToDb(seq=2, timestamp=...507)
            Component->>Component: Reset transcriptDoneHandled flag
        end
    end

    Note over DB: RESULT: Two identical messages in DB with different IDs/timestamps
```


## Root Cause

The race condition occurs because:
- Both event handlers check local state before either handler modifies it
- JavaScript async execution allows both handlers to pass their checks simultaneously
- Both handlers proceed to save the message independently

## Solution: Use OpenAI API IDs

Track saved messages using OpenAI's own identifiers instead of local state:

```mermaid
sequenceDiagram
    participant API as OpenAI API
    participant WS as WebSocket Handler
    participant Component as openai-realtime-chat<br/>savedResponseItems Set
    participant DB as IndexedDB

    API->>WS: response.audio_transcript.done<br/>item_id: item_abc
    WS->>Component: Check: savedResponseItems.has item_abc? NO
    Component->>Component: savedResponseItems.add item_abc
    Component->>DB: saveMessageToDb()

    API->>WS: response.done<br/>response.output[0].id: item_abc
    WS->>Component: Check: savedResponseItems.has item_abc? YES
    Note over Component: Skip - already saved

    Note over DB: RESULT: Single message saved ✓
```

## Implementation

```javascript
// In initialize():
this.savedResponseItems = this.savedResponseItems || new Set();

// In response.audio_transcript.done handler:
if (message.item_id && this.savedResponseItems.has(message.item_id)) {
  console.log(`Skipping duplicate save for item ${message.item_id}`);
  break;
}
if (message.item_id) {
  this.savedResponseItems.add(message.item_id);
}
// ... save message

// In response.done handler:
for (const item of message.response.output) {
  if (item.id && this.savedResponseItems.has(item.id)) {
    console.log(`Skipping duplicate save for item ${item.id}`);
    continue;
  }
  // ... save message if needed
}

// Cleanup old IDs (keep last 100):
if (this.savedResponseItems.size > 100) {
  const arr = Array.from(this.savedResponseItems);
  this.savedResponseItems = new Set(arr.slice(-100));
}
```
