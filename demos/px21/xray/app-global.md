
<script>

class App
{
  async put()
  {
    var text = await fetch("https://eno34ez0jykr9nz.m.pipedream.net/", { method: "PUT", body: JSON.stringify(this.textboxElement.innerHTML) }).then(r => r.text());
    this.textboxElement.innerHTML = text;
    await lively.sleep(1000)
    lively.showElement(window.lastButton).textContent = "FETCH PUT" 
  }

  async get()
  {
    var text = await fetch("https://eno34ez0jykr9nz.m.pipedream.net/").then(r => r.text());
    this.textboxElement.innerHTML = text;
    
    await lively.sleep(1000)

    lively.showElement(window.lastButton).textContent = "FETCH GET" 
  }
  
  create(ctx)
  {
    this.textboxElement = <div class="lively-text lively-content" contenteditable="true" style="width: 314.477px; background-color: rgb(255, 255, 255); border-color: rgb(0, 0, 0); border-width: 1px; border-style: solid; height: 142.673px;"></div>
    
    this.get();
    
    var style = document.createElement("style");
    
    style.textContent = ` div { border: 0px solid black; } `
    
    var getButton = <button click={() => { 
            runZoned(async () => {
                this.get(); 
            }, {
            zoneValues: {
              lastButton: getButton
            }
            })
            }} style=" width: 130px; height: 34px;">GET</button>
    
    var putButton =  <button click={() => { 
            window.lastButton = putButton
                this.put(); }} style=" width: 130px; height: 34px;">PUT</button>
              
    
    
    return  <div style="width: 321.956px; height: 199.412px; border-width: 1px; background-color: rgba(40, 40, 80, 0.5);">
              {style}
              {getButton}
              {putButton}
              {this.textboxElement}
            </div>
  }
}

new App().create(this)

</script>