export class VibratingPoint {
  get numParticles() {
    return 1;
  }
  
  execute() {
    const time = 0.1;
    const dtime = 0.01;
    const L = 2;
    const Mp = 1;
    const Vp = 1;
    const vp = 0.1;
    const s = 0;
    // Young's modulus
    const E = 4 * Math.PI * Math.PI;
    
    let nodes = [];   
    let xp = 0.5 * L;
    let q = Mp * vp; 
    let t = 0;
    this.ta = [];
    this.va = [];
    this.xa = [];
    
    while (t < time) {
      let N1 = 1 - Math.abs(xp - nodes[1]);
      let N2 = 1 - Math.abs(xp - nodes[2]) / L;
      let dN1 = -1 / L;
      let dN2 = 1 /L;
      let m1 = N1 * Mp;
      let m2 = N2 * Mp;
      //let mv1 = N1 * q;
      let mv2 = N2 * q;
      let mv1 = 0;
      let fint1 = -Vp * s * dN1;
      let fint2 = -Vp * s * dN2;
      //let f1 = fint1; 
      let f2 = fint2;
      let f1 = 0;
      mv1 = mv1 + f1 * dtime;
      mv2 = mv2 + f2 * dtime;
      let vp = vp + dtime * (N1* f1 / m1 + N2 * f2 / m2);
      let xp = xp + dtime * (N1*mv1 / m1 + N2 *mv2 / m2);
      let q = Mp * vp;
      let v1 = N1 * Mp * vp / m1;
      let v2 = N2 * Mp * vp / m2;
      v1 = 0; 
      let Lp = dN1 * v1 + dN2 * v2; 
      let dEps = dtime * Lp; 
      let s = s + E * dEps;
      this.ta.push(t);
      this.va.push(vp);
      this.xa.push(xp);
      t = t + dtime;
     }
  }
}