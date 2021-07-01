export default class Example1 {
  
  static createView(context) {
    
     context.querySelector("div").style.border = "5px solid blue"
    
    return <div>This is my View</div>
  }
  
}