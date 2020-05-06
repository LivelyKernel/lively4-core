  "enable aexpr";

  import Morph from 'src/components/widgets/lively-morph.js';

  export default class LivelyPetrinet extends Morph {
    
    async initialize() {
      this.windowTitle = "LivelyPetrinet";
      this.registerButtons()
      this.testVariable = 1

      lively.html.registerKeys(this); // automatically installs handler for some methods

      lively.addEventListener("template", this, "dblclick", 
        evt => this.onDblClick(evt))
      // #Note 1
      // ``lively.addEventListener`` automatically registers the listener
      // so that the the handler can be deactivated using:
      // ``lively.removeEventListener("template", this)``
      // #Note 1
      // registering a closure instead of the function allows the class to make 
      // use of a dispatch at runtime. That means the ``onDblClick`` method can be
      // replaced during development

       this.get("#textField").value = this.testVariable;
    }

    onDblClick() {
      this.animate([
        {backgroundColor: "lightgray"},
        {backgroundColor: "red"},
        {backgroundColor: "lightgray"},
      ], {
        duration: 1000
      })
    }
    
    attachedCallback() {
        this.drawCircle();
    }
    
    drawCircle(){
      var canvas = this.get("#circle");
      var ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(40, 40, 20, 0, 2 * Math.PI);
      ctx.stroke();
    }

  

    // this method is autmatically registered through the ``registerKeys`` method
    onKeyDown(evt) {
      lively.notify("Key Down!" + evt.charCode)
    }

    // this method is automatically registered as handler through ``registerButtons``
    onPlusButton() {
      this.testVariable += 1;
      this.get("#textField").value =  this.testVariable
    }

    onMinusButton() {
      this.testVariable -= 1;
      this.get("#textField").value =  this.testVariable
    }

    /* Lively-specific API */

    // store something that would be lost
    livelyPrepareSave() {
      this.setAttribute("data-mydata", this.get("#textField").value)
    }

    livelyPreMigrate() {
      // is called on the old object before the migration
    }

    livelyMigrate(other) {
      // whenever a component is replaced with a newer version during development
      // this method is called on the new object during migration, but before initialization
      this.someJavaScriptProperty = other.someJavaScriptProperty
    }

    livelyInspect(contentNode, inspector) {
      // do nothing
    }


  }