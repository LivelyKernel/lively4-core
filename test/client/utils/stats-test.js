import { expect } from 'https://esm.sh/chai@5.1.2';
import { analyzeJSONL, generateStatsTree } from 'src/client/utils/stats.js';

describe('JSONL Stats Analyzer', function() {

  describe('Basic Type Tracking', function() {
    it('should track string statistics', function() {
      const jsonl = JSON.stringify({ message: "hello" }) + '\n' +
                   JSON.stringify({ message: "world!" });

      const stats = analyzeJSONL(jsonl);

      expect(stats.message._count).to.equal(2);
      expect(stats.message._types.string).to.equal(2);
      expect(stats.message._sum).to.equal(11); // "hello" (5) + "world!" (6)
      expect(stats.message._min).to.equal(5);
      expect(stats.message._max).to.equal(6);
      expect(stats.message._avg).to.equal(5.5);
    });

    it('should track number statistics', function() {
      const jsonl = JSON.stringify({ count: 10 }) + '\n' +
                   JSON.stringify({ count: 20 }) + '\n' +
                   JSON.stringify({ count: 15 });

      const stats = analyzeJSONL(jsonl);

      expect(stats.count._count).to.equal(3);
      expect(stats.count._types.number).to.equal(3);
      expect(stats.count._sum).to.equal(45);
      expect(stats.count._min).to.equal(10);
      expect(stats.count._max).to.equal(20);
      expect(stats.count._avg).to.equal(15);
    });
  });

  describe('Array Statistics', function() {
    it('should track array length statistics', function() {
      const jsonl = JSON.stringify({ tags: ["a", "b"] }) + '\n' +
                   JSON.stringify({ tags: ["x", "y", "z"] });

      const stats = analyzeJSONL(jsonl);

      expect(stats.tags._count).to.equal(2);
      expect(stats.tags._types.array).to.equal(2);
      expect(stats.tags._arrayLength._sum).to.equal(5); // 2 + 3
      expect(stats.tags._arrayLength._min).to.equal(2);
      expect(stats.tags._arrayLength._max).to.equal(3);
      expect(stats.tags._arrayLength._avg).to.equal(2.5);
    });

    it('should track content size for arrays with strings', function() {
      const jsonl = JSON.stringify({
        messages: ["short", "a very long message here"]
      }) + '\n' + JSON.stringify({
        messages: ["x"]
      });

      const stats = analyzeJSONL(jsonl);

      expect(stats.messages._arrayContentSize).to.exist;
      expect(stats.messages._arrayContentSize._sum).to.equal(30); // (5+24) + 1
      expect(stats.messages._arrayContentSize._min).to.equal(1);
      expect(stats.messages._arrayContentSize._max).to.equal(29);
    });

    it('should track content size for arrays with huge strings', function() {
      const hugeString = 'x'.repeat(10000);
      const jsonl = JSON.stringify({
        system: ["small", hugeString]
      });

      const stats = analyzeJSONL(jsonl);

      expect(stats.system._arrayLength._sum).to.equal(2);
      expect(stats.system._arrayContentSize._sum).to.equal(10005); // 5 + 10000
      expect(stats.system._arrayContentSize._max).to.equal(10005);
    });

    it('should handle arrays with mixed types', function() {
      const jsonl = JSON.stringify({
        mixed: ["string", 123, true, null]
      });

      const stats = analyzeJSONL(jsonl);

      expect(stats.mixed._arrayLength._sum).to.equal(4);
      expect(stats.mixed._arrayContentSize._sum).to.be.greaterThan(0);
      // "string" (6) + "123" (3) + "true" (4) + "null" (4) = 17
      expect(stats.mixed._arrayContentSize._sum).to.equal(17);
    });

    it('should handle nested arrays', function() {
      const jsonl = JSON.stringify({
        nested: [["a", "b"], ["x"]]
      });

      const stats = analyzeJSONL(jsonl);

      expect(stats.nested._arrayLength._sum).to.equal(2);
      expect(stats.nested._arrayContentSize).to.exist;
      // [["a","b"],["x"]] -> inner arrays contribute their content
      expect(stats.nested._arrayContentSize._sum).to.be.greaterThan(0);
    });
  });

  describe('Real-world AI Workspace Scenario', function() {
    it('should properly track system prompts with huge strings', function() {
      // Simulate Claude API message format with large system array
      const systemPrompt1 = 'You are a helpful assistant. ' + 'x'.repeat(5000);
      const systemPrompt2 = 'Additional context. ' + 'y'.repeat(3000);

      const jsonl = JSON.stringify({
        type: "message.updated",
        data: {
          info: {
            system: [
              { type: "text", text: systemPrompt1 },
              { type: "text", text: systemPrompt2 }
            ]
          }
        }
      });

      const stats = analyzeJSONL(jsonl);

      // Navigate to the system array stats
      const systemStats = stats.data.info.system;

      expect(systemStats._arrayLength._sum).to.equal(2);
      expect(systemStats._arrayContentSize).to.exist;
      // Should account for the large strings inside the objects
      expect(systemStats._arrayContentSize._sum).to.be.greaterThan(8000);
    });
  });

  describe('Edge Cases', function() {
    it('should handle empty arrays', function() {
      const jsonl = JSON.stringify({ items: [] });

      const stats = analyzeJSONL(jsonl);

      expect(stats.items._arrayLength._sum).to.equal(0);
      expect(stats.items._arrayContentSize._sum).to.equal(0);
    });

    it('should handle arrays with objects containing circular references gracefully', function() {
      // Note: JSON.stringify will fail on circular refs, so this simulates
      // the graceful handling in calculateContentSize
      const jsonl = JSON.stringify({
        items: [{ a: 1, b: "test" }]
      });

      const stats = analyzeJSONL(jsonl);

      expect(stats.items._arrayContentSize).to.exist;
      expect(stats.items._arrayContentSize._sum).to.be.greaterThan(0);
    });
  });

  describe('ASCII Tree Visualization', function() {
    it('should generate basic tree structure', function() {
      const jsonl = JSON.stringify({
        user: { name: "Alice", email: "alice@example.com" }
      }) + '\n' + JSON.stringify({
        user: { name: "Bob", email: "bob@example.com" }
      });

      const stats = analyzeJSONL(jsonl);
      const tree = generateStatsTree(stats, 0); // No cutoff for testing

      expect(tree).to.be.a('string');
      expect(tree).to.include('Total Size:');
      expect(tree).to.include('user');
      expect(tree).to.include('name');
      expect(tree).to.include('email');
    });

    it('should show sizes and percentages', function() {
      const jsonl = JSON.stringify({
        message: "hello world"
      });

      const stats = analyzeJSONL(jsonl);
      const tree = generateStatsTree(stats, 0);

      expect(tree).to.match(/\d+\.\d+%/); // Should have percentages
      expect(tree).to.match(/\d+ B/); // Should have byte sizes
    });

    it('should filter nodes below cutoff percentage', function() {
      const largeString = 'x'.repeat(1000);
      const smallString = 'y';

      const jsonl = JSON.stringify({
        large: largeString,
        small: smallString
      });

      const stats = analyzeJSONL(jsonl);
      const tree = generateStatsTree(stats, 10); // 10% cutoff

      expect(tree).to.include('large');
      expect(tree).not.to.include('small'); // Should be filtered out
    });

    it('should sort children by size descending', function() {
      const jsonl = JSON.stringify({
        small: "hi",
        large: "this is a much longer string",
        medium: "medium length"
      });

      const stats = analyzeJSONL(jsonl);
      const tree = generateStatsTree(stats, 0);

      const lines = tree.split('\n');
      const fieldLines = lines.filter(l => l.includes('──'));

      // Extract field names in order
      const names = fieldLines.map(l => {
        const match = l.match(/──\s+(\w+)/);
        return match ? match[1] : null;
      }).filter(n => n);

      expect(names[0]).to.equal('large');
      expect(names[1]).to.equal('medium');
      expect(names[2]).to.equal('small');
    });

    it('should show node information', function() {
      const jsonl = JSON.stringify({
        tags: ["a", "b", "c"]
      }) + '\n' + JSON.stringify({
        tags: ["x", "y"]
      });

      const stats = analyzeJSONL(jsonl);
      const tree = generateStatsTree(stats, 0);

      expect(tree).to.match(/n=\d+/); // Should show count
      expect(tree).to.match(/types=/); // Should show types
    });

    it('should handle nested structures', function() {
      const jsonl = JSON.stringify({
        data: {
          info: {
            system: ["prompt1", "prompt2"]
          }
        }
      });

      const stats = analyzeJSONL(jsonl);
      const tree = generateStatsTree(stats, 0);

      expect(tree).to.include('data');
      expect(tree).to.include('info');
      expect(tree).to.include('system');

      // Check for proper tree connectors
      expect(tree).to.match(/└──|├──/); // Should have connectors
    });

    it('should accumulate sizes from children', function() {
      const jsonl = JSON.stringify({
        parent: {
          child1: "small",
          child2: "medium size",
          child3: "this is a much larger string"
        }
      });

      const stats = analyzeJSONL(jsonl);
      const tree = generateStatsTree(stats, 0);

      const lines = tree.split('\n');
      const parentLine = lines.find(l => l.includes('parent'));
      const child3Line = lines.find(l => l.includes('child3'));

      // Extract sizes
      const extractSize = (line) => {
        const match = line.match(/(\d+) B/);
        return match ? parseInt(match[1]) : 0;
      };

      const parentSize = extractSize(parentLine);
      const child3Size = extractSize(child3Line);

      // Parent should include all children's sizes
      expect(parentSize).to.be.greaterThan(child3Size);
      expect(parentSize).to.equal(5 + 11 + 28); // "small" + "medium size" + "this is a much larger string"
    });
  });
});
