# SWA - Bibliographie



<script>

import SWABibliographie from "./swa-bibliographie.js"

;(async () => {
  var bibliography = new SWABibliographie(
    `https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/input.html`,
    "https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/output.bib")
  var preview = <div id="preview" style="white-space: pre;"></div>
  var pane = <div>    
      <button click={async () => {
        await bibliography.export() 
        lively.openBrowser(bibliography.exportURL)
        }}>export</button>
      {preview}
    </div>
    
  preview.innerHTML = (await bibliography.import()).join("")
  return pane
})()
</script>