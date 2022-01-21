# Croquet in Lively?

<script>
(async () => {
  
  // return "already active session"
  if (self.CroquetSession) {
    self.CroquetSession.leave()
  }

  // full croquet reload
  if (self.Croquet) {
    self.Croquet = null
    if (self.croquetscript) croquetscript.remove()
  }
  
  
  // await lively.loadJavaScriptThroughDOM("croquetscript", "https://unpkg.com/@croquet/croquet@1.0")
  await lively.loadJavaScriptThroughDOM("croquetscript", "https://lively-kernel.org/lively4/test/croquet.min")
  
  // 

  var style = document.createElement("style")
  style.innerHTML = `#countDisplay {
    font: 64px sans-serif;
    background-color: #fcfcfc;
    height: 90vh;
  }
  `

  var countDisplay = <div id="countDisplay"></div>

  var pane = <div>
    {style}
    {countDisplay}
    </div>
  

  class MyModel extends Croquet.Model {

      init() {
          this.count = 0;
          this.subscribe("counter", "reset", this.resetCounter);
          this.future(1000).tick();
      }

      resetCounter() {
          this.count = 0;
          this.publish("counter", "changed");
      }

      tick() {
          this.count++;
          this.publish("counter", "changed");
          this.future(1000).tick();
      }

  }

  MyModel.register("MyModel");

  class MyView extends Croquet.View {

      constructor(model) {
          super(model);
          this.model = model;
          countDisplay.onclick = event => this.counterReset();
          this.subscribe("counter", "changed", this.counterChanged);
          this.counterChanged();
      }

      counterReset() {
          this.publish("counter", "reset");
      }

      counterChanged() {
          countDisplay.textContent = this.model.count;
      }

  }

  Croquet.Session.join({
    appId: "org.lively-kernel.counter",
    apiKey: "1ebzGo8ghty3C0tPdIPtNx6EgDGBbLpNDJr5t6i33",
    name: "unnamed",
    password: "secret",
    model: MyModel,
    view: MyView}).then(session => {
    
      self.CroquetSession = session
    
    });
  

  return pane
})()
</script>