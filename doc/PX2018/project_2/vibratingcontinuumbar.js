import MpmAnimation from './mpmanimation.js';

export default class VibratingContinuumBar extends MpmAnimation {
  constructor() {
    super();
    
    this.L = 25;
    this.E = 100;
    this.elementCount = 13;
    this.nodes = Array.apply(null, {length: this.elementCount + 1}).map(Number.call, Number).map(n => (this.L / this.elementCount) * n);
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
    
    this.Fp = Array(this.pCount).fill(1);
    this.Vp0 = this.Vp;
    this.sp = new Array(this.pCount).fill(0);
    this.vp = new Array(this.pCount).fill(0);
    
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
    
    this.nmass = new Array(this.nodeCount).fill(0);
    this.nmomentum = new Array(this.nodeCount).fill(0);
    this.niforce = new Array(this.nodeCount).fill(0);
    this.neforce = new Array(this.nodeCount).fill(0);
  }
  
  calculate(caller) {    
    this.nmass = 0;                                            // TODO: finish
    this.nmomentum = 0;                                        // TODO: finish
    this.niforce = 0;                                          // TODO: finish

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

        this.nmass[esctr[0]] += N1 * this.Mp[pid];
        this.nmass[esctr[1]] += N2 * this.Mp[pid];
        this.nmomentum[esctr[0]] += N1 * this.Mp[pid] * this.vp[pid];
        this.nmomentum[esctr[1]] += N2 * this.Mp[pid] * this.vp[pid];

        this.niforce[esctr[0]] = this.niforce[esctr[0]] - this.Vp[pid] * this.sp[pid] * dN1;
        this.niforce[esctr[1]] = this.niforce[esctr[1]] - this.Vp[pid] * this.sp[pid] * dN2;
      }
    }

    this.nmomentum[0] = 0;
    this.niforce[0] = 0;

    for (let i = 0; i < this.nodeCount; ++i) {
      this.nmomentum[i] = this.nmomentum[i] + this.niforce[i] * this.dtime;
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

        if (this.nmass[esctr[0]] > to1) {
          this.vp[pid] += this.dtime * N1 * this.niforce[esctr[0]] / this.nmass[esctr[0]];
        }

        if (this.nmass[esctr[1]] > to1) {
          this.vp[pid] += this.dtime * N2 * this.niforce[esctr[1]] / this.nmass[esctr[1]];
        }

        this.xp[pid] = this.dtime * (N1 * this.nmomentum[esctr[0]] / this.nmass[esctr[0]] + 
                                     N2 * this.nmomentum[esctr[1]] / this.nmass[esctr[1]]);
        let v1 = this.nmomentum[esctr[0]] / this.nmass[esctr[0]];
        let v2 = this.nmomentum[esctr[1]] / this.nmass[esctr[1]];
        let Lp = dN1 * v1 + dN2 * v2;
        this.Fp[pid] = (1 + Lp * this.dtime) * this.Fp[pid];
        this.Vp[pid] = this.Fp[pid] + this.Vp0[pid];
        let dEps = this.dtime * Lp;
        this.sp[pid] = this.sp[pid] + this.E * dEps;
      }
    }
  }
}