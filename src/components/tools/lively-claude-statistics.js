import Morph from 'src/components/widgets/lively-morph.js';
import Terminal from 'src/client/terminal.js';
import Chart from 'src/external/chart.js';

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
    
    // Initialize terminal for file operations
    this.terminal = new Terminal({
      url: lively4url,
      cwd: "/lively4-core"
    });
    
    // Initialize data structures
    this._sessionList = this._sessionList || [];
    this._processedSessions = this._processedSessions || new Map();
    this._chartInstances = new Map();
    this._loadingProgress = {
      total: 0,
      loaded: 0,
      currentSession: null
    };
    this._lastRefresh = null;
    
    this.registerButtons();
    
    this.ensureDataAndUpdateView()
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
    await this.refresh();
  }

  async onExportButton() {
    await this.exportData();
  }

  formatNumber(num) {
    if (num >= 10000) {
      return Math.round(num / 1000) + 'k';
    }
    return Math.round(num).toString();
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
    // Reuse session discovery logic from lively-claude-session
    const command = `find ~/.claude/projects -type f -name '*.jsonl' -path '*-lively4-core/*' -printf '%TY-%Tm-%TdT%TH:%TM:%TS\t%s\t%p\n' | sort -r`;
    
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
        this.showError("No Claude session files found in ~/.claude/projects/*lively4-core/");
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
        
        // Cache the processed data
        this._processedSessions.set(sessionFile.path, sessionData);
        
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
    return this.processSessionData(sessionFile, messages);
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
    
    // Process each message for cost analysis
    messages.forEach((sessionEntry) => {
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
      costProgression: costProgression,
      sizeBytes: sessionFile.sizeBytes
    };
  }

  renderAllSessions() {
    this.sessionList.innerHTML = '';
    this._processedSessions.forEach((sessionData) => {
      this.renderSessionItem(sessionData);
    });
  }

  renderSessionItem(sessionData) {
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
    
    header.innerHTML = `
      <span class="session-id" title="${sessionData.sessionId}">${sessionData.sessionId.substring(0, 8)}...</span>
      <span class="date-range">${dateRangeText}</span>
      <span class="message-count">${sessionData.messageCount} msgs (${sessionData.messagesWithTokens} w/ tokens)</span>
      <span class="total-cost">₹${this.formatNumber(sessionData.totalCost)}</span>
      <span class="escalation-indicator" title="Cost escalation ratio">${escalationText}</span>
    `;
    
    sessionDiv.appendChild(header);
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    
    const canvas = document.createElement('canvas');
    canvas.className = 'session-chart';
    canvas.height = 200;
    
    chartContainer.appendChild(canvas);
    sessionDiv.appendChild(chartContainer);
    
    // Add to session list
    this.sessionList.appendChild(sessionDiv);
    
    // Create chart
    this.createSessionChart(canvas, sessionData);
  }

  createSessionChart(canvas, sessionData) {
    const ctx = canvas.getContext('2d');
    
    if (sessionData.costProgression.length === 0) {
      // No token data available
      ctx.fillText('No token usage data available', 10, 50);
      return;
    }
    
    // Calculate required canvas width based on message count
    // 10px per bar + padding
    const barWidth = 10;
    const messageCount = sessionData.costProgression.length;
    const requiredWidth = messageCount * barWidth + 100; // +100 for axis labels and padding
    
    // Set canvas width dynamically
    const chartContainer = canvas.parentElement;
    if (requiredWidth > chartContainer.offsetWidth) {
      chartContainer.style.overflowX = 'auto';
      canvas.width = requiredWidth;
      canvas.style.width = requiredWidth + 'px';
      canvas.style.minWidth = requiredWidth + 'px';
    }
    
    // Prepare chart data
    const chartData = this.prepareChartData(sessionData);
    
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Input Cost',
            data: chartData.inputCosts,
            backgroundColor: '#2196f3',
            stack: 'cost',
            barThickness: barWidth
          },
          {
            label: 'Output Cost', 
            data: chartData.outputCosts,
            backgroundColor: '#4caf50',
            stack: 'cost',
            barThickness: barWidth
          },
          {
            label: 'Cache Read Cost',
            data: chartData.cacheReadCosts,
            backgroundColor: '#8d6e63',
            stack: 'cost',
            barThickness: barWidth
          },
          {
            label: 'Cache Write Cost',
            data: chartData.cacheWriteCosts,
            backgroundColor: '#424242',
            stack: 'cost',
            barThickness: barWidth
          }
        ]
      },
      options: {
        responsive: false, // Disable responsive to control width manually
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { 
              display: true, 
              text: 'Message Index'
            },
            stacked: true,
            grid: {
              display: true
            }
          },
          y: {
            title: { 
              display: true, 
              text: 'Cost (₹)' 
            },
            stacked: true,
            beginAtZero: true
          }
        },
        plugins: {
          legend: { 
            display: false 
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (items) => `Message ${items[0].label}`,
              label: (item) => `${item.dataset.label}: ₹${this.formatNumber(item.raw)}`,
              footer: (items) => {
                const total = items.reduce((sum, item) => sum + item.raw, 0);
                return `Total: ₹${this.formatNumber(total)}`;
              }
            }
          }
        },
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10
          }
        }
      }
    });
    
    // Cache the chart instance
    this._chartInstances.set(sessionData.sessionId, chart);
    
    return chart;
  }

  prepareChartData(sessionData) {
    const progression = sessionData.costProgression;
    
    return {
      labels: progression.map(m => m.messageIndex),
      inputCosts: progression.map(m => m.costBreakdown.inputCost),
      outputCosts: progression.map(m => m.costBreakdown.outputCost),
      cacheReadCosts: progression.map(m => m.costBreakdown.cacheReadCost),
      cacheWriteCosts: progression.map(m => m.costBreakdown.cacheWriteCost)
    };
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    this._chartInstances.clear();
    this._sessionList = [];
    
    await this.loadAllSessions();
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
    
    // Don't copy chart instances as they need to be recreated for the new DOM
    // Chart.js instances are tied to specific canvas elements
    // this._chartInstances will be populated when renderAllSessions() runs
  }

  livelyExample() {
    // This will be called when the component is opened as an example
    // The component will automatically load available sessions
  }
}