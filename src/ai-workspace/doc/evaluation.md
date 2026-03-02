# Evaluation



## Social Engineering required

There was sometimes an issue where the voice agent thought that it send a command to the code agent and that it is actually waiting on it. But the chat made it clear that this did not happen. It was very hard to convince the voice agent to really sent it. What surprisingly worked was to ask: "Send it again". Which made the the human feel like a tech support asking the user to unplug the machine and plug it in again. 



## Known Issue: Ghost Interruptions in OpenAI Realtime API (VAD False Positives)

When using the OpenAI Realtime API in server VAD mode, background noise, filler sounds, or microphone artifacts can trigger false VAD activations — causing the API to treat non-speech audio as a user turn, cancel the model's ongoing response, and commit an empty or near-empty audio buffer to the conversation. The model has no awareness of this happening: when a VAD start event occurs, any ongoing response with output to the default conversation is interrupted and cancelled, but nothing meaningful is added to the model's context. From the model's perspective the conversation simply stopped mid-response with no explanation, while the developer side may see a transcript artifact like "Bye" or "Thank you" from the ASR pipeline attached to the committed turn. This is a widely reported issue: normal conversational filler words like "hmm", "okay", or "right" — as well as noise — are treated as actual interruptions even at high VAD threshold values. The primary mitigations are raising the `threshold` value in `turn_detection`, enabling input audio noise reduction, which filters audio before it is sent to VAD and the model, improving VAD accuracy and reducing false positives, or disabling automatic interruption via `interrupt_response: false` and handling response gating manually.