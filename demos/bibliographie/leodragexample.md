# Leo's Drag 'n Drop Example

<div id="helloDiv" draggable="true">
Hello
  <a href="https://lively-kernel.org/lively4/lively4-jens/src/components/tools/lively-console.js">
    lively-console.js
  </a>
</div>

<div>
World
</div>



<script>
  console.log("DKFNKEI");
  let helloDiv = lively.query(this, '#helloDiv');
  helloDiv.addEventListener("drag", onDrag);
  
  function onDrag() {
    console.log("Draggin");
  }
</script>







<script data-name="loadLively" type="lively4script">function loadLively() {
  lively.removeEventListener("Drag", this)
  this.draggable = true
  lively.addEventListener("Drag", this, "dragstart", 
    evt => this.onDragStart(evt))
}</script>

<script data-name="onDragStart" type="lively4script">function onDragStart(evt) {
  // working around issue https://bugs.chromium.org/p/chromium/issues/detail?id=438479
  // to achieve https://html.spec.whatwg.org/multipage/dnd.html#dom-datatransferitemlist-add
  
  console.log("ALOHA");

  lively.notify("start")
  var dataList = evt.dataTransfer.items;
  // dataList.add(ev.target.id, "text/plain");
  // Add some other items to the drag payload
  var file = new File(["hello"], "filename.txt", {type: "text/plain", lastModified: ""})
  // var item = dataList.add(file)
  var item = dataList.add(file)

//   "image/png"
  dataList.types = Object.freeze(["Files"])
  dataList.files = [file]

  console.log("effect", evt.dataTransfer.effectAllowed)
  console.log("files", dataList.files)
  console.log("types", dataList.types)

  // dataList.add("http://www.example.org","text/uri-list");
}</script>



<!--div class="lively-content" style="background-color: lightgray; border: 1px solid gray; width: 269px; height: 89px; " draggable="true" id="drag-example2">

  <p contenteditable="true" class="lively-content" style="position: absolute; left: 42.1875px; top: 1.6125px;">
    Drag Example2
  </p>
  
  <script data-name="loadLively" type="lively4script">function loadLively() {
    lively.removeEventListener("Drag", this)
    this.draggable = true
    lively.addEventListener("Drag", this, "dragstart", 
      evt => this.onDragStart(evt))
  }</script>

  <script data-name="onDragStart" type="lively4script">function onDragStart(evt) {
    // working around issue https://bugs.chromium.org/p/chromium/issues/detail?id=438479
    // to achieve https://html.spec.whatwg.org/multipage/dnd.html#dom-datatransferitemlist-add

    lively.notify("start")
      var dataList = evt.dataTransfer.items;
    // dataList.add(ev.target.id, "text/plain");
    // Add some other items to the drag payload
    var file = new File(["hello"], "filename.txt", {type: "text/plain", lastModified: ""})
    // var item = dataList.add(file)
    var item = dataList.add(file)

  //   "image/png"
    dataList.types = Object.freeze(["Files"])
    dataList.files = [file]

    console.log("effect", evt.dataTransfer.effectAllowed)
    console.log("files", dataList.files)
    console.log("types", dataList.types)

    // dataList.add("http://www.example.org","text/uri-list");
  }</script>

</div-->





<!--div class="lively-content" style="background-color: lightgray; border: 1px solid gray; width: 318px; height: 139px;" data-lively-id="64014460-2486-4f3f-860e-812556f0a3d5" draggable="true" id="drag-example">

  <a class="lively-content" href="https://lively-kernel.org/lively4/lively4-jens/src/components/tools/lively-console.js" style="position: absolute; left: 99px; top: 52px;">
    lively-console.js
  </a>
  <a class="lively-content" href="https://lively-kernel.org/lively4/lively4-jens/src/components/tools/lively-console.html" style="position: absolute; left: 103px; top: 102px;">
    lively-console.html
  </a>
  <p contenteditable="true" class="lively-content" style="position: absolute; left: 42.1875px; top: 1.6125px;">
    Drag Example... drag me
  </p>
  
  <script data-name="onDragStart" type="lively4script">function onDragStart(evt) {
  let urls = _.map(this.querySelectorAll("a"), ea => ea.href),
    url = urls[0],
    name = lively.files.name(url),
    mimetype = "text/plain";
  evt.dataTransfer.setData("DownloadURL", `${mimetype}:${name}:${url}`);
  }</script>
  
  <script data-name="loadLively" type="lively4script">function loadLively() {
  lively.removeEventListener("Drag", this)
  this.draggable = true
  lively.addEventListener("Drag", this, "dragstart", 
    evt => this.onDragStart(evt))
  }</script>

</div-->
