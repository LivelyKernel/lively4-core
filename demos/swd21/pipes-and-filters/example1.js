export default class Example1 {
  
    
  static async createView(context) {
    var counter = 0
    
    animation()
    
    
    return <div>This is my View</div>
  }
  
  async animation() {
    if (this.isAnimating) return
    this.isAnimating=true
    while(lively.isInBody(context)) {
      context.querySelector("div").style.border = "5px solid blue"
      
      await lively.sleep(100)
    }
    this.isAnimating=false
    
  }
  
  
}