"enable aexpr";

export default class AexprExample {
    constructor(...args) {
      this.x = 1;
      this.y = 1;
      this.expr = aexpr(() => this.x+this.y);
      this.expr.onChange(()=>lively.notify(""+this.x+" "+this.y))
    }
  
    dispose() {
      this.expr.dispose();
    }
}