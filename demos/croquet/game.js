
export default async function setup()  {

  // #TODO reuse existing croquet instance....
  // return "already active session"
  if (self.CroquetSession) {
    self.CroquetSession.leave()
  }
  document.body.querySelectorAll("#croquet_spinnerOverlay").forEach(ea => ea.remove())
  // full croquet reload
  if (self.Croquet) {
    self.Croquet = null
    if (self.croquetscript) croquetscript.remove()
  }
  // await lively.loadJavaScriptThroughDOM("croquetscript", "https://unpkg.com/@croquet/croquet@1.0")
  // await lively.loadJavaScriptThroughDOM("croquetscript", "https://lively4/scheme/cached/https://lively-kernel.org/lively4/test/croquet.min")
  await lively.loadJavaScriptThroughDOM("croquetscript", "https://lively-kernel.org/lively4/test/croquet.min")


  class GameModel extends Croquet.Model {
   
    init() {
      // touched...
      this.initFields()
      this.players = []
      this.playerCounter = 0
      
      // check if this works with snapshots...
      this.subscribe("field", "toggle", this.toggleField);
      this.subscribe("field", "playercolor", this.setFieldPlayerColor);
      
      this.subscribe(this.sessionId, "view-join", this.viewJoin);
      this.subscribe(this.sessionId, "view-exit", this.viewExit);
      
      
      this.subscribe("player", "color", this.changePlayerColor);
    }
    
    getPlayer(viewId) {
      return this.players.find(ea => ea.viewId == viewId)
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
      this.addPlayer(viewId)
    }
  
    viewExit(viewId) {
      lively.notify("viewExit " + viewId)
      // this.participants--;
      // this.views.delete(viewId);
      // this.publish("viewInfo", "refresh");
      
       this.removePlayer(viewId)
    }
    
    
    changePlayerColor(data) {
      var player = this.getPlayer(data.viewId)
      player.color = data.color
      this.publish("player", "colorChanged", {viewId: player.viewId, color: data.color})
    }

    addPlayer(viewId) {
      this.removePlayer(viewId)
      var player = {viewId, name: "Player " + this.playerCounter++}
      this.players.push(player)
      this.publish("players", "update")
      return player
    }
    
    removePlayer(viewId) {
      this.players = this.players.filter(ea => ea.viewId != viewId)
      this.publish("players", "update")
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
    
    getField(id) {
      return  this.fields.find(ea => ea.id == id)
    }
    
    toggleField(id) {
      var fieldModel =  this.getField(id)
      if (fieldModel.color === "white") {
        fieldModel.color  = "black"
      } else {
       fieldModel.color  = "white"
      } 

      this.publish("field", "update", fieldModel.id);
    }

    setFieldPlayerColor(data) {
      var player = this.getPlayer(data.viewId) 
      var field = this.getField(data.fieldId)
      field.color = player.color
      this.publish("field", "update", field.id);
    }
    
    

  }

  self.GameModel = GameModel
  
  GameModel.register("GameModel");

  var pane = <div id="pane" style="position: relative">
    <style>{`
      
      .field {
        position: absolute; 
        top: 10px; 
        left: 10px; 
        width: 50px; 
        height: 50px; 
        background-color: gray;
        border: 1px solid black;
      }
      #players {
        position: absolute;
        top: 0px;
        left: 600px;
        background-color: gray;
      }     
      

      `     
      }</style>
      <div id="players">no players</div>
  </div>
      

  class GameView extends Croquet.View {

      constructor(model) {
          super(model);
          this.model = model;
          this.setupBoard()
          
          this.subscribe("field", "update", this.updateField);
          this.subscribe("players", "update", this.updatePlayers);
        
          this.subscribe("player", "colorChanged", this.updatePlayerColor);
        
          this.updatePlayers()
        
      }
  
      get(id) {
        return pane.querySelector("#" + id)
      }
    
      myPlayer() {
        return this.models.getPlayer(this.viewId)
      }
    
      async updatePlayers() {
        lively.notify("update players")
        var newContent = []
        for(let player of this.model.players) {
          let colorChooser = await (<lively-crayoncolors id="color"></lively-crayoncolors>)
          colorChooser.value = player.color
          if (player.viewId === this.viewId) {
            colorChooser.addEventListener("color-choosen", evt => {
             this.onPlayerColorChanged(player, evt.detail.value)
            });              
            var item = <div id={"player" + player.viewId} class="myself player">{colorChooser}
                  <b>{player.name}</b></div>
          } else {
            colorChooser.style.pointerEvents = "none";
            item = <div id={"player" + player.viewId} class="player">{colorChooser}{player.name}</div>
          }
          newContent.push(item)
        }

        let list = this.get("players")
        // do this atomically 
        list.innerHTML = ""
        for(let ea of newContent) {
          list.appendChild(ea)  
        }
      }
      
      updatePlayerColor(data) {
        var playerIem = this.get("players").querySelector("#player" + data.viewId)
        var player = this.model.getPlayer(data.viewId)
        // lively.notify("change player " + player.name + " color " + data.viewId)
        var crayons = playerIem.querySelector("#color")
        crayons.value = data.color
        
      }
    
      onPlayerColorChanged(player, color) {
        this.publish("player", "color", {viewId: player.viewId, color})        
      }
    
  
      updateField(id) {
        var fieldModel = this.model.getField(id)
        var fieldView = this.get(id)
        
        
        if (!fieldModel || !fieldView) {
          return lively.warn("could not update " + id)
        } 
        fieldView.style.backgroundColor = fieldModel.color
      }

      updateFields() {
        for(let field of this.model.fields) {
          this.updateField(field.id)
        }
      }
    
    
      setupBoard() {
        pane.view = this
        
        var oldFields =  Array.from(pane.querySelectorAll(".field"))
        for(let field of oldFields) {
          field.remove()
        }
        
        for(let fieldModel of this.model.fields) {
          let fieldView = <div id={fieldModel.id} class="field" style=""></div>
          pane.appendChild(fieldView)
          lively.setPosition(fieldView, lively.pt(10 + fieldModel.j*60 , 10 + fieldModel.i*60))
          fieldView.addEventListener("click", evt => {
            // lively.showElement(fieldView)
            // this.publish("field", "toggle", fieldModel.id);
            this.publish("field", "playercolor", {fieldId: fieldModel.id, viewId: this.viewId});
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