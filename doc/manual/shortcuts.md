# Keyboard Shortcuts





<lively-script><script>
var extractShortCuts = (async function(url){
  var content = await fetch(url).then(r => r.text())  
  return <ul>{...
    content.split("\n")
      .filter(ea => ea.match(/#KeyboardShortcut/))
      .map(ea => <li>{ea.replace(/.*#KeyboardShortcut /,"")}</li>)
  }</ul>
})

var result = <div>
  <h2>Global Shortcuts</h2>
  {extractShortCuts(lively4url + "/src/client/keys.js")}
  <h2>Code Mirror Shortcuts</h2>
  {extractShortCuts(lively4url + "/src/components/widgets/lively-code-mirror.js")}
  <h2>Module Specific Shortcuts</h2>
  {extractShortCuts(lively4url + "/src/client/expose.js")}
  {extractShortCuts(lively4url + "/src/client/graffle.js")}
</div>

result
</script><lively-script>