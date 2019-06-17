# Classes

<lively-import src="_navigation.html"></lively-import>

Auto-generated list of taggedFiles found in (browser-local) files data-base.

<script>
  import FileCache from "src/client/fileindex.js"
</script>

<script>
(async () => {
  var methods = {}
  // var codeMirror = await (<lively-code-mirror id="code"></lively-code-mirror>)
  var codeMirror = await (<div id="code" style="white-space:pre;font-family:monospace"></div>)
  Object.defineProperty(codeMirror, 'value', {
    get() { return this.textContent },
    set(s) { return this.textContent = s }
  });
  
  var classes = await FileCache.current().db.classes.toArray();
  classes = classes
    .filter(ea => ea.url.match(lively4url)) // only show local files...

  var lastLi, lastMethodItem
  async function showClass(li, aClass) {
    if (lastLi) lastLi.querySelectorAll("ul").forEach(ea => ea.remove());
    if (lastLi == li) {
      lastLi = null
      return
    }
    lastLi = li
    var ul2 = document.createElement("ul")
    var source = await lively.files.loadFile(aClass.url)
    aClass.methods.forEach(eaMethod => {
      var li2 = document.createElement("li")
      li2.innerHTML = '<a href="' +eaMethod.url + '">'+eaMethod.name + '</a> '
      li2.querySelector("a").onclick = async (evt) => {
        evt.preventDefault()
        if (evt.ctrlKey) {
          lively.openInspector(eaMethod)
        } else if (evt.shiftKey) {
          var container = await lively.openBrowser(aClass.url, true)
          var livelyEditor = await container.getEditor()     
          var cm = await livelyEditor.awaitEditor()
          cm.setSelection(cm.doc.posFromIndex(eaMethod.start), cm.doc.posFromIndex(eaMethod.end))
          cm.focus()
          // lively.openInspector(cm)
        } else {
          if (lastMethodItem) lastMethodItem.querySelectorAll("#code").forEach(ea => ea.remove());
          if (lastMethodItem == li2) {
            lastMethodItem = null
            return
          }
          lastMethodItem = li
          
          codeMirror.value = source.slice(eaMethod.start, eaMethod.end)
          li2.appendChild(codeMirror)
        }
      }
      ul2.appendChild(li2)
    })
    li.appendChild(ul2)
  }
  
  function packageName(url) {
    return url.replace(/[^/]*$/,"")
  }
  
  var packages = _.uniq(classes.map(ea => packageName(ea.url)))
  var packagesList = <ul></ul>

  packages.forEach(eaPackage => {
    var packageItem = <li>{eaPackage.replace(lively4url, "")}</li>
    packagesList.appendChild(packageItem)
    var classList = document.createElement("ul")
    classes
      .filter(ea => packageName(ea.url) == eaPackage)
      .sortBy(ea => ea.url + ea.name)
      .forEach(async aClass => {
        var li = await (<li>
          <a click={evt => {
            evt.preventDefault()
            showClass(li, aClass)  
          }} href={aClass.url}>{aClass.name}</a>
          <a click={evt => {
              evt.preventDefault()
              lively.openBrowser(aClass.url, true)
            }} 
            style="font-size:8pt"
            href={aClass.url}>{
              aClass.url.replace(/.*\//, "")
          }</a></li>)

      classList.appendChild(li)   
    })
    packageItem.appendChild(classList)
  })


  return packagesList
})()
</script>