import MpmAnimation from './mpmanimation.js';
import Matrix from './matrix.js';
import CircleMesh from 'doc/PX2018/project_2/circlemesh.js';

// Original Source: https://www.researchgate.net/publication/262415477_Material_point_method_basics_and_applications?_sg=yZLOSAsv6oOMKU62vzSyDBmCJ7kCJ6-Qwo0stHaGzQfzVzpwgp30HzJWVvrSqp70tW43-Rg7dQ
// 
// Notes:
// - { } is the so called brace indexer to index cells equivalent
//   to json object functionality
// -

export default class ElasticBodies extends MpmAnimation {
  constructor() {
    super();
    
    // Load particles to initialize data structures
    this.loadCircleMesh().then(() => this.initDataStructures());    
  }
  
  async loadCircleMesh() {
    this.particles = [];
    
    let points1 = await CircleMesh.gmsh(50, -100, 100);
    for (let point of points1) {
      this.particles.push(new Matrix(point));
    }
    let points2 = await CircleMesh.gmsh(50, 100, -100);
    for (let point of points2) {
      this.particles.push(new Matrix(point));
    }
  }
  
  async initDataStructures() {
    this.numElementsV = 20;
    this.numElementsH = 20;
    this.v = 0.3;
    this.pCount = this.particles.length;
    this.nCount = 10;
    this.Mp = Matrix.ones(this.pCount, 1);
    this.Vp = Matrix.ones(this.pCount, 1);
    this.Fp = Matrix.ones(this.pCount, 4);
    this.s = Matrix.zeros(this.pCount, 3);
    this.eps = Matrix.zeros(this.pCount, 3);
    this.vp = Matrix.zeros(this.pCount, 2);
    this.xp = Matrix.zeros(this.pCount, 2);
    this.mpoints = {};                                                          // TODO: finish (what should this be filled with?)
    this.pElems = Matrix.zeros(this.pCount);
    this.rho = 0.2;                                                             // TODO: finish (what is rho?)
    this.Fp = {};
    
    // Storages for plotting (probably not needed because emited after each frame)
    this.pos = {};
    this.vel = {};
    // Number probably used for indexing plotting variables
    this.istep = 0;
    
    this.C = null;                                                              // TODO: finish
    
    for (let i = 0; i < this.pCount; ++i) {
      let coord = this.particles[i];
      let square = new Matrix([[coord.get(0), coord.get(1)], [1, 1]]);
      let a = (square).det() / 2;
      
      this.Vp.set(i, 0, a);
      this.Mp.set(i, 0, a * this.rho);
      this.xp.set(i, 0, coord.mean());
      
      if (this.xp.get(i, 0) < 0.5) {
        this.vp.set(i, 0, new Matrix([this.v, this.v]));
      } else {
        this.vp.set(i, 0, new Matrix([-this.v, -this.v]));
      }
      
      this.Fp[i] = new Matrix([[1, 0], [0, 1]]);
    }
    
    this.Vp0 = this.Vp;
    
    // Nodal initialisation
    this.nmass = Matrix.zeros(this.nCount, 1);
    this.nmomentum = Matrix.zeros(this.nCount, 2);
    this.niforce = Matrix.zeros(this.nCount, 2);
    this.neforce = Matrix.zeros(this.nCount, 2);
  }
  
  calculate(caller) {
    this.nmass = Matrix.zeros(this.nCount, 1);
    this.nmomentum = Matrix.zeros(this.nCount, 2);
    this.niforce = Matrix.zeros(this.nCount, 2);
    
    this.particlesToNodes();
    
    /*
    // This has to be calculate as math matrices not javascript arrays
    this.nmomentum = this.nmomentum + this.niforce * this.dtime;
    
    this.nodesToParticles();
    
    this.pos[this.istep] = this.xp;
    this.vel[this.istep] = this.vp;
    
    for (let i = 0; i < this.pCount; ++i) {
      let x = this.xp[i][1];
      let y = this.xp[i][2];
      let e = Math.floor(x / this.deltaX) + 1 + this.numx2 * Math.floor(y / this.deltaY);   // TODO: finish
    }*/
  }
  
  particlesToNodes() {
    for (let i = 0; i < this.pCount; ++i) {
      let esctr = this.element[i];
      let enode = this.node[esctr];
      let mpts = this.mpoints[i];
      
      for (let j = 0; j < mpts.length; ++i) {
        let pid = mpts[j];
        let pt1 = (2 * this.xp.get(pid, 0) - (enode[1][1] + enode[2][1])) / this.deltaX;      // TODO: finish
        let pt2 = (2 * this.xp.get(pid, 1) - (enode[2][2] + enode[3][2])) / this.deltaX;      // TODO: finish
        let dNdxi = null;                                                                 // TODO: finish
        let N = null;                                                                     // TODO: finish
        let J0 = enode.transpose() * dNdxi;                                           // TODO: finish
        let invJ0 = J0.invert();
        let dNdx = dNdxi.multiply(invJ0);
      }
    }
  }
  
  /*nodesToParticles() {
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
            vI = Math.divide(this.nmomentum[id], this.nmass[id]);
          }

          Lp = Math.add(Lp, Math.multiply(this.derivation(vI), dNdx[k]));
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
  }*/
}