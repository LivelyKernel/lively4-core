'use strict';

import Morph from './Morph.js';

function getScroll() {
  return {
    x: document.scrollingElement.scrollLeft || 0,
    y: document.scrollingElement.scrollTop || 0
  };
}

export default class Window extends Morph {

  /*
   * Getters/Setters
   */
  get title() {
    return this._title;
  }
  set title(val) {
    this._title = val;
    this.render();
  }

  get isFixed() {
    return this.hasAttribute('fixed');
  }

  setPosition(top, left) {
    this.style.top = top + 'px';
    this.style.left = left + 'px';
  }

  setSize(width, height) {
    this.style.width = width + 'px';
    this.style.height = height + 'px';
  }

  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.setup();

    this.created = true;
    this.render();
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    switch (attrName) {
      case 'title':
        this.render();
        break;
      case 'fixed':
        this.reposition();
        break;
      default:
        //
    }
  }

  /*
   * Initialization
   */
  defineShortcuts() {
    this.window = this.shadowRoot.querySelector('.window');
    this.titleSpan = this.shadowRoot.querySelector('.window-title span');

    this.menuButton = this.shadowRoot.querySelector('.window-menu');
    this.minButton = this.shadowRoot.querySelector('.window-min');
    this.maxButton = this.shadowRoot.querySelector('.window-max');
    this.pinButton = this.shadowRoot.querySelector('.window-pin');
    this.resizeButton = this.shadowRoot.querySelector('.window-resize');
    this.closeButton = this.shadowRoot.querySelector('.window-close');

    this.contentBlock = this.shadowRoot.querySelector('#window-content');
  }

  bindEvents() {
    this.addEventListener('mousedown', (e) => { this.focus(); });
    this.addEventListener('created', (e) => { this.focus(); });
    document.addEventListener('mousemove', (e) => { this.windowMouseMove(e); });
    document.addEventListener('mouseup', (e) => { this.windowMouseUp(e); });

    this.shadowRoot.querySelector('.window-title')
      .addEventListener('mousedown', (e) => { this.titleMouseDown(e); });

    this.menuButton.addEventListener('click', (e) => { this.menuButtonClicked(e); });
    this.minButton.addEventListener('click', (e) => { this.minButtonClicked(e); });
    // this.maxButton.addEventListener('click', (e) => { this.maxButtonClicked(e); });
    this.pinButton.addEventListener('click', (e) => { this.pinButtonClicked(e); });
    this.resizeButton.addEventListener('mousedown', (e) => { this.resizeMouseDown(e); });
    this.closeButton.addEventListener('click', (e) => { this.closeButtonClicked(e); });
  }

  setup() {
    this.dragging = false;

    this.defineShortcuts();
    this.bindEvents();
  }

  /*
   * Window methods
   */
  render() {
    if (this.created) {
      if (this.attributes['title']) {
        this.titleSpan.innerHTML = this.attributes['title'].value;
      }
    }
  }

  reposition() {
    let rect = this.getBoundingClientRect();

    if (this.isFixed) {
      this.setPosition(
        rect.top,
        rect.left
      );

      this.classList.add('window-fixed');
      this.pinButton.classList.add('active');
    } else {
      let scroll = getScroll();

      this.setPosition(
        rect.top + scroll.y,
        rect.left + scroll.x
      );

      this.classList.remove('window-fixed');
      this.pinButton.classList.remove('active');
    }
  }

  focus(e) {
    let minZIndex = 100;

    let allWindows = Array.from(document.querySelectorAll('lively-window'));
    let thisIdx = allWindows.indexOf(this);

    let allWindowsButThis = allWindows;
    allWindowsButThis.splice(thisIdx, 1);

    allWindowsButThis.sort((a, b) => {
      return parseInt(a.style['z-index']) - parseInt(b.style['z-index']);
    });

    allWindowsButThis.forEach((win, index) => {
      win.style['z-index'] = minZIndex + index;
      win.window.classList.remove('focused');
    });

    this.style['z-index'] = minZIndex + allWindowsButThis.length;
    this.window.classList.add('focused');
  }

  minButtonClicked(e) {
    // NotImplemented
    lively.notify("min window")
    var content = this.shadowRoot.querySelector('#window-content')
    if (content.style.visibility == "hidden") {
     content.style.visibility = "visible" 
    } else {
      content.style.visibility = "hidden"
    }
  }

  maxButtonClicked(e) {
    // NotImplemented
  }

  pinButtonClicked(e) {
    let isPinned = this.pinButton.classList.toggle('active');
    if (isPinned) {
      this.setAttribute('fixed', '');
    } else {
      this.removeAttribute('fixed');
    }
  }

  closeButtonClicked(e) {
    this.parentNode.removeChild(this);
  }

  menuButtonClicked(e) {
    lively.openContextMenu(document.body, e, this.childNodes[0]);
  }

  titleMouseDown(e) {
    e.preventDefault();

    let offsetWindow = $(this).offset();

    if (this.isFixed) {
      this.dragging = {
        left: e.pageX - offsetWindow.left,
        top: e.pageY - offsetWindow.top
      };
    } else {
      this.dragging = {
        left: e.clientX - offsetWindow.left,
        top: e.clientY - offsetWindow.top
      };
    }

    this.window.classList.add('dragging');
  }

  resizeMouseDown(e) {
    e.preventDefault();

    let offsetWindow = $(this).offset();

    this.resizing = {
      left: offsetWindow.left,
      top: offsetWindow.top
    };

    this.window.classList.add('resizing');
  }

  windowMouseUp(e) {
    e.preventDefault();

    this.dragging = false;
    this.resizing = false;

    this.window.classList.remove('dragging');
    this.window.classList.remove('resizing');
  }

  windowMouseMove(e) {

    if (this.dragging) {
      e.preventDefault();

      if (this.isFixed) {
        this.setPosition(
          e.clientY - this.dragging.top,
          e.clientX - this.dragging.left
        );
      } else {
        let scroll = getScroll();

        this.setPosition(
          e.pageY - this.dragging.top - scroll.y,
          e.pageX - this.dragging.left - scroll.x
        );
      }
    } else if (this.resizing) {
      e.preventDefault();
      this.setSize(
        e.pageX - this.resizing.left,
        e.pageY - this.resizing.top        
      );
    }
  }

  /*
   * Public interface
   */
  centerInWindow() {
    let rect = this.getBoundingClientRect();
    this.style.top = 'calc(50% - ' + (rect.height / 2) + 'px)';
    this.style.left = 'calc(50% - ' + (rect.width / 2) + 'px)';
  }
}
