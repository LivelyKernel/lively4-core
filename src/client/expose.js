
import html from "src/client/html.js"
import {pt,rect} from "src/client/graphics.js"

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
      'Transform',
      'Border'
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
   
    if (!Expose.current) return
    
    lively.html.registerKeys(document.body, "expose", Expose.current, true)
    lively.globalFocus()

    if (Expose.isOpen) {
      return;
    }

    Expose.isOpen = true;

    // Sort windows according to their z-index, because the order
    // of z-index corresponds to the order of the windows last access.
    let windows = [...document.querySelectorAll('body > lively-window')].sort((w1, w2) => {
      return parseInt(w2.style["z-index"]) - parseInt(w1.style["z-index"]);
    });

    Expose.windows = windows;

    if (windows.length < 2) {
      // 0: no windows to display
      // 1: no expose on a single window
      Expose.isOpen = false;
      return;
    }

    Expose.dimWindow();

    let topLeft = pt(100,100)
    windows.forEach((w, i) => {
      let row = Math.floor(i / (Expose.windowsPerRows));
      let column = i % Expose.windowsPerRows;

      Expose.saveWindowStyles(w);

      w.style.transition = 'all 100ms';
      w.style.cursor = 'pointer';
      w.classList.add("expose")
  
      this.exposeScale = 0.5
      this.elementLength = 300 
      w.style.border = ""
    
      var ext = lively.getExtent(w)
      
      const realScale = Math.min(1, this.elementLength / Math.max(ext.x, ext.y))
      w.tempScale = realScale

      // scale with origin topleft
      this.setScaleTransform(realScale, w, ext)
      var pos = topLeft.addPt(pt(column * (this.elementLength + 20), row * (this.elementLength + 20)))
      
      var delta = lively.getClientPosition(document.body)
      lively.setPosition(w, pos.subPt(delta))
      
    w.addEventListener('mousemove', Expose.onWindowMouseMove);
    w.addEventListener('click', Expose.onWindowClick);
    })

    Expose.setSelectedWindow(windows.second);
  }

  static setScaleTransform(scale, win, ext) {
    win.style.transformOrigin = "top left";
    win.style.transform = `scale(${scale})`
  }

  static close() {

    lively.removeEventListener("expose", document.body)

    if (!Expose.isOpen) {
      return;
    }

    Expose.isOpen = false;

    let windows = Array.from(document.querySelectorAll('body > lively-window'));
    windows.forEach((win) => {
      win.classList.remove("expose")
      Expose.restoreWindowStyles(win);

      win.removeEventListener('mousemove', Expose.onWindowMouseMove);
      win.removeEventListener('click', Expose.onWindowClick);
      
      delete win.tempScaledExtent
      delete win.tempScale
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

  static restoreWindowStyles(w) {
    Expose._stylesToSave.forEach((style) => {
      w.style[style.toLowerCase()] = w.dataset[`livelyExposePrev${style}`];
    });

    // restore transition later for animation
    setTimeout(function() {
      w.style.transition = w.dataset['livelyExposePrevTransition'];
    }, 100);
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
    overlay.style.transition = 'opacity 100ms';
    overlay.style['z-index'] = 99;

    document.body.appendChild(overlay);
    overlay.style.opacity = 1;
  }

  static undimWindow() {
    let overlay = document.querySelector('#lively-expose-overlay');
    if (overlay) {
      overlay.style.opacity = 0;
      setTimeout(() => {
        overlay.remove()
      }, 100);
    }
  }

  static setSelectedWindow(w) {
    if (w === Expose.selectedWin) {
      return;
    }
    Expose.windowRemoveHighlight(Expose.selectedWin);
    Expose.windowHighlight(w);
    Expose.selectedWin = w;
  }

  static onWindowMouseMove(evt) {
    Expose.setSelectedWindow(this);
  }

  static onWindowClick(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    let win = this;
    setTimeout(() => lively.gotoWindow(win, false), 1000);
    Expose.close();
  }
  
  /* Highlights */
  static windowHighlight(w) {
    this.setScaleTransform(w.tempScale + 0.05, w, w.tempScaledExtent)
    w.style.border = "3px solid orange"
    w.style.transform = w.style.transform  + " translate(-20px,-20px)" ;
  }

  static windowRemoveHighlight(w) {
    if (!w) return;
    w.style.border =""
    this.setScaleTransform(w.tempScale, w, w.tempScaledExtent)
  }


  // Single Global Event
  static onKeyDown(evt) {
    var key = String.fromCharCode(evt.keyCode)
    // #TODO Consider replacing or disable for editor, 
    // since Ctrl-E is "jump to end of line" in every other editor
    // #KeyboardShortcut Ctrl-E toggle expose
    if ((key === "E" && (evt.metaKey || evt.ctrlKey)) 
        /* || (key === "Q" && evt.altKey) */) {
      Expose.toggle();
      evt.preventDefault()
      evt.stopPropagation();
    }
  }

  onLeftDown(evt) {
    
    
    Expose.selectPrev();
  }
  
  onUpDown(evt) {
    Expose.selectUp();
  }
  
  onRightDown(evt) {
    Expose.selectNext();
  }

  onDownDown(evt) {
    Expose.selectDown();
  }
  
  onEnterDown(evt) {
    Expose.onWindowClick.call(Expose.selectedWin, evt);
  }

  onEscDown(evt) {
    Expose.close();
  }


  static postLoad() {
    if (window.lively && lively.removeEventListener) {
      console.log("Post load expose")
      // basic class configuration
      Expose.isOpen = false;
      Expose.windowsPerRows = 4;
      lively.removeEventListener("ToggleExpose", document)
      lively.addEventListener("ToggleExpose",document, "keydown", evt => {
        Expose.onKeyDown(evt)
      })
      Expose.current = new Expose()
    } else {
      console.log("defere Post load expose")
      window.setTimeout(this.postLoad, 100)
    }
  }
}

Expose.postLoad()
