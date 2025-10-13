# 2025-10-13 OpenAI Realtime Audio Chat Integration #webrtc #openai #realtime-api #audio-chat

*Author: @JensLincke [with @BlindGoldie]*

Integrated OpenAI's Realtime API with WebRTC into the OpenAI Audio Chat component, enabling real-time bidirectional audio conversations with GPT-4o.

- **Modified**: [openai-audio-chat.js](edit://src/components/tools/openai-audio-chat.js), [openai-audio-chat.html](edit://src/components/tools/openai-audio-chat.html)
- **Feature**: Real-time audio streaming mode using WebRTC and OpenAI Realtime API
- **UI**: Toggle for switching between traditional text-based chat and real-time audio mode
- **Audio**: Direct audio-to-audio communication with automatic voice activity detection

## Technical Implementation

**WebRTC Connection Architecture:**
- `generateEphemeralToken()` - Creates 60-second ephemeral tokens via `/v1/realtime/sessions` endpoint
- `connectRealtimeWebRTC()` - Establishes RTCPeerConnection with OpenAI's Realtime API
- SDP offer/answer exchange with ephemeral token authentication
- Data channel for control messages and transcript events
- Audio tracks automatically streamed bidirectionally

**Voice Compatibility Management:**
- `updateVoiceOptions(isRealtime)` - Dynamically switches voice dropdown options
- Regular TTS voices: alloy, echo, fable, onyx, nova, shimmer
- Realtime API voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar
- Automatic voice mapping when switching modes (e.g., onyx→echo, nova→shimmer)
- Bidirectional mapping preserves user preference when toggling modes

**Transcript Integration:**
- `handleRealtimeMessage()` captures transcript events from data channel
- `conversation.item.input_audio_transcription.completed` for user speech
- `response.audio_transcript.delta` and `response.audio_transcript.done` for AI responses
- Transcripts displayed in chat history using existing `addMessage()` and `renderMessage()` methods
- Text history persists alongside real-time audio conversations

**Session Configuration:**
- Server VAD (Voice Activity Detection) with configurable threshold
- Input audio transcription via Whisper-1 model
- Turn detection with 500ms silence duration
- Streaming audio with automatic speech start/stop detection

## Key Features

1. **Dual Mode Operation**: Seamless switching between text-based and real-time audio modes
2. **Ephemeral Token Security**: 60-second tokens protect API keys in browser environment
3. **Low Latency**: WebRTC optimized for real-time audio streaming
4. **Automatic VAD**: Server-side voice activity detection handles turn-taking
5. **Transcript Capture**: Full text history of audio conversations
6. **Voice Compatibility**: Intelligent mapping between TTS and Realtime API voice sets
7. **Visual Indicators**: Clear UI feedback for streaming mode status (streaming-mode class, "LIVE" indicator)

## API Endpoints

- `POST https://api.openai.com/v1/realtime/sessions` - Generate ephemeral token with model and voice configuration
- `POST https://api.openai.com/v1/realtime` - WebRTC SDP offer/answer exchange using ephemeral token authentication
- Data channel events: session.created, session.updated, input_audio_buffer.speech_started/stopped, conversation.item.created, response.audio_transcript.delta/done, response.done

## Error Handling

- Voice validation with automatic fallback to compatible voices
- Detailed error logging for ephemeral token generation failures
- Connection failure rollback restores regular TTS mode
- WebRTC cleanup on disconnect (peer connection, data channel, audio streams)

## Implementation Notes

**WebRTC vs WebSocket:**
- Replaced initial WebSocket approach due to browser header limitations
- WebSocket requires Authorization header not supported by browser WebSocket API
- WebRTC with ephemeral tokens solves authentication without server-side proxy
- Lower latency and better audio codec support with WebRTC

**Model Version:**
- Using `gpt-4o-realtime-preview-2024-12-17` model
- Ephemeral token specifies model and voice at session creation
- Session configuration sent via data channel after connection established

**Audio Handling:**
- Microphone access via `getUserMedia()` with audio constraints
- Remote audio playback via Audio element with MediaStream source
- Automatic cleanup of audio tracks on disconnect

## Future Enhancements

- Visual transcript streaming (show delta updates in real-time)
- Push-to-talk integration with F4 hotkey in streaming mode
- Model selection for Realtime API (currently hardcoded to gpt-4o-realtime-preview)
- Recording and playback of real-time conversations
- Multi-turn conversation context preservation across reconnections
