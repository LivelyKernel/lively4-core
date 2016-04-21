'use strict';

export default class Expose {

  static get _stylesToSave() {
    return [
      // capitalized for dataset
      'Position',
      'Left',
      'Top',
      'Bottom',
      'Right',
      'Width',
      'Height',
      'Cursor',
      'Transform'
    ];
  }

  static toggle() {
    if (Expose.isOpen) {
      this.close()
    } else {
      this.open();
    }
  }
  
  static open() {
    Expose.isOpen = true;
    
    let windows = Array.from(document.querySelectorAll('body > lively-window'));

    if (windows.length === 0) {
      // no windows to display
      Expose.isOpen = false;
      return;
    }
    
    Expose.dimWindow();
    
    let rows = Math.ceil(windows.length / Expose.windowsPerRows);
    
    let marginV = 40;
    let marginH = 40;
    let paddingV = 20;
    let paddingH = 20;
    
    for (var i = 0; i < windows.length; i++) {
      let win = windows[i];
      let row = Math.floor(i / (Expose.windowsPerRows));
      let column = i % Expose.windowsPerRows;
      
      Expose.saveWindowStyles(win);
      
      win.style.transition = 'all 200ms';
      win.style.cursor = 'pointer';
      
      win.style.position = 'fixed';
      win.style.width = `calc(${1 / Expose.windowsPerRows * 100}% - ${1 * marginH}px - ${(Expose.windowsPerRows - 1) * paddingH}px)`;
      win.style.height = `calc(${1 / rows * 100}% - ${2 * marginV}px - ${(0) * paddingV}px)`;
      
      win.style.top = `calc(${marginV}px + ${row} * (${1 / rows * 100}% - ${paddingV}px))`;
      win.style.left = `calc(${marginH}px + ${column} * (${1 / Expose.windowsPerRows * 100}% - ${1 * marginH}px))`;
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      
      win.addEventListener('mouseenter', Expose.windowMouseEnter);
      win.addEventListener('mouseleave', Expose.windowMouseLeave);
      win.addEventListener('click', Expose.windowClick);
    }
  }

  static close() {
    Expose.isOpen = false;
    
    let windows = Array.from(document.querySelectorAll('body > lively-window'));
    windows.forEach((win) => {
      Expose.restoreWindowStyles(win);

      win.removeEventListener('mouseenter', Expose.windowMouseEnter);
      win.removeEventListener('mouseleave', Expose.windowMouseLeave);
      win.removeEventListener('click', Expose.windowClick);
    });
    
    Expose.undimWindow();
  }

  static saveWindowStyles(window) { 
    Expose._stylesToSave.forEach((style) => {
      window.dataset[`livelyExposePrev${style}`] = window.style[style.toLowerCase()];
    });
    window.dataset['livelyExposePrevTransition'] = window.style.transition; 
  }

  static restoreWindowStyles(window) {
    Expose._stylesToSave.forEach((style) => {
      window.style[style.toLowerCase()] = window.dataset[`livelyExposePrev${style}`]; 
    });

    // restore transition later for animation
    setTimeout(function() {
      window.style.transition = window.dataset['livelyExposePrevTransition'];
    }, 200);
  }
  
  static dimWindow() {
    let overlay = document.createElement('div');
    overlay.id = 'lively-expose-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.bottom = 0;
    overlay.style.right = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.7)';
    overlay.style.opacity = 0;
    overlay.style.transition = 'opacity 200ms';
    
    document.body.appendChild(overlay);
    overlay.style.opacity = 1;
  }
  
  static undimWindow() {
    let overlay = document.querySelector('#lively-expose-overlay');
    if (overlay) {
      overlay.style.opacity = 0;
      setTimeout(() => {
        document.body.removeChild(overlay);  
      }, 200);
    }
  }
  
  static windowMouseEnter(e) {
    this.style.transform = 'scale(1.02)';
  }
  
  static windowMouseLeave(e) {
    this.style.transform = 'scale(1)';
  }
  
  static windowClick(e) {
    let window = this;
    Expose.close()
    setTimeout(function() {
      window.focus();
    }, 250);
  }
  
  static bodyKeyDown(e) {
    // cmd+E
    if (e.keyCode === 69 && e.metaKey) {
      Expose.toggle();
    }
  }
}

// basic class configuration
Expose.isOpen = false;
Expose.windowsPerRows = 3;

document.body.removeEventListener('keydown', Expose.bodyKeyDown);
document.body.addEventListener('keydown', Expose.bodyKeyDown);

console.info('Expose loaded');
