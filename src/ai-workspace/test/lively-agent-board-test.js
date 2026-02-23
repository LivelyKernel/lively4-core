import { expect } from 'src/external/chai.js';
import { testWorld, loadComponent } from 'test/templates/templates-fixture.js';

describe("Lively Agent Board", function() {
  
  let board;
  
  beforeEach(async () => {
    board = await lively.create("lively-agent-board");
    document.body.appendChild(board);
  });
  
  afterEach(() => {
    if (board && board.parentNode) {
      board.parentNode.removeChild(board);
    }
  });

  describe("Component Creation", () => {
    it("should create the component", () => {
      expect(board).to.exist;
      expect(board.tagName.toLowerCase()).to.equal('lively-agent-board');
    });

    it("should have content div", () => {
      const content = board.get('#content');
      expect(content).to.exist;
    });

    it("should show empty message when no TODOs", () => {
      const content = board.get('#content');
      expect(content.textContent).to.include('No data to display');
    });
  });

  describe("TODO Display", () => {
    it("should display TODOs grouped by status", () => {
      const todos = [
        { content: "Task 1", status: "in_progress", priority: "high" },
        { content: "Task 2", status: "pending", priority: "medium" },
        { content: "Task 3", status: "completed", priority: "low" }
      ];
      
      board.updateTodos(todos);
      
      const content = board.get('#content');
      expect(content.textContent).to.include('In Progress');
      expect(content.textContent).to.include('Pending');
      expect(content.textContent).to.include('Completed');
      expect(content.textContent).to.include('Task 1');
      expect(content.textContent).to.include('Task 2');
      expect(content.textContent).to.include('Task 3');
    });

    it("should show priority classes", () => {
      const todos = [
        { content: "High priority", status: "pending", priority: "high" },
        { content: "Medium priority", status: "pending", priority: "medium" },
        { content: "Low priority", status: "pending", priority: "low" }
      ];
      
      board.updateTodos(todos);
      
      const content = board.get('#content');
      const highPriorityItem = content.querySelector('.priority-high');
      const mediumPriorityItem = content.querySelector('.priority-medium');
      const lowPriorityItem = content.querySelector('.priority-low');
      
      expect(highPriorityItem).to.exist;
      expect(mediumPriorityItem).to.exist;
      expect(lowPriorityItem).to.exist;
    });

    it("should show correct status icons", () => {
      const todos = [
        { content: "In progress task", status: "in_progress", priority: "high" },
        { content: "Pending task", status: "pending", priority: "medium" },
        { content: "Completed task", status: "completed", priority: "low" },
        { content: "Cancelled task", status: "cancelled", priority: "low" }
      ];
      
      board.updateTodos(todos);
      
      const content = board.get('#content');
      const html = content.innerHTML;
      
      expect(html).to.include('⊙'); // in_progress icon
      expect(html).to.include('☐'); // pending icon
      expect(html).to.include('✓'); // completed icon
      expect(html).to.include('✗'); // cancelled icon
    });

    it("should handle empty TODO array", () => {
      board.updateTodos([]);
      
      const content = board.get('#content');
      expect(content.textContent).to.include('No data to display');
    });

    it("should handle null TODO array", () => {
      board.updateTodos(null);
      
      const content = board.get('#content');
      expect(content.textContent).to.include('No data to display');
    });
  });

  describe("Example", () => {
    it("should provide livelyExample", () => {
      board.livelyExample();
      
      const content = board.get('#content');
      expect(content.textContent).to.include('In Progress');
      expect(content.textContent).to.include('Implement feature X');
    });
  });

  describe("Path Shortening", () => {
    it("should shorten path by removing working directory", () => {
      board.setContext({
        workingDirectory: '/home/jens/lively4/lively4-core',
        projectPath: null,
        urlBase: 'http://localhost:9005/lively4-core'
      });

      const path = '/home/jens/lively4/lively4-core/src/components/file.js';
      const shortened = board.shortenPath(path);
      
      expect(shortened).to.equal('src/components/file.js');
    });

    it("should shorten path by removing working directory and project path", () => {
      board.setContext({
        workingDirectory: '/home/jens/lively4/lively4-core',
        projectPath: 'src/ai-workspace',
        urlBase: 'http://localhost:9005/lively4-core'
      });

      const path = '/home/jens/lively4/lively4-core/src/ai-workspace/components/file.js';
      const shortened = board.shortenPath(path);
      
      expect(shortened).to.equal('components/file.js');
    });

    it("should return original path when no context set", () => {
      const path = '/absolute/path/to/file.js';
      const shortened = board.shortenPath(path);
      
      expect(shortened).to.equal(path);
    });

    it("should handle paths that don't match working directory", () => {
      board.setContext({
        workingDirectory: '/home/jens/lively4/lively4-core',
        projectPath: null,
        urlBase: 'http://localhost:9005/lively4-core'
      });

      const path = '/different/path/to/file.js';
      const shortened = board.shortenPath(path);
      
      expect(shortened).to.equal(path);
    });
  });

  describe("URL Building", () => {
    it("should build full URL from file path", () => {
      board.setContext({
        workingDirectory: '/home/jens/lively4/lively4-core',
        projectPath: null,
        urlBase: 'http://localhost:9005/lively4-core'
      });

      const path = '/home/jens/lively4/lively4-core/src/components/file.js';
      const url = board.buildFileUrl(path);
      
      expect(url).to.equal('http://localhost:9005/lively4-core/src/components/file.js');
    });

    it("should handle URL base without trailing slash", () => {
      board.setContext({
        workingDirectory: '/home/jens/lively4/lively4-core',
        projectPath: null,
        urlBase: 'http://localhost:9005/lively4-core'
      });

      const path = '/home/jens/lively4/lively4-core/test/file.js';
      const url = board.buildFileUrl(path);
      
      expect(url).to.equal('http://localhost:9005/lively4-core/test/file.js');
    });

    it("should return original path when no context set", () => {
      const path = '/absolute/path/to/file.js';
      const url = board.buildFileUrl(path);
      
      expect(url).to.equal(path);
    });
  });

  describe("File Links", () => {
    it("should add file read links", () => {
      board.addFileRead('/path/to/file1.js');
      board.addFileRead('/path/to/file2.js');
      
      expect(board.links.filesRead).to.have.length(2);
      expect(board.links.filesRead).to.include('/path/to/file1.js');
      expect(board.links.filesRead).to.include('/path/to/file2.js');
    });

    it("should add file written links", () => {
      board.addFileWritten('/path/to/output1.js');
      board.addFileWritten('/path/to/output2.js');
      
      expect(board.links.filesWritten).to.have.length(2);
      expect(board.links.filesWritten).to.include('/path/to/output1.js');
      expect(board.links.filesWritten).to.include('/path/to/output2.js');
    });

    it("should not add duplicate file reads", () => {
      board.addFileRead('/path/to/file.js');
      board.addFileRead('/path/to/file.js');
      
      expect(board.links.filesRead).to.have.length(1);
    });

    it("should not add duplicate file writes", () => {
      board.addFileWritten('/path/to/file.js');
      board.addFileWritten('/path/to/file.js');
      
      expect(board.links.filesWritten).to.have.length(1);
    });

    it("should clear file links", () => {
      board.addFileRead('/path/to/file1.js');
      board.addFileWritten('/path/to/file2.js');
      
      board.clearFileLinks();
      
      expect(board.links.filesRead).to.be.empty;
      expect(board.links.filesWritten).to.be.empty;
    });

    it("should clear all data", () => {
      board.addFileRead('/path/to/file1.js');
      board.addFileWritten('/path/to/file2.js');
      board.setProjectFocus('src/ai-workspace/index.md');
      board.updateTodos([{ content: 'Test', status: 'pending', priority: 'high' }]);
      
      board.clearAll();
      
      expect(board.links.filesRead).to.be.empty;
      expect(board.links.filesWritten).to.be.empty;
      expect(board.links.projectFocus).to.be.null;
      expect(board.todos).to.be.empty;
    });
  });

  describe("File Operation Counts", () => {
    it("should count file reads", () => {
      board.addFileRead('/path/to/file.js');
      board.addFileRead('/path/to/file.js');
      board.addFileRead('/path/to/file.js');
      
      expect(board.fileReadCounts.get('/path/to/file.js')).to.equal(3);
      expect(board.links.filesRead).to.have.length(1); // Still only one unique file
    });

    it("should count file writes", () => {
      board.addFileWritten('/path/to/file.js');
      board.addFileWritten('/path/to/file.js');
      
      expect(board.fileWriteCounts.get('/path/to/file.js')).to.equal(2);
      expect(board.links.filesWritten).to.have.length(1);
    });

    it("should track counts for multiple files", () => {
      board.addFileRead('/path/to/file1.js');
      board.addFileRead('/path/to/file1.js');
      board.addFileRead('/path/to/file2.js');
      
      expect(board.fileReadCounts.get('/path/to/file1.js')).to.equal(2);
      expect(board.fileReadCounts.get('/path/to/file2.js')).to.equal(1);
    });

    it("should clear file counts when clearing file links", () => {
      board.addFileRead('/path/to/file.js');
      board.addFileRead('/path/to/file.js');
      board.addFileWritten('/path/to/file.js');
      
      board.clearFileLinks();
      
      expect(board.fileReadCounts.size).to.equal(0);
      expect(board.fileWriteCounts.size).to.equal(0);
    });
  });

  describe("Tool Usage Tracking", () => {
    it("should track tool usages", () => {
      board.addToolUsage('mcp_read');
      board.addToolUsage('mcp_write');
      board.addToolUsage('mcp_read');
      
      expect(board.toolUsages.get('mcp_read')).to.equal(2);
      expect(board.toolUsages.get('mcp_write')).to.equal(1);
    });

    it("should calculate total tool usages", () => {
      board.addToolUsage('mcp_read');
      board.addToolUsage('mcp_read');
      board.addToolUsage('mcp_write');
      board.addToolUsage('mcp_bash');
      
      expect(board.getTotalToolUsages()).to.equal(4);
    });

    it("should clear tool usages", () => {
      board.addToolUsage('mcp_read');
      board.addToolUsage('mcp_write');
      
      board.clearToolUsages();
      
      expect(board.toolUsages.size).to.equal(0);
      expect(board.getTotalToolUsages()).to.equal(0);
    });

    it("should clear tool usages when clearing all", () => {
      board.addToolUsage('mcp_read');
      board.addToolUsage('mcp_write');
      
      board.clearAll();
      
      expect(board.toolUsages.size).to.equal(0);
    });

    it("should handle multiple tool types", () => {
      const tools = ['mcp_read', 'mcp_write', 'mcp_edit', 'mcp_bash', 'mcp_glob', 'mcp_grep'];
      tools.forEach(tool => {
        board.addToolUsage(tool);
        board.addToolUsage(tool);
      });
      
      expect(board.toolUsages.size).to.equal(6);
      expect(board.getTotalToolUsages()).to.equal(12);
    });
  });

  describe("Statistics Section Rendering", () => {
    it("should render tool usage statistics", () => {
      board.addToolUsage('mcp_read');
      board.addToolUsage('mcp_read');
      board.addToolUsage('mcp_write');
      
      board.render();
      
      const content = board.get('#content');
      const statsSection = content.querySelector('.stats-section');
      
      expect(statsSection).to.exist;
      expect(statsSection.textContent).to.include('Tool Usage');
      expect(statsSection.textContent).to.include('mcp_read');
      expect(statsSection.textContent).to.include('mcp_write');
    });

    it("should show total tool usage count", () => {
      board.addToolUsage('mcp_read');
      board.addToolUsage('mcp_read');
      board.addToolUsage('mcp_write');
      
      board.render();
      
      const content = board.get('#content');
      expect(content.textContent).to.include('Total: 3');
    });

    it("should render file operation summary", () => {
      board.addFileRead('/path/to/file1.js');
      board.addFileRead('/path/to/file1.js');
      board.addFileRead('/path/to/file2.js');
      board.addFileWritten('/path/to/file3.js');
      
      board.render();
      
      const content = board.get('#content');
      const statsSection = content.querySelector('.stats-section');
      
      expect(statsSection).to.exist;
      expect(statsSection.textContent).to.include('File Operations');
      expect(statsSection.textContent).to.include('Total Reads');
      expect(statsSection.textContent).to.include('3'); // 3 total reads
      expect(statsSection.textContent).to.include('2 files'); // 2 unique files read
      expect(statsSection.textContent).to.include('Total Writes');
      expect(statsSection.textContent).to.include('1'); // 1 total write
    });

    it("should not render stats section when no stats", () => {
      board.render();
      
      const content = board.get('#content');
      const statsSection = content.querySelector('.stats-section');
      
      expect(statsSection).to.not.exist;
    });
  });
});
