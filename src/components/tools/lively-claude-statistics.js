import Morph from 'src/components/widgets/lively-morph.js';
import Terminal from 'src/client/terminal.js';
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
    
    // Initialize terminal for file operations
    this.terminal = new Terminal({
      url: lively4url,
      cwd: "/lively4-core"
    });
    
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

  async onProjectChanged() {
    console.log("onProjectChanged called");
    console.log("projectSelect:", this.projectSelect);
    const selectedProject = this.projectSelect ? this.projectSelect.value : undefined;
    console.log("selectedProject:", selectedProject);
    console.log("_currentProject:", this._currentProject);
    
    if (selectedProject !== this._currentProject) {
      this._currentProject = selectedProject;
      console.log("Project changed to:", this._currentProject);
      
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
      // Discover all project directories under ~/.claude/projects
      const command = `find ~/.claude/projects -maxdepth 1 -type d -not -path ~/.claude/projects | sort`;
      const result = await this.terminal.run(command);
      
      if (result.error) {
        console.warn('Failed to load projects:', result.stderr || result.error.message);
        this._availableProjects = [];
        this.populateProjectDropdown();
        return;
      }
      
      const projectPaths = result.stdout.trim().split('\n').filter(line => line.trim());
      this._availableProjects = projectPaths.map(path => {
        const dirName = path.split('/').pop();
        return {
          name: dirName,
          path: path
        };
      });
      
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

  formatNumber(num) {
    if (num >= 10000) {
      return Math.round(num / 1000) + 'k';
    }
    return Math.round(num).toString();
  }
  
  formatDuration(milliseconds) {
    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`;
    }
    const seconds = milliseconds / 1000;
    if (seconds < 60) {
      return `${Math.round(seconds * 10) / 10}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  calculateEstimatedCost(usage) {
    // Based on research: cache reads ~0.1x, cache creation ~1.25x, regular input 1x, output ~3x
    const inputCost = (usage.input_tokens || 0) * 1.0;
    const cacheReadCost = (usage.cache_read_input_tokens || 0) * 0.1;
    const cacheCreationCost = (usage.cache_creation_input_tokens || 0) * 1.25;
    const outputCost = (usage.output_tokens || 0) * 3.0;
    
    return inputCost + cacheReadCost + cacheCreationCost + outputCost;
  }

  async discoverSessions() {
    // Build find command based on selected project
    let command;
    
    console.log("discoverSessions: _currentProject =", this._currentProject);
    
    if (this._currentProject && this._currentProject.trim() !== '') {
      // Filter to specific project - show all .jsonl files in that project
      console.log("Searching in specific project:", this._currentProject);
      command = `find ~/.claude/projects/${this._currentProject} -type f -name '*.jsonl' -printf '%TY-%Tm-%TdT%TH:%TM:%TS\t%s\t%p\n' | sort -r`;
    } else {
      // Show all projects - original pattern for lively4-core compatibility
      console.log("Searching in all lively4-core projects");
      command = `find ~/.claude/projects -type f -name '*.jsonl' -path '*-lively4-core/*' -printf '%TY-%Tm-%TdT%TH:%TM:%TS\t%s\t%p\n' | sort -r`;
    }
    
    console.log("Find command:", command);
    
    const result = await this.terminal.run(command);
    
    if (result.error) {
      throw new Error(result.stderr || result.error.message);
    }
    
    const sessionFiles = result.stdout.trim().split('\n').filter(line => line.trim()).map(ea => {
      var parts = ea.split("\t");
      const path = parts[2];
      const fileName = path.split('/').pop();
      const sessionId = fileName.replace('.jsonl', '');
      
      return {
        modified: parts[0], 
        sizeBytes: parseInt(parts[1]) || 0, 
        path: path,
        sessionId: sessionId
      };
    });
    
    return sessionFiles;
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
    // Read the JSONL file content
    const command = `cat "${sessionFile.path}"`;
    const result = await this.terminal.run(command);
    
    if (result.error) {
      throw new Error(result.stderr || result.error.message);
    }
    
    // Parse JSONL content (each line is a separate JSON object)
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());
    const messages = [];
    
    for (let i = 0; i < lines.length; i++) {
      try {
        const message = JSON.parse(lines[i]);
        messages.push(message);
      } catch (parseError) {
        console.warn(`Failed to parse line ${i + 1}:`, parseError, lines[i]);
      }
    }
    
    // Process session data
    const sessionData = this.processSessionData(sessionFile, messages);
    
    // Filter out sessions with no token statistics or very short sessions
    if (sessionData.messagesWithTokens === 0 || sessionData.messagesWithTokens < 2) {
      return null; // Skip sessions without meaningful token data
    }
    
    return sessionData;
  }

  processSessionData(sessionFile, messages) {
    const costProgression = [];
    let totalCost = 0;
    let messageIndex = 1;
    
    // Find date range
    const timestamps = messages
      .map(m => m.timestamp)
      .filter(t => t)
      .sort();
    
    const dateRange = {
      start: timestamps.length > 0 ? new Date(timestamps[0]) : null,
      end: timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]) : null
    };
    
    // Calculate thinking time first and store per message
    const messageThinkingTimes = new Map(); // messageIndex -> thinking time in ms
    
    for (let i = 1; i < messages.length; i++) {
      const currentMsg = messages[i];
      const prevMsg = messages[i - 1];
      
      if (currentMsg.timestamp && prevMsg.timestamp && currentMsg.message?.usage) {
        const prevRole = prevMsg.message?.role || prevMsg.role;
        const currentRole = currentMsg.message?.role || currentMsg.role;
        
        if (prevRole === 'user' && currentRole === 'assistant') {
          const thinkingDuration = new Date(currentMsg.timestamp) - new Date(prevMsg.timestamp);
          if (thinkingDuration > 0 && thinkingDuration < 300000) {
            messageThinkingTimes.set(i, thinkingDuration);
          }
        }
      }
    }
    
    // Process each message for cost analysis
    messages.forEach((sessionEntry, index) => {
      const message = sessionEntry.message || sessionEntry;
      
      if (message.usage) {
        const usage = message.usage;
        const messageCost = this.calculateEstimatedCost(usage);
        
        const costBreakdown = {
          inputCost: (usage.input_tokens || 0) * 1.0,
          outputCost: (usage.output_tokens || 0) * 3.0,
          cacheReadCost: (usage.cache_read_input_tokens || 0) * 0.1,
          cacheWriteCost: (usage.cache_creation_input_tokens || 0) * 1.25
        };
        
        costProgression.push({
          messageIndex: messageIndex++,
          timestamp: sessionEntry.timestamp ? new Date(sessionEntry.timestamp) : null,
          totalCost: messageCost,
          costBreakdown: costBreakdown,
          thinkingTime: messageThinkingTimes.get(index) || 0, // Add thinking time for this message
          tokens: {
            input: usage.input_tokens || 0,
            output: usage.output_tokens || 0,
            cacheRead: usage.cache_read_input_tokens || 0,
            cacheWrite: usage.cache_creation_input_tokens || 0
          }
        });
        
        totalCost += messageCost;
      }
    });
    
    // Calculate total thinking time from stored per-message data
    const totalThinkingTime = costProgression.reduce((sum, msg) => sum + (msg.thinkingTime || 0), 0);
    const thinkingTimeCount = costProgression.filter(msg => msg.thinkingTime > 0).length;
    const avgThinkingTime = thinkingTimeCount > 0 ? totalThinkingTime / thinkingTimeCount : 0;
    
    // Calculate escalation ratio
    const firstQuarter = costProgression.slice(0, Math.max(1, Math.ceil(costProgression.length / 4)));
    const lastQuarter = costProgression.slice(-Math.max(1, Math.ceil(costProgression.length / 4)));
    
    const avgEarly = firstQuarter.reduce((sum, m) => sum + m.totalCost, 0) / firstQuarter.length;
    const avgLate = lastQuarter.reduce((sum, m) => sum + m.totalCost, 0) / lastQuarter.length;
    const escalationRatio = avgEarly > 0 ? avgLate / avgEarly : 1;
    
    return {
      sessionId: sessionFile.sessionId,
      filePath: sessionFile.path,
      dateRange: dateRange,
      messageCount: messages.length,
      messagesWithTokens: costProgression.length,
      totalCost: totalCost,
      avgCost: costProgression.length > 0 ? totalCost / costProgression.length : 0,
      escalationRatio: escalationRatio,
      totalThinkingTime: totalThinkingTime, // Total AI thinking time in milliseconds
      avgThinkingTime: avgThinkingTime, // Average AI thinking time in milliseconds
      thinkingTimeCount: thinkingTimeCount, // Number of AI responses measured
      costProgression: costProgression,
      sizeBytes: sessionFile.sizeBytes
    };
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
      `🤔 ${this.formatDuration(sessionData.totalThinkingTime)}` : 
      `🤔 N/A`;
    
    header.innerHTML = `
      <div class="session-info-left">
        <span class="session-id" title="Full Session ID: ${sessionData.sessionId}">${sessionData.sessionId.substring(0, 8)}...</span>
        <span class="date-range" title="Date range when this session was active">${dateRangeText}</span>
        <span class="message-count" title="Total messages: ${sessionData.messageCount}&#10;Messages with token usage data: ${sessionData.messagesWithTokens}&#10;&#10;Only messages with token data are shown in the cost chart.">${sessionData.messageCount} msgs (${sessionData.messagesWithTokens} w/ tokens)</span>
        <span class="total-cost" title="Total estimated cost for all messages with tokens in this session&#10;Average cost per message: ₹${this.formatNumber(sessionData.avgCost)}&#10;&#10;Cost calculation:&#10;• Input tokens: 1.0× weight&#10;• Output tokens: 3.0× weight&#10;• Cache read: 0.1× weight&#10;• Cache write: 1.25× weight">₹${this.formatNumber(sessionData.totalCost)}</span>
        <span class="thinking-time" title="AI Thinking Time: ${this.formatDuration(sessionData.totalThinkingTime)}&#10;Average per response: ${this.formatDuration(sessionData.avgThinkingTime)}&#10;Responses measured: ${sessionData.thinkingTimeCount}&#10;&#10;Measures time from user message to AI response.&#10;Excludes gaps > 5 minutes (likely human pauses).&#10;Shows actual AI processing time, not human typing time.">${thinkingTimeText}</span>
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
    
    // Chart dimensions
    const barWidth = 10; // Reduced from 20px to 10px for half width
    const barSpacing = 2;  
    const messageCount = sessionData.costProgression.length;
    const margin = { top: 20, right: 40, bottom: 40, left: 60 };
    const height = 250;
    const width = messageCount * (barWidth + barSpacing) + margin.left + margin.right;
    
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
    
    // Create stacked bars
    sessionData.costProgression.forEach((point, index) => {
      const x = margin.left + index * (barWidth + barSpacing);
      let yOffset = 0; // Track cumulative height
      
      stackKeys.forEach(key => {
        const costValue = point.costBreakdown[key]; // Get cost from nested costBreakdown object
        if (costValue > 0) {
          const barHeight = yScale(0) - yScale(costValue);
          const y = yScale(0) - yOffset - barHeight;
          
          chart.append('rect')
            .attr('x', x)
            .attr('y', y)
            .attr('width', barWidth)
            .attr('height', barHeight)
            .attr('fill', colors[key])
            .append('title') // Simple tooltip
            .text(`Message ${index + 1}\n${key.replace('Cost', '')}: ₹${this.formatNumber(costValue)}`);
          
          yOffset += barHeight;
        }
      });
    });
    
    // X-axis
    const xTicks = d3.range(messageCount).filter((d, i) => {
      // Show every 10th tick or first/last for long charts
      return i % 10 === 0 || i === 0 || i === messageCount - 1;
    });
    
    chart.selectAll('.x-tick')
      .data(xTicks)
      .enter()
      .append('text')
      .attr('class', 'x-tick')
      .attr('x', d => margin.left + d * (barWidth + barSpacing) + barWidth / 2)
      .attr('y', height + margin.top + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text(d => d + 1);
    
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
      .text('Message Index');
    
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
    // Check if we have thinking time data
    const hasThinkingData = sessionData.costProgression.some(point => point.thinkingTime > 0);
    if (!hasThinkingData) {
      container.innerHTML = '<div style="padding: 10px; color: #666; text-align: center; font-size: 12px;">No thinking time data available</div>';
      return;
    }
    
    // Chart dimensions (smaller than cost chart)
    const barWidth = 10;
    const barSpacing = 2;  
    const messageCount = sessionData.costProgression.length;
    const margin = { top: 10, right: 40, bottom: 30, left: 60 };
    const height = 80; // Much smaller than cost chart
    const width = messageCount * (barWidth + barSpacing) + margin.left + margin.right;
    
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
    
    // Create thinking time bars
    sessionData.costProgression.forEach((point, index) => {
      if (point.thinkingTime > 0) {
        const x = margin.left + index * (barWidth + barSpacing);
        const barHeight = yScale(0) - yScale(Math.min(point.thinkingTime, maxThinkingTime));
        const y = yScale(Math.min(point.thinkingTime, maxThinkingTime));
        
        chart.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', barWidth)
          .attr('height', barHeight)
          .attr('fill', point.thinkingTime > maxThinkingTime ? '#ff4444' : '#6f42c1') // Red if clipped
          .append('title') // Simple tooltip
          .text(`Message ${index + 1}\nThinking time: ${this.formatDuration(point.thinkingTime)}`);
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
    if (other.terminal) {
      this.terminal = other.terminal;
    }
    
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
    
    // D3 SVG charts are recreated fresh for each render
  }

  livelyExample() {
    // This will be called when the component is opened as an example
    // The component will automatically load available sessions
  }
}