export default class Example1 {
  
  
  
  static createView(context) {
    
     context.querySelector("div").border = "5px solid green"
    
    return <div>This is my View</div>
  }
  
}