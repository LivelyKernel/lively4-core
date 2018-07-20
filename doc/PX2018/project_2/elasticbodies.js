import MpmAnimation from './mpmanimation.js';
import Matrix from './matrix.js';
import CircleMesh from 'doc/PX2018/project_2/circlemesh.js';

// Original Source:
//  Title: Material point method: basics and applications
//  Link: https://www.researchgate.net/publication/262415477_Material_point_method_basics_and_applications?_sg=yZLOSAsv6oOMKU62vzSyDBmCJ7kCJ6-Qwo0stHaGzQfzVzpwgp30HzJWVvrSqp70tW43-Rg7dQ


// Link that uses linear interpolation with normal formulars:
// https://github.com/dsrim/mpm-matlab/blob/master/mpmtools/I2p.m

// Some other interpolation formulars
// https://github.com/mjrodriguez/mpm_lab_2d/blob/master/source/INTERPOLATION.cpp
// https://mospace.umsystem.edu/xmlui/bitstream/handle/10355/46077/research.pdf?sequence=1
// FEM: https://www.codeproject.com/script/Articles/ViewDownloads.aspx?aid=579983

export default class ElasticBodies extends MpmAnimation {
  constructor(oneDisk = false) {
    super();
    
    this.deltaX = 40;
    this.deltaY = 40;
    this.elementCount = 100;
    this.elementCountX = 10;
    this.elementCountY = this.elementCount / this.elementCountX;
    this.nCount = (this.elementCountX + 1) * (this.elementCountY + 1);
    this.v = 10;
    this.dtime = 0.05;
    this.tol = 5;
    this.rho = 10;
    this.r = 50;
    this.oneDisk = oneDisk;
    
    // Stores information for visualisation
    this._displayVariables = {};
    this._showVariables = false;
  }
  
  set speed(value) {
    this.dtime = value;
  }
  
  async init() {
    // Load particles to initialize data structures
    await this.loadCircleMesh();  
    this.initParticles();
  }
  
  async loadCircleMesh() {
    this.particles = [];
    
    let points1 = await CircleMesh.gmsh(this.r, 100, 300);
    for (let point of points1) {
      this.particles.push(new Matrix(point));
    }
    
    if (this.oneDisk) return;
      
    let points2 = await CircleMesh.gmsh(this.r, 300, 100);
    for (let point of points2) {
      this.particles.push(new Matrix(point));
    }
  }
  
  get showElements() {
    return true;
  }
  
  get numElements() {
    return this.elementCount;
  }
  
  get elementSize() {
    return [this.deltaX, this.deltaY];
  }
  
  get displayVariables() {
    return this._displayVariables;
  }
  
  set showVariables(value) {
    this._showVariables = value;
  }
  
  get showVariables() {
    return this._showVariables;
  }
  
  initParticles() {
    this.pCount = this.particles.length;
    this.Mp = Matrix.ones(this.pCount, 1);
    this.Vp = Matrix.ones(this.pCount, 1);
    this.Fp = [];
    this.s = [];
    this.vp = [];
    this.pElements = [];
    this.mPoints = [];
    this.C = 100;
    
    // The initialisation code does not make much sense in the paper
    for (let i = 0; i < this.pCount; ++i) {
      let particle = this.particles[i];
      
      this.Vp.set(i, 0, Math.PI * this.r * this.r);
      this.Mp.set(i, 0, Math.PI * this.r * this.r * this.rho);
      
      // The initial velocities need to be adjusted to fit canvas coordinates
      // and not the coordinates given in the paper.
      if (particle.get(1) > (this.deltaX * this.elementCountX / 2)) {
        this.vp.push(new Matrix([this.v, -this.v]));
      } else {
        this.vp.push(new Matrix([-this.v, this.v]));
      }
      
      this.Fp.push(new Matrix([[1, 0], [0, 1]]));
      this.s.push(Matrix.zeros(3));
    }
    
    this.Vp0 = this.Vp;
    
    // Nodal initialisation
    this.nmass = [];
    this.nmomentum = Matrix.zeros(this.nCount, 2);
    this.niforce = Matrix.zeros(this.nCount, 2);
    this.neforce = [];
    for (let i = 0; i < this.nCount; ++i) {
      this.nmass.push(Matrix.zeros(1));
      this.neforce.push(Matrix.zeros(2));
    }
    
    this.updateParticleNodeRelation();
  }
  
  calculate(caller) {
    this._displayVariables = {};
    this.nmass.length = 0;
    this.nmomentum = Matrix.zeros(this.nCount, 2);
    this.niforce = Matrix.zeros(this.nCount, 2);
    for (let i = 0; i < this.nCount; ++i) {
      this.nmass.push(0);
    }
    
    this.particlesToNodes();
    
    // This has to be calculate as math matrices not javascript arrays
    this.nmomentum = this.nmomentum.add(this.niforce.multiply(this.dtime));
    
    this.nodesToParticles();
    
    if (this._showVariables) {
      this._displayVariables["pVelocity"] = [];
      this._displayVariables["Stress"] = [];
      for (let i = 0; i < this.pCount; ++i) {
        this._displayVariables["pVelocity"].push("(" + Math.round(this.vp[i].get(0) * 100) / 100 + ", " + Math.round(this.vp[i].get(1) * 100) / 100 + ")");
        this._displayVariables["Stress"].push("(" + this.s[i].get(0) + ", " + this.s[i].get(1) + ", " + this.s[i].get(2) + ")");
      }
    }
    
    this.updateParticleNodeRelation();
  }
  
  particlesToNodes() {
    for (let i = 0; i < this.elementCount; ++i) {
      let nodes = this.getElementNodes(i);
      let enode = new Matrix(nodes);
      let mpts = this.mPoints[i];
      
      for (let j = 0; j < mpts.length; ++j) {
        let pid = mpts[j];
        let x = (2 * this.particles[pid].get(0) - (enode.get(0, 0) + enode.get(1, 0))) / this.deltaX;
        let y = (2 * this.particles[pid].get(1) - (enode.get(1, 1) + enode.get(2, 1))) / this.deltaY;
        //let x = (this.particles[pid].get(0) - enode.get(0, 0)) / this.deltaX;
        //let y = (this.particles[pid].get(1) - enode.get(0, 1)) / this.deltaY;
        let N = this.interpValue(x, y);
        let dNdxi = this.interpGradient(x, y);
        let transposed = enode.transpose();
        let J0 = transposed.multiply(dNdxi);
        let invJ0 = J0.invert();
        let dNdx = dNdxi.multiply(invJ0);
        let stress = this.s[pid];
        for (let k = 0; k < nodes.length; ++k) {
          let nodeId = this.getNodeId(nodes[k][0], nodes[k][1]);
          let dNIdx = dNdx.get(k, 0);
          let dNIdy = dNdx.get(k, 1);
          this.nmass[nodeId] = this.nmass[nodeId] + N.get(k, 0) * this.Mp.get(pid, 0);
          let curMomentum = new Matrix([this.nmomentum.get(nodeId, 0), this.nmomentum.get(nodeId, 1)]);
          curMomentum = curMomentum.add(this.vp[pid].multiply(N.get(k, 0) * this.Mp.get(pid, 0)));
          this.nmomentum.set(nodeId, 0, curMomentum.get(0));
          this.nmomentum.set(nodeId, 1, curMomentum.get(1));
          let niforceX = this.niforce.get(nodeId, 0) + N.get(k, 0) * this.niforce.get(nodeId, 0) - this.Vp.get(pid, 0) * (stress.get(0) * dNIdx + stress.get(2) * dNIdy);
          let niforceY = this.niforce.get(nodeId, 1) + N.get(k, 0) * this.niforce.get(nodeId, 1) - this.Vp.get(pid, 0) * (stress.get(2) * dNIdx + stress.get(1) * dNIdy);
          this.niforce.set(nodeId, 0, niforceX);
          this.niforce.set(nodeId, 1, niforceY);
          
          
        }
      }
    }
  }
  
  nodesToParticles() {
    for (let i = 0; i < this.elementCount; ++i) {
      let nodes = this.getElementNodes(i);
      let enode = new Matrix(nodes);
      let mpts = this.mPoints[i];
      
      for (let j = 0; j < mpts.length; ++j) {
        let pid = mpts[j];
        let x = (2 * this.particles[pid].get(0) - (enode.get(0, 0) + enode.get(1, 0))) / this.deltaX;
        let y = (2 * this.particles[pid].get(1) - (enode.get(1, 1) + enode.get(2, 1))) / this.deltaY;
        //let x = (this.particles[pid].get(0) - enode.get(0, 0)) / this.deltaX;
        //let y = (this.particles[pid].get(1) - enode.get(0, 1)) / this.deltaY;
        let N = this.interpValue(x, y);
        let dNdxi = this.interpGradient(x, y);
        let transposed = enode.transpose();
        let J0 = transposed.multiply(dNdxi);
        let invJ0 = J0.invert();
        let dNdx = dNdxi.multiply(invJ0);
        let Lp = Matrix.zeros(2, 2);
        for (let k = 0; k < nodes.length; ++k) {
          let nodeId = this.getNodeId(nodes[k][0], nodes[k][1]);
          let vI = new Matrix([0, 0]);
          
          if (this.nmass[nodeId] > this.tol) {
            let niforce = new Matrix([this.niforce.get(nodeId, 0), this.niforce.get(nodeId, 1)]);
            let nmomentum = new Matrix([this.nmomentum.get(nodeId, 0), this.nmomentum.get(nodeId, 1)]);
            this.vp[pid] = this.vp[pid].add(niforce.multiply(this.dtime * N.get(k, 0)).divide(this.nmass[nodeId]));
            let add = nmomentum.multiply(this.dtime * N.get(k, 0)).divide(this.nmass[nodeId]);
            this.particles[pid] = this.particles[pid].add(add);
            let curMomentum = new Matrix([this.nmomentum.get(nodeId, 0), this.nmomentum.get(nodeId, 1)]);
            vI = curMomentum.divide(this.nmass[nodeId]);
          }

          let dNdxSingle = new Matrix([dNdx.get(k, 0), dNdx.get(k, 1)]);
          Lp = Lp.add(vI.transpose().multiply(dNdxSingle));
        }

        let F = (new Matrix([[1, 0], [0, 1]]).add(Lp.multiply(this.dtime))).multiply(this.Fp[pid].reshape(2, 2));
        this.Fp[pid] = F.reshape(1, 4);
        this.Vp.set(pid, 0, F.det() * this.Vp0.get(pid, 0));
        let dEps = Lp.add(Lp.transpose()).multiply(this.dtime * 0.5);
        let dsigma = (new Matrix([dEps.get(0, 0), dEps.get(1, 1), 2 * dEps.get(0, 1)])).multiply(this.C);
        this.s[pid] = this.s[pid].add(dsigma.transpose());
      }
    }
  }
  
  updateParticleNodeRelation() {
    // Update particle list
    this.pElements.length = 0;
    for (let i = 0; i < this.pCount; ++i) {
      let x = this.particles[i].get(0);
      let y = this.particles[i].get(1);
      let e = this.findParticleElement(x, y);
      this.pElements.push(e);
    }
    
    this.mPoints.length = 0;
    // Update particle node relations
    for (let i = 0; i < this.elementCount; ++i) {
      this.mPoints.push([]);
      
      for (let j = 0; j < this.pElements.length; ++j) {
        if (this.pElements[j] != i) continue;
        this.mPoints[i].push(j);
      }
    }
  }
  
  /**
   * Returns the element of a given particle
   * @param x x-coordinate of the particle
   * @param y y-coordinate of the particle
   */
  findParticleElement(x, y) {
    let element = Math.floor(x / this.deltaX) + this.elementCountX * Math.floor(y / this.deltaY);
    return element;
  }
  
  getElementNodes(element) {
    let nodes = [];
    let x = element % this.elementCountX;
    let y = Math.floor(element / this.elementCountX);
    nodes.push([x * this.deltaX, y * this.deltaY]);
    nodes.push([(x + 1) * this.deltaX, y * this.deltaY]);
    nodes.push([(x + 1) * this.deltaX, (y + 1) * this.deltaY]);
    nodes.push([x * this.deltaX, (y + 1) * this.deltaY]);
    
    return nodes;
  }
        
  getNodeId(x, y) {
    let id = x % this.deltaX + Math.floor(y / this.deltaY) * this.elementCountX;
    return id;
  }
  
  interpValue(x, y) {
    return this.interpValue1(x, y);
  }
  
  interpGradient(x, y) {
    return this.interpGradient1(x, y);
  }
  
  // The example uses linear interpolation
  // 1: According to Stefans paper; Requires 0 <= x <= 1 && 0 <= y <= 1
  // https://www.osti.gov/servlets/purl/537397
  interpValue1(x, y) {
    let N = Matrix.zeros(4);
    N.set(0, 0, x * y);
    N.set(1, 0, (1 - x) * y);
    N.set(2, 0, x * (1 - y));
    N.set(3, 0, (1 - x) * (1 - y));
    
    return N;
  }
  
  interpGradient1(x, y) {
    let G = Matrix.zeros(4, 2);
    // G_x
    G.set(3, 0, -(1 - y) / this.deltaX);
    G.set(2, 0, (1 - y) / this.deltaX);
    G.set(1, 0, y / this.deltaX);
    G.set(0, 0, -y / this.deltaX);
    // G_y
    G.set(3, 1, -(1 - x) / this.deltaY);
    G.set(2, 1, -x / this.deltaY);
    G.set(1, 1, x / this.deltaY);
    G.set(0, 1, (1 - x) / this.deltaY);
    
    return G;
  }
  
  // 2: According to http://pure.au.dk/portal/files/116802415/Material-point_method_analysis_of_bending_in_elastic_beams
  // Interpolation coordinates are more like in https://www.researchgate.net/publication/262415477_Material_point_method_basics_and_applications
  // Math behind: http://www.iws.uni-stuttgart.de/institut/hydrosys/lehre/mhs/English/Lecture/4_fem_isopara.pdf
  //              http://www.uniroma2.it/didattica/TCM/deposito/2-D_elements.pdf
  interpValue2(x, y) {
    let N = Matrix.zeros(4);
    
    N.set(0, 0, 1/4 * (1 - x) * (1 - y));
    N.set(1, 0, 1/4 * (1 + x) * (1 - y));
    N.set(2, 0, 1/4 * (1 + x) * (1 + y));
    N.set(3, 0, 1/4 * (1 - x) * (1 + y));
    
    return N;
  }
  
  interpGradient2(x, y) {
    let G = Matrix.zeros(4, 2);
    // G_x
    G.set(0, 0, (y - 1) / 4);
    G.set(1, 0, -(y - 1) / 4);
    G.set(2, 0, (y + 1) / 4);
    G.set(3, 0, -(y + 1) / 4);
    // G_y
    G.set(0, 1, (x - 1) / 4);
    G.set(1, 1, -(x + 1) / 4);
    G.set(2, 1, (x + 1) / 4);
    G.set(3, 1, -(x - 1) / 4);
    
    return G;
  }
}