
export default async function setup()  {


  // #TODO reuse existing croquet instance....
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



  class GameModel extends Croquet.Model {

    init() {
      this.initFields()
      this.subscribe("field", "toggle", this.toggleField);
      
      this.subscribe(this.sessionId, "view-join", this.viewJoin);
      this.subscribe(this.sessionId, "view-exit", this.viewExit);
    }
    
    viewJoin(viewId) {
      lively.notify("viewJoin " + viewId)
      // const existing = this.views.get(viewId);
      // if (!existing) {
      //   const nickname = this.randomName();
      //   this.views.set(viewId, nickname);
      // }
      // this.participants++;
      // this.publish("viewInfo", "refresh");  
    }
  
    viewExit(viewId) {
      lively.notify("viewExit " + viewId)
      // this.participants--;
      // this.views.delete(viewId);
      // this.publish("viewInfo", "refresh");
    }

    initFields() {
      this.fields = []
      for(var i=0; i < 9; i++) {
        for(var j=0; j < 9; j++) {
          let id = "field_"+i +"_"+j
          var fieldModel = {id: id, i:i, j: j, color: "gray"}
          this.fields.push(fieldModel)
        }
      }
    }
    
    toggleField(id) {
      console.log('updateField ' + id)
      var fieldModel =  this.fields.find(ea => ea.id == id)
               
      if (fieldModel.color === "white") {
        fieldModel.color  = "black"
      } else {
       fieldModel.color  = "white"
      } 

      this.publish("field", "update", fieldModel.id);
    }

    

  }

  self.GameModel = GameModel
  
  GameModel.register("GameModel");


  var pane = <div id="pane" style="position: relative">
  
  </div>

  class GameView extends Croquet.View {

      constructor(model) {
          super(model);
          this.model = model;
          this.setupBoard()
          
          this.subscribe("field", "update", this.updateField);
      }
  
      get(id) {
        return pane.querySelector("#" + id)
      }
  
      updateField(id) {
        var fieldModel = this.model.fields.find(ea => ea.id == id)
        var fieldView = this.get(id)
        
        
        if (!fieldModel || !fieldView) {
          return lively.warn("could not update " + id)
        } 
        fieldView.style.backgroundColor = fieldModel.color
      }


      setupBoard() {
        
        for(let fieldModel of this.model.fields) {
          let fieldView = <div id={fieldModel.id} class="field" style="position: absolute; top: 10px; left: 10px; width: 50px; height: 50px; background-color: gray"></div>
          pane.appendChild(fieldView)
          lively.setPosition(fieldView, lively.pt(10 + fieldModel.j*60 , 10 + fieldModel.i*60))
          fieldView.addEventListener("click", evt => {
            lively.showElement(fieldView)
            this.publish("field", "toggle", fieldModel.id);
          })
          this.updateField(fieldModel.id)
        }
      }

  }

  Croquet.Session.join({
    appId: "org.lively-kernel.game",
    apiKey: "1ebzGo8ghty3C0tPdIPtNx6EgDGBbLpNDJr5t6i33",
    name: "unnamed", // Croquet.App.autoSession()
    password: "secret",
    model: GameModel,
    view: GameView}).then(session => {
    
      self.CroquetSession = session
    
    });
  

  return pane
}