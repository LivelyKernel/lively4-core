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
   
    
    // Initialize data structures
    this._sessionList = this._sessionList || [];
    this._processedSessions = this._processedSessions || new Map();
    this._globalMaxCost = this._globalMaxCost || 0;
    this._globalMaxMessages = this._globalMaxMessages || 0;
    this._currentProject = this.getAttribute('selected-project');
    this._availableProjects = this._availableProjects || [];
    this._selectedDay = this.getAttribute('selected-day');
    this._availableDays = this._availableDays || [];
    this._remainingSessions = this._remainingSessions || [];
    this._sessionsWithDuplicates = this._sessionsWithDuplicates || new Set(); // Track sessions with duplicate content
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
    if (this._sessionList.length > 0 && this._processedSessions.size > 0) {
      // We have cached data, just render it
      this.renderAllSessions();
      return;
    }
    
    // No data available, load it fresh
    await this.loadAllSessions();
  }
  
  
  
  async onRefreshButton() {
    // Force a complete refresh from disk, ignoring caches
    await this.forceRefresh();
  }


  onChartModeChanged() {
    // Re-render all sessions with new chart mode
    this.renderAllSessions();
  }

  onCompactViewChanged() {
    // Re-render all sessions with new compact view setting
    this.renderAllSessions();
  }

  onCalendarModeChanged() {
    this.renderAllSessions();
  }

  async onDayChanged() {
    const selectedDay = this.daySelect ? this.daySelect.value : undefined;
    
    if (selectedDay !== this._selectedDay) {
      this._selectedDay = selectedDay;
      // Persist to attributes
      this.setAttribute('selected-day', selectedDay || '');
      
      // If a specific day is selected, we might need to load sessions from that day
      if (selectedDay) {
        await this.ensureSessionsForDayLoaded(selectedDay);
      }
      
      // Re-render sessions filtered by selected day
      this.renderAllSessions();
    }
  }

  async ensureSessionsForDayLoaded(targetDay) {
    // Check if we have any sessions for this day loaded
    const hasSessionsForDay = Array.from(this._processedSessions.values()).some(sessionData => {
      let sessionDate = null;
      
      if (sessionData.modificationTime) {
        sessionDate = new Date(sessionData.modificationTime);
      } else if (sessionData.dateRange) {
        sessionDate = sessionData.dateRange.start || sessionData.dateRange.end;
      }
      
      if (sessionDate instanceof Date && !isNaN(sessionDate.getTime())) {
        const dayString = sessionDate.toISOString().split('T')[0];
        return dayString === targetDay;
      }
      return false;
    });
    
    // If we don't have sessions for this day, check if any unloaded sessions match
    if (!hasSessionsForDay && this._remainingSessions.length > 0) {
      const matchingSessions = this._remainingSessions.filter(sessionFile => {
        if (sessionFile.modified) {
          try {
            const modDate = new Date(sessionFile.modified);
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
      
      // Load all matching sessions for this day
      if (matchingSessions.length > 0) {
        for (const sessionFile of matchingSessions) {
          // Remove from remaining sessions
          const index = this._remainingSessions.indexOf(sessionFile);
          if (index > -1) {
            this._remainingSessions.splice(index, 1);
          }
          
          // Load and process the session
          if (!this._processedSessions.has(sessionFile.path)) {
            const sessionData = await this.loadAndProcessSession(sessionFile);
            if (sessionData !== null) {
              this._processedSessions.set(sessionFile.path, sessionData);
              
              // Update global max values
              if (sessionData.costProgression.length > 0) {
                const sessionMax = Math.max(...sessionData.costProgression.map(p => p.totalCost));
                this._globalMaxCost = Math.max(this._globalMaxCost || 0, sessionMax);
                this._globalMaxMessages = Math.max(this._globalMaxMessages || 0, sessionData.costProgression.length);
              }
            }
          }
        }
        
      }
    }
  }

  async onLoadMoreButton() {
    if (!this._remainingSessions || this._remainingSessions.length === 0) {
      return;
    }
    
    // Disable button during loading
    this.loadMoreButton.disabled = true;
    this.loadMoreButton.textContent = 'Loading...';
    
    try {
      let sessionsToLoad;
      
      if (this._selectedDay && this._selectedDay.trim() !== '') {
        // Load all remaining sessions for the selected day
        sessionsToLoad = this._remainingSessions.filter(sessionFile => {
          if (sessionFile.modified) {
            try {
              const modDate = new Date(sessionFile.modified);
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
        
        // Remove loaded sessions from remaining list
        this._remainingSessions = this._remainingSessions.filter(sessionFile => {
          return !sessionsToLoad.includes(sessionFile);
        });
      } else {
        // Load all remaining sessions for current project
        sessionsToLoad = [...this._remainingSessions];
        this._remainingSessions = [];
      }
      
      // Process each session
      let successfullyLoaded = 0;
      let skippedNoTokens = 0;
      
      for (let i = 0; i < sessionsToLoad.length; i++) {
        const sessionFile = sessionsToLoad[i];
        
        // Skip if already cached
        if (this._processedSessions.has(sessionFile.path)) {
          continue;
        }
        
        // Update button text with progress
        const progress = Math.round(((i + 1) / sessionsToLoad.length) * 100);
        this.loadMoreButton.textContent = `Loading... ${progress}%`;
        
        // Load and process new session
        const sessionData = await this.loadAndProcessSession(sessionFile);
        
        // Skip sessions without token statistics
        if (sessionData === null) {
          skippedNoTokens++;
          continue;
        }
        
        // Cache the processed data
        this._processedSessions.set(sessionFile.path, sessionData);
        successfullyLoaded++;
        
        // Update global max values for this session
        if (sessionData.costProgression.length > 0) {
          const sessionMax = Math.max(...sessionData.costProgression.map(p => p.totalCost));
          this._globalMaxCost = Math.max(this._globalMaxCost || 0, sessionMax);
          this._globalMaxMessages = Math.max(this._globalMaxMessages || 0, sessionData.costProgression.length);
        }
        
        // Allow UI to update (non-blocking)
        await lively.sleep(10);
      }
      
      // Re-render all sessions to show new ones in correct sorted order
      this.renderAllSessions();
      
      // Update Load More button visibility
      this.showLoadMoreButton();
      
      // Show completion notification
      const target = this._selectedDay && this._selectedDay.trim() !== '' 
        ? `day ${this._selectedDay}` 
        : 'project';
      lively.notify(`Loaded ${successfullyLoaded} more sessions for ${target}`);
      
    } catch (error) {
      lively.notify('Failed to load more sessions: ' + error.message);
    } finally {
      // Re-enable button
      this.loadMoreButton.disabled = false;
    }
  }

  showLoadMoreButton() {
    if (!this.loadMoreButton) return;
    
    const remainingCount = this.getRemainingSessionsForDay(this._selectedDay);
    
    this.loadMoreButton.innerHTML = `
      <i class="fa fa-download" aria-hidden="true"></i>
      Load
    `;
    this.loadMoreButton.style.display = 'block';
  }

  getRemainingSessionsForDay(selectedDay) {
    if (!selectedDay || selectedDay.trim() === '') {
      // "All Days" - return all remaining sessions
      return this._remainingSessions.length;
    }
    
    // Filter remaining sessions by the selected day
    const remainingForDay = this._remainingSessions.filter(sessionFile => {
      if (sessionFile.modified) {
        try {
          const modDate = new Date(sessionFile.modified);
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
      
      // Clear old session data completely
      this._processedSessions.clear();
      this._sessionList = [];
      this._remainingSessions = [];
      this._globalMaxCost = 0;
      this._globalMaxMessages = 0;
      this._lastRefresh = null;
      this._sessionsWithDuplicates = new Set(); // Clear duplicate tracking
      
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
    const dayMap = new Map(); // Map from day string to { date: Date, count: number, sessions: [] }
    
    // Iterate through all processed sessions to extract days
    this._processedSessions.forEach((sessionData, sessionPath) => {
      if (!sessionData) return;
      
      // Try multiple sources for the date: modificationTime, dateRange.start, dateRange.end
      let sessionDate = null;
      
      // First try modification time (most reliable)
      if (sessionData.modificationTime) {
        sessionDate = new Date(sessionData.modificationTime);
      }
      // Fallback to date range
      else if (sessionData.dateRange) {
        sessionDate = sessionData.dateRange.start || sessionData.dateRange.end;
      }
      
      if (sessionDate instanceof Date && !isNaN(sessionDate.getTime())) {
        const dayString = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!dayMap.has(dayString)) {
          dayMap.set(dayString, {
            date: sessionDate,
            count: 0,
            sessions: []
          });
        }
        
        const dayInfo = dayMap.get(dayString);
        dayInfo.count++;
        dayInfo.sessions.push(sessionData);
      }
    });
    
    // Convert map to sorted array (newest first)
    return Array.from(dayMap.entries())
      .map(([dayString, dayInfo]) => ({
        dayString,
        displayName: `${dayString} (${dayInfo.count} sessions)`,
        date: dayInfo.date,
        count: dayInfo.count,
        sessions: dayInfo.sessions
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

  async discoverSessions() {
    return await ClaudeSessions.discoverSessions(this._currentProject);
  }

  async loadAllSessions() {
    try {
      this.showProgress();
      
      // Phase 1: Discover sessions
      this.updateProgress(0, 'Discovering sessions...');
      const sessionFiles = await this.discoverSessions();
      
      this._sessionList = sessionFiles;
      this._loadingProgress.total = sessionFiles.length;
      
      if (sessionFiles.length === 0) {
        const searchPath = this._currentProject ? 
          `~/.claude/projects/${this._currentProject}/` : 
          `~/.claude/projects/*-lively4-core/`;
        this.showError(`No Claude session files found in ${searchPath}`);
        return;
      }
      
      this.populateEarlyDayDropdown(sessionFiles);
      
      // Determine how many sessions to load initially
      const initialLoadCount = 5; // Load first 5 sessions
      const sessionsToLoad = sessionFiles.slice(0, initialLoadCount);
      this._remainingSessions = sessionFiles.slice(initialLoadCount);
      
      this._loadingProgress.total = sessionsToLoad.length;
      
      // Phase 2: Load initial sessions incrementally
      for (let i = 0; i < sessionsToLoad.length; i++) {
        const sessionFile = sessionsToLoad[i];
        
        // Check cache first
        if (this._processedSessions.has(sessionFile.path)) {
          this.updateProgress(i + 1, `Using cached data for ${sessionFile.sessionId.substring(0, 8)}...`);
          continue;
        }
        
        // Load and process new session
        this.updateProgress(i + 1, `Loading ${sessionFile.sessionId.substring(0, 8)}...`);
        const sessionData = await this.loadAndProcessSession(sessionFile);
        
        if (sessionData === null) {
          continue;
        }
        
        // Cache the processed data
        this._processedSessions.set(sessionFile.path, sessionData);
        
        // Update global max values for this session
        if (sessionData.costProgression.length > 0) {
          const sessionMax = Math.max(...sessionData.costProgression.map(p => p.totalCost));
          this._globalMaxCost = Math.max(this._globalMaxCost || 0, sessionMax);
          this._globalMaxMessages = Math.max(this._globalMaxMessages || 0, sessionData.costProgression.length);
        }
        
        // Render chart immediately for progressive display
        this.renderSessionItem(sessionData);
      }
      
      this.updateProgress(sessionsToLoad.length, 'Complete!');
      this._lastRefresh = Date.now();
      
      lively.sleep(1000).then(() => this.hideProgress())
      
    } catch (error) {
      this.showError(`Failed to load sessions: ${error.message}`);
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


  updateCostSummary(sessionsToRender) {
    if (!this.totalCostSummary) return;
    
    if (!sessionsToRender || sessionsToRender.length === 0) {
      this.totalCostSummary.style.display = 'none';
      return;
    }
    const summary = ClaudeSessions.calculateTotalCostSummary(sessionsToRender);
    const PRICING = ClaudeSessions.PRICING
    
    // Store the duplicate session information for rendering
    this._sessionsWithDuplicates = summary.sessionsWithDuplicates;
    
    this.totalCostSummary.innerHTML = ""
    
    const costs = summary.totalCosts
    const tokens = summary.totalTokens
    
    const totalMessages = summary.uniqueMessages + summary.duplicateMessages;
    this.totalCostSummary.appendChild(<div class="summary-title">Total Costs</div>)
    this.totalCostSummary.appendChild(<div class="summary-details">
      <span id="totalSessions" class="summary-item" title={`
Sessions: ${summary.totalSessions}
Unique messages: ${summary.uniqueMessages}
Duplicate messages: ${summary.duplicateMessages} (skipped)
Total tokens from unique messages: ${humanReadable(tokens.total)}`}>{
          `${summary.totalSessions} session${summary.totalSessions !== 1 ? 's' : ''}`}</span>
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
  
  
  renderAllSessions() {
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
    this._processedSessions.forEach((sessionData) => {
      if (sessionData && sessionData.costProgression && sessionData.costProgression.length > 0) {
        const sessionMax = Math.max(...sessionData.costProgression.map(p => p.totalCost || 0));
        globalMaxCost = Math.max(globalMaxCost, sessionMax);
        globalMaxMessages = Math.max(globalMaxMessages, sessionData.costProgression.length);
      }
    });
    
    // Store global max values for chart creation
    this._globalMaxCost = globalMaxCost;
    this._globalMaxMessages = globalMaxMessages;
    
    // Filter and render sessions based on selected day
    let sessionsToRender = [...this._processedSessions.values()];
    
    // Sort sessions by oldest first for proper duplicate detection
    // (newer sessions with duplicate messages will appear translucent)
    sessionsToRender.sort((a, b) => {
      // Use modification time from sessionFile if available, fallback to dateRange
      const aTime = a.modificationTime || a.dateRange?.end || a.dateRange?.start;
      const bTime = b.modificationTime || b.dateRange?.end || b.dateRange?.start;
      
      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;
      
      return new Date(aTime).getTime() - new Date(bTime).getTime(); // Oldest first for duplicate detection
    });
    
    // Apply day filtering if a specific day is selected
    if (this._selectedDay && this._selectedDay.trim() !== '') {
      sessionsToRender = sessionsToRender.filter(sessionData => {
        if (!sessionData) return false;
        
        // Use same date priority as getAvailableDays(): modificationTime first, then dateRange
        let sessionDate = null;
        
        // First try modification time (most reliable)
        if (sessionData.modificationTime) {
          sessionDate = new Date(sessionData.modificationTime);
        }
        // Fallback to date range
        else if (sessionData.dateRange) {
          sessionDate = sessionData.dateRange.start || sessionData.dateRange.end;
        }
        
        if (sessionDate instanceof Date && !isNaN(sessionDate.getTime())) {
          const dayString = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          return dayString === this._selectedDay;
        }
        
        return false;
      });
    }
    
    // Process sessions in chronological order (oldest first) for proper UUID duplicate detection
    sessionsToRender.forEach((sessionData) => {
      this.renderSessionItem(sessionData);
    });
    
    // Update cost summary after rendering sessions
    this.updateCostSummary(sessionsToRender);
    
    if (sessionsToRender.length === 0) {
      const message = (this._selectedDay && this._selectedDay.trim() !== '')
        ? `No sessions found for ${this._selectedDay}.` 
        : 'No sessions with valid cost progression data found.';
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

  /**
   * Aggregate session data by date and hour for calendar visualization
   * Uses the same deduplication logic as other views to avoid counting duplicate messages
   * @returns {Object} Aggregated data structure: { "YYYY-MM-DD": { "08": {messages: N, tokens: N, cost: N}, ... } }
   */
  aggregateCalendarData() {
    const calendarData = {};
    
    // Get filtered sessions (respects current project/day selection)
    let sessionsToProcess = [...this._processedSessions.values()];
    
    // Apply project filtering (same as renderAllSessions)
    if (this._selectedDay && this._selectedDay.trim() !== '') {
      sessionsToProcess = sessionsToProcess.filter(sessionData => {
        if (!sessionData) return false;
        
        let sessionDate = null;
        if (sessionData.modificationTime) {
          sessionDate = new Date(sessionData.modificationTime);
        } else if (sessionData.dateRange) {
          sessionDate = sessionData.dateRange.start || sessionData.dateRange.end;
        }
        
        if (sessionDate instanceof Date && !isNaN(sessionDate.getTime())) {
          const dayString = sessionDate.toISOString().split('T')[0];
          return dayString === this._selectedDay;
        }
        return false;
      });
    }
    
    // Sort sessions by modification time (oldest first) for proper duplicate detection
    // This matches the same logic used in renderAllSessions and calculateTotalCostSummary
    sessionsToProcess.sort((a, b) => {
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
    
    // Process each session's cost progression in chronological order
    sessionsToProcess.forEach(sessionData => {
      if (!sessionData || !sessionData.costProgression) return;
      
      sessionData.costProgression.forEach(point => {
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
    this._processedSessions.clear();
    this._sessionList = [];
    this._remainingSessions = [];
    this._globalMaxCost = 0;
    this._globalMaxMessages = 0;
    this._lastRefresh = null; // Reset refresh timestamp
    this._sessionsWithDuplicates = new Set(); // Clear duplicate tracking
    
    
    // Force fresh discovery and loading from disk
    await this.loadAllSessions();
    
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
    
    this._sessionList = other._sessionList;
    this._processedSessions = other._processedSessions;
    this._loadingProgress = other._loadingProgress;
    this._lastRefresh = other._lastRefresh;
    this._globalMaxCost = other._globalMaxCost;
    this._availableProjects = other._availableProjects;
    this._availableDays = other._availableDays;
    this._remainingSessions = other._remainingSessions;
    this._sessionsWithDuplicates = other._sessionsWithDuplicates; 
    this._globalMessageUUIDs = other._globalMessageUUIDs; 
  }

}