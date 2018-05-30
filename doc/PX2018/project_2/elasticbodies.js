import MpmAnimation from './mpmanimation.js';

export default class ElasticBodies extends MpmAnimation {
  constructor() {
    super();
    
    this.v = 0.3;
    this.pCount = 200;
    this.Mp = new Array(this.pCount).fill(1);
    this.Vp = new Array(this.pCount).fill(1);
    this.Fp = new Array(this.pCount).fill(new Array(4).fill(1));
    this.s = new Array(this.pCount).fill(new Array(3).fill(0));
    this.eps = new Array(this.pCount).fill(new Array(3).fill(0));
    this.vp = new Array(this.pCount).fill(new Array(2).fill(0));
    this.xp = new Array(this.pCount).fill(new Array(2).fill(0));
    
    for (let i = 0; i < this.pCount; ++i) {
      let coord = null;                                               // TODO: finish
      let a = null;                                                   // TODO: finish
      this.Vp[i] = a;
      this.Mp[i] = a * this.rho;                                      // TODO: finish
      this.xp[i] = null;                                              // TODO: finish
      
      if (this.xp[i][1] < 0.5) {
        this.vp[i][1] = [this.v, this.v];
      } else {
        this.vp[i][1] = [-this.v, -this.v];
      }
      
      this.Fp[i] = [1, 0, 0, 1];
    }
    
    this.Vp0 = this.Vp;
    
    // Nodal initialisation
    this.nmass = new Array(this.nodeCount);
    this.nmomentum = new Array(this.pCount).fill(new Array(2).fill(0));
    this.niforce = new Array(this.pCount).fill(new Array(2).fill(0));
    this.neforce = new Array(this.pCount).fill(new Array(2).fill(0));
  }
  
  calculate(caller) {
    this.nmass.fill(0);
    this.nmomentum.fill(new Array(2).fill(0));
    this.niforce.fill(new Array(2).fill(0));
    
    this.particlesToNodes();
    
    // This has to be calculate as math matrices not javascript arrays
    this.nmomentum = this.nmomentum + this.niforce * this.dtime;
    
    this.nodesToParticles();
    
    // TODO: Add pos and vel lines
    
    for (let i = 0; i < this.pCount; ++i) {
      
    }
  }
  
  particlesToNodes() {
    
  }
  
  nodesToParticles() {
    for (let i = 0; i < this.pCount; )
    let esctr = this.element[i];
  }
}