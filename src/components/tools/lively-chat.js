import Morph from 'src/components/widgets/lively-morph.js';

/*MD
# Lively Chat Base Class

Shared superclass for AI-related chat components:
- lively-ai-workspace
- openai-realtime-chat
- lively-opencode

This base class provides common functionality and styles for chat interfaces.

MD*/

export default class LivelyChat extends Morph {

  /*MD ## Shared Properties MD*/

  set messagesUI(value) {
    // Control whether messages are rendered in the UI
    // Default (undefined/true) renders messages normally
    // Set to false to disable UI rendering (e.g., when embedded in workspace)
    if (value === false || value === "false") {
      this.setAttribute("messages-ui", "false");
    } else if (value === true || value === "true") {
      this.setAttribute("messages-ui", "true");
    } else {
      this.removeAttribute("messages-ui");
    }
  }

  get messagesUI() {
    const attr = this.getAttribute("messages-ui");
    if (attr === "false") return false;
    return true; // default is visible
  }
}
