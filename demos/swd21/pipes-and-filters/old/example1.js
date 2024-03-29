export default class Example1 {
  
    
  static async createView(context) {
    this.context = context
    this.counter = 0
   
    this.context.querySelector("div").addEventListener("click", evt => {
      this.startAnimation()
    })
    
    
    this.startAnimation()
    
    return <div><button click={evt => lively.notify("start")}>start</button>This is my View</div>
  }
  
  static step() {
    this.counter = Math.random() * 50
    this.context.querySelector("div").style.outline = `${this.counter}5px solid blue`
  }
  
  static async startAnimation() {
    if (this.isAnimating) return
    this.isAnimating=true
    while(lively.isInBody(this.context.querySelector("div"))) {
      this.step()
      await lively.sleep(100)
    }
    this.isAnimating=false
    
  }
  
  
}