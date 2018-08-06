import MpmAnimation from './mpmanimation.js';

// DEPRECATED: The MPM component is now working with proper
//   MPM coordinates, thus it is not compatible with the VibratingPoint.
export default class VibratingPoint extends MpmAnimation {
  constructor() {
    super();
    VibratingPoint.Mp = 1;
    VibratingPoint.Vp = 1;
    
    // Parameters
    // Young's modulus
    this.E = 0.001 * Math.PI * Math.PI;
    this.L = 200;
    this.dtime = 20;
    this.standardS = 0;
    this.nodes = [1, 100];   
    this.standardVp = 0.1;
    this.standardQ = VibratingPoint.Mp * this.standardVp;
    this.q = [];
    this.s = [];
    this.vp = [];
    this.numParticles = 1;
  }
  
  set numParticles(value) {
    this._numParticles = value;
    this.particles.length = 0;
    this.q.length = 0;
    this.s.length = 0;
    this.vp.length = 0;
    
    for (let i = 0; i < this._numParticles; ++i) {
      this.particles.push(0.5 * this.L);
      this.q.push(this.standardQ);
      this.s.push(this.standardS);
      this.vp.push(this.standardVp);
    }
    
    return this._numParticles;
  }
  
  get numParticles() {
    return this._numParticles;
  }
  
  calculate(caller) {
    this.E = caller.variables.youngModulus != null ? caller.variables.youngModulus * Math.PI * Math.PI : this.E;
    this.L = caller.extend != null ? caller.extend : this.L;
    this.dtime = caller.speed != null ? caller.speed : this.dtime;

    for (let i = 0; i < this.numParticles; ++i) {
      let N1 = 1 - Math.abs(this.particles[i] - this.nodes[0]) / this.L;
      let N2 = 1 - Math.abs(this.particles[i] - this.nodes[1]) / this.L;
      let dN1 = -1 / this.L;
      let dN2 = 1 /this.L;
      let m1 = N1 * VibratingPoint.Mp;
      let m2 = N2 * VibratingPoint.Mp;
      let mv1 = N1 * this.q[i];
      let mv2 = N2 * this.q[i];
      mv1 = 0;
      let fint1 = -VibratingPoint.Vp * this.s[i] * dN1;
      let fint2 = -VibratingPoint.Vp * this.s[i] * dN2;
      let f1 = fint1; 
      let f2 = fint2;
      f1 = 0;
      mv1 = mv1 + f1 * this.dtime;
      mv2 = mv2 + f2 * this.dtime;
      this.vp[i] = this.vp[i] + this.dtime * (N1* f1 / m1 + N2 * f2 / m2);
      this.particles[i] = this.particles[i] + this.dtime * (N1*mv1 / m1 + N2 *mv2 / m2);
      this.q[i] = VibratingPoint.Mp * this.vp[i];
      let v1 = N1 * VibratingPoint.Mp * this.vp[i] / m1;
      let v2 = N2 * VibratingPoint.Mp * this.vp[i] / m2;
      v1 = 0; 
      let Lp = dN1 * v1 + dN2 * v2; 
      let dEps = this.dtime * Lp; 
      this.s[i] = this.s[i] + this.E * dEps;
    }
  }
}
