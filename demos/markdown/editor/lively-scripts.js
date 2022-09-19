
// Lively Scripts

/*PW                            

<button style="position: relative;" class="lively-content" data-lively-id="4624db17-121a-4ff6-b69b-17cc4ac0d12f" data-lively-part-name="button">button
  <script data-name="livelyLoad" type="lively4script">function livelyLoad() {
  lively.notify("loadedLoad button")
  this.counter = 0
  lively.removeEventListener("me", this, "click")
  lively.addEventListener("me", this, "click", evt => this.onClick(evt)) 
}</script>
  <script data-name="onClick" type="lively4script">function onClick() {
  this.counter += 1;
      
  lively.notify("button  clicked!", this.counter)
}</script>
</button>     

    PW*/

/*PW   <div class="lively-content" style="width: 485px; height: 389px; border: 1px solid black; position: relative; background-color: rgba(40, 40, 80, 0.5); left: 0px; top: 0px;" data-lively-id="82023bb8-414e-47a6-b1cd-090890b8767b"><lively-list tabindex="0" class="lively-content" style="position: relative; left: 36px; top: 36px;" data-lively-id="2e2bd91b-7fa1-49e7-8554-b8636c8c2701">
              <li class="">one</li>
              
              <li class="" contenteditable="true" style="position: relative; left: 0px; top: 0px; width: 245px; height: 16px;">three hello<br></li>
              <li class="selected">four</li>
            </lively-list></div>  PW*/