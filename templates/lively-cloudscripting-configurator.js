import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyCloudscriptingConfigurator extends Morph {
  initialize() {
    this.windowTitle = "LivelyCloudscriptingConfigurator";
    
  }

  createUI(){
    this.getSubmorph('#heading').innerHTML="Config for "+this.filename
    var that = this
    this.getSubmorph("#button").addEventListener('click',this.saveConfig.bind(this))
    $.ajax({
        url: that.endpoint+"getConfig",
        type: 'POST',
        data:JSON.stringify({
          user:that.user,
          triggerId:that.triggerId
        }),
        success: function(res){that.config=res;that.renderConfigEls(res)},   
        done: function(res){lively.notify("done")},
        error: function(res){"Error"+lively.notify(JSON.stringify(res))}
    }); 
  }
  
  
  
  renderConfigEls(config){
    console.log("this is the config" + config)
    var table=this.getSubmorph('#configTable')
    for(var key in config){
      if(key!=="description"&&config.hasOwnProperty(key)){
        var row = table.insertRow(1)
        row.className="row"
        var cell1 = row.insertCell(0)
        cell1.className ="keyEntry"
        var cell2 = row.insertCell(1)
        cell2.className ="valueEntry"
        var input = document.createElement("INPUT");
        var that=this
        input.addEventListener("focusout",function(e){that.config[key]=e.target.value})
        input.className ="valueInput"
        input.value=config[key]
        cell1.innerHTML= key
        cell2.appendChild(input)
      }
    }
  }
  
  saveConfig(){
    console.log(JSON.stringify(this.config))
    var that =this
    $.ajax({
        url: that.endpoint+"updateConfig",
        type: 'POST',
        data:JSON.stringify({
          user:that.user,
          triggerId:that.triggerId,
          config:that.config
        }),
        success: function(res){lively.notify("Config change successfull")},   
        done: function(res){lively.notify("done")},
        error: function(res){console.log(res)}
    }); 
  }
}