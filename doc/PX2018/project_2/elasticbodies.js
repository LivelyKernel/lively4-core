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
    
    this.deltaX = 20;
    this.deltaY = 20;
    this.elementCount = 400;
    this.elementCountX = 20;
    this.elementCountY = this.elementCount / this.elementCountX;
    this.nCount = 10;
    this.v = 0.3;
    
    // Load particles to initialize data structures
    this.loadCircleMesh().then(() => this.initParticles());    
  }
  
  async loadCircleMesh() {
    this.particles = [];
    
    let points1 = await CircleMesh.gmsh(50, 300, 100);
    for (let point of points1) {
      this.particles.push(new Matrix(point));
    }
    let points2 = await CircleMesh.gmsh(50, 100, 300);
    for (let point of points2) {
      this.particles.push(new Matrix(point));
    }
  }
  
  async initParticles() {
    this.pCount = this.particles.length;
    this.Mp = Matrix.ones(this.pCount, 1);
    this.Vp = Matrix.ones(this.pCount, 1);
    this.Fp = Matrix.ones(this.pCount, 4);
    this.s = Matrix.zeros(this.pCount, 3);
    this.eps = Matrix.zeros(this.pCount, 3);
    this.vp = {};
    this.xp = {};
    this.rho = 0.2;                                                             // TODO: finish (what is rho?)
    this.Fp = {};
    this.pElements = [];
    this.mPoints = [];
    
    // Storages for plotting (probably not needed because emited after each frame)
    this.pos = {};
    this.vel = {};
    // Number probably used for indexing plotting variables
    this.istep = 0;
    
    this.C = null;                                                              // TODO: finish
    
    for (let i = 0; i < this.pCount; ++i) {
      let particle = this.particles[i];
      let square = new Matrix([[particle.get(0), particle.get(1)], [1, 1]]);
      let a = (square).det() / 2;
      
      this.Vp.set(i, 0, a);
      this.Mp.set(i, 0, a * this.rho);
      this.xp[i] = particle;
      
      if (particle.get(1) < 0.5) {
        this.vp[i] = new Matrix([this.v, this.v]);
      } else {
        this.vp[i] = new Matrix([-this.v, -this.v]);
      }
      
      this.Fp[i] = new Matrix([[1, 0], [0, 1]]);
      
      let e = this.findParticleElement(particle.get(0), particle.get(1));
      this.pElements.push(e);
    }
    
    this.Vp0 = this.Vp;
    
    // Nodal initialisation
    this.nmass = Matrix.zeros(this.nCount, 1);
    this.nmomentum = Matrix.zeros(this.nCount, 2);
    this.niforce = Matrix.zeros(this.nCount, 2);
    this.neforce = Matrix.zeros(this.nCount, 2);
    
    for (let i = 0; i < this.elementCount; ++i) {
      this.mPoints.push([]);
      
      for (let j = 0; j < this.pElements.length; ++j) {
        if (this.pElements[j] != i) continue;
        this.mPoints[i].push(j);
      }
    }
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
    for (let i = 0; i < this.elementCount; ++i) {
      let enode = this.getElementNodes(i);
      let mpts = this.mPoints[i];
      
      for (let j = 0; j < mpts.length; ++j) {
        let pid = mpts[j];
        let x = (2 * this.xp[pid].get(0) - (enode.get(0, 0) + enode.get(1, 0))) / this.deltaX;
        let y = (2 * this.xp[pid].get(1) - (enode.get(1, 1) + enode.get(2, 1))) / this.deltaY;
        let N = this.interpValue(x, y);
        let dNdxi = this.interpGradient(x, y);                                                                 // TODO: finish
        let transposed = enode.transpose();
        let J0 = transposed.multiply(dNdxi);
        let invJ0 = J0.invert();
        let dNdx = dNdxi.multiply(invJ0);
        let stress = this.s[pid];
      }
    }
  }
  
  nodesToParticles() {
    for (let i = 0; i < this.pCount; ++i) {
      let enode = this.getElementNodes(i);
      let mpts = this.mPoints[i];
      
      for (let j = 0; i < mpts.length; ++j) {
        let pid = mpts[j];
        let x = (2 * this.xp[pid].get(0) - (enode.get(0, 0) + enode.get(1, 0))) / this.deltaX;
        let y = (2 * this.xp[pid].get(1) - (enode.get(1, 1) + enode.get(2, 1))) / this.deltaY;
        let N = this.interpValue(x, y);
        let dNdxi = this.interpGradient(x, y);
        let J0 = enode.transpose().multiply(dNdxi);
        let invJ0 = J0.invert();
        let dNdx = dNdxi.multiply(invJ0);
        let Lp = Matrix.zeros(2, 2);

        /*for (let k = 0; k < esctr.length; ++k) {
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
        this.s*/
      }
    }
  }
  
  /**
   * Returns the element of a given particle
   * @param x x-coordinate of the particle
   * @param y y-coordinate of the particle
   */
  findParticleElement(x, y) {
    return Math.floor(x / this.deltaX) + this.elementCountX * Math.floor(y / this.deltaY);
  }
  
  getElementNodes(element) {
    let nodes = [];
    let x = element % this.elementCountX;
    let y = Math.floor(element / this.elementCountX);
    nodes.push([x * this.deltaX, y * this.deltaY]);
    nodes.push([(x + 1) * this.deltaX, y * this.deltaY]);
    nodes.push([x * this.deltaX, (y + 1) * this.deltaY]);
    nodes.push([(x + 1) * this.deltaX, (y + 1) * this.deltaY]);
    
    return new Matrix(nodes);
  }
        
  getNodeId(x, y) {
    
  }
  
  // The example uses linear interpolation
  // Taken from https://www.osti.gov/servlets/purl/537397
  
  /**
   *
   */
  interpValue(x, y) {
    let N = Matrix.zeros(4, 1);
    N.set(0, 0, (1 - x) * (1 - y));
    N.set(1, 0, x * (1 - y));
    N.set(2, 0, x * y);
    N.set(3, 0, (1 - x) * y);
    
    return N;
  }
  
  interpGradient(x, y) {
    let G = Matrix.zeros(4, 2);
    // G_x
    G.set(0, 0, -(1 - y) / this.deltaX);
    G.set(1, 0, (1 - y) / this.deltaX);
    G.set(2, 0, y / this.deltaX);
    G.set(3, 0, -y / this.deltaX);
    // G_y
    G.set(0, 1, -(1 - x) / this.deltaY);
    G.set(1, 1, -x / this.deltaY);
    G.set(2, 1, x / this.deltaY);
    G.set(3, 1, (1 - x) / this.deltaY);
    
    return G;
  }
}