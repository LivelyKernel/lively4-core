'use strict';

// import lively from './lively.js'

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
    if (Expose.isOpen) {
      return;
    }

    Expose.isOpen = true;

    // Sort windows according to their z-index, because the order
    // of z-index corresponds to the order of the windows last access.
    let windows = Array.from(document.querySelectorAll('body > lively-window')).sort((w1, w2) => {
      return parseInt(w2.style["z-index"]) - parseInt(w1.style["z-index"]);
    });

    Expose.windows = windows;

    if (windows.length === 0) {
      // no windows to display
      Expose.isOpen = false;
      return;
    }

    // select the second window, if it exists
    Expose.selectedWin = windows[1] || windows[0];

    Expose.dimWindow();

    let rows = Math.ceil(windows.length / Expose.windowsPerRows);

    let marginV = 40;
    let marginH = 40;
    let paddingV = 20;
    let paddingH = 20;

    let topLeft = pt(100,100)
    for (var i = 0; i < windows.length; i++) {
      let win = windows[i];
      let row = Math.floor(i / (Expose.windowsPerRows));
      let column = i % Expose.windowsPerRows;

      Expose.saveWindowStyles(win);

      win.style.transition = 'all 200ms';
      win.style.cursor = 'pointer';

  
      // win.style.width = `calc(${1 / Expose.windowsPerRows * 100}% - ${1 * marginH}px - ${(Expose.windowsPerRows - 1) * paddingH}px)`;
      // win.style.height = `calc(${1 / rows * 100}% - ${2 * marginV}px - ${(0) * paddingV}px)`;

      // win.style.top = `calc(${marginV}px + ${row} * (${1 / rows * 100 }% - ${paddingV}px))`;
      // win.style.left = `calc(${marginH}px + ${column} * (${1 / Expose.windowsPerRows * 100 }% - ${1 * marginH}px))`;
      // win.style.right = 'auto';
      // win.style.bottom = 'auto';
      this.exposeScale = 0.5
      var elementWidth = 300 
      
      var oldExtent = lively.getExtent(win)
      // scale with origin topleft

      if (oldExtent.x > oldExtent.y) {
        var scaledElementWidth = elementWidth / this.exposeScale
        var scaledElementHeight = oldExtent.y / oldExtent.x  * scaledElementWidth
      } else {
        scaledElementHeight = elementWidth / this.exposeScale
        scaledElementWidth = oldExtent.x / oldExtent.y  * scaledElementHeight
      }
      
      var newExtent = pt(scaledElementWidth, scaledElementHeight)
      lively.setExtent(win, newExtent)
      win.tempScaledExtent = newExtent
      this.setScaleTransform(this.exposeScale, win, newExtent)
  
      var pos = topLeft.addPt(pt(column * (elementWidth + 20), row * (elementWidth + 20)))
      
      lively.setGlobalPosition(win, pos)

      win.addEventListener('mouseenter', Expose.windowMouseEnter);
      win.addEventListener('mouseleave', Expose.windowMouseLeave);
      win.addEventListener('click', Expose.windowClick);
    }

    Expose.windowMouseEnter.call(Expose.selectedWin);
  }

  static setScaleTransform(scale, win, ext) {
    ext = ext || lively.getExtent(win)
    win.style.transform = 
      `translate(-${ext.x}px, -${ext.y}px) scale(${scale}) translate(${ext.x * (1 + this.exposeScale)}px, ${ext.y *(1 + this.exposeScale)}px)`
  
  }

  static close() {
    if (!Expose.isOpen) {
      return;
    }

    Expose.isOpen = false;

    let windows = Array.from(document.querySelectorAll('body > lively-window'));
    windows.forEach((win) => {
      Expose.restoreWindowStyles(win);

      win.removeEventListener('mouseenter', Expose.windowMouseEnter);
      win.removeEventListener('mouseleave', Expose.windowMouseLeave);
      win.removeEventListener('click', Expose.windowClick);
      
      delete win.tempScaledExtent
    });

    Expose.undimWindow();
  }

  static saveWindowStyles(window) {
    Expose._stylesToSave.forEach((style) => {
      window.dataset[`livelyExposePrev${style}`] = window.style[style.toLowerCase()];
    });
    window.dataset['livelyExposePrevTransition'] = window.style.transition;
  }

  static selectNext() {
    let idx = Expose.windows.indexOf(Expose.selectedWin);
    Expose.setSelectedWindow(Expose.windows[idx+1] || Expose.windows[0]);
  }

  static selectPrev() {
    let idx = Expose.windows.indexOf(Expose.selectedWin);
    Expose.setSelectedWindow(Expose.windows[idx-1] || Expose.windows[Expose.windows.length-1]);
  }

  static selectUp() {
    let idx = Expose.windows.indexOf(Expose.selectedWin);
    let row = Math.floor(idx / Expose.windowsPerRows);
    let col = idx % Expose.windowsPerRows;
    Expose.setSelectedWindow(Expose.windows[(row-1)*Expose.windowsPerRows + col] || Expose.windows[Expose.windows.length-1]);
  }

  static selectDown() {
    let idx = Expose.windows.indexOf(Expose.selectedWin);
    let row = Math.floor(idx / Expose.windowsPerRows);
    let col = idx % Expose.windowsPerRows;
    Expose.setSelectedWindow(Expose.windows[(row+1)*Expose.windowsPerRows + col] || Expose.windows[0]);
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
    overlay.style['z-index'] = 99;

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

  static setSelectedWindow(w) {
    Expose.windowRemoveHighlight(Expose.selectedWin);
    Expose.windowHighlight(w);
    Expose.selectedWin = w;
  }

  static windowMouseEnter(e) {
    Expose.setSelectedWindow(this);
  }

  static windowMouseLeave(e) {
    Expose.windowRemoveHighlight(this);
  }

  static windowHighlight(w) {
     this.setScaleTransform(this.exposeScale * 1.2 , w,w.tempScaledExtent.scaleBy(2))
  }

  static windowRemoveHighlight(w) {
     this.setScaleTransform(this.exposeScale, w, w.tempScaledExtent)
  }

  static windowClick(e) {
    let window = this;
    window.focus();
    Expose.close();
  }

  static bodyKeyDown(e) {
    // (cmd|ctrl)+E || alt+q
    if ((e.keyCode === 69 && (e.metaKey || e.ctrlKey)) || (e.keyCode === 81 && e.altKey)) {
      Expose.toggle();
    }

    if (Expose.isOpen) {

      // Left
      if (e.keyCode === 37) {
        Expose.selectPrev();
      }

      // Up
      if (e.keyCode === 38) {
        Expose.selectUp();
      }

      // Right
      if (e.keyCode === 39) {
        Expose.selectNext();
      }

      // Down
      if (e.keyCode === 40) {
        Expose.selectDown();
      }

      // Enter
      if (e.keyCode === 13) {
        Expose.windowClick.call(Expose.selectedWin, e);
      }

      // Esc
      if (e.keyCode === 27) {
        Expose.close();
      }

    }
  }

  static postLoad() {
    if (window.lively && lively.removeEventListener) {
      console.log("Post load expose")
      // basic class configuration
      Expose.isOpen = false;
      Expose.windowsPerRows = 5;

      lively.removeEventListener("expose")
      lively.addEventListener("expose", document.body, 'keydown', Expose.bodyKeyDown)
    } else {
      console.log("defere Post load expose")
      window.setTimeout(this.postLoad, 100)
    }
  }
}

Expose.postLoad()
