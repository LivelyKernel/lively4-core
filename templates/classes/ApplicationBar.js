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
    this.toolbar = this.shadowRoot.querySelector('#toolbar');
    this.clock = this.shadowRoot.querySelector('#clock');
    
    this.windowTabs = new Map();
  }

  bindEvents() {
    //
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
    this.bindEvents();
    this.registerActiveWindowView();

    this.onTitleChange();
    this.onActiveChange();
    this.onOutOfWindow();
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
    windowTab.style = 'float: left; border: 1px solid gray; margin-right: 5px;';
    windowTab.addEventListener('click', e => {
      if(win.isMinimized())
        win.toggleMinimize();
        
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

  onActiveChange() {
    new AExpr(win => win.getAttribute('active'))
    .applyOnAll(this.activeWindowView)
    .onChange(win => {
      var windowTab = this.windowTabs.get(win);
      windowTab.style.borderColor = win.getAttribute('active') ? 'red' : 'gray';
    });
  }

  onOutOfWindow() {
    var windowTabs = this.windowTabs;
    
    new AExpr(win => {
      var fromBottom = window.innerHeight - win.offsetHeight - parseInt(win.style.top);
      var fromRight = window.innerWidth - win.offsetWidth - parseInt(win.style.left);

      return fromBottom < 0 || fromRight < 0;
    })
    .applyOnAll(this.activeWindowView)
    .onChange(function(win) {
      var windowTab = windowTabs.get(win);
      
      windowTab.style.backgroundColor = this.currentValue ?
        'red' : '';
    });
  }
}
