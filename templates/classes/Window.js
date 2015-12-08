'use strict';

import Morph from './Morph.js';

export default class Window extends Morph {

  // window title
  get title() {
    return this._title;
  }
  set title(val) {
    this._title =  val;
    this.render();
  }

  get isFixed() {
    return this.hasAttribute('fixed');
  }

  attachedCallback() {
    console.log('window attachedCallback!');

    // define shortcut variables
    this.titleSpan = this.shadowRoot.querySelector('.window-title span');
    this.minButton = this.shadowRoot.querySelector('.window-min');
    this.maxButton = this.shadowRoot.querySelector('.window-max');
    this.pinButton = this.shadowRoot.querySelector('.window-pin');
    this.resizeButton = this.shadowRoot.querySelector('.window-resize');
    this.closeButton = this.shadowRoot.querySelector('.window-close');
    this.contentBlock = this.shadowRoot.querySelector('#window-content');

    // bind events for window behavior
    this.dragging = false;
    this.closeButton.addEventListener('click', (e) => { this.closeButtonClicked(e) });
    this.minButton.addEventListener('click', (e) => { this.minButtonClicked(e) });
    this.maxButton.addEventListener('click', (e) => { this.maxButtonClicked(e) });
    this.pinButton.addEventListener('click', (e) => { this.pinButtonClicked(e) });
    this.resizeButton.addEventListener('mousedown', (e) => { this.resizeMouseDown(e) });
    this.shadowRoot.querySelector('.window-title').addEventListener('mousedown', (e) => { this.titleMouseDown(e) });

    document.body.addEventListener('mousemove', (e) => { this.windowMouseMove(e) });
    document.body.addEventListener('mouseup', (e) => { this.windowMouseUp(e) });

    this.created = true;
    this.render();
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    switch(attrName) {
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

  // (re)render the element
  render() {
    console.log('window render!');
    if (this.created) {
      if(this.attributes['title']) {
        this.titleSpan.innerHTML = this.attributes['title'].value;
      }
    }
  }

  reposition() {
    let rect = this.getBoundingClientRect();
    let scrollX = document.scrollingElement.scrollLeft || 0;
    let scrollY = document.scrollingElement.scrollTop || 0;

    if (this.isFixed) {
      this.style.left = rect.left + 'px';
      this.style.top = rect.top + 'px';
      this.classList.add('window-fixed');
      this.pinButton.classList.add('active');
    } else {
      this.style.left = (rect.left + scrollX) + 'px';
      this.style.top = (rect.top + scrollY) + 'px';
      this.classList.remove('window-fixed');
      this.pinButton.classList.remove('active');
    }
  }

  minButtonClicked(e) {
    // TODO
  }

  maxButtonClicked(e) {
    // TODO
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
    $('.window', this.shadowRoot).addClass('dragging');
  }

  resizeMouseDown(e) {
    e.preventDefault();

    let offsetWindow = $(this).offset();

    this.resizing = {
      left: offsetWindow.left,
      top: offsetWindow.top
    };
    $('.window', this.shadowRoot).addClass('resizing');
  }

  windowMouseUp(e) {
    e.preventDefault();

    this.dragging = false;
    this.resizing = false;
    $('.window', this.shadowRoot).removeClass('dragging').removeClass('resizing');
  }

  windowMouseMove(e) {
    e.preventDefault();

    if (this.dragging) {
      if (this.isFixed) {
        $(this).css({
          left: e.clientX - this.dragging.left,
          top: e.clientY - this.dragging.top
        });
      } else {
        let scrollX = document.scrollingElement.scrollLeft || 0;
        let scrollY = document.scrollingElement.scrollTop || 0;
        $(this).css({
          left: e.pageX - this.dragging.left - scrollX,
          top: e.pageY - this.dragging.top - scrollY
        });
      }
    } else if (this.resizing) {
      $(this).css({
        width: e.pageX - this.resizing.left,
        height: e.pageY - this.resizing.top
      });
    }
  }

  // Public interface
  centerInWindow() {
    let rect = this.getBoundingClientRect();
    this.style.top = 'calc(50% - ' + (rect.height / 2) + 'px)';
    this.style.left = 'calc(50% - ' + (rect.width / 2) + 'px)';
  }
}
