// visitors applied to the stroboscoped objects

function visitor1_accept(a) {
  if (a.pagename === "main")
    a.redirect = function(){return "Hello"}
  else
    a.main = function(){return 0}
}

function visitor2_accept(a) {
  if (a.pagename === "main")
    delete a.pagename
}

function visitor3_accept(a) {
  if (typeof a.pagename !== "string")
    a.error = "faulty page name"
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

var objects = [{pagename:"main"}, {pagename:"index"}, {pagename:"help"}]
var stroboscopes = []
for(var i = 0; i < objects.length; i++)
  {
    stroboscopes[i] = new Stroboscope(objects[i])
    stroboscopes[i].reciever = opener.viewer
    stroboscopes[i].start()
  }


// do the work
for (var j = 0; j < objects.length; j++)
  {
    visitor1_accept(objects[j])
  }

for (var l = 0; l < objects.length; l++)
  {
    visitor2_accept(objects[l])
  }

for (var m = 0; m < objects.length; m++)
  {
    visitor3_accept(objects[m])
  }

// stop stroboscopes
for(var k = 0; k < stroboscopes.length; k++)
  {
    stroboscopes[k].stop()
  }
