import Stroboscope from 'src/client/stroboscope/stroboscope.js';
    
class Viewer {
  open() {
    this.init() 
  }
  
  async init() {
    this.viewer = await this.callAssignViewer();
  }

  async callAssignViewer() {
    var viewer = await lively.openComponentInWindow('lively-stroboscope');
    return viewer;
  }
}

var tt = {name:"name", length:8, width:4, height:2};
var stroboscope = new Stroboscope(tt)
const viewer = new Viewer()
viewer.open()

//2. execution block due to await

stroboscope.reciever = viewer.viewer

stroboscope.start()


tt.solution = 43

stroboscope.stop()