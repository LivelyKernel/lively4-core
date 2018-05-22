import MpmAnimation from './mpmanimation.js';

export default class VibratingContinuumBar extends MpmAnimation {
  constructor() {
    super();
    
    this.L = 25;
    this.E = 100;
    this.elementCount = 13;
    this.nodes = null;                                          // TODO: finish
    this.elements = null;                                       // TODO: finish
    
    for (let i = 0; i < this.elementCount; ++i) {
      this.elements[i] = null;                                  // TODO: finish
    }
    
    this.nodeCount = null;                                      // TODO: finish
    this.velo = null;                                           // TODO: finish
    // Id of the center mass particle
    this.mId = Math.floor(this.elementCount / 2) + 1;
    this.c = Math.sqrt(this.E / this.rho);
    this.beta1 = Math.PI / 2 / this.L;
    this.omega1 = this.beta1 * this.c;
    this.deltax = this.L / this.elementCount;
    this.xp = null;                                             // TODO: finish
    
    for (let i = 1; i < this.elementCount - 1; ++i) {
      this.xp[i] = 0.5 * (this.nodes[i] + this.nodes[i + 1]);
    }
    this.pCount = this.xp.length;
    this.Mp = this.deltax;                                      // TODO: finish
    this.Vp = this.deltax;                                      // TODO: finish
    this.Fp = null;                                             // TODO: finish
    this.Vp0 = this.Vp;
    this.sp = null;                                             // TODO: finish
    this.vp = null;                                             // TODO: finish
    
    // Initial velocities
    for (let i = 1; i < this.pCount; ++i) {
      this.vp[i] = 0.1 * Math.sin(this.beta1 * this.xp[i]);
    }
    
    this.dtime = 0.1 * this.deltax / this.c;
    this.time = 100;
    this.t = 0;
    
    this.ta = [];
    this.va = [];
    this.xa = [];
  }
  
  calculate(caller) {    
    while (this.t < this.time) {
      let nmass = 0;                                            // TODO: finish
      let nmomentum = 0;                                        // TODO: finish
      let niforce = 0;                                          // TODO: finish
      
      // Grid loop
      for (let i = 1; i < this.elementCount; ++i) {
        let esctr = null;                                       // TODO: finish
        let enode = null;                                       // TODO: finish
        let Le = enode[1] - enode[0];
        let mpts = null;
        
        // Particle loop
        for (let j = 1; mpts.length; ++i) {
          let pid = mpts[j];
          let N1 = 1 - Math.abs(this.xp[pid] - enode[0]) / Le;
          let N2 = 1 - Math.abs(this.xp[pid] - enode[1]) / Le;
          let dN1 = -1 / Le;
          let dN2 = 1 / Le;
          
          nmass[esctr[0]] += N1 * this.Mp[pid];
          nmass[esctr[1]] += N2 * this.Mp[pid];
          nmomentum[esctr[0]] += N1 * this.Mp[pid] * this.vp[pid];
          nmomentum[esctr[1]] += N2 * this.Mp[pid] * this.vp[pid];
          
          niforce[esctr[0]] = niforce[esctr[0]] - this.Vp[pid] * this.sp[pid] * dN1;
          niforce[esctr[1]] = niforce[esctr[1]] - this.Vp[pid] * this.sp[pid] * dN2;
        }
      }
      
      nmomentum[0] = 0;
      niforce[0] = 0;
      
      for (let i = 0; i < this.nodeCount; ++i) {
        nmomentum[i] = nmomentum[i] + niforce[i] * this.dtime;
      }
      
      // Update particles
      for (let i = 1; i < this.elementCount; ++i) {
        let esctr = null;                                       // TODO: finish
        let enode = null;                                       // TODO: finish
        let Le = enode[1] - enode[0];
        let mpts = null;
        
        // Particle loop
        for (let j = 1; mpts.length; ++i) {
          let pid = mpts[j];
          let N1 = 1 - Math.abs(this.xp[pid] - enode[0]) / Le;
          let N2 = 1 - Math.abs(this.xp[pid] - enode[1]) / Le;
          let dN1 = -1 / Le;
          let dN2 = 1 / Le;
          
          if (nmass[esctr[0]] > to1) {
            this.vp[pid] += this.dtime * N1 * niforce[esctr[0]] / nmass[esctr[0]];
          }
          
          if (nmass[esctr[1]] > to1) {
            this.vp[pid] += this.dtime * N2 * niforce[esctr[1]] / nmass[esctr[1]];
          }
          
          this.xp[pid] = this.dtime * (N1 * nmomentum[esctr[0]] / nmass[esctr[0]] + 
                                       N2 * nmomentum[esctr[1]] / nmass[esctr[1]]);
          let v1 = nmomentum[esctr[0]] / nmass[esctr[0]];
          let v2 = nmomentum[esctr[1]] / nmass[esctr[1]];
          let Lp = dN1 * v1 + dN2 * v2;
          this.Fp[pid] = (1 + Lp * this.dtime) * this.Fp[pid];
          this.Vp[pid] = this.Fp[pid] + this.Vp0[pid];
          let dEps = this.dtime * Lp;
          this.sp[pid] = this.sp[pid] + this.E * dEps;
        }
      }
    }
  }
}