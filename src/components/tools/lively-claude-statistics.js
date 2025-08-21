import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeSessionsAPI from 'src/client/claude-sessions.js';
import d3 from "src/external/d3.v5.js";
import moment from "src/external/moment.js";

/*MD # Claude Statistics Viewer

- Analyzes all Claude Code session files and displays cost progression charts
- Shows stacked bar charts for each session with token cost breakdowns

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
    this.loadMoreContainer = this.get("#loadMoreContainer");
    this.loadMoreButton = this.get("#loadMoreButton");
    this.remainingCountSpan = this.get("#remainingCount");
    
    // Initialize data structures
    this._sessionList = this._sessionList || [];
    this._processedSessions = this._processedSessions || new Map();
    this._globalMaxCost = this._globalMaxCost || 0;
    this._globalMaxMessages = this._globalMaxMessages || 0;
    this._currentProject = this._currentProject || null;
    this._availableProjects = this._availableProjects || [];
    this._selectedDay = this._selectedDay || null;
    this._availableDays = this._availableDays || [];
    this._remainingSessions = this._remainingSessions || [];
    this._loadingProgress = {
      total: 0,
      loaded: 0,
      currentSession: null
    };
    this._lastRefresh = null;
    
    this.registerButtons();
    
    if (this.projectSelect) {
      const selectedProject = this.getAttribute('selected-project');
      if (selectedProject !== null) {
        this._currentProject = selectedProject;
      }
      
      this.projectSelect.addEventListener('change', () => {
        this.setAttribute('selected-project', this.projectSelect.value);
        this.onProjectChanged();
      });
    }
    
    // Register day selector dropdown
    if (this.daySelect) {
      const selectedDay = this.getAttribute('selected-day');
      if (selectedDay !== null) {
        this._selectedDay = selectedDay;
      }
      
      this.daySelect.addEventListener('change', () => {
        this.setAttribute('selected-day', this.daySelect.value);
        this.onDayChanged();
      });
    }
    
    // Register chart mode toggle checkbox
    if (this.showDetailedCostsCheckbox) {
      const detailedCosts = this.getAttribute('detailed-costs');
      if (detailedCosts !== null) {
        this.showDetailedCostsCheckbox.checked = detailedCosts === 'true';
      }
      
      this.showDetailedCostsCheckbox.addEventListener('change', () => {
        this.setAttribute('detailed-costs', this.showDetailedCostsCheckbox.checked);
        this.onChartModeChanged();
      });
    }
    
    // Register compact view toggle checkbox
    if (this.compactViewCheckbox) {
      const compactView = this.getAttribute('compact-view');
      if (compactView !== null) {
        this.compactViewCheckbox.checked = compactView === 'true';
      }
      
      this.compactViewCheckbox.addEventListener('change', () => {
        this.setAttribute('compact-view', this.compactViewCheckbox.checked);
        this.onCompactViewChanged();
      });
    }
    
    // Register load more button
    if (this.loadMoreButton) {
      this.loadMoreButton.addEventListener('click', () => {
        this.onLoadMoreButton();
      });
    }
    
    // Load projects and data
    if (this._availableProjects && this._availableProjects.length > 0) {
      this.populateProjectDropdown();
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
        
        // Update Load More button
        if (this._remainingSessions.length > 0) {
          this.showLoadMoreButton();
        } else {
          this.hideLoadMoreButton();
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
    if (!this.loadMoreContainer) return;
    
    const remainingCount = this.getRemainingSessionsForDay(this._selectedDay);
    
    // Only show button if there are remaining sessions for the selected day/filter
    if (remainingCount === 0) {
      this.hideLoadMoreButton();
      return;
    }
    
    const buttonText = this._selectedDay && this._selectedDay.trim() !== '' 
      ? `Load All for Day ${this._selectedDay} (${remainingCount} remaining)`
      : `Load All for Project (${remainingCount} remaining)`;
    
    this.loadMoreButton.innerHTML = `
      <i class="fa fa-download" aria-hidden="true"></i>
      ${buttonText}
    `;
    this.loadMoreContainer.style.display = 'block';
  }

  hideLoadMoreButton() {
    if (!this.loadMoreContainer) return;
    this.loadMoreContainer.style.display = 'none';
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
      
      // Clear the UI immediately
      this.sessionList.innerHTML = '';
      this.hideLoadMoreButton();
      
      await this.forceRefresh(); // Reload data for new project
    }
  }

  async loadProjects() {
    try {
      this._availableProjects = await ClaudeSessionsAPI.loadProjects();
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
    
    // Set current selection from instance variable or attribute
    const dayToSelect = this._selectedDay || this.getAttribute('selected-day') || '';
    if (dayToSelect) {
      this.daySelect.value = dayToSelect;
    }
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
    return await ClaudeSessionsAPI.discoverSessions(this._currentProject);
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
      
      // Phase 1.5: Populate day dropdown early so user can interact
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
        
        // Skip sessions without token statistics
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
        
        // Allow UI to update (non-blocking)
        await lively.sleep(10);
      }
      
      this.updateProgress(sessionsToLoad.length, 'Complete!');
      this._lastRefresh = Date.now();
      
      // Don't repopulate day dropdown - keep the complete list from early population
      
      // Show Load More button if there are remaining sessions
      if (this._remainingSessions.length > 0) {
        this.showLoadMoreButton();
      }
      
      lively.sleep(1000).then(() => this.hideProgress())
      
    } catch (error) {
      this.showError(`Failed to load sessions: ${error.message}`);
    }
  }

  async loadAndProcessSession(sessionFile) {
    try {
      // Load session content using shared API
      const messages = await ClaudeSessionsAPI.loadSessionContent(sessionFile.path);
      
      // Process session data using shared API
      const sessionData = ClaudeSessionsAPI.processSessionData(sessionFile, messages);
      
      // Filter out sessions with no token statistics or very short sessions
      if (sessionData.messagesWithTokens === 0 || sessionData.messagesWithTokens < 2) {
        return null; // Skip sessions without meaningful token data
      }
      
      return sessionData;
    } catch (error) {
      return null;
    }
  }


  renderAllSessions() {
    this.sessionList.innerHTML = '';
    
    // Day dropdown already populated from early population - don't overwrite
    
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
    
    // Sort sessions by latest modification time on top
    sessionsToRender.sort((a, b) => {
      // Use modification time from sessionFile if available, fallback to dateRange
      const aTime = a.modificationTime || a.dateRange?.end || a.dateRange?.start;
      const bTime = b.modificationTime || b.dateRange?.end || b.dateRange?.start;
      
      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;
      
      return new Date(bTime).getTime() - new Date(aTime).getTime(); // Newest first
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
    
    sessionsToRender.forEach((sessionData) => {
      this.renderSessionItem(sessionData);
    });
    
    
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
    
    
    header.innerHTML = `
      <div class="session-info-left">
        <span class="session-id" title="Full Session ID: ${sessionData.sessionId}">${sessionData.sessionId.substring(0, 8)}...</span>
        <span class="modification-time" title="File modification time: ${modificationTimeText}">📝 ${modificationTimeText}</span>
        <span class="date-range" title="Date range when this session was active">${dateRangeText}</span>
        <span class="message-count" title="Total messages: ${sessionData.messageCount}&#10;Messages with token usage data: ${sessionData.messagesWithTokens}&#10;&#10;Only messages with token data are shown in the cost chart.">${sessionData.messageCount} msgs (${sessionData.messagesWithTokens} w/ tokens)</span>
        <span class="total-cost" title="Total estimated cost for all messages with tokens in this session&#10;Average cost per message: ${ClaudeSessionsAPI.formatNumber(sessionData.avgCost)} tokens&#10;&#10;Cost calculation:&#10;• Input tokens: 1.0× weight&#10;• Output tokens: 3.0× weight&#10;• Cache read: 0.1× weight&#10;• Cache write: 1.25× weight">${ClaudeSessionsAPI.formatNumber(sessionData.totalCost)} tokens</span>
        <span class="escalation-indicator" title="Cost Escalation Ratio: ${sessionData.escalationRatio.toFixed(2)}&#10;&#10;Compares average cost between first 25% and last 25% of messages:&#10;• Ratio > 1.5: 🔺 Costs escalated significantly&#10;• Ratio < 0.8: 🔻 Costs decreased significantly&#10;• 0.8-1.5: ➡️ Costs remained stable&#10;&#10;High escalation often indicates context buildup making later messages more expensive.">${escalationText}</span>
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
    
    // Add to session list
    this.sessionList.appendChild(sessionDiv);
    
    // Add event listener for open session button
    const openSessionBtn = header.querySelector('.open-session-btn');
    if (openSessionBtn) {
      openSessionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openSessionInViewer(sessionData.filePath);
      });
    }
    
    // Create chart
    this.createSessionChart(costChartDiv, sessionData);
  }

  // #important
  createSessionChart(container, sessionData) {
    if (!sessionData || sessionData.costProgression.length === 0) {
      container.innerHTML = '<div style="padding: 20px; color: #666;">No data available</div>';
      return;
    }
    
    // Chart dimensions - compact view controls spacing and bar width
    const messageCount = sessionData.costProgression.length;
    const compactView = this.isCompactViewEnabled();
    
    // Adjust bar width and spacing based on compact view
    const barWidth = compactView ? 5 : 10; // Half width in compact view
    const barSpacing = compactView ? 1 : 2; // Tighter spacing in compact view
    
    const margin = { top: 20, right: 40, bottom: 150, left: 60 }; // More space for rotated timestamps
    const height = 250;
    
    let width;
    if (compactView) {
      // Compact: use actual count of messages (no gaps, half width bars)
      width = messageCount * (barWidth + barSpacing) + margin.left + margin.right;
    } else {
      // Preserve original JSONL line gaps (full width bars)
      const messageIndices = sessionData.costProgression.map(p => p.messageIndex);
      const minIndex = Math.min(...messageIndices);
      const maxIndex = Math.max(...messageIndices);
      const indexRange = maxIndex - minIndex + 1;
      width = indexRange * (barWidth + barSpacing) + margin.left + margin.right;
    }
    
    // Create SVG using D3
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height + margin.top + margin.bottom)
      .style('width', width + 'px')
      .style('height', (height + margin.top + margin.bottom) + 'px');
    
    // Enable horizontal scrolling for parent container
    if (width > container.parentElement.offsetWidth) {
      container.parentElement.style.overflowX = 'auto';
    }
    
    // Scales - Fixed max cost at 30k to avoid outlier scaling issues
    const maxCost = 50000;
    
    const yScale = d3.scaleLinear()
      .domain([0, maxCost])
      .range([height + margin.top, margin.top]);
    
    // Color scale for cost types
    const colors = {
      inputCost: '#2196f3',
      outputCost: '#4caf50', 
      cacheReadCost: '#8d6e63',
      cacheWriteCost: '#424242'
    };
    
    // Create main chart group
    const chart = svg.append('g');
    
    // Stack keys in order (bottom to top)
    const stackKeys = ['inputCost', 'outputCost', 'cacheReadCost', 'cacheWriteCost'];
    
    // Pre-calculate positioning data for non-compact mode
    let minIndex = 0;
    if (!compactView) {
      const messageIndices = sessionData.costProgression.map(p => p.messageIndex);
      minIndex = Math.min(...messageIndices);
    }
    
    // Create stacked bars (including empty boxes for user messages)
    sessionData.costProgression.forEach((point, arrayIndex) => {
      // Position based on compact view setting
      let x;
      if (compactView) {
        // Compact: use array index (no gaps)
        x = margin.left + arrayIndex * (barWidth + barSpacing);
      } else {
        // Preserve gaps: use original JSONL line positions
        const messagePosition = point.messageIndex - minIndex;
        x = margin.left + messagePosition * (barWidth + barSpacing);
      }
      let yOffset = 0; // Track cumulative height
      
      // Check if detailed cost breakdown mode is enabled
      const showDetailedCosts = this.isDetailedCostsEnabled();

      if (point.isUserMessage) {
        // Render user message as empty box with blue border (matching session viewer)
        const emptyBoxHeight = 20; // Fixed height for user messages
        const y = yScale(0) - emptyBoxHeight;
        
        chart.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', barWidth)
          .attr('height', emptyBoxHeight)
          .attr('fill', '#f8fbff') // Light blue background matching session viewer
          .attr('stroke', '#2196f3') // Blue border matching session viewer
          .attr('stroke-width', 2)
          .attr('cursor', 'pointer')
          .on('click', () => {
            this.navigateToMessageInExistingViewer(sessionData.filePath, point.uuid);
          })
          .append('title')
          .text(`User Message #${point.messageIndex}
${point.sessionEntry.message.content.slice(0,100)}`);
      } else {
        const totalCost = Object.values(point.costBreakdown).reduce((sum, cost) => sum + cost, 0);
        if (totalCost > 0) {
          if (showDetailedCosts) {
            // Detailed mode: Show stacked cost breakdown with shared purple border
            const totalBarHeight = yScale(0) - yScale(totalCost);
            const backgroundY = yScale(totalCost);
            
            // Add background rectangle with purple border for the entire stack
            chart.append('rect')
              .attr('x', x - 1) // Slightly wider to encompass the stack
              .attr('y', backgroundY - 1)
              .attr('width', barWidth + 2)
              .attr('height', totalBarHeight + 2)
              .attr('fill', 'none')
              .attr('stroke', 'none') 
              .attr('stroke-width', 0)
              .attr('cursor', 'pointer')
              .on('click', () => {
                this.navigateToMessageInExistingViewer(sessionData.filePath, point.uuid);
              });
            
            // Render individual cost segments
            stackKeys.forEach(key => {
              const costValue = point.costBreakdown[key];
              if (costValue > 0) {
                const barHeight = yScale(0) - yScale(costValue);
                const y = yScale(0) - yOffset - barHeight;
                
                chart.append('rect')
                  .attr('x', x)
                  .attr('y', y)
                  .attr('width', barWidth)
                  .attr('height', barHeight)
                  .attr('fill', colors[key])
                  .attr('cursor', 'pointer')
                  .on('click', () => {
                    this.navigateToMessageInExistingViewer(sessionData.filePath, point.uuid);
                  })
                  .append('title')
                  .text(`Assistant Message #${point.messageIndex}
${key.replace('Cost', '')}: ${ClaudeSessionsAPI.formatNumber(costValue)} tokens

${point.sessionEntry.message.content[0].text ? point.sessionEntry.message.content[0].text.slice(0,100)  : ""}`);
                yOffset += barHeight;
              }
            });
          } else {
            // Simple mode: Single purple bar for total cost
            const totalBarHeight = yScale(0) - yScale(totalCost);
            const y = yScale(totalCost);
            
            chart.append('rect')
              .attr('x', x)
              .attr('y', y)
              .attr('width', barWidth)
              .attr('height', totalBarHeight)
              .attr('fill', '#9c27b0') // Purple fill matching session viewer
              .attr('stroke', '#9c27b0')
              .attr('stroke-width', 1)
              .attr('cursor', 'pointer')
              .on('click', () => {
                this.navigateToMessageInExistingViewer(sessionData.filePath, point.uuid);
              })
              .append('title')
              .text(`Assistant Message #${point.messageIndex}
Total Cost: ${ClaudeSessionsAPI.formatNumber(totalCost)} tokens
${point.sessionEntry.message.content[0].text ? point.sessionEntry.message.content[0].text.slice(0,100)  : ""}`);
          }
        }
      }
    });
    
    // X-axis - smart timestamp selection and response time calculation
    const intelligentTickData = [];
    
    sessionData.costProgression.forEach((point, arrayIndex) => {
      const showTimestamp = point.isUserMessage || // Always show for user messages
        (arrayIndex > 0 && sessionData.costProgression[arrayIndex + 1]?.isUserMessage); // Show for AI response before user message
      
      if (showTimestamp && point.timestamp) {
        // Simple moment.js formatting - no cleverness, just reliable parsing
        let formattedTime = 'Invalid';
        
        try {
          // Use the original timestamp string from sessionEntry
          const originalTimestamp = point.sessionEntry.timestamp;
          
          if (originalTimestamp) {
            // Parse with moment.js and format as HH:mm:ss
            const momentObj = moment(originalTimestamp);
            
            if (momentObj.isValid()) {
              formattedTime = momentObj.format('HH:mm:ss');
            } else {
              formattedTime = 'Invalid';
            }
          }
        } catch (error) {
          formattedTime = 'Error';
        }
        
        const tickItem = {
          messageIndex: point.messageIndex,
          arrayIndex,
          timestamp: point.timestamp, // Use the existing parsed timestamp
          isUserMessage: point.isUserMessage,
          formattedTime: formattedTime
        };
        
        // Calculate response time if this is an AI response before a user message
        if (!point.isUserMessage && arrayIndex > 0 && sessionData.costProgression[arrayIndex + 1]?.isUserMessage) {
          // Find the previous user message to calculate response time
          for (let i = arrayIndex - 1; i >= 0; i--) {
            const prevMessage = sessionData.costProgression[i];
            if (prevMessage.isUserMessage && prevMessage.timestamp) {
              // Use moment.js for reliable time difference calculation
              const responseTimeMs = moment(point.timestamp).diff(moment(prevMessage.timestamp));
              const responseTimeSeconds = Math.round(responseTimeMs / 1000);
              tickItem.responseTime = responseTimeSeconds;
              tickItem.responseLabel = responseTimeSeconds < 60 
                ? `${responseTimeSeconds}s` 
                : `${Math.floor(responseTimeSeconds / 60)}m${responseTimeSeconds % 60}s`;
              break;
            }
          }
        }
        
        intelligentTickData.push(tickItem);
      }
    });
    
    // Also show regular index ticks for every 10th message for reference
    const regularTickData = sessionData.costProgression
      .map((point, arrayIndex) => ({ 
        messageIndex: point.messageIndex, 
        arrayIndex, 
        timestamp: point.timestamp
      }))
      .filter((item, i, arr) => {
        return i % 10 === 0 || i === 0 || i === arr.length - 1;
      });
    
    // Message index labels (top line) - show every 10th for reference
    chart.selectAll('.x-tick-index')
      .data(regularTickData)
      .enter()
      .append('text')
      .attr('class', 'x-tick-index')
      .attr('x', d => {
        if (compactView) {
          return margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2;
        } else {
          const messagePosition = d.messageIndex - minIndex;
          return margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
        }
      })
      .attr('y', height + margin.top + 12)
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('fill', '#aaa')
      .text(d => d.messageIndex);
    
    // Smart timestamp labels (rotated 45 degrees)
    chart.selectAll('.x-tick-time')
      .data(intelligentTickData)
      .enter()
      .append('text')
      .attr('class', 'x-tick-time')
      .attr('x', d => {
        let baseX;
        if (compactView) {
          baseX = margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2;
        } else {
          const messagePosition = d.messageIndex - minIndex;
          baseX = margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
        }
        // Offset user messages 5px right, non-user messages 5px left
        return baseX + (d.isUserMessage ? 5 : -5);
      })
      .attr('y', height + margin.top + 60)
      .attr('text-anchor', 'start')
      .attr('transform', d => {
        let baseX = compactView 
          ? margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2
          : margin.left + (d.messageIndex - minIndex) * (barWidth + barSpacing) + barWidth / 2;
        // Apply same offset as x position
        const x = baseX + (d.isUserMessage ? 5 : -5);
        return `rotate(45, ${x}, ${height + margin.top + 45})`;
      })
      .style('font-size', '8px')
      .style('fill', d => d.isUserMessage ? '#2196f3' : '#9c27b0') // Blue for user, purple for AI
      .text(d => {
        const momentParsed = moment(d.timestamp);
        const formatted = momentParsed.isValid() ? momentParsed.format('HH:mm:ss') : 'INVALID';
        return `${formatted}`;
      });
    
    // Response time labels (horizontal, middle position)
    chart.selectAll('.x-response-time')
      .data(intelligentTickData.filter(d => d.responseTime))
      .enter()
      .append('text')
      .attr('class', 'x-response-time')
      .attr('x', d => {
        if (compactView) {
          return margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2;
        } else {
          const messagePosition = d.messageIndex - minIndex;
          return margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
        }
      })
      .attr('y', height + margin.top + 100)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#e91e63') // Pink color for response times
      .style('cursor', 'help')
      .text(d => d.responseLabel)
      .append('title')
      .text(d => {
        const aiTime = moment(d.timestamp).format('YYYY-MM-DD HH:mm:ss');
        
        return `AI Response Time: ${d.responseLabel} (${d.responseTime} seconds)\n` +
               `AI response completed at: ${aiTime}\n` +
               `Message #${d.messageIndex}\n` +
               `This is the time from user question to AI response completion`;
      });
    
    // Hour and day markers (show under first message of each time period)
    const hourMarkers = [];
    const dayMarkers = [];
    const seenHours = new Set();
    const seenDays = new Set();
    
    // Process each message to find first occurrence of each hour/day
    sessionData.costProgression.forEach((msg, arrayIndex) => {
      if (!msg.timestamp) return;
      
      const msgMoment = moment(msg.timestamp);
      if (!msgMoment.isValid()) return;
      
      const dayKey = msgMoment.format('YYYY-MM-DD');
      const hourKey = msgMoment.format('YYYY-MM-DD-HH');
      
      // Add day marker for first message of each day
      if (!seenDays.has(dayKey)) {
        seenDays.add(dayKey);
        dayMarkers.push({
          arrayIndex: arrayIndex,
          messageIndex: msg.messageIndex,
          dayLabel: dayKey,
          timestamp: msg.timestamp
        });
      }
      
      // Add hour marker for first message of each hour
      if (!seenHours.has(hourKey)) {
        seenHours.add(hourKey);
        
        // Only skip hour marker if this isn't the first message of a new day AND it's not the very first message
        const isFirstDayOccurrence = dayMarkers.some(d => 
          d.arrayIndex === arrayIndex && d.dayLabel === dayKey
        );
        const isVeryFirstMessage = arrayIndex === 0;
        
        if (!isFirstDayOccurrence || isVeryFirstMessage) {
          hourMarkers.push({
            arrayIndex: arrayIndex,
            messageIndex: msg.messageIndex,
            hourLabel: msgMoment.format('HH:00'),
            timestamp: msg.timestamp
          });
        }
      }
    });
    
    // Render hour markers
    chart.selectAll('.x-hour-marker')
      .data(hourMarkers)
      .enter()
      .append('text')
      .attr('class', 'x-hour-marker')
      .attr('x', d => {
        if (compactView) {
          return margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2;
        } else {
          const messagePosition = d.messageIndex - minIndex;
          return margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
        }
      })
      .attr('y', height + margin.top + 90)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#ff9800') // Orange color for hour markers
      .style('cursor', 'help')
      .text(d => d.hourLabel)
      .append('title')
      .text(d => `First message of ${d.hourLabel} hour\nMessage #${d.messageIndex} at ${moment(d.timestamp).format('HH:mm:ss')}`);
    
    // Render day markers
    chart.selectAll('.x-day-marker')
      .data(dayMarkers)
      .enter()
      .append('text')
      .attr('class', 'x-day-marker')
      .attr('x', d => {
        if (compactView) {
          return margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2;
        } else {
          const messagePosition = d.messageIndex - minIndex;
          return margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
        }
      })
      .attr('y', height + margin.top + 120)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#e91e63') // Pink/red color for day markers (more prominent)
      .style('cursor', 'help')
      .text(d => d.dayLabel)
      .append('title')
      .text(d => `First message of ${d.dayLabel}\nMessage #${d.messageIndex} at ${moment(d.timestamp).format('HH:mm:ss')}`);
    
    // Y-axis  
    const yTicks = yScale.ticks(5);
    chart.selectAll('.y-tick')
      .data(yTicks)
      .enter()
      .append('text')
      .attr('class', 'y-tick')
      .attr('x', margin.left - 10)
      .attr('y', d => yScale(d) + 4)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text(d => d >= 10000 ? `${Math.round(d / 1000)}k` : Math.round(d));
    
    // Axis lines
    chart.append('line')
      .attr('x1', margin.left)
      .attr('x2', margin.left)
      .attr('y1', margin.top)
      .attr('y2', height + margin.top)
      .attr('stroke', '#666')
      .attr('stroke-width', 1);
    
    chart.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', height + margin.top)
      .attr('y2', height + margin.top)
      .attr('stroke', '#666')
      .attr('stroke-width', 1);
    
    // Axis labels
    chart.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.top + margin.bottom - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Message Index & Timestamp');
    
    chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height + margin.top) / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Cost (tokens)');
    
    return svg.node();
  }

  showProgress() {
    this.loadingProgress.style.display = 'block';
    this.sessionList.style.display = 'none';
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
    this.hideLoadMoreButton();
    
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
    this._currentProject = other._currentProject;
    this._availableProjects = other._availableProjects;
    this._selectedDay = other._selectedDay;
    this._availableDays = other._availableDays;
    this._remainingSessions = other._remainingSessions;
    
    // Checkbox states are now handled via attributes - no manual preservation needed
    
    // D3 SVG charts are recreated fresh for each render
  }

}