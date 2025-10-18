import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeMessageColors from 'src/client/claude-message-colors.js';
import { Panning, Zooming } from "src/client/html.js";

/*MD # Claude Conversation Graph

Visualizes a single Claude conversation structure as a graph showing how messages connect to each other through parent-child relationships.

**API:**
- `setConversation(claudeConversation, conversationTitle)` - Set the conversation to visualize
- `renderConversation()` - Render the current conversation graph
- Events: `conversation-message-selected` - Emitted when a message is clicked

MD*/

export default class LivelyClaudeConversationGraph extends Morph {

  initialize() {
    this.windowTitle = "Claude Conversation Graph";
    
    // State preservation for live updates
    this._currentConversation = this._currentConversation || null;
    this._conversationTitle = this._conversationTitle || null;
    this._messages = this._messages || new Map();
    this._currentlyOpenMessage = this._currentlyOpenMessage || null;
    
    // Clear volatile state
    this._graphviz = null;
    this._zooming = null;
    this._details = null;
    this._pane = null;
    
    this.registerButtons();
    
    if (this._currentConversation) {
      this.renderConversation();
    } else {
      this.showEmptyState();
    }
  }
  
  /**
   * Set the conversation to visualize
   * @param {ClaudeConversation} claudeConversation - The conversation to visualize
   * @param {string} conversationTitle - Title for the conversation
   */
  setConversation(claudeConversation, conversationTitle = "Conversation") {
    this._currentConversation = claudeConversation;
    this._conversationTitle = conversationTitle;
    
    // Update messages map
    this._messages.clear();
    if (claudeConversation && claudeConversation.messages) {
      claudeConversation.messages.forEach(message => {
        if (message.uuid) {
          this._messages.set(message.uuid, message);
        }
      });
    }
    
    this.renderConversation();
  }
  
  /**
   * Render the current conversation as a graph
   */
  async renderConversation() {
    if (!this._currentConversation || this._messages.size === 0) {
      this.showEmptyState();
      return;
    }
    
    this.get("#content").innerHTML = "";
    this._details = <div class="details" style="position:absolute; display: none; z-index: 1000; background: #FBFBFB; padding: 10px; border: 1px solid gray; border-radius: 5px; max-width: 400px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"></div>;
    this._pane = <div id="root">{this._details}</div>;
    this.get("#content").appendChild(this._pane);
    
    new Panning(this._pane);
    
    let dot = 'digraph ConversationGraph {\n';
    dot += '  fontname="Arial";\n';
    dot += '  rankdir=TB;\n';
    dot += '  ranksep=0.4;\n';
    dot += '  nodesep=0.3;\n';
    dot += '  node [shape=circle, width=0.3, height=0.3, fontsize=12, fontname="Arial"];\n';
    dot += '  edge [arrowsize=0.3, fontname="Arial"];\n';
    
    // Single conversation - no cluster needed
    dot += `  label="${this.escapeLabel(this._conversationTitle)}";\n`;
    dot += `  labelloc=t;\n`;
    dot += `  labeljust=c;\n`;
    
    this._currentConversation.messages.forEach(message => {
      const color = ClaudeMessageColors.getGraphvizColor(message);
      const title = `${message.role} - ${message.uuid.substring(0, 8)}`;
      dot += `  "${message.uuid}" [label="X", fillcolor="${color}", style="filled", tooltip="${title}", title="${message.uuid}"];\n`;
    });
    
    this._currentConversation.messages.forEach(message => {
      if (message.parentUuid) {
        const parentExists = this._currentConversation.messages.some(m => m.uuid === message.parentUuid);
        if (parentExists) {
          dot += `  "${message.parentUuid}" -> "${message.uuid}";\n`;
        }
      }
    });
    
    dot += '}';
    await this.renderDotGraph(dot);
  }
  
  showEmptyState() {
    this.get("#content").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-title">No Conversation Selected</div>
        <div class="empty-description">Select a conversation from the list to view its message flow graph.</div>
      </div>
    `;
  }
  
  escapeLabel(label) {
    return label.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
  
  async renderDotGraph(dot) {
    try {
      this._graphviz = await (<graphviz-dot server="true"></graphviz-dot>);
      this._graphviz.style.display = 'inline-block';
      
      this._graphviz.innerHTML = `<script type="graphviz">${dot}</script>`;
      this._graphviz.setAttribute("engine", "dot");
      
      this._pane.appendChild(this._graphviz);
      await this._graphviz.updateViz();
      
      this._zooming = new Zooming(this._graphviz, {
        minZoom: 0.1,
        maxZoom: 5.0,
        zoomStep: 0.1,
        transformOrigin: 'top left'
      });
      
      this.addClickHandlers();
      this.patchMessageIcons();
      
    } catch (error) {
      console.error('Failed to render graph:', error);
      this.showError(`Failed to render graph: ${error.message}`);
    }
  }
  
  addClickHandlers() {
    if (!this._graphviz || !this._graphviz.shadowRoot) return;
    
    const messageNodes = this._graphviz.shadowRoot.querySelectorAll("g.node");
    messageNodes.forEach(nodeElement => {
      nodeElement.addEventListener("click", async (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        
        const titleElement = nodeElement.querySelector('title');
        if (titleElement) {
          const uuid = titleElement.textContent.trim();
          const message = this._messages.get(uuid);
          if (message) {
            this.onMessageClick(evt, uuid, message, nodeElement);
          }
        }
      });
    });
  }
  
  patchMessageIcons() {
    if (!this._graphviz || !this._graphviz.shadowRoot) return;
    
    const nodeGroups = this._graphviz.shadowRoot.querySelectorAll("g.node");
    nodeGroups.forEach(nodeGroup => {
      const titleElement = nodeGroup.querySelector('title');
      if (!titleElement) return;
      
      const uuid = titleElement.textContent.trim();
      const message = this._messages.get(uuid);
      if (message) {
        const textElement = nodeGroup.querySelector('text');
        if (textElement && textElement.textContent === 'X') {
          textElement.textContent = message.getIcon();
        }
      }
    });
  }
  
  async onMessageClick(evt, uuid, message, svgNode) {
    if (this._details.style.display === 'block') {
      // hide details
      this._details.style.display = 'none';
      return;
    }
    
    const inspector = await (<lively-inspector></lively-inspector>);
    inspector.inspect(message);
    inspector.hideWorkspace();
    
    this._details.innerHTML = '';
    this._details.appendChild(inspector);
    
    this._details.style.display = 'block';
    
    lively.setClientPosition(this._details, lively.getClientPosition(svgNode).addPt(lively.pt(50, 0)));
    
    // Emit event for other components to listen
    this.dispatchEvent(new CustomEvent('conversation-message-selected', {
      detail: { uuid, message },
      bubbles: true
    }));
  }
  
  showError(message) {
    this.get("#content").innerHTML = `<div class="error-message">${message}</div>`;
  }
  
  onRefreshButton() {
    this.renderConversation();
  }
  
  livelyMigrate(other) {
    this._currentConversation = other._currentConversation;
    this._conversationTitle = other._conversationTitle;
    this._messages = other._messages || new Map();
    
    if (other._zooming) {
      this._zoomLevel = other._zooming.getZoom();
    }
  }
}