'use strict';

import Morph from './Morph.js';
import { AExpr } from 'src/../../active-expressions/src/active-expressions.js?12';
import { ActiveDOMView } from 'src/../../active-expressions/src/active-view.js';

export default class ApplicationBar extends Morph {

  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.setup();
    this.render();
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    switch (attrName) {
      //case 'attribute':
      //  this.render();
      //  break;
      default:
        //
    }
  }

  /*
   * Initialization
   */
  defineShortcuts() {
    this.windowSpace = this.shadowRoot.querySelector('#window-space');
    this.menuButton = this.shadowRoot.querySelector('#menu-button');
    this.toolbar = this.shadowRoot.querySelector('#toolbar');
    this.clock = this.shadowRoot.querySelector('#clock');
    
    this.windowTabs = new Map();
  }

  bindEvents() {
    this.onTitleChange();
    this.onActiveChange();
    this.onMinimizeChange();
    
    this.menuButton.addEventListener('click', (e) => { this.openContextMenu(e); });
  }

  registerActiveWindowView() {
    this.activeWindowView = new ActiveDOMView('lively-window');
    this.activeWindowView.onEnter(win => {
      this.addWindowTab(win);
    }).onExit(win => {
      this.removeWindowTab(win);
    });
  }

  setup() {
    this.defineShortcuts();
    this.registerActiveWindowView();
    this.bindEvents();
  }

  /*
   * Application Bar methods
   */
  render() {
    //
  }
  
  addWindowTab(win) {
    if(!win instanceof Morph)
      return;

    var windowTab = document.createElement('span');
    windowTab.classList.add('tab');
    
    windowTab.addEventListener('click', e => {
      if(win.isMinimized() || win.active)
        win.toggleMinimize();
        
      if(!win.isMinimized())
        win.focus(e);
    });
    
    windowTab.innerHTML = win.hasAttribute('title') ? 
      win.getAttribute('title') : 'no title';

    this.windowSpace.appendChild(windowTab);
    this.windowTabs.set(win, windowTab);
  }
  
  removeWindowTab(win) {
    var windowTab = this.windowTabs.get(win);
    this.windowTabs.delete(win);
    windowTab.remove();
  }
  
  onTitleChange() {
    new AExpr(win => win.getAttribute('title'))
    .applyOnAll(this.activeWindowView)
    .onChange(win => {
      var windowTab = this.windowTabs.get(win);
      windowTab.innerHTML = win.getAttribute('title');
    });
  }
  
  onMinimizeChange() {
    new AExpr(win => win.style.display == 'none')
    .applyOnAll(this.activeWindowView)
    .onChange(win => {
      var windowTab = this.windowTabs.get(win);
      
      if(win.isMinimized()) {
        windowTab.classList.add('minimized');
      } else {
        windowTab.classList.remove('minimized');
      }
    });
  }

  onActiveChange() {
    new AExpr(win => win.getAttribute('active'))
    .applyOnAll(this.activeWindowView)
    .onChange(win => {
      var windowTab = this.windowTabs.get(win);
      
      if(win.getAttribute('active')) {
        windowTab.classList.add('active');
      } else {
        windowTab.classList.remove('active');
      }
    });
  }
  
  openContextMenu(event) {
    let openMenuCount = document.querySelectorAll('lively-menu').length;
    if(openMenuCount == 0) {
      lively.openContextMenu(document.body, event);  
    }
  }
}
