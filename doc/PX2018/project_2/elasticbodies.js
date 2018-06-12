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
    this.C = null;                                                              // TODO: finish
    let node1 = null;
    let element1 = null;
    
    for (let i = 0; i < this.pCount; ++i) {
      let coord = node1[element1];
      let a = this.det(coord, [1, 1, 1]) / 2;
      this.Vp[i] = a;
      this.Mp[i] = a * this.rho;                                                // TODO: finish (what is rho?)
      this.xp[i] = this.mean(coord);
      
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
      let x = this.xp[i][1];
      let y = this.xp[i][2];
      let e = Math.floor(x / deltaX) + 1 + numx2 * Math.floor(y / deltaY);
    }
  }
  
  particlesToNodes() {
    
  }
  
  nodesToParticles() {
    for (let i = 0; i < this.pCount; ++i) {
      let esctr = this.element[i];
      let enode = this.node[esctr];
      let mpts = null;
        for (let j = 0; i < esctr.length; ++j) {
          let pid = mpts[j];
          let pt1 = (2 * this.xp[pid][1] - (enode[1][1] + enode[2][1])) /deltaX;
          let pt2 = (2 * this.xp[pid][2] - (enode[2][2] + enode[3][2])) /deltaX;
          let J0 = null;                                                          // TODO: finish
          let N = null;                                                           // TODO: finish
          let dNdxi = null;                                                       // TODO: finish
          let invJ0 = this.invert(J0);
          let dNdx = dNdxi * invJ0;
          let Lp = [[0, 0], [0, 0]];
          
          for (let k = 0; k < esctr.length; ++k) {
            let id = esctr[k];
            let vI = [0, 0];
            
            if (this.nmass[id] > tol) {
              this.vp[pid] += this.dtime * N[k] * this.niforce[id] / this.nmass[id];
              this.xp[pid] += this.dtime * N[k] * this.nmomentum[id] / this.nmass[id];
              vI = this.nmomentum[id] / this.nmass[id];
            }
            
            Lp = Lp + this.derivation(vI) * dNdx[k];
          }
          
          // This has to be calculate as math matrices not javascript arrays
          let F = ([[1, 0], [0, 1]] + Lp * this.dtime) * this.reshape(this.Fp[pid], 2, 2);
          this.Fp[pid] = this.reshape(F, 1, 4);
          this.Vp[pid] = this.det(F) * this.Vp0(pid);
          let dEps = this.dtime * 0.5 * (Lp + this.derivation(Lp));
          let dsigma = this.C * [dEps[1][1], dEps[2][2], 2 * dEps[1][2]];
          this.s
        }
    }
  }
  
  det(vector) {
    
  }
  
  invert(vector) {
    
  }
  
  derivation(vector) {
    
  }
  
  reshape(vector, num1, num2) {
    
  }
}