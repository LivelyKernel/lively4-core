import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeSessions, { 
  ClaudeConversation, 
  ClaudeMessage, 
  ClaudeUserMessage, 
  ClaudeAgentMessage, 
  ClaudeToolCall, 
  ClaudeToolResponse 
} from 'src/client/claude-sessions.js';
import ClaudeMessageColors from 'src/client/claude-message-colors.js';
import { Panning, Zooming } from "src/client/html.js";
import moment from 'src/external/moment.js';


/*MD # Claude Conversations

Manages Claude conversations with a list view and detailed graph visualization. Shows conversations side-by-side with their message flow graphs.

MD*/


export default class LivelyClaudeConversations extends Morph {

  initialize() {
    this.windowTitle = "Claude Conversations";
    
    this.projectSelect = this.get("#projectSelect");
    this.loadButton = this.get("#loadButton");
    this.loading = this.get("#loading");
    this.conversationsList = this.get("#conversationsList");
    
    this.stats = this.get("#stats");
    this.messageCount = this.get("#messageCount");
    this.sessionCount = this.get("#sessionCount");
    this.conversationCount = this.get("#conversationCount");
    
    this._currentProject = this._currentProject  || this.getAttribute('selected-project');
    this._availableProjects = this._availableProjects ||this._availableProjects || [];
    this._messages = this._messages || new Map();
    this._sessions = this._sessions || [];
    this._claudeConversations = this._claudeConversations || [];
    this._selectedConversationId = this._selectedConversationId || null;
    this._conversationGraph = this._conversationGraph || null;
    
    this.registerButtons();
    
    this.projectSelect.addEventListener('change', () => {
      this.setAttribute('selected-project', this.projectSelect.value);
      this._currentProject = this.projectSelect.value;
    });
    
    if (this._claudeConversations.length == 0) {
      this.loadProjects();
    } else {
      this.populateProjectDropdown();
      this.renderConversationsList();
      this.setupGraphComponent();
    }
  }
  
  async loadProjects() {
    try {
      this._availableProjects = await ClaudeSessions.loadProjects();
      this.populateProjectDropdown();
    } catch (error) {
      console.error('Failed to load projects:', error);
      this._availableProjects = [];
      this.populateProjectDropdown();
    }
  }
  
  populateProjectDropdown() {
    if (!this.projectSelect) return;
    
    this.projectSelect.innerHTML = '';
    
    if (this._availableProjects.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No projects found';
      option.disabled = true;
      this.projectSelect.appendChild(option);
      return;
    }
    
    const selectOption = document.createElement('option');
    selectOption.value = '';
    selectOption.textContent = 'Select Project';
    this.projectSelect.appendChild(selectOption);
    
    this._availableProjects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.name;
      option.textContent = project.name;
      this.projectSelect.appendChild(option);
    });
    
    const projectToSelect = this._currentProject || this.getAttribute('selected-project') || '';
    if (projectToSelect) {
      this.projectSelect.value = projectToSelect;
    }
  }
  
  async onLoadButton() {
    if (!this._currentProject) {
      lively.notify('Please select a project first');
      return;
    }
    
    this.showLoading();
    
    try {
      await this.loadConversations();
      await this.renderConversationsList();
      await this.setupGraphComponent();
      this.updateStats();
    } catch (error) {
      this.showError(`Failed to load conversations: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }
  
  
  async loadConversations() {
    this._claudeConversations = await ClaudeSessions.loadConversations(this._currentProject);
    
    this._messages.clear();
    this._claudeConversations.forEach(({ claudeConversation }) => {
      claudeConversation.messages.forEach(message => {
        if (message.uuid) {
          this._messages.set(message.uuid, message);
        }
      });
    });
  }
  
  getConversationTitle(conversationData) {
    if (conversationData.latestDate)
      return moment(conversationData.latestDate).format('MMM D, YY') 
    else 
      return 'No date'
  }

  async renderConversationsList() {
    if (!this.conversationsList) return;
    
    if (this._claudeConversations.length === 0) {
      this.conversationsList.innerHTML = '<div class="empty-conversations">No conversations found</div>';
      return;
    }
    
    this.conversationsList.innerHTML = '';
    
    for (const [conversationId, conversationData] of this._claudeConversations) {
      const { claudeConversation, title, latestDate } = conversationData;
      
      const conversationItem = document.createElement('div');
      conversationItem.className = 'conversation-item';
      if (conversationId === this._selectedConversationId) {
        conversationItem.classList.add('selected');
      }
      
      const conversationTitle = this.getConversationTitle({ title, latestDate });
      const messageCount = claudeConversation.messages.length;
      
      conversationItem.innerHTML = `
        <div class="conversation-title">${conversationTitle}</div>
        <div class="conversation-meta">${messageCount} messages</div>
      `;
      
      conversationItem.addEventListener('click', () => {
        this.selectConversation(conversationId, conversationData);
      });
      
      this.conversationsList.appendChild(conversationItem);
    }
  }
  
  selectConversation(conversationId, conversationData) {
    // Update selection
    this._selectedConversationId = conversationId;
    
    // Update UI
    this.conversationsList.querySelectorAll('.conversation-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    const selectedItem = Array.from(this.conversationsList.children)
      .find(item => item.textContent.includes(this.getConversationTitle(conversationData)));
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }
    
    // Update graph component
    if (this._conversationGraph) {
      const conversationTitle = this.getConversationTitle(conversationData);
      this._conversationGraph.setConversation(conversationData.claudeConversation, conversationTitle);
    }
  }
  
  async setupGraphComponent() {
    if (!this._conversationGraph) {
      const graphContainer = this.get('#graphContainer');
      if (graphContainer) {
        this._conversationGraph = await lively.create('lively-claude-conversation-graph');
        graphContainer.innerHTML = '';
        graphContainer.appendChild(this._conversationGraph);
        
        // Listen for message selection events
        this._conversationGraph.addEventListener('conversation-message-selected', (evt) => {
          console.log('Message selected:', evt.detail);
        });
      }
    }
  }
  
  escapeLabel(label) {
    return label.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
  
  
  async onRefreshButton() {
    await this.renderConversationsList();
    await this.setupGraphComponent();
  }
  
  updateStats() {
    if (!this.stats) return;
    
    this.messageCount.textContent = `Messages: ${this._messages.size}`;
    this.conversationCount.textContent = `Conversations: ${this._claudeConversations.size}`;
    
    this.stats.style.display = 'flex';
  }
  
  showLoading() {
    if (this.loading) {
      this.loading.style.display = 'block';
    }
    if (this.conversationsList) {
      this.conversationsList.innerHTML = '';
    }
  }
  
  hideLoading() {
    if (this.loading) {
      this.loading.style.display = 'none';
    }
  }
  
  showError(message) {
    this.hideLoading();
    if (this.conversationsList) {
      this.conversationsList.innerHTML = `<div class="error-message">${message}</div>`;
    }
  }
  
  livelyMigrate(other) {
    this._availableProjects = other._availableProjects;
    this._currentProject = other._currentProject;
    this._claudeConversations = other._claudeConversations || new Map();
    this._messages = other._messages || new Map();
    this._selectedConversationId = other._selectedConversationId;
    this._conversationGraph = other._conversationGraph;
  }
}
