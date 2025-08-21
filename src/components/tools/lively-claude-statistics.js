import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeSessionsAPI from 'src/client/claude-sessions.js';
// Using D3 for SVG-based charts with dynamic sizing
import d3 from "src/external/d3.v5.js";

/*
 * Claude Statistics Viewer
 * Analyzes all Claude Code session files and displays cost progression charts
 * Shows stacked bar charts for each session with token cost breakdowns
 */



export default class LivelyClaudeStatistics extends Morph {

  
    async initialize() {
    this.windowTitle = "Claude Statistics";
    
    
    // Initialize UI references
    this.loadingProgress = this.get("#loadingProgress");
    this.progressFill = this.get("#progressFill");
    this.progressText = this.get("#progressText");
    this.sessionList = this.get("#sessionList");
    this.refreshBtn = this.get("#refreshButton");
    this.exportBtn = this.get("#exportButton");
    this.projectSelect = this.get("#projectSelect");
    this.showDetailedCostsCheckbox = this.get("#showDetailedCosts");
    
    // Terminal is now managed by ClaudeSessionsAPI
    
    // Initialize data structures
    this._sessionList = this._sessionList || [];
    this._processedSessions = this._processedSessions || new Map();
    // D3 charts don't need instance tracking like Chart.js did
    this._globalMaxCost = this._globalMaxCost || 0;
    this._globalMaxMessages = this._globalMaxMessages || 0;
    this._currentProject = this._currentProject || null;
    this._availableProjects = this._availableProjects || [];
    this._loadingProgress = {
      total: 0,
      loaded: 0,
      currentSession: null
    };
    this._lastRefresh = null;
    
    this.registerButtons();
    
    // Register project dropdown change event
    if (this.projectSelect) {
      this.projectSelect.addEventListener('change', () => {
        this.onProjectChanged();
      });
    }
    
    // Register chart mode toggle checkbox
    if (this.showDetailedCostsCheckbox) {
      this.showDetailedCostsCheckbox.addEventListener('change', () => {
        this.onChartModeChanged();
      });
    }
    
    // Load projects first, then data
    // If we already have project data from migration, populate dropdown immediately
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

  async onExportButton() {
    await this.exportData();
  }

  onChartModeChanged() {
    // Re-render all sessions with new chart mode
    this.renderAllSessions();
  }

  async onProjectChanged() {
    const selectedProject = this.projectSelect ? this.projectSelect.value : undefined;
    
    if (selectedProject !== this._currentProject) {
      this._currentProject = selectedProject;
      
      // Clear old session data completely
      this._processedSessions.clear();
      this._sessionList = [];
      this._globalMaxCost = 0;
      this._globalMaxMessages = 0;
      this._lastRefresh = null;
      
      // Clear the UI immediately
      this.sessionList.innerHTML = '';
      
      await this.forceRefresh(); // Reload data for new project
    }
  }

  async loadProjects() {
    try {
      this._availableProjects = await ClaudeSessionsAPI.loadProjects();
      this.populateProjectDropdown();
    } catch (error) {
      console.error('Failed to load projects:', error);
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
    
    // Set current selection
    if (this._currentProject) {
      this.projectSelect.value = this._currentProject;
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
      
      // Phase 2: Load sessions incrementally
      for (let i = 0; i < sessionFiles.length; i++) {
        const sessionFile = sessionFiles[i];
        
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
        await this.delay(10);
      }
      
      this.updateProgress(sessionFiles.length, 'Complete!');
      this._lastRefresh = Date.now();
      
      setTimeout(() => {
        this.hideProgress();
      }, 1000);
      
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
      console.error(`Failed to load session ${sessionFile.path}:`, error);
      return null;
    }
  }


  renderAllSessions() {
    this.sessionList.innerHTML = '';
    
    
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
    
    // Render all sessions
    const sessionsToRender = [...this._processedSessions.values()];
    
    sessionsToRender.forEach((sessionData) => {
      this.renderSessionItem(sessionData);
    });
    
    
    if (sessionsToRender.length === 0) {
      this.sessionList.innerHTML = '<div class="error-message">No sessions with valid cost progression data found.</div>';
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
    
    const dateRangeText = sessionData.dateRange.start && sessionData.dateRange.end ? 
      `${sessionData.dateRange.start.toLocaleDateString()} - ${sessionData.dateRange.end.toLocaleDateString()}` :
      'Unknown dates';
    
    const escalationText = sessionData.escalationRatio > 1.5 ? 
      `🔺 +${Math.round((sessionData.escalationRatio - 1) * 100)}%` :
      sessionData.escalationRatio < 0.8 ?
      `🔻 ${Math.round((sessionData.escalationRatio - 1) * 100)}%` :
      `➡️ ${Math.round((sessionData.escalationRatio - 1) * 100)}%`;
    
    const thinkingTimeText = sessionData.thinkingTimeCount > 0 ? 
      `🤔 ${ClaudeSessionsAPI.formatDuration(sessionData.totalThinkingTime)}` : 
      `🤔 N/A`;
    
    header.innerHTML = `
      <div class="session-info-left">
        <span class="session-id" title="Full Session ID: ${sessionData.sessionId}">${sessionData.sessionId.substring(0, 8)}...</span>
        <span class="date-range" title="Date range when this session was active">${dateRangeText}</span>
        <span class="message-count" title="Total messages: ${sessionData.messageCount}&#10;Messages with token usage data: ${sessionData.messagesWithTokens}&#10;&#10;Only messages with token data are shown in the cost chart.">${sessionData.messageCount} msgs (${sessionData.messagesWithTokens} w/ tokens)</span>
        <span class="total-cost" title="Total estimated cost for all messages with tokens in this session&#10;Average cost per message: ₹${ClaudeSessionsAPI.formatNumber(sessionData.avgCost)}&#10;&#10;Cost calculation:&#10;• Input tokens: 1.0× weight&#10;• Output tokens: 3.0× weight&#10;• Cache read: 0.1× weight&#10;• Cache write: 1.25× weight">₹${ClaudeSessionsAPI.formatNumber(sessionData.totalCost)}</span>
        <span class="thinking-time" title="AI Thinking Time: ${ClaudeSessionsAPI.formatDuration(sessionData.totalThinkingTime)}&#10;Average per response: ${ClaudeSessionsAPI.formatDuration(sessionData.avgThinkingTime)}&#10;Responses measured: ${sessionData.thinkingTimeCount}&#10;&#10;Measures time from user message to AI response.&#10;Excludes gaps > 5 minutes (likely human pauses).&#10;Shows actual AI processing time, not human typing time.">${thinkingTimeText}</span>
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
    
    // Create chart container with fixed height
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    
    // Cost chart
    const costChartDiv = document.createElement('div');
    costChartDiv.className = 'svg-chart-container';
    
    // Thinking time chart
    const thinkingChartDiv = document.createElement('div');
    thinkingChartDiv.className = 'svg-chart-container thinking-chart';
    
    chartContainer.appendChild(costChartDiv);
    chartContainer.appendChild(thinkingChartDiv);
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
    
    // Create charts
    this.createSessionChart(costChartDiv, sessionData);
    this.createThinkingTimeChart(thinkingChartDiv, sessionData);
  }

  createSessionChart(container, sessionData) {
    // This should never happen now due to filtering, but keep as safety check
    if (!sessionData || sessionData.costProgression.length === 0) {
      container.innerHTML = '<div style="padding: 20px; color: #666;">No data available</div>';
      return;
    }
    
    // Chart dimensions - need to calculate based on message indices, not just count
    const barWidth = 10; 
    const barSpacing = 2;  
    const messageCount = sessionData.costProgression.length;
    
    // Find the range of message indices to determine chart width
    const messageIndices = sessionData.costProgression.map(p => p.messageIndex);
    const minIndex = Math.min(...messageIndices);
    const maxIndex = Math.max(...messageIndices);
    const indexRange = maxIndex - minIndex + 1;
    
    const margin = { top: 20, right: 40, bottom: 40, left: 60 };
    const height = 250;
    const width = indexRange * (barWidth + barSpacing) + margin.left + margin.right;
    
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
    const maxCost = 30000;
    
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
    
    // Create stacked bars (including empty boxes for user messages)
    sessionData.costProgression.forEach((point, arrayIndex) => {
      // Use actual message index for positioning, not array index
      const messagePosition = point.messageIndex - minIndex; // Convert to 0-based position
      const x = margin.left + messagePosition * (barWidth + barSpacing);
      let yOffset = 0; // Track cumulative height
      
      // Check if detailed cost breakdown mode is enabled
      const showDetailedCosts = this.showDetailedCostsCheckbox ? this.showDetailedCostsCheckbox.checked : true;

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
          .text(`User Message #${point.messageIndex}\nUUID ${point.uuid}\n${point.sessionEntry.message.content.slice(0,100)}`);
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
              .attr('stroke', '#9c27b0') // Purple border matching session viewer
              .attr('stroke-width', 1.5)
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
                  .text(`Assistant Message #${point.messageIndex}\nUUID ${point.uuid}\n${key.replace('Cost', '')}: ₹${ClaudeSessionsAPI.formatNumber(costValue)}\n\n${
                      point.sessionEntry.message.content[0].text ? point.sessionEntry.message.content[0].text.slice(0,100)  : ""
                  }`);
                
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
              .text(`Assistant Message #${point.messageIndex}\nUUID ${point.uuid}\nTotal Cost: ₹${ClaudeSessionsAPI.formatNumber(totalCost)}\n\n${
                  point.sessionEntry.message.content[0].text ? point.sessionEntry.message.content[0].text.slice(0,100)  : ""
              }`);
          }
        }
      }
    });
    
    // X-axis - show actual message indices
    const messageIndicesForTicks = sessionData.costProgression
      .map(p => p.messageIndex)
      .filter((messageIndex, i, arr) => {
        // Show every 10th message index, or first/last
        return i % 10 === 0 || i === 0 || i === arr.length - 1;
      });
    
    chart.selectAll('.x-tick')
      .data(messageIndicesForTicks)
      .enter()
      .append('text')
      .attr('class', 'x-tick')
      .attr('x', messageIndex => {
        const messagePosition = messageIndex - minIndex;
        return margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
      })
      .attr('y', height + margin.top + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text(messageIndex => messageIndex); // Show actual message index
    
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
      .text('Message Index (JSONL Line #)');
    
    chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height + margin.top) / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Cost (₹)');
    
    return svg.node();
  }

  createThinkingTimeChart(container, sessionData) {
    // Always show chart now since we include user messages as empty boxes
    // Check if we have any data at all
    if (!sessionData.costProgression || sessionData.costProgression.length === 0) {
      container.innerHTML = '<div style="padding: 10px; color: #666; text-align: center; font-size: 12px;">No message data available</div>';
      return;
    }
    
    // Chart dimensions (smaller than cost chart) - use same logic as cost chart
    const barWidth = 10;
    const barSpacing = 2;  
    const messageCount = sessionData.costProgression.length;
    
    // Find the range of message indices to determine chart width
    const messageIndices = sessionData.costProgression.map(p => p.messageIndex);
    const minIndex = Math.min(...messageIndices);
    const maxIndex = Math.max(...messageIndices);
    const indexRange = maxIndex - minIndex + 1;
    
    const margin = { top: 10, right: 40, bottom: 30, left: 60 };
    const height = 80; // Much smaller than cost chart
    const width = indexRange * (barWidth + barSpacing) + margin.left + margin.right;
    
    // Create SVG using D3
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height + margin.top + margin.bottom)
      .style('width', width + 'px')
      .style('height', (height + margin.top + margin.bottom) + 'px');
    
    // Scales - Fixed max thinking time at 30 seconds for readability
    const maxThinkingTime = 30000; // 30 seconds in milliseconds
    
    const yScale = d3.scaleLinear()
      .domain([0, maxThinkingTime])
      .range([height + margin.top, margin.top]);
    
    // Create main chart group
    const chart = svg.append('g');
    
    // Create thinking time bars (only for assistant messages with thinking time)
    sessionData.costProgression.forEach((point, arrayIndex) => {
      // Use actual message index for positioning, not array index
      const messagePosition = point.messageIndex - minIndex; // Convert to 0-based position
      const x = margin.left + messagePosition * (barWidth + barSpacing);
      
      // Only render assistant messages with thinking time > 0
      if (!point.isUserMessage && point.thinkingTime > 0) {
        // Render assistant thinking time bar with purple border
        const barHeight = yScale(0) - yScale(Math.min(point.thinkingTime, maxThinkingTime));
        const y = yScale(Math.min(point.thinkingTime, maxThinkingTime));
        
        chart.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', barWidth)
          .attr('height', barHeight)
          .attr('fill', point.thinkingTime > maxThinkingTime ? '#ff4444' : '#6f42c1') // Red if clipped
          .attr('stroke', '#9c27b0') // Purple border matching session viewer
          .attr('stroke-width', 1)
          .append('title') // Simple tooltip
          .text(`Assistant Message #${point.messageIndex}\nThinking time: ${ClaudeSessionsAPI.formatDuration(point.thinkingTime)}`);
      }
    });
    
    // Y-axis with fewer ticks
    const yTicks = [0, 10000, 20000, 30000]; // 0s, 10s, 20s, 30s
    chart.selectAll('.y-tick')
      .data(yTicks)
      .enter()
      .append('text')
      .attr('class', 'y-tick')
      .attr('x', margin.left - 10)
      .attr('y', d => yScale(d) + 3)
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text(d => d === 0 ? '0' : `${d/1000}s`);
    
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
    
    // Y-axis label
    chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height + margin.top) / 2)
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('Think Time');
    
    return svg.node();
  }

  // D3 works directly with raw data - no Chart.js data preparation needed

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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async navigateToMessageInExistingViewer(sessionPath, messageUuid) {
    try {
      // Check if there's already a session viewer with this session open
      const existingViewer = this.findExistingSessionViewer(sessionPath);
      
      if (!existingViewer) {
        lively.notify("Please open the session viewer first");
        return;
      }
      
      console.log(`Navigating to message ${messageUuid} in existing session viewer`);
      
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
        // Fallback for older session viewers that don't have the showMessage method
        console.warn(`Session viewer does not have showMessage method`);
        lively.notify(`Please refresh the session viewer to enable message navigation`);
      }
      
    } catch (error) {
      console.error('Failed to navigate to message in session viewer:', error);
      lively.notify(`Failed to navigate to message: ${error.message}`);
    }
  }

  async openSessionInViewer(sessionPath) {
    try {
      // Open the Claude session viewer component
      const sessionViewer = await lively.openComponentInWindow('lively-claude-session');
      
      // Wait a moment for the component to initialize
      await this.delay(100);
      
      // Set the session path attribute to pre-select this session
      sessionViewer.setAttribute('selected-session', sessionPath);
      
      // Trigger loading of the specific session
      if (sessionViewer.loadSession) {
        await sessionViewer.loadSession(sessionPath);
      }
      
    } catch (error) {
      console.error('Failed to open session viewer:', error);
      // Show a user-friendly error
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
    this._globalMaxCost = 0;
    this._globalMaxMessages = 0;
    this._lastRefresh = null; // Reset refresh timestamp
    
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

  async exportData() {
    // Export session statistics to CSV
    let csv = 'Session ID,Date Range,Messages,Total Cost,Avg Cost,Escalation Ratio\n';
    
    this._processedSessions.forEach((sessionData) => {
      const dateRange = sessionData.dateRange.start && sessionData.dateRange.end ? 
        `${sessionData.dateRange.start.toISOString()} - ${sessionData.dateRange.end.toISOString()}` :
        'Unknown';
      
      csv += `${sessionData.sessionId},${dateRange},${sessionData.messageCount},${sessionData.totalCost},${sessionData.avgCost},${sessionData.escalationRatio}\n`;
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-statistics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  

  livelyMigrate(other) {
    // Only copy data, don't manipulate DOM or setup event listeners
    // Terminal is now managed by ClaudeSessionsAPI
    
    // Copy session list and processed data - this is the key data to preserve
    if (other._sessionList && other._sessionList.length > 0) {
      this._sessionList = other._sessionList;
    }
    
    if (other._processedSessions && other._processedSessions.size > 0) {
      this._processedSessions = other._processedSessions;
    }
    
    // Copy loading state
    if (other._loadingProgress) {
      this._loadingProgress = other._loadingProgress;
    }
    
    if (other._lastRefresh) {
      this._lastRefresh = other._lastRefresh;
    }
    
    // Copy global max values for consistent axis scaling
    if (other._globalMaxCost) {
      this._globalMaxCost = other._globalMaxCost;
    }
    
    if (other._globalMaxMessages) {
      this._globalMaxMessages = other._globalMaxMessages;
    }
    
    // Copy project selection state
    if (other._currentProject !== undefined) {
      this._currentProject = other._currentProject;
    }
    
    if (other._availableProjects && other._availableProjects.length > 0) {
      this._availableProjects = other._availableProjects;
    }
    
    // Preserve checkbox states
    if (other.showDetailedCostsCheckbox) {
      const wasChecked = other.showDetailedCostsCheckbox.checked;
      setTimeout(() => {
        if (this.showDetailedCostsCheckbox) {
          this.showDetailedCostsCheckbox.checked = wasChecked;
        }
      }, 10);
    }
    
    // D3 SVG charts are recreated fresh for each render
  }

  livelyExample() {
    // This will be called when the component is opened as an example
    // The component will automatically load available sessions
  }
}