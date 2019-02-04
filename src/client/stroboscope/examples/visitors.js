// visitors applied to the stroboscoped objects

function visitor0_accept(a) {
  if (a.pagename !== "New Page Name")
    a.pagename = "New Page Name"
  else 
    a.pagename = "Even Better New Page Name"
}

function visitor1_accept(a) {
  if (a.visitor1 === undefined) a.visitor1 = 0
for(var i = 0; i < 10; i++)
  {
    a.visitor1 = a.visitor1 + i
  }
}

function visitor2_accept(a) {
  if (a.counter2 !== undefined) a.counter2 = 0
for(var i = 0; i < 10; i++)
  {
    a.counter2 = a.counter2 + i
  }
}

function visitor3_accept(a) {
  a.pagename = function(){return "bad";}
}






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

var obj = {pagename:"name"};
var stroboscope = new Stroboscope(obj)

stroboscope.reciever = opener.viewer
stroboscope.start()


// do the work

visitor0_accept(obj)
visitor1_accept(obj)
visitor2_accept(obj)
visitor3_accept(obj)

// stop stroboscope

stroboscope.stop()

