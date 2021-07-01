export default class Example1 {
  
    
  static async createView(context) {
    this.counter = 0
    
    animation()
    
    return <div>This is my View</div>
  }
  
  step() {
    console.log("step...")
    context.querySelector("div").style.border = `${this.counter % 100}5px solid blue`
  }
  
  async animation() {
    if (this.isAnimating) return
    this.isAnimating=true
    while(lively.isInBody(context)) {
      this.step()
      await lively.sleep(100)
    }
    this.isAnimating=false
    
  }
  
  
}