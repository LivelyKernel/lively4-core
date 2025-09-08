import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeSessions from 'src/client/claude-sessions.js';
import d3 from "src/external/d3.v5.js";
import moment from "src/external/moment.js";

import LivelyClaudeStatisticsCalendar from 'src/client/claude/claude-statistics-calendar-chart.js';
import LivelyClaudeStatisticsSession from 'src/client/claude/claude-statistics-session-chart.js'

const inDollar = ClaudeSessions.formatDollarAmount
const humanReadable = ClaudeSessions.formatNumber



/*MD # Claude Statistics Viewer

- Analyzes all Claude Code session files and displays cost progression charts
- Shows stacked bar charts for each session with token cost breakdowns
- Displays actual costs in dollars based on Claude Sonnet 4 pricing

MD*/

export default class LivelyClaudeStatistics extends Morph {

  async initialize() {
    this.windowTitle = "Claude Statistics";
    
    // Initialize UI references
    this.loadingProgress = this.get("#loadingProgress");
    this.progressFill = this.get("#progressFill");
    this.progressText = this.get("#progressText");
    this.sessionList = this.get("#sessionList");
    this.refreshBtn = this.get("#refreshButton");
    this.projectSelect = this.get("#projectSelect");
    this.daySelect = this.get("#daySelect");
    this.showDetailedCostsCheckbox = this.get("#showDetailedCosts");
    this.compactViewCheckbox = this.get("#compactView");
    this.calendarModeCheckbox = this.get("#calendarMode");
    this.loadMoreButton = this.get("#loadMoreButton");
    
    // Calendar view elements
    this.calendarView = this.get("#calendarView");
    
    // Cost summary elements
    this.totalCostSummary = this.get("#totalCostSummary");
   
    
    // Initialize data structures - now using conversations instead of sessions
    this._conversationList = this._conversationList || [];
    this._processedConversations = this._processedConversations || new Map();
    this._globalMaxCost = this._globalMaxCost || 0;
    this._globalMaxMessages = this._globalMaxMessages || 0;
    this._currentProject = this.getAttribute('selected-project');
    this._availableProjects = this._availableProjects || [];
    this._selectedDay = this.getAttribute('selected-day');
    this._availableDays = this._availableDays || [];
    this._remainingConversations = this._remainingConversations || [];
    this._conversationsWithDuplicates = this._conversationsWithDuplicates || new Set(); // Track conversations with duplicate content
    this._globalMessageUUIDs = this._globalMessageUUIDs || new Set(); // Track UUIDs across all rendered messages
    this._loadingProgress = {
      total: 0,
      loaded: 0,
      currentSession: null
    };
    this._lastRefresh = null;
    
    this.registerButtons();
    
    this.projectSelect.addEventListener('change', () => {
      this.setAttribute('selected-project', this.projectSelect.value);
      this.onProjectChanged();
    });
    
    // Selector dropdown
    this.populateDayDropdown();
    this.daySelect.addEventListener('change', () => {
      this.setAttribute('selected-day', this.daySelect.value);
      this.onDayChanged();
    });
    
    this.populateProjectDropdown();
    
    
    // X hart mode toggle checkbox
    const detailedCosts = this.getAttribute('detailed-costs');
    if (detailedCosts !== null) {
      this.showDetailedCostsCheckbox.checked = detailedCosts === 'true';
    }

    this.showDetailedCostsCheckbox.addEventListener('change', () => {
      this.setAttribute('detailed-costs', this.showDetailedCostsCheckbox.checked);
      this.onChartModeChanged();
    });

    // Register compact view toggle checkbox
    
    const compactView = this.getAttribute('compact-view');
    if (compactView !== null) {
      this.compactViewCheckbox.checked = compactView === 'true';
    }

    this.compactViewCheckbox.addEventListener('change', () => {
      this.setAttribute('compact-view', this.compactViewCheckbox.checked);
      this.onCompactViewChanged();
    });

    // Register calendar mode toggle checkbox

    const calendarMode = this.getAttribute('calendar-mode');
    if (calendarMode !== null) {
      this.calendarModeCheckbox.checked = calendarMode === 'true';
    }

    this.calendarModeCheckbox.addEventListener('change', () => {
      this.setAttribute('calendar-mode', this.calendarModeCheckbox.checked);
      this.onCalendarModeChanged();
    });
    
    // Register load more button
    this.loadMoreButton.addEventListener('click', () => {
      this.onLoadMoreButton();
    });
    
    // Load projects and data
    if (this._availableProjects && this._availableProjects.length > 0) {
      this.ensureDataAndUpdateView();
    } else {
      this.loadProjects().then(() => {
        this.ensureDataAndUpdateView();
      });
    }
  }

  async ensureDataAndUpdateView() {
    // Check if we already have data (from migration or previous load)
    if (this._conversationList.length > 0 && this._processedConversations.size > 0) {
      // We have cached data, just render it
      this.renderAllConversations();
      return;
    }
    
    // No data available, load it fresh
    await this.loadAllConversations();
  }
  
  
  
  async onRefreshButton() {
    // Force a complete refresh from disk, ignoring caches
    await this.forceRefresh();
  }


  onChartModeChanged() {
    // Re-render all conversations with new chart mode
    this.renderAllConversations();
  }

  onCompactViewChanged() {
    // Re-render all conversations with new compact view setting
    this.renderAllConversations();
  }

  onCalendarModeChanged() {
    this.renderAllConversations();
  }

  async onDayChanged() {
    const selectedDay = this.daySelect ? this.daySelect.value : undefined;
    
    if (selectedDay !== this._selectedDay) {
      this._selectedDay = selectedDay;
      // Persist to attributes
      this.setAttribute('selected-day', selectedDay || '');
      
      // If a specific day is selected, we might need to load conversations from that day
      if (selectedDay) {
        await this.ensureConversationsForDayLoaded(selectedDay);
      }
      
      // Re-render conversations filtered by selected day
      this.renderAllConversations();
    }
  }

  async ensureConversationsForDayLoaded(targetDay) {
    // Check if we have any conversations for this day loaded
    const hasConversationsForDay = Array.from(this._processedConversations.values()).some(conversationData => {
      let conversationDate = null;
      
      if (conversationData.modificationTime) {
        conversationDate = new Date(conversationData.modificationTime);
      } else if (conversationData.dateRange) {
        conversationDate = conversationData.dateRange.start || conversationData.dateRange.end;
      }
      
      if (conversationDate instanceof Date && !isNaN(conversationDate.getTime())) {
        const dayString = conversationDate.toISOString().split('T')[0];
        return dayString === targetDay;
      }
      return false;
    });
    
    // If we don't have conversations for this day, check if any unloaded conversations match
    if (!hasConversationsForDay && this._remainingConversations.length > 0) {
      const matchingConversations = this._remainingConversations.filter(conversation => {
        if (conversation.latestModificationTime) {
          try {
            const modDate = new Date(conversation.latestModificationTime);
            if (!isNaN(modDate.getTime())) {
              const dayString = modDate.toISOString().split('T')[0];
              return dayString === targetDay;
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
        return false;
      });
      
      // Load all matching conversations for this day
      if (matchingConversations.length > 0) {
        for (const conversation of matchingConversations) {
          // Remove from remaining conversations
          const index = this._remainingConversations.indexOf(conversation);
          if (index > -1) {
            this._remainingConversations.splice(index, 1);
          }
          
          // Load and process the conversation
          if (!this._processedConversations.has(conversation.conversationId)) {
            const conversationData = await this.loadAndProcessConversation(conversation);
            if (conversationData !== null) {
              this._processedConversations.set(conversation.conversationId, conversationData);
              
              // Update global max values
              if (conversationData.costProgression.length > 0) {
                const conversationMax = Math.max(...conversationData.costProgression.map(p => p.totalCost));
                this._globalMaxCost = Math.max(this._globalMaxCost || 0, conversationMax);
                this._globalMaxMessages = Math.max(this._globalMaxMessages || 0, conversationData.costProgression.length);
              }
            }
          }
        }
      }
    }
  }

  async onLoadMoreButton() {
    if (!this._remainingConversations || this._remainingConversations.length === 0) {
      return;
    }
    
    // Disable button during loading
    this.loadMoreButton.disabled = true;
    this.loadMoreButton.textContent = 'Loading...';
    
    try {
      let conversationsToLoad;
      
      if (this._selectedDay && this._selectedDay.trim() !== '') {
        // Load all remaining conversations for the selected day
        conversationsToLoad = this._remainingConversations.filter(conversation => {
          if (conversation.latestModificationTime) {
            try {
              const modDate = new Date(conversation.latestModificationTime);
              if (!isNaN(modDate.getTime())) {
                const dayString = modDate.toISOString().split('T')[0];
                return dayString === this._selectedDay;
              }
            } catch (e) {
              // Skip invalid dates
            }
          }
          return false;
        });
        
        // Remove loaded conversations from remaining list
        this._remainingConversations = this._remainingConversations.filter(conversation => {
          return !conversationsToLoad.includes(conversation);
        });
      } else {
        // Load all remaining conversations for current project
        conversationsToLoad = [...this._remainingConversations];
        this._remainingConversations = [];
      }
      
      // Process each conversation
      let successfullyLoaded = 0;
      let skippedNoTokens = 0;
      
      for (let i = 0; i < conversationsToLoad.length; i++) {
        const conversation = conversationsToLoad[i];
        
        // Skip if already cached
        if (this._processedConversations.has(conversation.conversationId)) {
          continue;
        }
        
        // Update button text with progress
        const progress = Math.round(((i + 1) / conversationsToLoad.length) * 100);
        this.loadMoreButton.textContent = `Loading... ${progress}%`;
        
        // Load and process new conversation
        const conversationData = await this.loadAndProcessConversation(conversation);
        
        // Skip conversations without token statistics
        if (conversationData === null) {
          skippedNoTokens++;
          continue;
        }
        
        // Cache the processed data
        this._processedConversations.set(conversation.conversationId, conversationData);
        successfullyLoaded++;
        
        // Update global max values for this conversation
        if (conversationData.costProgression.length > 0) {
          const conversationMax = Math.max(...conversationData.costProgression.map(p => p.totalCost));
          this._globalMaxCost = Math.max(this._globalMaxCost || 0, conversationMax);
          this._globalMaxMessages = Math.max(this._globalMaxMessages || 0, conversationData.costProgression.length);
        }
        
        // Allow UI to update (non-blocking)
        await lively.sleep(10);
      }
      
      // Re-render all conversations to show new ones in correct sorted order
      this.renderAllConversations();
      
      // Update Load More button visibility
      this.showLoadMoreButton();
      
      // Show completion notification
      const target = this._selectedDay && this._selectedDay.trim() !== '' 
        ? `day ${this._selectedDay}` 
        : 'project';
      lively.notify(`Loaded ${successfullyLoaded} more conversations for ${target}`);
      
    } catch (error) {
      lively.notify('Failed to load more conversations: ' + error.message);
    } finally {
      // Re-enable button
      this.loadMoreButton.disabled = false;
    }
  }

  showLoadMoreButton() {
    if (!this.loadMoreButton) return;
    
    const remainingCount = this.getRemainingConversationsForDay(this._selectedDay);
    
    this.loadMoreButton.innerHTML = `
      <i class="fa fa-download" aria-hidden="true"></i>
      Load
    `;
    this.loadMoreButton.style.display = 'block';
  }

  getRemainingConversationsForDay(selectedDay) {
    if (!selectedDay || selectedDay.trim() === '') {
      // "All Days" - return all remaining conversations
      return this._remainingConversations.length;
    }
    
    // Filter remaining conversations by the selected day
    const remainingForDay = this._remainingConversations.filter(conversation => {
      if (conversation.latestModificationTime) {
        try {
          const modDate = new Date(conversation.latestModificationTime);
          if (!isNaN(modDate.getTime())) {
            const dayString = modDate.toISOString().split('T')[0];
            return dayString === selectedDay;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
      return false;
    });
    
    return remainingForDay.length;
  }

  isCompactViewEnabled() {
    // Check if compact view is enabled (default: true)
    if (this.compactViewCheckbox) {
      return this.compactViewCheckbox.checked;
    }
    // Fallback to attribute if checkbox not ready yet
    const compactView = this.getAttribute('compact-view');
    return compactView !== null ? compactView === 'true' : true;
  }

  isDetailedCostsEnabled() {
    // Check if detailed cost breakdown is enabled (default: true)
    if (this.showDetailedCostsCheckbox) {
      return this.showDetailedCostsCheckbox.checked;
    }
    // Fallback to attribute if checkbox not ready yet
    const detailedCosts = this.getAttribute('detailed-costs');
    return detailedCosts !== null ? detailedCosts === 'true' : true;
  }

  isCalendarModeEnabled() {
    // Check if calendar mode is enabled (default: false)
    if (this.calendarModeCheckbox) {
      return this.calendarModeCheckbox.checked;
    }
    // Fallback to attribute if checkbox not ready yet
    const calendarMode = this.getAttribute('calendar-mode');
    return calendarMode !== null ? calendarMode === 'true' : false;
  }

  async onProjectChanged() {
    
    const selectedProject = this.projectSelect ? this.projectSelect.value : undefined;
    
    if (selectedProject !== this._currentProject) {
      this._currentProject = selectedProject;
      // Persist to attributes
      this.setAttribute('selected-project', selectedProject || '');
      
      // Clear old conversation data completely
      this._processedConversations.clear();
      this._conversationList = [];
      this._remainingConversations = [];
      this._globalMaxCost = 0;
      this._globalMaxMessages = 0;
      this._lastRefresh = null;
      this._conversationsWithDuplicates = new Set(); // Clear duplicate tracking
      
      // Clear the UI immediately
      this.sessionList.innerHTML = '';
      // Hide cost summary when clearing sessions
      if (this.totalCostSummary) {
        this.totalCostSummary.style.display = 'none';
      }
      
      await this.forceRefresh(); // Reload data for new project
    }
  }

  async loadProjects() {
    try {
      this._availableProjects = await ClaudeSessions.loadProjects();
      this.populateProjectDropdown();
    } catch (error) {
      this._availableProjects = [];
      this.populateProjectDropdown();
    }
  }

  populateProjectDropdown() {
    if (!this.projectSelect) return;
    
    // Clear existing options
    this.projectSelect.innerHTML = '';
    
    if (this._availableProjects.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No projects found';
      option.disabled = true;
      this.projectSelect.appendChild(option);
      return;
    }
    
    // Add "All Projects" option
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All Projects';
    this.projectSelect.appendChild(allOption);
    
    // Add individual project options
    this._availableProjects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.name; // Use the full directory name for both value and display
      option.textContent = project.name;
      this.projectSelect.appendChild(option);
    });
    
    // Set current selection from instance variable or attribute
    const projectToSelect = this._currentProject || this.getAttribute('selected-project') || '';
    if (projectToSelect) {
      this.projectSelect.value = projectToSelect;
    }
  }

  getAvailableDays() {
    const dayMap = new Map(); // Map from day string to { date: Date, count: number, conversations: [] }
    
    // Iterate through all processed conversations to extract days
    this._processedConversations.forEach((conversationData, conversationId) => {
      if (!conversationData) return;
      
      // Try multiple sources for the date: modificationTime, dateRange.start, dateRange.end
      let conversationDate = null;
      
      // First try modification time (most reliable)
      if (conversationData.modificationTime) {
        conversationDate = new Date(conversationData.modificationTime);
      }
      // Fallback to date range
      else if (conversationData.dateRange) {
        conversationDate = conversationData.dateRange.start || conversationData.dateRange.end;
      }
      
      if (conversationDate instanceof Date && !isNaN(conversationDate.getTime())) {
        const dayString = conversationDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!dayMap.has(dayString)) {
          dayMap.set(dayString, {
            date: conversationDate,
            count: 0,
            conversations: []
          });
        }
        
        const dayInfo = dayMap.get(dayString);
        dayInfo.count++;
        dayInfo.conversations.push(conversationData);
      }
    });
    
    // Convert map to sorted array (newest first)
    return Array.from(dayMap.entries())
      .map(([dayString, dayInfo]) => ({
        dayString,
        displayName: `${dayString} (${dayInfo.count} conversations)`,
        date: dayInfo.date,
        count: dayInfo.count,
        conversations: dayInfo.conversations
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  populateDayDropdown() {
    if (!this.daySelect) return;
    
    // Get available days from processed sessions
    this._availableDays = this.getAvailableDays();
    
    // Clear existing options
    this.daySelect.innerHTML = '';
    
    // Add "All Days" option
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All Days';
    this.daySelect.appendChild(allOption);
    
    if (this._availableDays.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No sessions found';
      option.disabled = true;
      this.daySelect.appendChild(option);
      return;
    }
    
    // Add individual day options (newest first)
    this._availableDays.forEach(dayInfo => {
      const option = document.createElement('option');
      option.value = dayInfo.dayString; // YYYY-MM-DD format
      option.textContent = dayInfo.displayName; // "YYYY-MM-DD (N sessions)"
      this.daySelect.appendChild(option);
    });
    
    this.daySelect.value =  this._selectedDay;
  }

  populateEarlyDayDropdown(sessionFiles) {
    if (!this.daySelect || !sessionFiles) return;
    
    // Extract days from file modification times for early population
    const dayMap = new Map();
    
    sessionFiles.forEach(sessionFile => {
      if (sessionFile.modified) {
        try {
          const modDate = new Date(sessionFile.modified);
          if (!isNaN(modDate.getTime())) {
            const dayString = modDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            if (!dayMap.has(dayString)) {
              dayMap.set(dayString, {
                date: modDate,
                count: 0
              });
            }
            dayMap.get(dayString).count++;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    
    // Clear existing options
    this.daySelect.innerHTML = '';
    
    // Add "All Days" option
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All Days';
    this.daySelect.appendChild(allOption);
    
    if (dayMap.size === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No sessions found';
      option.disabled = true;
      this.daySelect.appendChild(option);
      return;
    }
    
    // Convert to sorted array (newest first)
    const sortedDays = Array.from(dayMap.entries())
      .map(([dayString, dayInfo]) => ({
        dayString,
        displayName: `${dayString} (${dayInfo.count} sessions)`,
        date: dayInfo.date,
        count: dayInfo.count
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Add day options
    sortedDays.forEach(dayInfo => {
      const option = document.createElement('option');
      option.value = dayInfo.dayString;
      option.textContent = dayInfo.displayName;
      this.daySelect.appendChild(option);
    });
    
    // Set current selection
    const dayToSelect = this._selectedDay || this.getAttribute('selected-day') || '';
    if (dayToSelect) {
      this.daySelect.value = dayToSelect;
    }
  }

  async discoverConversations() {
    return await ClaudeSessions.discoverConversations(this._currentProject);
  }

  async loadAllConversations() {
    try {
      this.showProgress();
      
      // Phase 1: Discover conversations
      this.updateProgress(0, 'Discovering conversations...');
      const conversations = await this.discoverConversations();
      
      this._conversationList = conversations;
      this._loadingProgress.total = conversations.length;
      
      if (conversations.length === 0) {
        const searchPath = this._currentProject ? 
          `~/.claude/projects/${this._currentProject}/` : 
          `~/.claude/projects/*-lively4-core/`;
        this.showError(`No Claude conversations found in ${searchPath}`);
        return;
      }
      
      this.populateEarlyDayDropdownForConversations(conversations);
      
      // Determine how many conversations to load initially
      const initialLoadCount = 5; // Load first 5 conversations
      const conversationsToLoad = conversations.slice(0, initialLoadCount);
      this._remainingConversations = conversations.slice(initialLoadCount);
      
      this._loadingProgress.total = conversationsToLoad.length;
      
      // Phase 2: Load initial conversations incrementally
      for (let i = 0; i < conversationsToLoad.length; i++) {
        const conversation = conversationsToLoad[i];
        
        // Check cache first
        if (this._processedConversations.has(conversation.conversationId)) {
          this.updateProgress(i + 1, `Using cached data for ${conversation.conversationId.substring(0, 8)}...`);
          continue;
        }
        
        // Load and process new conversation
        this.updateProgress(i + 1, `Loading conversation ${conversation.conversationId.substring(0, 8)}...`);
        const conversationData = await this.loadAndProcessConversation(conversation);
        
        if (conversationData === null) {
          continue;
        }
        
        // Cache the processed data
        this._processedConversations.set(conversation.conversationId, conversationData);
        
        // Update global max values for this conversation
        if (conversationData.costProgression.length > 0) {
          const conversationMax = Math.max(...conversationData.costProgression.map(p => p.totalCost));
          this._globalMaxCost = Math.max(this._globalMaxCost || 0, conversationMax);
          this._globalMaxMessages = Math.max(this._globalMaxMessages || 0, conversationData.costProgression.length);
        }
        
        // Render chart immediately for progressive display
        this.renderConversationItem(conversationData);
      }
      
      this.updateProgress(conversationsToLoad.length, 'Complete!');
      this._lastRefresh = Date.now();
      
      lively.sleep(1000).then(() => this.hideProgress())
      
    } catch (error) {
      this.showError(`Failed to load conversations: ${error.message}`);
    }
  }

  async loadAndProcessConversation(conversation) {
    try {
      // Process conversation data using shared API
      const conversationData = await ClaudeSessions.processConversationData(conversation);
      
      // Filter out conversations with no token statistics or very short conversations
      if (conversationData.messagesWithTokens === 0 || conversationData.messagesWithTokens < 2) {
        return null; // Skip conversations without meaningful token data
      }
      
      return conversationData;
    } catch (error) {
      return null;
    }
  }

  async loadAndProcessSession(sessionFile) {
    try {
      // Load session content using shared API
      const messages = await ClaudeSessions.loadSessionContent(sessionFile.path);
      
      // Process session data using shared API
      const sessionData = ClaudeSessions.processSessionData(sessionFile, messages);
      
      // Filter out sessions with no token statistics or very short sessions
      if (sessionData.messagesWithTokens === 0 || sessionData.messagesWithTokens < 2) {
        return null; // Skip sessions without meaningful token data
      }
      
      return sessionData;
    } catch (error) {
      return null;
    }
  }

  populateEarlyDayDropdownForConversations(conversations) {
    if (!this.daySelect || !conversations) return;
    
    // Extract days from conversation modification times for early population
    const dayMap = new Map();
    
    conversations.forEach(conversation => {
      if (conversation.latestModificationTime) {
        try {
          const modDate = new Date(conversation.latestModificationTime);
          if (!isNaN(modDate.getTime())) {
            const dayString = modDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            if (!dayMap.has(dayString)) {
              dayMap.set(dayString, {
                date: modDate,
                count: 0
              });
            }
            dayMap.get(dayString).count++;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    
    // Clear existing options
    this.daySelect.innerHTML = '';
    
    // Add "All Days" option
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All Days';
    this.daySelect.appendChild(allOption);
    
    if (dayMap.size === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No conversations found';
      option.disabled = true;
      this.daySelect.appendChild(option);
      return;
    }
    
    // Convert to sorted array (newest first)
    const sortedDays = Array.from(dayMap.entries())
      .map(([dayString, dayInfo]) => ({
        dayString,
        displayName: `${dayString} (${dayInfo.count} conversations)`,
        date: dayInfo.date,
        count: dayInfo.count
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Add day options
    sortedDays.forEach(dayInfo => {
      const option = document.createElement('option');
      option.value = dayInfo.dayString;
      option.textContent = dayInfo.displayName;
      this.daySelect.appendChild(option);
    });
    
    // Set current selection
    const dayToSelect = this._selectedDay || this.getAttribute('selected-day') || '';
    if (dayToSelect) {
      this.daySelect.value = dayToSelect;
    }
  }


  updateCostSummary(conversationsToRender) {
    if (!this.totalCostSummary) return;
    
    if (!conversationsToRender || conversationsToRender.length === 0) {
      this.totalCostSummary.style.display = 'none';
      return;
    }
    const summary = ClaudeSessions.calculateTotalCostSummary(conversationsToRender);
    const PRICING = ClaudeSessions.PRICING
    
    // Store the duplicate conversation information for rendering
    this._conversationsWithDuplicates = summary.sessionsWithDuplicates; // Reuse same field for conversations
    
    this.totalCostSummary.innerHTML = ""
    
    const costs = summary.totalCosts
    const tokens = summary.totalTokens
    
    const totalMessages = summary.uniqueMessages + summary.duplicateMessages;
    const totalSessions = conversationsToRender.reduce((sum, conv) => sum + (conv.sessionCount || 0), 0);
    
    this.totalCostSummary.appendChild(<div class="summary-title">Total Costs</div>)
    this.totalCostSummary.appendChild(<div class="summary-details">
      <span id="totalConversations" class="summary-item" title={`
Conversations: ${summary.totalSessions}
Total sessions: ${totalSessions}
Unique messages: ${summary.uniqueMessages}
Duplicate messages: ${summary.duplicateMessages} (skipped)
Total tokens from unique messages: ${humanReadable(tokens.total)}`}>{
          `${summary.totalSessions} conversation${summary.totalSessions !== 1 ? 's' : ''} (${totalSessions} sessions)`}</span>
      <span id="totalDollarCost" class="summary-item total" title={
`Total cost (deduplicated by message UUID):
• Input: ${inDollar(costs.input)} (${humanReadable(tokens.input)} tokens)
• Output: ${inDollar(costs.output)} (${humanReadable(tokens.output)} tokens)
• Cache Read: ${inDollar(costs.cacheRead)} (${humanReadable(tokens.cacheRead)} tokens)
• Cache Write: ${inDollar(costs.cacheWrite)} (${humanReadable(tokens.cacheWrite)} tokens)

Duplicates skipped: ${summary.duplicateMessages}`}>{inDollar(costs.total)}</span>
      <span id="inputCostSummary" class="summary-item breakdown" 
        title={`Input tokens: ${humanReadable(tokens.input)} @ $${PRICING.baseInput}/MTok`}>{
          `Input: ${inDollar(costs.input)}`}</span>
      <span id="outputCostSummary" class="summary-item breakdown" 
        title={`Output tokens: ${humanReadable(tokens.output)} @ $${PRICING.output}/MTok`}>{
          `Output: ${inDollar(costs.output)}`}</span>
      <span id="cacheCostSummary" class="summary-item breakdown" 
        title={`Cache costs:
• Read: ${inDollar(costs.cacheRead)} (${humanReadable(tokens.ccheRead)} tokens @ $${PRICING.cacheHit}/MTok)
• Write: ${inDollar(costs.cacheWrite)} (${humanReadable(tokens.cacheWrite)} tokens @ $${PRICING.cacheWrite5m}/MTok)`}>{
          `Cache: ${inDollar(costs.cache)}`}</span>
    </div>)
       
    // Show the summary
    this.totalCostSummary.style.display = 'flex';
  }
  
  
  renderAllConversations() {
    if (this.isCalendarModeEnabled()) {
      this.sessionList.style.display = 'none';
      this.calendarView.style.display = 'block';
      this.renderCalendarView();
    } else {
      this.sessionList.style.display = 'block';
      this.calendarView.style.display = 'none';
    }
    
    this.sessionList.innerHTML = '';
    
    // Reset global message UUID tracking for this render cycle
    this._globalMessageUUIDs.clear();
        
    // Calculate global max values for comparable axis scaling
    let globalMaxCost = 0;
    let globalMaxMessages = 0;
    this._processedConversations.forEach((conversationData) => {
      if (conversationData && conversationData.costProgression && conversationData.costProgression.length > 0) {
        const conversationMax = Math.max(...conversationData.costProgression.map(p => p.totalCost || 0));
        globalMaxCost = Math.max(globalMaxCost, conversationMax);
        globalMaxMessages = Math.max(globalMaxMessages, conversationData.costProgression.length);
      }
    });
    
    // Store global max values for chart creation
    this._globalMaxCost = globalMaxCost;
    this._globalMaxMessages = globalMaxMessages;
    
    // Filter and render conversations based on selected day
    let conversationsToRender = [...this._processedConversations.values()];
    
    // Sort conversations by oldest first for proper duplicate detection
    // (conversations with duplicate messages will appear translucent)
    conversationsToRender.sort((a, b) => {
      // Use latest modification time from conversation, fallback to dateRange
      const aTime = a.modificationTime || a.dateRange?.end || a.dateRange?.start;
      const bTime = b.modificationTime || b.dateRange?.end || b.dateRange?.start;
      
      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;
      
      return new Date(aTime).getTime() - new Date(bTime).getTime(); // Oldest first for duplicate detection
    });
    
    // Apply day filtering if a specific day is selected
    if (this._selectedDay && this._selectedDay.trim() !== '') {
      conversationsToRender = conversationsToRender.filter(conversationData => {
        if (!conversationData) return false;
        
        // Use same date priority: modificationTime first, then dateRange
        let conversationDate = null;
        
        // First try modification time (most reliable)
        if (conversationData.modificationTime) {
          conversationDate = new Date(conversationData.modificationTime);
        }
        // Fallback to date range
        else if (conversationData.dateRange) {
          conversationDate = conversationData.dateRange.start || conversationData.dateRange.end;
        }
        
        if (conversationDate instanceof Date && !isNaN(conversationDate.getTime())) {
          const dayString = conversationDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          return dayString === this._selectedDay;
        }
        
        return false;
      });
    }
    
    // Process conversations in chronological order (oldest first) for proper UUID duplicate detection
    conversationsToRender.forEach((conversationData) => {
      this.renderConversationItem(conversationData);
    });
    
    // Update cost summary after rendering conversations
    this.updateCostSummary(conversationsToRender);
    
    if (conversationsToRender.length === 0) {
      const message = (this._selectedDay && this._selectedDay.trim() !== '')
        ? `No conversations found for ${this._selectedDay}.` 
        : 'No conversations with valid cost progression data found.';
      this.sessionList.innerHTML = `<div class="error-message">${message}</div>`;
    }
  }

  renderSessionItem(sessionData) {
    // Skip sessions with no token data (double-check at render level)
    if (!sessionData || !sessionData.costProgression || sessionData.costProgression.length === 0) {
      return;
    }
    
    const sessionDiv = document.createElement('div');
    sessionDiv.className = 'session-item';
    sessionDiv.setAttribute('data-session-id', sessionData.sessionId);
    
    // Apply visual styling to sessions that contain duplicate messages
    const sessionIdentifier = sessionData.sessionId || sessionData.filePath;
    if (this._sessionsWithDuplicates && this._sessionsWithDuplicates.has(sessionIdentifier)) {
      sessionDiv.classList.add('has-duplicates');
      sessionDiv.title = `This session contains duplicate messages that were already counted in older sessions.\nCosts from duplicate messages are excluded from totals to prevent double-counting.`;
    }
    
    // Create session header
    const header = document.createElement('div');
    header.className = 'session-header';
    
    // Format date range with minutes
    const formatDateWithMinutes = (date) => {
      if (!date) return 'Unknown';
      if (!(date instanceof Date)) return 'Invalid Date';
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      return `${dateStr} ${timeStr}`;
    };
    
    const dateRangeText = sessionData.dateRange.start && sessionData.dateRange.end ? 
      `${formatDateWithMinutes(sessionData.dateRange.start)} - ${formatDateWithMinutes(sessionData.dateRange.end)}` :
      'Unknown dates';
    
    // Format modification time for display
    let modificationTimeText = 'Unknown';
    if (sessionData.modificationTime) {
      try {
        const modDate = new Date(sessionData.modificationTime);
        if (!isNaN(modDate.getTime())) {
          modificationTimeText = formatDateWithMinutes(modDate);
        }
      } catch (e) {
        modificationTimeText = 'Invalid';
      }
    }
    
    const escalationText = sessionData.escalationRatio > 1.5 ? 
      `🔺 +${Math.round((sessionData.escalationRatio - 1) * 100)}%` :
      sessionData.escalationRatio < 0.8 ?
      `🔻 ${Math.round((sessionData.escalationRatio - 1) * 100)}%` :
      `➡️ ${Math.round((sessionData.escalationRatio - 1) * 100)}%`;
    
    // Calculate total dollar cost for this session
    const sessionDollarCost = ClaudeSessions.calculateSessionDollarCost(sessionData);
    const avgDollarCost = sessionData.messagesWithTokens > 0 ? sessionDollarCost / sessionData.messagesWithTokens : 0;
    
    // Check if this session has duplicates for visual indicator
    const sessionKey = sessionData.sessionId || sessionData.filePath;
    const hasDuplicates = this._sessionsWithDuplicates && this._sessionsWithDuplicates.has(sessionKey);
    const duplicateIndicator = hasDuplicates ? 
      `<span class="duplicate-indicator" title="This session contains duplicate messages already counted in older sessions">🔄 Duplicates</span>` : '';
    
    header.innerHTML = `
      <div class="session-info-left">
        <span class="session-id" title="Full Session ID: ${sessionData.sessionId}">${sessionData.sessionId.substring(0, 8)}...</span>
        <span class="modification-time" title="File modification time: ${modificationTimeText}">📝 ${modificationTimeText}</span>
        <span class="date-range" title="Date range when this session was active">${dateRangeText}</span>
        <span class="message-count" title="Total messages: ${sessionData.messageCount}&#10;Messages with token usage data: ${sessionData.messagesWithTokens}&#10;&#10;Only messages with token data are shown in the cost chart.">${sessionData.messageCount} msgs (${sessionData.messagesWithTokens} w/ tokens)</span>
        <span class="total-cost" title="Total estimated cost for all messages with tokens in this session&#10;Token cost: ${humanReadable(sessionData.totalCost)} tokens&#10;Dollar cost: ${inDollar(sessionDollarCost)}&#10;Average cost per message: ${humanReadable(sessionData.avgCost)} tokens (${inDollar(avgDollarCost)})&#10;&#10;Cost calculation:&#10;• Input tokens: $3/MTok&#10;• Output tokens: $15/MTok&#10;• Cache read: $0.30/MTok&#10;• Cache write: $3.75/MTok">${humanReadable(sessionData.totalCost)} tokens (${inDollar(sessionDollarCost)})</span>
        <span class="escalation-indicator" title="Cost Escalation Ratio: ${sessionData.escalationRatio.toFixed(2)}&#10;&#10;Compares average cost between first 25% and last 25% of messages:&#10;• Ratio > 1.5: 🔺 Costs escalated significantly&#10;• Ratio < 0.8: 🔻 Costs decreased significantly&#10;• 0.8-1.5: ➡️ Costs remained stable&#10;&#10;High escalation often indicates context buildup making later messages more expensive.">${escalationText}</span>
        ${duplicateIndicator}
      </div>
      <div class="session-actions">
        <button class="open-session-btn" data-session-path="${sessionData.filePath}" title="Open this session file in the Claude session viewer">
          <i class="fa fa-external-link" aria-hidden="true"></i>
          Open Session
        </button>
      </div>
    `;
    
    sessionDiv.appendChild(header);
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    
    // Cost chart
    const costChartDiv = document.createElement('div');
    costChartDiv.className = 'svg-chart-container';
    
    chartContainer.appendChild(costChartDiv);
    sessionDiv.appendChild(chartContainer);
    
    // Add to session list - prepend newer sessions to show them on top
    this.sessionList.insertBefore(sessionDiv, this.sessionList.firstChild);
    
    // Add event listener for open session button
    const openSessionBtn = header.querySelector('.open-session-btn');
    if (openSessionBtn) {
      openSessionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openSessionInViewer(sessionData.filePath);
      });
    }
    
    LivelyClaudeStatisticsSession && LivelyClaudeStatisticsSession.create(costChartDiv, sessionData, this);
  }

  renderConversationItem(conversationData) {
    // Skip conversations with no token data (double-check at render level)
    if (!conversationData || !conversationData.costProgression || conversationData.costProgression.length === 0) {
      return;
    }
    
    const conversationDiv = document.createElement('div');
    conversationDiv.className = 'session-item'; // Reuse session-item styling
    conversationDiv.setAttribute('data-conversation-id', conversationData.conversationId);
    
    // Apply visual styling to conversations that contain duplicate messages
    const conversationIdentifier = conversationData.conversationId || conversationData.filePath;
    if (this._conversationsWithDuplicates && this._conversationsWithDuplicates.has(conversationIdentifier)) {
      conversationDiv.classList.add('has-duplicates');
      conversationDiv.title = `This conversation contains duplicate messages that were already counted in older conversations.\nCosts from duplicate messages are excluded from totals to prevent double-counting.`;
    }
    
    // Create conversation header
    const header = document.createElement('div');
    header.className = 'session-header';
    
    // Format date range with minutes
    const formatDateWithMinutes = (date) => {
      if (!date) return 'Unknown';
      if (!(date instanceof Date)) return 'Invalid Date';
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      return `${dateStr} ${timeStr}`;
    };
    
    const dateRangeText = conversationData.dateRange.start && conversationData.dateRange.end ? 
      `${formatDateWithMinutes(conversationData.dateRange.start)} - ${formatDateWithMinutes(conversationData.dateRange.end)}` :
      'Unknown dates';
    
    // Format modification time for display (latest session modification)
    let modificationTimeText = 'Unknown';
    if (conversationData.modificationTime) {
      try {
        const modDate = new Date(conversationData.modificationTime);
        if (!isNaN(modDate.getTime())) {
          modificationTimeText = formatDateWithMinutes(modDate);
        }
      } catch (e) {
        modificationTimeText = 'Invalid';
      }
    }
    
    const escalationText = conversationData.escalationRatio > 1.5 ? 
      `🔺 +${Math.round((conversationData.escalationRatio - 1) * 100)}%` :
      conversationData.escalationRatio < 0.8 ?
      `🔻 ${Math.round((conversationData.escalationRatio - 1) * 100)}%` :
      `➡️ ${Math.round((conversationData.escalationRatio - 1) * 100)}%`;
    
    // Calculate total dollar cost for this conversation
    const conversationDollarCost = ClaudeSessions.calculateSessionDollarCost(conversationData);
    const avgDollarCost = conversationData.messagesWithTokens > 0 ? conversationDollarCost / conversationData.messagesWithTokens : 0;
    
    // Check if this conversation has duplicates for visual indicator
    const conversationKey = conversationData.conversationId || conversationData.filePath;
    const hasDuplicates = this._conversationsWithDuplicates && this._conversationsWithDuplicates.has(conversationKey);
    const duplicateIndicator = hasDuplicates ? 
      `<span class="duplicate-indicator" title="This conversation contains duplicate messages already counted in older conversations">🔄 Duplicates</span>` : '';
    
    header.innerHTML = `
      <div class="session-info-left">
        <span class="conversation-title" title="Full Conversation: ${conversationData.title}&#10;Conversation ID: ${conversationData.conversationId}&#10;Sessions: ${conversationData.sessionCount}">${conversationData.title}</span>
        <span class="session-count" title="Number of sessions in this conversation">📚 ${conversationData.sessionCount} session${conversationData.sessionCount !== 1 ? 's' : ''}</span>
        <span class="modification-time" title="Latest session modification time: ${modificationTimeText}">📝 ${modificationTimeText}</span>
        <span class="date-range" title="Date range when this conversation was active">${dateRangeText}</span>
        <span class="message-count" title="Total messages: ${conversationData.messageCount}&#10;Messages with token usage data: ${conversationData.messagesWithTokens}&#10;&#10;Only messages with token data are shown in the cost chart.">${conversationData.messageCount} msgs (${conversationData.messagesWithTokens} w/ tokens)</span>
        <span class="total-cost" title="Total estimated cost for all messages with tokens in this conversation&#10;Token cost: ${humanReadable(conversationData.totalCost)} tokens&#10;Dollar cost: ${inDollar(conversationDollarCost)}&#10;Average cost per message: ${humanReadable(conversationData.avgCost)} tokens (${inDollar(avgDollarCost)})&#10;&#10;Cost calculation:&#10;• Input tokens: $3/MTok&#10;• Output tokens: $15/MTok&#10;• Cache read: $0.30/MTok&#10;• Cache write: $3.75/MTok">${humanReadable(conversationData.totalCost)} tokens (${inDollar(conversationDollarCost)})</span>
        <span class="escalation-indicator" title="Cost Escalation Ratio: ${conversationData.escalationRatio.toFixed(2)}&#10;&#10;Compares average cost between first 25% and last 25% of messages:&#10;• Ratio > 1.5: 🔺 Costs escalated significantly&#10;• Ratio < 0.8: 🔻 Costs decreased significantly&#10;• 0.8-1.5: ➡️ Costs remained stable&#10;&#10;High escalation often indicates context buildup making later messages more expensive.">${escalationText}</span>
        ${duplicateIndicator}
      </div>
      <div class="session-actions">
        <button class="view-latest-session-btn" data-conversation-id="${conversationData.conversationId}" title="Open the latest session in this conversation">
          <i class="fa fa-external-link" aria-hidden="true"></i>
          View Latest Session
        </button>
      </div>
    `;
    
    conversationDiv.appendChild(header);
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    
    // Cost chart
    const costChartDiv = document.createElement('div');
    costChartDiv.className = 'svg-chart-container';
    
    chartContainer.appendChild(costChartDiv);
    conversationDiv.appendChild(chartContainer);
    
    // Add to session list - prepend newer conversations to show them on top
    this.sessionList.insertBefore(conversationDiv, this.sessionList.firstChild);
    
    // Add event listener for view latest session button
    const viewLatestSessionBtn = header.querySelector('.view-latest-session-btn');
    if (viewLatestSessionBtn) {
      viewLatestSessionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openLatestSessionInViewer(conversationData);
      });
    }
    
    LivelyClaudeStatisticsSession && LivelyClaudeStatisticsSession.create(costChartDiv, conversationData, this);
  }

  openLatestSessionInViewer(conversationData) {
    // Find the session with the latest modification time
    let latestSession = null;
    let latestTime = null;
    
    // Look through all sessions to find the one with latest modification time
    for (let i = 0; i < conversationData.sessionPaths.length; i++) {
      const sessionPath = conversationData.sessionPaths[i];
      
      // Try to find this session in our original conversation data
      const matchingSession = conversationData.sessions ? 
        conversationData.sessions.find(s => s.path === sessionPath) : null;
      
      if (matchingSession && matchingSession.modified) {
        const modTime = new Date(matchingSession.modified);
        if (!latestTime || modTime > latestTime) {
          latestTime = modTime;
          latestSession = matchingSession;
        }
      }
    }
    
    // Fallback: use the first session path if we can't determine the latest
    const sessionPath = latestSession ? latestSession.path : conversationData.sessionPaths[0];
    
    if (sessionPath) {
      this.openSessionInViewer(sessionPath);
    } else {
      lively.notify('No session path found for this conversation');
    }
  }

  /**
   * Aggregate session data by date and hour for calendar visualization
   * Uses the same deduplication logic as other views to avoid counting duplicate messages
   * @returns {Object} Aggregated data structure: { "YYYY-MM-DD": { "08": {messages: N, tokens: N, cost: N}, ... } }
   */
  aggregateCalendarData() {
    const calendarData = {};
    
    // Get filtered conversations (respects current project/day selection)
    let conversationsToProcess = [...this._processedConversations.values()];
    
    // Apply project filtering (same as renderAllConversations)
    if (this._selectedDay && this._selectedDay.trim() !== '') {
      conversationsToProcess = conversationsToProcess.filter(conversationData => {
        if (!conversationData) return false;
        
        let conversationDate = null;
        if (conversationData.modificationTime) {
          conversationDate = new Date(conversationData.modificationTime);
        } else if (conversationData.dateRange) {
          conversationDate = conversationData.dateRange.start || conversationData.dateRange.end;
        }
        
        if (conversationDate instanceof Date && !isNaN(conversationDate.getTime())) {
          const dayString = conversationDate.toISOString().split('T')[0];
          return dayString === this._selectedDay;
        }
        return false;
      });
    }
    
    // Sort conversations by modification time (oldest first) for proper duplicate detection
    // This matches the same logic used in renderAllConversations and calculateTotalCostSummary
    conversationsToProcess.sort((a, b) => {
      const aTime = a.modificationTime || a.dateRange?.end || a.dateRange?.start;
      const bTime = b.modificationTime || b.dateRange?.end || b.dateRange?.start;
      
      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;
      
      return new Date(aTime).getTime() - new Date(bTime).getTime(); // Oldest first
    });
    
    // Use Set to track processed message UUIDs to avoid double-counting duplicates
    // This is the same deduplication logic used in calculateTotalCostSummary
    const processedMessageUUIDs = new Set();
    let uniqueMessages = 0;
    let duplicateMessages = 0;
    
    // Process each conversation's cost progression in chronological order
    conversationsToProcess.forEach(conversationData => {
      if (!conversationData || !conversationData.costProgression) return;
      
      conversationData.costProgression.forEach(point => {
        if (!point.timestamp || point.isUserMessage) return; // Only count assistant messages
        
        // Check for duplicate messages using UUID (same as calculateTotalCostSummary)
        if (!point.uuid || processedMessageUUIDs.has(point.uuid)) {
          if (point.uuid) {
            duplicateMessages++;
          }
          return; 
        }
        
        // Mark this UUID as processed
        processedMessageUUIDs.add(point.uuid);
        uniqueMessages++;
        
        try {
          const timestamp = moment(point.timestamp);
          if (!timestamp.isValid()) return;
          
          const dateString = timestamp.format('YYYY-MM-DD');
          const hourString = timestamp.format('HH');
          const minute = timestamp.minute();
          const slot15min = Math.floor(minute / 15); // 0, 1, 2, or 3
          const slotKey = `${hourString}-${slot15min}`;
          
          // Initialize date if not exists
          if (!calendarData[dateString]) {
            calendarData[dateString] = {};
          }
          
          // Initialize hour if not exists
          if (!calendarData[dateString][hourString]) {
            calendarData[dateString][hourString] = {
              messages: 0,
              tokens: 0,
              cost: 0,
              inputTokens: 0,
              outputTokens: 0,
              cacheTokens: 0,
              slots: {
                '0': { messages: 0, tokens: 0, cost: 0, inputTokens: 0, outputTokens: 0, cacheTokens: 0 },
                '1': { messages: 0, tokens: 0, cost: 0, inputTokens: 0, outputTokens: 0, cacheTokens: 0 },
                '2': { messages: 0, tokens: 0, cost: 0, inputTokens: 0, outputTokens: 0, cacheTokens: 0 },
                '3': { messages: 0, tokens: 0, cost: 0, inputTokens: 0, outputTokens: 0, cacheTokens: 0 }
              }
            };
          }
          
          const hourData = calendarData[dateString][hourString];
          const slotData = hourData.slots[slot15min];
          
          // Increment message count (only unique messages) - both hour and slot
          hourData.messages++;
          slotData.messages++;
          
          // Add token counts to both hour and slot
          if (point.tokens) {
            const inputTokens = point.tokens.input || 0;
            const outputTokens = point.tokens.output || 0;
            const cacheReadTokens = point.tokens.cacheRead || 0;
            const cacheWriteTokens = point.tokens.cacheWrite || 0;
            const totalTokens = inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens;
            
            // Hour totals
            hourData.inputTokens += inputTokens;
            hourData.outputTokens += outputTokens;
            hourData.cacheTokens += cacheReadTokens + cacheWriteTokens;
            hourData.tokens += totalTokens;
            
            // Slot totals
            slotData.inputTokens += inputTokens;
            slotData.outputTokens += outputTokens;
            slotData.cacheTokens += cacheReadTokens + cacheWriteTokens;
            slotData.tokens += totalTokens;
          }
          
          // Add dollar cost to both hour and slot
          if (point.tokens) {
            const dollarCost = ClaudeSessions.calculateDollarCost(point.tokens);
            hourData.cost += dollarCost.totalCost;
            slotData.cost += dollarCost.totalCost;
          }
          
        } catch (error) {
          // Skip invalid timestamps
        }
      });
    });
    
    // Log deduplication summary for calendar view
    if (duplicateMessages > 0) {
      console.log(`Calendar aggregation: Processed ${uniqueMessages} unique messages, skipped ${duplicateMessages} duplicates`);
    }
    
    return calendarData;
  }

  /**
   * Render the calendar visualization
   */
  renderCalendarView() {
    if (!this.calendarView) return;
    
    // Clear existing content
    this.calendarView.innerHTML = '';
    
    // Get aggregated calendar data
    const calendarData = this.aggregateCalendarData();
    
    if (Object.keys(calendarData).length === 0) {
      this.calendarView.innerHTML = `
        <div class="calendar-container">
          <div class="error-message">No data available for calendar view</div>
        </div>
      `;
      return;
    }
    
    // Create calendar container
    const container = document.createElement('div');
    container.className = 'calendar-container';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'calendar-header';
    
    const title = document.createElement('div');
    title.className = 'calendar-title';
    title.textContent = 'Claude Usage Calendar (8:00-20:00)';
    
    const legend = document.createElement('div');
    legend.className = 'calendar-legend';
    legend.innerHTML = `
      <div class="legend-item">
        <div class="legend-color" style="background-color: #f5f5f5;"></div>
        <span>$0.00</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #deebf7;"></div>
        <span>$0.75</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #9ecae1;"></div>
        <span>$1.50</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #4292c6;"></div>
        <span>$2.25</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #08519c;"></div>
        <span>$3.00+ per 15min</span>
      </div>
    `;
    
    header.appendChild(title);
    header.appendChild(legend);
    container.appendChild(header);
    
    LivelyClaudeStatisticsCalendar && LivelyClaudeStatisticsCalendar.create(container, calendarData);
    
    this.calendarView.appendChild(container);
  }


  showProgress() {
    this.loadingProgress.style.display = 'block';
    this.sessionList.style.display = 'none';
    // Hide cost summary during loading
    if (this.totalCostSummary) {
      this.totalCostSummary.style.display = 'none';
    }
  }

  hideProgress() {
    this.loadingProgress.style.display = 'none';
    this.sessionList.style.display = 'block';
  }

  updateProgress(loaded, currentText) {
    this._loadingProgress.loaded = loaded;
    this._loadingProgress.currentSession = currentText;
    
    const percentage = this._loadingProgress.total > 0 ? 
      (loaded / this._loadingProgress.total) * 100 : 0;
    
    this.progressFill.style.width = `${percentage}%`;
    this.progressText.textContent = currentText;
  }

  showError(message) {
    this.hideProgress();
    this.sessionList.innerHTML = `<div class="error-message">${message}</div>`;
    // Hide cost summary on error
    if (this.totalCostSummary) {
      this.totalCostSummary.style.display = 'none';
    }
  }

  async navigateToMessageInExistingViewer(sessionPath, messageUuid) {
    try {
      // Check if there's already a session viewer with this session open
      const existingViewer = this.findExistingSessionViewer(sessionPath);
      
      if (!existingViewer) {
        lively.notify("Please open the session viewer first");
        return;
      }
      
      
      // Bring the existing window to front
      if (existingViewer.parentElement && existingViewer.parentElement.classList.contains('lively-window')) {
        const window = existingViewer.parentElement;
        window.style.zIndex = '1000';
        window.focus();
      }
      
      // Use the session viewer's public showMessage method to handle shadow DOM properly
      if (existingViewer.showMessage) {
        const success = existingViewer.showMessage(messageUuid);
        if (!success) {
          lively.notify(`Message with UUID ${messageUuid.substring(0, 8)}... not found in session viewer`);
        }
      } else {
        lively.notify(`Please refresh the session viewer to enable message navigation`);
      }
      
    } catch (error) {
      lively.notify(`Failed to navigate to message: ${error.message}`);
    }
  }

  async openSessionInViewer(sessionPath) {
    try {
      // Open the Claude session viewer component
      const sessionViewer = await lively.openComponentInWindow('lively-claude-session');
      
      // Wait a moment for the component to initialize
      await lively.sleep(100);
      
      // Set the session path attribute to pre-select this session
      sessionViewer.setAttribute('selected-session', sessionPath);
      
      // Trigger loading of the specific session
      if (sessionViewer.loadSession) {
        await sessionViewer.loadSession(sessionPath);
      }
      
    } catch (error) {
      lively.notify('Failed to open session viewer: ' + error.message);
    }
  }

  findExistingSessionViewer(sessionPath) {
    // Look for all lively-claude-session components in the document
    const sessionViewers = document.querySelectorAll('lively-claude-session');
    
    for (let viewer of sessionViewers) {
      const selectedSession = viewer.getAttribute('selected-session');
      if (selectedSession === sessionPath) {
        return viewer;
      }
    }
    
    return null;
  }


  async refresh() {
    // Only reload if data is stale (>5 minutes) or forced
    const now = Date.now();
    if (this._lastRefresh && (now - this._lastRefresh) < 5 * 60 * 1000) {
      // Check for new/modified session files without full reload
      const currentSessions = await this.discoverSessions();
      const hasChanges = this.detectChanges(currentSessions);
      
      if (!hasChanges) {
        return; // No changes detected
      }
    }
    
    // Clear caches and reload
    this._processedSessions.clear();
    this._sessionList = [];
    
    await this.loadAllSessions();
  }

  async forceRefresh() {
    // Show progress immediately
    this.showProgress();
    this.updateProgress(0, "Forcing complete reload...");
    
    // Clear ALL caches and reset everything
    this._processedConversations.clear();
    this._conversationList = [];
    this._remainingConversations = [];
    this._globalMaxCost = 0;
    this._globalMaxMessages = 0;
    this._lastRefresh = null; // Reset refresh timestamp
    this._conversationsWithDuplicates = new Set(); // Clear duplicate tracking
    
    
    // Force fresh discovery and loading from disk
    await this.loadAllConversations();
    
    this.hideProgress();
  }

  detectChanges(currentSessions) {
    if (currentSessions.length !== this._sessionList.length) {
      return true;
    }
    
    // Check for modified files
    for (let i = 0; i < currentSessions.length; i++) {
      const current = currentSessions[i];
      const existing = this._sessionList[i];
      
      if (current.path !== existing.path || 
          current.modified !== existing.modified ||
          current.sizeBytes !== existing.sizeBytes) {
        return true;
      }
    }
    return false;
  }

  

  livelyMigrate(other) {
    // Migrate conversation data structures
    this._conversationList = other._conversationList || other._sessionList || [];
    this._processedConversations = other._processedConversations || other._processedSessions || new Map();
    this._remainingConversations = other._remainingConversations || other._remainingSessions || [];
    this._conversationsWithDuplicates = other._conversationsWithDuplicates || other._sessionsWithDuplicates || new Set();
    
    // Migrate common data structures
    this._loadingProgress = other._loadingProgress;
    this._lastRefresh = other._lastRefresh;
    this._globalMaxCost = other._globalMaxCost;
    this._availableProjects = other._availableProjects;
    this._availableDays = other._availableDays;
    this._globalMessageUUIDs = other._globalMessageUUIDs; 
  }

}