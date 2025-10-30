import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';

/*MD
# Lively Chat Base Class

Shared superclass for AI-related chat components:
- lively-ai-workspace
- openai-realtime-chat
- lively-opencode

This base class provides common functionality and styles for chat interfaces.

## Shared Properties

- `messagesUI` - Show/hide message display pane
- `sessionUI` - Show/hide session management UI
- `showDebug` - Show debug annotations in messages

## Shared Methods

- `setupInputHandling(inputSelector)` - Configure Enter to send pattern
- `scrollToBottom(container, force)` - Scroll container to bottom
- `generateToggleIcon(state)` - Generate checkbox icon for context menu
- `createBaseContextMenu()` - Base context menu items

## Extension Points

Override these methods in subclasses to customize behavior:
- `getContextMenuItems()` - Add component-specific menu items

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

  set sessionUI(value) {
    // Control whether session management UI is shown
    // Default (undefined/true) shows the session panel
    // Set to false to hide when embedded or managed externally
    if (value === false || value === "false") {
      this.setAttribute("session-ui", "false");
    } else if (value === true || value === "true") {
      this.setAttribute("session-ui", "true");
    } else {
      this.removeAttribute("session-ui");
    }
  }

  get sessionUI() {
    const attr = this.getAttribute("session-ui");
    if (attr === "false") return false;
    return true; // default is visible
  }

  set showDebug(value) {
    // Control whether debug annotations are shown in messages
    this._showDebug = value;
    // Update existing messages if messages container exists
    this.updateMessagesDebugState();
  }

  get showDebug() {
    return this._showDebug || false;
  }

  /*MD ## Shared Utility Methods MD*/

  /**
   * Update debug state on all existing message elements
   * Subclasses should override to target correct container
   */
  updateMessagesDebugState() {
    // Override in subclass with specific container selector
  }

  /**
   * Setup input handling for Enter to send pattern
   * @param {string} inputSelector - CSS selector for input element
   * @param {Function} sendHandler - Handler to call on send (e.g., this.onSendButton)
   */
  setupInputHandling(inputSelector, sendHandler) {
    const input = this.get(inputSelector);
    if (input) {
      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter' && !evt.shiftKey) {
          evt.preventDefault();
          sendHandler.call(this);
        }
      });
    }
  }

  /**
   * Scroll container to bottom with optional force
   * @param {HTMLElement} container - Container to scroll
   * @param {boolean} force - Force scroll even if not at bottom
   * @param {number} delay - Delay in ms before scrolling (default 10)
   */
  scrollToBottom(container, force = false, delay = 10) {
    if (!container) return;

    const shouldScroll = force || this.isAtBottom(container);
    if (shouldScroll) {
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, delay);
    }
  }

  /**
   * Check if container is scrolled near bottom
   * @param {HTMLElement} container - Container to check
   * @param {number} threshold - Distance from bottom in pixels (default 50)
   */
  isAtBottom(container, threshold = 50) {
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return (scrollHeight - scrollTop - clientHeight) < threshold;
  }

  /**
   * Generate checkbox icon for context menu toggle items
   * @param {boolean} state - Checked state
   * @returns {string} HTML icon string
   */
  generateToggleIcon(state) {
    return state
      ? '<i class="fa fa-check-square-o" aria-hidden="true"></i>'
      : '<i class="fa fa-square-o" aria-hidden="true"></i>';
  }

  /*MD ## Context Menu Support MD*/

  /**
   * Create base context menu items common to all chat components
   * Subclasses can override getContextMenuItems() to add more items
   */
  createBaseContextMenu(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const menuItems = [
      ["Copy", () => {
        const selection = window.getSelection().toString();
        if (selection) {
          navigator.clipboard.writeText(selection);
          lively.notify("Copied", "Selection copied to clipboard");
        }
      }],
      [" Debug", () => {
        this.showDebug = !this.showDebug;
      }, "", this.generateToggleIcon(this.showDebug)],
    ];

    // Allow subclass to add more items
    const customItems = this.getContextMenuItems();
    if (customItems && customItems.length > 0) {
      menuItems.push(...customItems);
    }

    const menu = new ContextMenu(this, menuItems);
    menu.openIn(document.body, evt, this);
    return true;
  }

  /**
   * Override in subclass to add component-specific context menu items
   * @returns {Array} Array of menu item arrays
   */
  getContextMenuItems() {
    return [];
  }
}
