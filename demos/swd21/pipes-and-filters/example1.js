export default class Example1 {
  
    
  static async createView(context) {
    this.context = context
    this.counter = 0
    
    this.animation()
    
    return <div>This is my View</div>
  }
  
  static step() {
    console.log("step...")
    this.context.querySelector("div").style.border = `${this.counter % 100}5px solid blue`
  }
  
  static async animation() {
    if (this.isAnimating) return
    this.isAnimating=true
    while(lively.isInBody(this.context)) {
      this.step()
      await lively.sleep(100)
    }
    this.isAnimating=false
    
  }
  
  
}