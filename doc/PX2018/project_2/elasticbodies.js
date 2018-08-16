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
    this.elementCount = 100; // the grid
    this.elementCountX = 10;
    this.elementCountY = this.elementCount / this.elementCountX;
    this.nCount = (this.elementCountX + 1) * (this.elementCountY + 1);
    this.v = 10; // initial velocity
    this.dtime = 0.05; // time step
    this.tol = 5; // cutoff value for small masses .. Nguyen2014MPM (22)
    this.rho = 10; // density
    this.r = 50; // particle radius 
    
    this.oneDisk = oneDisk; // one or two disks...
    
    // Stores information for visualisation
    this._displayVariables = [];
    this._showVariables = false;
  }
  
//   set particles(value) {
//     this._particles = value
//     // this.initParticles()
//   }
  
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
    this.pCount = this.particles.length; // number of particles
    this.Mp = Matrix.ones(this.pCount, 1); // mass
    this.Vp = Matrix.ones(this.pCount, 1); // volume
    this.Fp = []; // gradient deformation
    this.s = [];  // stress
    this.eps = []; // strain ??
    this.vp = []; // velocity
    this.xp = []; // position
    this.pElements = []; // ??
    this.mPoints = []; // ?
    this.C = 100; // ?
    
    // The initialisation code does not make much sense in the paper
    for (let i = 0; i < this.pCount; ++i) {
      let particle = this.particles[i];
      
      this.Vp.set(i, 0, Math.PI * this.r * this.r); // initial volume 
      this.Mp.set(i, 0, Math.PI * this.r * this.r * this.rho); // intial mass
      
      // The initial velocities need to be adjusted to fit canvas coordinates
      // and not the coordinates given in the paper.
      if (particle.get(1) > (this.deltaX * this.elementCountX / 2)) {
        this.vp.push(new Matrix([this.v, -this.v]));
      } else {
        this.vp.push(new Matrix([-this.v, this.v]));
      }
      
      this.Fp.push(new Matrix([[1, 0], [0, 1]]));
      this.s.push(Matrix.zeros(3));
      this.eps.push(Matrix.zeros(3));
    }
    
    this.Vp0 = this.Vp;
    
    // Nodal initialisation
    this.nmass = [];
    this.nmomentum = Matrix.zeros(this.nCount, 2);
    this.niforce = Matrix.zeros(this.nCount, 2); // nodal internal force vector
    this.neforce = []; // nodal external force vector

    for (let i = 0; i < this.nCount; ++i) {
      this.nmass.push(Matrix.zeros(1));
      this.neforce.push(Matrix.zeros(2));
    }
    
    this.updateParticleNodeRelation();
  }
  
  /* Algorithm from: Nguyen 2014. Material point method: basics and applications,Box 5.1, S.11  
  
    Solution procedure of an explicit MPM code: USL formulation.
    
    1. Initialisation phase
      (a) Particle distribution in the undeformed conﬁguration
      (b) Grid set up
      (c) Initialise particle quantities such as mass, stress, strain etc.
    2. Solution phase for time step t to t + ∆t
      (a) Mapping from particles to nodes 
        - i. Compute nodal mass mt I = Pp NI(xt p)Mp 
        - ii. Compute nodal momentum (mv)t I =Pp NI(xt p)(Mv)t p 
        - iii. Compute external force fext,t I 
        - iv. Compute internal force fint I = −Pnp p=1 Vpσp∇NI(xp) 
        - v. Compute nodal force fI = fext I + fint I 
      (b) Update the momenta (mv)t+∆t I = (mv)t I + fI∆t 
      (c) Mapping from nodes to particles 
        - i. Update particle velocities vt+∆t p = vt p + ∆tPI NI(xp)ft I/mt I 
        - ii. Update particle positions xt+∆t p = xt p + ∆tPI NI(xp)(mv)t+∆t I /mt I 
        - iii. Update nodal velocities vt+∆t I = (mv)t+∆t I /mt I 
        - iv. Update gradient velocity Lt+∆t p =PI ∇NI(xp)vt+∆t I 
        - v. Updated gradient deformation tensor Ft+∆t p = (I + Lt+∆t p ∆t)Ft p 
        - vi. Update volume V t+∆t p = det Ft+∆t p V 0 p . 
        - vii. Update stresses σt+∆t p = σt p + ∆σp
    3. Reset the grid (if it was updated) and advance to the next time step."

*/

  
  calculate(caller) {
    if (!this.stepCounter) this.stepCounter = 0;
    
    this.stepCounter++
    
    if (!this._displayVariables) {
      this._displayVariables = [];
    }
    
    // reset grid data
    this.nmass.length = 0;
    for (let i = 0; i < this.nCount; ++i) {
      this.nmass.push(0);
    }
    this.nmomentum = Matrix.zeros(this.nCount, 2);
    this.niforce = Matrix.zeros(this.nCount, 2);
    
    this.particlesToNodes();
    
    // This has to be calculate as math matrices not javascript arrays
    this.nmomentum = this.nmomentum.add(this.niforce.multiply(this.dtime));
    
    this.nodesToParticles();
    
    if (this._showVariables) {
      
      var K = 0
      for (let i = 0; i < this.pCount; ++i) {
        var eachK = this.vp[i].multiply(this.vp[i]).multiply(this.Mp.get(i,0)).multiply(0.5)
        K += Number(eachK)
        this._displayVariables.push({
          step: this.stepCounter,
          n: i, 
          "Mp": this.Mp.get(i, 0),
          "pVelocity": this.vp[i], 
          "Stress": this.s[i],
          "strain": this.eps[i],
          K: eachK
        })
        
        
        // this._displayVariables["Mp"].push(this.Mp.get(i))
        // // this._displayVariables["K"].push(0.5 * this.vp[i] * this.vp[i] * this.Mp.get(i))
      }

      this._displayVariables.push({
          step: this.stepCounter,
          n: "all", 
          "K": K
        })

    }
    
    this.updateParticleNodeRelation();
  }
  
  particlesToNodes() {
    for (let i = 0; i < this.elementCount; ++i) { // loop over elements, e.g. the grid
      // esctr ... element connectivity #Missing? 
      // there seems to be another level... elements, that somehow capsulate particles
      let nodes = this.getElementNodes(i);
      let enode = new Matrix(nodes); //
      let mpts = this.mPoints[i];
      
      for (let j = 0; j < mpts.length; ++j) { // loop over particles
        let pid = mpts[j]; // particle ID
        let x = (2 * this.particles[pid].get(0) - (enode.get(0, 0) + enode.get(1, 0))) / this.deltaX;
        let y = (2 * this.particles[pid].get(1) - (enode.get(1, 1) + enode.get(2, 1))) / this.deltaY;
        //let x = (this.particles[pid].get(0) - enode.get(0, 0)) / this.deltaX;
        //let y = (this.particles[pid].get(1) - enode.get(0, 1)) / this.deltaY;
        let N = this.interpValue(x, y); // element shape function
        let dNdxi = this.interpGradient(x, y);
        let transposed = enode.transpose();
        let J0 = transposed.multiply(dNdxi); // elementg Jacobian matrix
        let invJ0 = J0.invert();
        let dNdx = dNdxi.multiply(invJ0); 
        // particle mass and momentum to node
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
          let niforceX = this.niforce.get(nodeId, 0)  
            - (this.Vp.get(pid, 0) * (stress.get(0) * dNIdx + stress.get(2) * dNIdy) + N.get(k, 0) * this.niforce.get(nodeId, 0));
          let niforceY = this.niforce.get(nodeId, 1) 
            - (this.Vp.get(pid, 0) * (stress.get(2) * dNIdx + stress.get(1) * dNIdy) + N.get(k, 0) * this.niforce.get(nodeId, 1));
          this.niforce.set(nodeId, 0, niforceX);
          this.niforce.set(nodeId, 1, niforceY);
          
          
        }
      }
    }
  }
  
  nodesToParticles() {
    for (let i = 0; i < this.elementCount; ++i) { // loop over elements
      let nodes = this.getElementNodes(i);
      let enode = new Matrix(nodes);
      let mpts = this.mPoints[i];
      
      for (let j = 0; j < mpts.length; ++j) { // loop over particles
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
        this.eps[pid] = this.eps[pid].add(new Matrix([dEps.get(0,0), dEps.get(1,1), 2*dEps.get(0,1)])); 
        
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

// live dev

// #UPDATE_INSTANCES
document.querySelectorAll("lively-mpm").forEach(mpm => {

  //after updating elasticbodies.js, the class changes
  mpm.animation.constructor === ElasticBodies

  // we can fix this, so we can do live development again....
  mpm.animation.__proto__ = ElasticBodies.prototype
  
})

