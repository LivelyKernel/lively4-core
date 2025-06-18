import { expect } from 'src/external/chai.js';
import { pt, rect } from 'src/client/graphics.js';

import { MockEvent, createHTML, testWorld, loadComponent } from 'test/templates/templates-fixture.js';

var oldDocking

describe('LivelyWindowDocking', () => {
  let docking;
  let windowMap;

  before(() => {
    oldDocking = lively.windowDocking;
  })

  after(() => {
    lively.windowDocking = oldDocking
  })

  async function createDocking() {
    docking = await loadComponent('lively-window-docking');
    return docking;
  }

  beforeEach(async () => {
    docking = await createDocking();
    // Set fixed dimensions for predictable testing
    docking.setFixedDimensions(2000, 1000);
  });

  afterEach(() => {
    testWorld().innerHTML = "";
  });

  // Helper functions for JSON-based scenario testing
  async function createWindowsFromTree(treeSpec) {
    if (!treeSpec) return null;

    if (treeSpec.windowTitle || treeSpec.windowId !== undefined) {
      // This is a leaf node that should contain a window
      if (treeSpec.windowTitle) {
        const win = await loadComponent('lively-window');
        win.title = treeSpec.windowTitle;
        win.appendChild(<div>{treeSpec.windowTitle}</div>);
        windowMap.set(treeSpec.windowTitle, win);
        return { window: win };
      } else {
        // Empty slot
        return { window: null };
      }
    }

    if (treeSpec.split) {
      // This is a split node
      const aNode = await createWindowsFromTree(treeSpec.split.a);
      const bNode = await createWindowsFromTree(treeSpec.split.b);

      return {
        split: {
          dir: treeSpec.split.dir,
          pos: treeSpec.split.pos,
          a: aNode,
          b: bNode
        }
      };
    }

    return { window: null };
  }

  async function applyTreeToDocking(treeSpec) {
    windowMap = new Map()

    const tree = await createWindowsFromTree(treeSpec);

    if (tree) {
      docking.dockingTree = tree;
      docking.buildParentMap();
      docking.resizeWindowsInSlot(docking.dockingTree, rect(0, 0, 1, 1));
    }
  }

  function validateTreeStructure(actualTree, expectedSpec) {
    if (!expectedSpec) {
      expect(actualTree).to.be.null;
      return;
    }

    if (expectedSpec.windowTitle) {
      expect(actualTree.window).to.exist;
      expect(actualTree.window.title).to.equal(expectedSpec.windowTitle);
      return;
    }

    if (expectedSpec.windowId === null) {
      expect(actualTree.window).to.be.null;
      return;
    }

    if (expectedSpec.split) {
      expect(actualTree.split).to.exist;
      expect(actualTree.split.dir).to.equal(expectedSpec.split.dir);
      expect(actualTree.split.pos).to.be.closeTo(expectedSpec.split.pos, 0.01);

      validateTreeStructure(actualTree.split.a, expectedSpec.split.a);
      validateTreeStructure(actualTree.split.b, expectedSpec.split.b);
    }
  }

  function testResize(windowName, deltaPos, deltaExtent) {
    const window = win(windowName);
    if (!window) {
      throw new Error(`Window "${windowName}" not found in windowMap`);
    }

    // Get current position and size using helper functions
    const currentPos = pos(windowName);
    const currentSize = size(windowName);

    // Calculate new position and size (convert deltaPos and deltaExtent to Points if needed)
    const deltaPosPoint = lively.pt(deltaPos.x, deltaPos.y);
    const deltaExtentPoint = lively.pt(deltaExtent.x, deltaExtent.y);

    const newPos = currentPos.addPt(deltaPosPoint);
    const newSize = currentSize.addPt(deltaExtentPoint);

    // Call the resize method on the docking system (convert Points back to plain objects for the API)
    docking.resizeMySlotEnd(window, { x: newSize.x, y: newSize.y }, { x: currentSize.x, y: currentSize
      .y }, { x: newPos.x, y: newPos.y }, { x: currentPos.x, y: currentPos.y });

    // Get the actual result position and size after the resize operation
    const resultPos = pos(windowName);
    const resultSize = size(windowName);

    return { newPos, newSize, currentPos, currentSize, resultPos, resultSize };
  }

  function pos(windowTitle) {
    return lively.getPosition(win(windowTitle))
  }

  function size(windowTitle) {
    return lively.getExtent(win(windowTitle))
  }

  function win(windowTitle) {
    return windowMap.get(windowTitle)
  }


  describe('initialization', () => {
    it('should initialize with empty docking tree', () => {
      expect(docking.dockingTree).to.deep.equal({ window: null });
    });
  });

  describe('coordinate conversion', () => {
    it('should convert client coordinates to docking coordinates', () => {
      const clientCoords = pt(100, 100);
      const dockingCoords = docking.clientCoordsToDockingCoords(clientCoords);
      expect(dockingCoords.x).to.equal(100 / docking.width);
      expect(dockingCoords.y).to.equal(100 / docking.height);
    });

    it('should convert docking coordinates to client coordinates', () => {
      const dockingCoords = pt(0.5, 0.5);
      const clientCoords = docking.dockingCoordsToClientCoords(dockingCoords);
      expect(clientCoords.x).to.equal(0.5 * docking.width);
      expect(clientCoords.y).to.equal(0.5 * docking.height);
    });
  });

  describe('coordinate conversion with fixed window size', () => {
    it('should correctly convert coordinates with fixed window size', () => {
      const clientCoords = pt(1000, 500);
      const dockingCoords = docking.clientCoordsToDockingCoords(clientCoords);

      // With window size 2000x1000, these should be exactly 0.5
      expect(dockingCoords.x).to.equal(0.5); // 1000/2000
      expect(dockingCoords.y).to.equal(0.5); // 500/1000

      // Convert back to client coordinates
      const backToClientCoords = docking.dockingCoordsToClientCoords(dockingCoords);
      expect(backToClientCoords.x).to.equal(1000);
      expect(backToClientCoords.y).to.equal(500);
    });

    it('should handle coordinates at window boundaries', () => {
      const rightEdge = docking.clientCoordsToDockingCoords(pt(2000, 1000));
      expect(rightEdge.x).to.equal(1);
      expect(rightEdge.y).to.equal(1);

      const leftEdge = docking.clientCoordsToDockingCoords(pt(0, 0));
      expect(leftEdge.x).to.equal(0);
      expect(leftEdge.y).to.equal(0);
    });

  });

  describe('docking tree operations', () => {
    it('should correctly split a window node', async () => {

      const window1 = await loadComponent('lively-window');
      window1.appendChild(<div>Hello</div>)


      const window2 = await loadComponent('lively-window');
      window2.appendChild(<div>World</div>)


      // First dock window1
      docking.currentDockingNode = docking.dockingTree;

      await docking.applyDockingToWindow('center', window1);

      // Then dock window2 to the right
      docking.currentDockingNode = docking.findNodeOfWindow(docking.dockingTree, window1);

      await docking.applyDockingToWindow('right', window2);

      expect(docking.dockingTree.split).to.exist;
      expect(docking.dockingTree.split.dir).to.equal('right');
      expect(docking.dockingTree.split.pos).to.equal(0.5);

      // Check window positions and sizes instead of object references
      const firstWindow = docking.dockingTree.split.a.window;
      const secondWindow = docking.dockingTree.split.b.window;

      expect(firstWindow).to.exist;
      expect(secondWindow).to.exist;

      expect(firstWindow.target.textContent).to.equal('Hello')


      // Both windows should be docked
      expect(firstWindow.classList.contains('docked')).to.be.true;
      expect(secondWindow.classList.contains('docked')).to.be.true;


      // After a right split, second window's left position should be half of the first window's width
      const firstWindowWidth = parseInt(firstWindow.style.width);
      const secondWindowLeft = parseInt(secondWindow.style.left);


      expect(secondWindowLeft).to.equal(firstWindowWidth);
    });

    it('should handle undocking windows', async () => {
      const window1 = await loadComponent('lively-window');

      // First dock the window
      docking.currentDockingNode = docking.dockingTree;
      await docking.applyDockingToWindow('center', window1);

      // Then undock it
      docking.undockMe(window1);

      expect(docking.dockingTree).to.deep.equal({ window: null });
    });

    it('should maintain deeper docked windows when removing a top-level window', async () => {

      const window1 = await loadComponent('lively-window');
      window1.appendChild(<div>Hello</div>)
      const window2 = await loadComponent('lively-window');
      window2.appendChild(<div>World!</div>)
      const window3 = await loadComponent('lively-window');
      window3.appendChild(<div>Foo</div>)

      // First dock window1 at center
      docking.currentDockingNode = docking.dockingTree;
      await docking.applyDockingToWindow('center', window1);

      // Dock window2 to the right of window1
      docking.currentDockingNode = docking.findNodeOfWindow(docking.dockingTree, window1);
      await docking.applyDockingToWindow('right', window2);

      // Dock window3 to the right of window2
      docking.currentDockingNode = docking.findNodeOfWindow(docking.dockingTree, window2);
      await docking.applyDockingToWindow('right', window3);

      // Now remove window1 (top-level)
      docking.undockMe(window1);
      window1.remove()

      // Verify the structure remains intact
      expect(docking.dockingTree.split).to.exist;
      expect(docking.dockingTree.split.dir).to.equal('right');


      // Verify window2 and window3 are still docked
      const firstWindow = docking.dockingTree.split.b.split.a.window;
      const secondWindow = docking.dockingTree.split.b.split.b.window;

      expect(firstWindow).to.equal(window2);
      expect(secondWindow).to.equal(window3);

      // Verify both windows are still marked as docked
      expect(window2.classList.contains('docked')).to.be.true;
      expect(window3.classList.contains('docked')).to.be.true;
    });
  });

  describe('parent map management', () => {
    it('should maintain correct parent references', async () => {

      const window1 = await loadComponent('lively-window');
      const window2 = await loadComponent('lively-window');

      // Dock windows
      docking.currentDockingNode = docking.dockingTree;
      await docking.applyDockingToWindow('center', window1);
      docking.currentDockingNode = docking.findNodeOfWindow(docking.dockingTree, window1);
      await docking.applyDockingToWindow('right', window2);

      // Check parent map
      docking.buildParentMap();
      const firstNode = docking.dockingTree.split.a;
      const secondNode = docking.dockingTree.split.b;

      expect(docking.parentMap.get(firstNode)).to.equal(docking.dockingTree);
      expect(docking.parentMap.get(secondNode)).to.equal(docking.dockingTree);
    });
  });

  describe('docking tree printing', () => {
    it('should print docking tree structure correctly', async () => {
      // Create a simple docking structure for testing
      const win1 = await lively.create("lively-window");
      win1.title = "window1";
      const win2 = await lively.create("lively-window");
      win2.title = "window2";
      const win3 = await lively.create("lively-window");
      win3.title = "window3";

      // Set up a simple tree structure
      docking.currentDockingNode = docking.dockingTree;
      await docking.applyDockingToWindow('center', win1);

      docking.currentDockingNode = docking.findNodeOfWindow(docking.dockingTree, win1);
      await docking.applyDockingToWindow('right', win2);

      docking.currentDockingNode = docking.findNodeOfWindow(docking.dockingTree, win2);
      await docking.applyDockingToWindow('bottom', win3);

      // Get the tree representation
      const treeStr = docking.printDockingTree();

      // Verify the structure contains expected information
      expect(treeStr).to.include("window1");
      expect(treeStr).to.include("window2");
      expect(treeStr).to.include("window3");
      expect(treeStr).to.include("Split: right");
      expect(treeStr).to.include("Split: bottom");
    });
  });

  describe('resizing logic', () => {
    it('updates split.pos when resizing a window vertically (top-bottom split)', async () => {
      const winA = await loadComponent('lively-window');
      winA.title = "A";

      const winB = await loadComponent('lively-window');
      winB.title = "B";

      // Set up initial top-bottom split manually
      docking.dockingTree = {
        split: {
          dir: 'top',
          pos: 0.5,
          a: { window: winA },
          b: { window: winB }
        }
      };
      docking.buildParentMap();

      const oldSize = { x: 2000, y: 500 }; // old height = 500px (50%)
      const newSize = { x: 2000, y: 700 }; // new height = 700px (should become ~70%)
      const oldPos = { x: 0, y: 0 };
      const newPos = { x: 0, y: 0 };

      docking.resizeMySlotEnd(winA, newSize, oldSize, newPos, oldPos);

      const updatedPos = docking.dockingTree.split.pos;
      expect(updatedPos).to.be.closeTo(0.7, 0.01); // Allow small rounding tolerance
    });

    it('updates split.pos when resizing horizontally (left-right split)', async () => {
      const winA = await loadComponent('lively-window');
      winA.title = "A";

      const winB = await loadComponent('lively-window');
      winB.title = "B";

      docking.dockingTree = {
        split: {
          dir: 'left',
          pos: 0.6,
          a: { window: winA },
          b: { window: winB }
        }
      };
      docking.buildParentMap();

      const oldSize = { x: 1200, y: 1000 }; // 60% of 2000
      const newSize = { x: 1000, y: 1000 }; // now 50%
      const oldPos = { x: 0, y: 0 };
      const newPos = { x: 0, y: 0 };

      docking.resizeMySlotEnd(winA, newSize, oldSize, newPos, oldPos);

      const updatedPos = docking.dockingTree.split.pos;
      expect(updatedPos).to.be.closeTo(0.5, 0.01);
    });

    it('resizes B side correctly (bottom)', async () => {
      const winA = await loadComponent('lively-window');
      winA.title = "A";

      const winB = await loadComponent('lively-window');
      winB.title = "B";

      docking.dockingTree = {
        split: {
          dir: 'bottom',
          pos: 0.5,
          a: { window: winA },
          b: { window: winB }
        }
      };
      docking.buildParentMap();

      const oldSize = { x: 2000, y: 500 }; // bottom window
      const newSize = { x: 2000, y: 300 }; // made smaller
      const oldPos = { x: 0, y: 500 };
      const newPos = { x: 0, y: 700 }; // moved down

      docking.resizeMySlotEnd(winB, newSize, oldSize, newPos, oldPos);

      const updatedPos = docking.dockingTree.split.pos;
      expect(updatedPos).to.be.closeTo(0.7, 0.01);
    });
  });

  describe('JSON-based scenario testing', () => {
    it('should create and dock windows from simple JSON structure', async () => {
      const testTree = {
        split: {
          dir: "left",
          pos: 0.5,
          a: { windowTitle: "Left Window" },
          b: { windowTitle: "Right Window" }
        }
      };

      await applyTreeToDocking(testTree);

      // Verify the structure was created correctly
      validateTreeStructure(docking.dockingTree, testTree);

      // Verify windows were created and are docked
      expect(windowMap.has("Left Window"), "Left Window").to.be.true;
      expect(windowMap.has("Right Window")).to.be.true;
      expect(win("Left Window").classList.contains('docked')).to.be.true;
      expect(win("Right Window").classList.contains('docked')).to.be.true;
    });

    it('should create complex nested window structure from your example JSON', async () => {
      const testTree = {
        split: {
          dir: "left",
          pos: 0.2,
          a: {
            split: {
              dir: "top",
              pos: 0.7,
              a: {
                split: {
                  dir: "left",
                  pos: 0.2,
                  a: { windowTitle: "A" },
                  b: { windowTitle: "B" }
                }
              },
              b: {
                split: {
                  dir: "bottom",
                  pos: 0.4,
                  a: { windowId: null },
                  b: { windowTitle: "C" }
                }
              }
            }
          },
          b: {
            split: {
              dir: "right",
              pos: 0.6,
              a: { windowId: null },
              b: { windowTitle: "D" }
            }
          }
        }
      };

      await applyTreeToDocking(testTree);

      // Verify all expected windows were created
      expect(windowMap.has("A")).to.be.true;
      expect(windowMap.has("B")).to.be.true;
      expect(windowMap.has("C")).to.be.true;
      expect(windowMap.has("D")).to.be.true;

      // Verify the structure matches
      validateTreeStructure(docking.dockingTree, testTree);

      // Verify all windows are properly docked
      ["A", "B", "C", "D"].forEach(title => {
        const window = win(title);
        expect(window.classList.contains('docked')).to.be.true;
        expect(window.title).to.equal(title);
      });

      // Verify the tree structure
      const tree = docking.dockingTree;
      expect(tree.split.dir).to.equal("left");
      expect(tree.split.pos).to.be.closeTo(0.2, 0.01);

      // Check nested structure - window A should be deeply nested
      const windowANode = tree.split.a.split.a.split.a;
      expect(windowANode.window.title).to.equal("A");

      // Check window D is in the right position
      const windowDNode = tree.split.b.split.b;
      expect(windowDNode.window.title).to.equal("D");
    });

    it('should handle empty slots in JSON structure', async () => {
      const testTree = {
        split: {
          dir: "top",
          pos: 0.3,
          a: { windowTitle: "Top Window" },
          b: {
            split: {
              dir: "left",
              pos: 0.5,
              a: { windowId: null }, // Empty slot
              b: { windowTitle: "Bottom Right" }
            }
          }
        }
      };

      await applyTreeToDocking(testTree);

      // Verify structure
      validateTreeStructure(docking.dockingTree, testTree);

      // Verify only the non-null windows were created
      expect(windowMap.has("Top Window")).to.be.true;
      expect(windowMap.has("Bottom Right")).to.be.true;
      expect(windowMap.size).to.equal(2);

      // Verify empty slot
      const emptyNode = docking.dockingTree.split.b.split.a;
      expect(emptyNode.window).to.be.null;
    });

    it('should create single window scenario', async () => {
      const testTree = {
        windowTitle: "Single Window"
      };

      await applyTreeToDocking(testTree);

      expect(windowMap.has("Single Window")).to.be.true;
      expect(docking.dockingTree.window).to.exist;
      expect(docking.dockingTree.window.title).to.equal("Single Window");
      expect(docking.dockingTree.split).to.be.undefined;
    });

    it('should create vertical split scenario', async () => {
      const testTree = {
        split: {
          dir: "top",
          pos: 0.3,
          a: { windowTitle: "Top" },
          b: { windowTitle: "Bottom" }
        }
      };

      await applyTreeToDocking(testTree);

      validateTreeStructure(docking.dockingTree, testTree);

      // Verify positioning - top window should be smaller (30%)

      const topSize = size("Top");
      const bottomSize = size("Bottom")
      const topPosition = pos("Top")
      const bottomPosition = pos("Bottom");

      // Top window should be 30% of total height (300px out of 1000px)
      expect(topSize.y).to.be.closeTo(300, 10);

      // Bottom window should be 70% of total height (700px out of 1000px)  
      expect(bottomSize.y).to.be.closeTo(700, 10);

      expect(topPosition.y).to.equal(0);

      // Bottom window should start where top window ends
      expect(bottomPosition.y).to.be.closeTo(topSize.y, 10);

      // Bottom window should be taller than top window
      expect(bottomSize.y).to.be.greaterThan(topPosition.y);
    });

    it('should support different split positions', async () => {
      const positions = [0.1, 0.25, 0.5, 0.75, 0.9];

      for (const pos of positions) {
        const testTree = {
          split: {
            dir: "left",
            pos: pos,
            a: { windowTitle: "Left" },
            b: { windowTitle: "Right" }
          }
        };

        await applyTreeToDocking(testTree);

        expect(docking.dockingTree.split.pos).to.be.closeTo(pos, 0.01);

        // Left window width should be approximately pos * total width
        const expectedLeftWidth = pos * 2000; // 2000 is our fixed width
        expect(parseInt(win("Left").style.width)).to.be.closeTo(expectedLeftWidth, 10);
      }
    });
  });

  describe('window resizing', () => {
    it('should resize window A and update split positions accordingly', async () => {
      const testTree = {
        split: {
          dir: "top",
          pos: 0.4,
          a: { windowTitle: "A" },
          b: { windowTitle: "B" }
        }
      };

      await applyTreeToDocking(testTree);
      expect(docking.dockingTree.split.pos).to.be.closeTo(0.4, 0.01);

      const result = testResize("A", { x: 0, y: 0 }, { x: 0, y: 50 });

      expect(result.newSize.y, "target height").to.equal(result.currentSize.y + 50);

      // The result size should match what the window actually has after layout
      expect(result.resultPos).to.deep.equal(pos("A"));
      expect(result.resultSize).to.deep.equal(size("A"));

      // Split position should be updated based on the resize
      expect(docking.dockingTree.split.pos).to.be.within(0.05, 0.95);

      // Log the differences for debugging using Point methods
      const deltaPos = result.resultPos.subPt(result.newPos);
      const deltaSize = result.resultSize.subPt(result.newSize);

      console.log('Resize result comparison:', {
        intended: { pos: { x: result.newPos.x, y: result.newPos.y }, size: { x: result.newSize.x,
            y: result.newSize.y } },
        actual: { pos: { x: result.resultPos.x, y: result.resultPos.y }, size: { x: result.resultSize
              .x, y: result.resultSize.y } },
        deltaPos: { x: deltaPos.x, y: deltaPos.y },
        deltaSize: { x: deltaSize.x, y: deltaSize.y }
      });
    });

    it('should handle drag top of bottom up', async () => {
      const testTree = {
        split: {
          dir: "top",
          pos: 0.5,
          a: { windowTitle: "A" },
          b: { windowTitle: "B" }
        }
      };

      await applyTreeToDocking(testTree);
      const result = testResize("B", pt(0, -10), pt(0, 10));

      expect(result.newPos, "intended pos").to.deep.equal(result.currentPos.addPt(pt(0, -10)));
      expect(result.newSize, "intended size").to.deep.equal(result.currentSize.addPt(pt(0, 10)));

      expect(result.resultPos, "actual pos").to.deep.equal(result.newPos);
      expect(result.resultSize, "actual size").to.deep.equal(result.newSize);

    });

    it('should handle drag bottom of nested B', async () => {
      const testTree = {
        split: {
          dir: "top",
          pos: 0.5,
          a: {
            split: {
              dir: "left",
              pos: 0.5,
              a: { windowTitle: "A" },
              b: { windowTitle: "B" }
            }
          },
          b: { windowTitle: "C" }
        }
      };
      await applyTreeToDocking(testTree);
      const result = testResize("B", pt(0, 0), pt(0, 10));

      expect(result.resultPos, "actual pos").to.deep.equal(result.newPos);
      expect(result.resultSize, "actual size").to.deep.equal(result.newSize);

    });


    it('should handle drag top of nested C', async () => {
      const testTree = {
        split: {
          dir: "top",
          pos: 0.5,
          a: {
            split: {
              dir: "left",
              pos: 0.5,
              a: { windowTitle: "A" },
              b: { windowTitle: "B" }
            }
          },
          b: {
            split: {
              dir: "left",
              pos: 0.5,
              a: { windowTitle: "C" },
              b: { windowTitle: "D" }
            }
          },
        }
      };
      await applyTreeToDocking(testTree);
      const result = testResize("C", pt(0, -10), pt(0, 10));

      expect(result.resultPos, "actual pos").to.deep.equal(result.newPos);
      expect(result.resultSize, "actual size").to.deep.equal(result.newSize);

    });


    it('should handle drag B in a row', async () => {
      const testTree = {
        split: {
          dir: "left",
          pos: 0.5,
          a: {
            split: {
              dir: "left",
              pos: 0.5,
              a: { windowTitle: "A" },
              b: { windowTitle: "B" }
            }
          },
          b: {
            split: {
              dir: "left",
              pos: 0.5,
              a: { windowTitle: "C" },
              b: { windowTitle: "D" }
            }
          },
        }
      };
      await applyTreeToDocking(testTree);

      var widthB = size("B").x
      var widthA = size("B").x
      var widthAandB = size("A").x + size("B").x;

      testResize("B", pt(0, 0), pt(10, 0));

      expect(docking.dockingTree.split.a.split.pos).to.equal(0.5);
      expect(docking.dockingTree.split.b.split.pos).to.equal(0.5);
      expect(docking.dockingTree.split.pos, "to level split changed").to.greaterThan(0.5);

      var newWidthAandB = size("A").x + size("B").x;
      expect(newWidthAandB, "A and B size").to.be.closeTo(widthAandB + 10, 0.1);
      expect(size("A").x, "A size").to.be.closeTo(widthA + 5, 0.1);
      expect(size("B").x, "B size").to.be.closeTo(widthB + 5, 0.1);
    });

    it('should handle drag B in a column', async () => {
      const testTree = {
        split: {
          dir: "top",
          pos: 0.5,
          a: {
            split: {
              dir: "top",
              pos: 0.5,
              a: { windowTitle: "A" },
              b: { windowTitle: "B" }
            }
          },
          b: {
            split: {
              dir: "top",
              pos: 0.5,
              a: { windowTitle: "C" },
              b: { windowTitle: "D" }
            }
          },
        }
      };
      await applyTreeToDocking(testTree);

      var heightB = size("B").y
      var heightA = size("B").y
      var heightAandB = size("A").y + size("B").y;

      testResize("B", pt(0, 0), pt(0, 10));

      expect(docking.dockingTree.split.a.split.pos).to.equal(0.5);
      expect(docking.dockingTree.split.b.split.pos).to.equal(0.5);
      expect(docking.dockingTree.split.pos, "to level split changed").to.greaterThan(0.5);

      var newHeightAandB = size("A").y + size("B").y;
      expect(newHeightAandB, "A and B size").to.be.closeTo(heightAandB + 10, 0.1);
      expect(size("A").y, "A size").to.be.closeTo(heightA + 5, 0.1);
      expect(size("B").y, "B size").to.be.closeTo(heightB + 5, 0.1);
    });
  });

});
