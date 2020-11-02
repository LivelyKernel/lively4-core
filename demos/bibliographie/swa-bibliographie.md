# SWA - Bibliographie



<script>

import SWABibliographie from "./swa-bibliographie.js";

(async () => {
  var bibliography = new SWABibliographie(
    `https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/input.html`,
    `https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/output.bib`,
    `https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/hirschfeld.bib`);

  async function myCompare() {
    await bibliography.bibtoJSON()
    bibliography.compare()
    function printBibliography(entries) {
      return entries.sortBy(ea => ea.citationKey).map(ea => ea.citationKey).join("\n")
    }
    
    preview.innerHTML = `<table>
      <tr><th>swa:` + bibliography.onlyInA.length 
        + "</th><th>academic:"  + bibliography.onlyInB.length 
        + `</th><th>both:` + bibliography.inAandB.length + `</th></tr>` 
        + `<tr>`
        + `<td style="vertical-align: top">`  + printBibliography(bibliography.onlyInA) + `</td>`
        + `<td style="vertical-align: top">` + printBibliography(bibliography.onlyInB) + `</td>`
        + `<td  style="vertical-align: top">` + printBibliography(bibliography.inAandB) + "</td></tr></table>"
    //lively.openInspector(bibliography)
  }
  
  var preview = <div id="preview" style="white-space: pre;"></div>
  var pane = <div>    
      <button click={async () => {
        await bibliography.export() 
        lively.openBrowser(bibliography.exportURL)
        }}>export</button>
      <button click={async () => {
        myCompare()
        
        }}>compare</button>
      {preview}
    </div>
  
  preview.innerHTML = (await bibliography.import()).join("")
  myCompare()  
  return pane
})()
</script>