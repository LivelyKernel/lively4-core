import MpmAnimation from './mpmanimation.js';
import Math from './math.js';

// Original Source: https://www.researchgate.net/publication/262415477_Material_point_method_basics_and_applications?_sg=yZLOSAsv6oOMKU62vzSyDBmCJ7kCJ6-Qwo0stHaGzQfzVzpwgp30HzJWVvrSqp70tW43-Rg7dQ
// 
// Notes:
// - { } is the so called brace indexer to index cells equivalent
//   to json object functionality
// -

export default class ElasticBodies extends MpmAnimation {
  constructor() {
    super();
    
    this.v = 0.3;
    this.pCount = 200;
    this.nCount = 10;
    this.Mp = Math.ones(this.pCount, 1);
    this.Vp = Math.ones(this.pCount, 1);
    this.Fp = Math.ones(this.pCount, 4);
    this.s = Math.zeros(this.pCount, 3);
    this.eps = Math.zeros(this.pCount, 3);
    this.vp = Math.zeros(this.pCount, 2);
    this.xp = Math.zeros(this.pCount, 2);
    this.mpoints = {};                                                          // TODO: finish (what should this be filled with?)
    this.pElems = Math.zeros(this.pCount);
    
    // Storages for plotting (probably not needed because emited after each frame)
    this.pos = {};
    this.vel = {};
    // Number probably used for indexing plotting variables
    this.istep = 0;
    
    this.C = null;                                                              // TODO: finish
    let node1 = null;
    let element1 = null;
    
    for (let i = 0; i < this.pCount; ++i) {
      let coord = node1[element1];
      let a = Math.det(coord, [1, 1, 1]) / 2;
      this.Vp[i] = a;
      this.Mp[i] = a * this.rho;                                                // TODO: finish (what is rho?)
      this.xp[i] = Math.mean(coord);
      
      if (this.xp[i][1] < 0.5) {
        this.vp[i][1] = [this.v, this.v];
      } else {
        this.vp[i][1] = [-this.v, -this.v];
      }
      
      this.Fp[i] = [1, 0, 0, 1];
    }
    
    this.Vp0 = this.Vp;
    
    // Nodal initialisation
    this.nmass = Math.zeros(this.nCount, 1);
    this.nmomentum = Math.zeros(this.nCount, 2);
    this.niforce = Math.zeros(this.nCount, 2);
    this.neforce = Math.zeros(this.nCount, 2);
  }
  
  calculate(caller) {
    this.nmass = Math.zeros(this.nCount, 1);
    this.nmomentum = Math.zeros(this.nCount, 2);
    this.niforce = Math.zeros(this.nCount, 2);
    
    this.particlesToNodes();
    
    // This has to be calculate as math matrices not javascript arrays
    this.nmomentum = this.nmomentum + this.niforce * this.dtime;
    
    this.nodesToParticles();
    
    this.pos[this.istep] = this.xp;
    this.vel[this.istep] = this.vp;
    
    for (let i = 0; i < this.pCount; ++i) {
      let x = this.xp[i][1];
      let y = this.xp[i][2];
      let e = Math.floor(x / this.deltaX) + 1 + this.numx2 * Math.floor(y / this.deltaY);   // TODO: finish
    }
  }
  
  particlesToNodes() {
    for (let i = 0; i < this.pCount; ++i) {
      let esctr = this.element[i];
      let enode = this.node[esctr];
      let mpts = this.mpoints[i];
    }
  }
  
  nodesToParticles() {
    for (let i = 0; i < this.pCount; ++i) {
      let esctr = this.element[i];
      let enode = this.node[esctr];
      let mpts = this.mpoints[i];
        for (let j = 0; i < mpts.length; ++j) {
          let pid = mpts[j];
          let pt1 = (2 * this.xp[pid][1] - (enode[1][1] + enode[2][1])) / this.deltaX;      // TODO: finish
          let pt2 = (2 * this.xp[pid][2] - (enode[2][2] + enode[3][2])) / this.deltaX;      // TODO: finish
          let dNdxi = null;                                                                 // TODO: finish
          let N = null;                                                                     // TODO: finish
          let J0 = Math.transpose(enode) * dNdxi;                                           // TODO: finish
          let invJ0 = this.invert(J0);
          let dNdx = dNdxi * invJ0;
          let Lp = [[0, 0], [0, 0]];
          
          for (let k = 0; k < esctr.length; ++k) {
            let id = esctr[k];
            let vI = [0, 0];
            
            if (this.nmass[id] > this.tol) {                                                 // TODO: finish
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
}