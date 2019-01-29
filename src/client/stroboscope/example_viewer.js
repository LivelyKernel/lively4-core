// open component

import Stroboscope from 'src/client/stroboscope/stroboscope.js';

class Opener {
  open() {
    this.init()
    this.func = function(){}
  }
  
  async init() {
    this.viewer = await this.callAssignViewer();
  }

  async callAssignViewer() {
    var viewer = await lively.openComponentInWindow('lively-stroboscope');
    return viewer;
  }
}

const opener = new Opener()
opener.open()

// start stroboscope
var stroboscope = new Stroboscope(opener.viewer, 500)
stroboscope.reciever = opener.viewer
stroboscope.start()

opener.viewer._rowHeight = 60

stroboscope.stop()

