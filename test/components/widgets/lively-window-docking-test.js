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
     testWorld().innerHTML = "HELLLOOOOOOOOO"
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
      debugger
      const window1 = await loadComponent('lively-window');
      const window2 = await loadComponent('lively-window');
      
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
      const leftWindow = docking.dockingTree.split.left.window;
      const rightWindow = docking.dockingTree.split.right.window;
      
      expect(leftWindow).to.exist;
      expect(rightWindow).to.exist;
      
      // Both windows should be docked
      expect(leftWindow.classList.contains('docked')).to.be.true;
      expect(rightWindow.classList.contains('docked')).to.be.true;
      
      
      // After a right split, right window's left position should be half of the left window's width
      const leftWindowWidth = parseInt(leftWindow.style.width);
      const rightWindowLeft = parseInt(rightWindow.style.left);
      expect(rightWindowLeft).to.equal(leftWindowWidth);
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
      const leftNode = docking.dockingTree.split.left;
      const rightNode = docking.dockingTree.split.right;
      
      expect(docking.parentMap.get(leftNode)).to.equal(docking.dockingTree);
      expect(docking.parentMap.get(rightNode)).to.equal(docking.dockingTree);
    });
  });
});
