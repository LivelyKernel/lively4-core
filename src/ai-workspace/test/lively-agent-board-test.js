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
      expect(content.textContent).to.include('No TODOs');
    });

    it("should handle null TODO array", () => {
      board.updateTodos(null);
      
      const content = board.get('#content');
      expect(content.textContent).to.include('No TODOs');
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
});
