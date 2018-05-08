"enable aexpr";

import Morph from'src/components/widgets/lively-morph.js';
import VibratingPoint from 'doc/PX2018/project_2/vibratingpoint.js';

export default class LivelyMpm extends Morph {
  async initialize() {
    this.windowTitle = "Lively Material Point Method Demo";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt));
    
    this.canvas = this.get("#mpm");
    this.context = this.canvas.getContext("2d");
    
    this.context.fillStyle = "rgba(" + 255 + "," + 0 + "," + 0 + "," + (255/255) + ")";
    this.context.fillRect(150, 150, 2, 2);
    
    this.execute();
    console.log(this.xa);
  }
  
  execute() {
    const time = 1000;
    const dtime = 0.01;
    const L = 2;
    const Mp = 1;
    const Vp = 1;
    // Young's modulus
    const E = 4 * Math.PI * Math.PI;
    
    let s = 0;
    let nodes = [1, 2];   
    let xp = 0.5 * L;
    let vp = 0.1;
    let q = Mp * vp;
    let t = 0;
    this.ta = [];
    this.va = [];
    this.xa = [];
    
    while (t < time) {
      let N1 = 1 - Math.abs(xp - nodes[0]) / L;
      let N2 = 1 - Math.abs(xp - nodes[1]) / L;
      let dN1 = -1 / L;
      let dN2 = 1 /L;
      let m1 = N1 * Mp;
      let m2 = N2 * Mp;
      let mv1 = N1 * q;
      let mv2 = N2 * q;
      mv1 = 0;
      let fint1 = -Vp * s * dN1;
      let fint2 = -Vp * s * dN2;
      let f1 = fint1; 
      let f2 = fint2;
      f1 = 0;
      mv1 = mv1 + f1 * dtime;
      mv2 = mv2 + f2 * dtime;
      vp = vp + dtime * (N1* f1 / m1 + N2 * f2 / m2);
      xp = xp + dtime * (N1*mv1 / m1 + N2 *mv2 / m2);
      q = Mp * vp;
      let v1 = N1 * Mp * vp / m1;
      let v2 = N2 * Mp * vp / m2;
      v1 = 0; 
      let Lp = dN1 * v1 + dN2 * v2; 
      let dEps = dtime * Lp; 
      s = s + E * dEps;
      this.ta.push(t);
      this.va.push(vp);
      this.xa.push(xp);
      t = t + dtime;
     }
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    
  }

  /* Lively-specific API */

  livelyPreMigrate() {
    
  }
  
  livelyMigrate(other) {
    
  }
  
  livelyInspect(contentNode, inspector) {
    
  }
  
  livelyPrepareSave() {
    
  }
  
  
  async livelyExample() {
    // Add mpm data here later
  }
  
  
}