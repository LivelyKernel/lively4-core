import {expect} from 'src/external/chai.js';
import {pt, rect} from 'src/client/graphics.js';

import {MockEvent, createHTML, testWorld, loadComponent} from 'test/templates/templates-fixture.js';

describe('LivelyWindowDocking', () => {
  let docking;
  
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
      debugger
      const window1 = await loadComponent('lively-window');
      const window2 = await loadComponent('lively-window');
      const window3 = await loadComponent('lively-window');
      
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
      
      // Verify the structure remains intact
      expect(docking.dockingTree.split).to.exist;
      expect(docking.dockingTree.split.dir).to.equal('right');
      
      // Verify window2 and window3 are still docked
      const firstWindow = docking.dockingTree.split.a.window;
      const secondWindow = docking.dockingTree.split.b.window;
      
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
});
