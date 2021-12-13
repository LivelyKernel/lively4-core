# SWA - Bibliographie



<script>

import SWABibliographie from "./swa-bibliographie.js";

(async () => {
  var bibliography = new SWABibliographie(
    lively4url + `/demos/bibliography/input.html`,
    lively4url + `/demos/bibliography/output.bib`,
    lively4url + `/demos/bibliography/hirschfeld.bib`);

  async function myCompare() {
    await bibliography.bibtoJSON()
    bibliography.compare()
    function printBibliography(entries) {
      return entries.sortBy(ea => ea.citationKey).map(ea => 
        <span click={() => lively.openBrowser("bib://" + ea.citationKey)}>{ea.citationKey}<br /></span>)
    }
    
    preview.innerHTML = ""
    preview.appendChild(<table>
        <tr>
          <th>swa:{bibliography.onlyInA.length}</th>
          <th>academic: {bibliography.onlyInB.length} 
          </th><th>both: {bibliography.inAandB.length} </th>
        </tr> 
        <tr>
          <td style="vertical-align: top">{... printBibliography(bibliography.onlyInA) }</td>
          <td style="vertical-align: top">{... printBibliography(bibliography.onlyInB) }</td>
          <td  style="vertical-align: top">{... printBibliography(bibliography.inAandB)}</td>
        </tr>
      </table>)
  }
  
  var preview = <div id="preview" style=""></div> 
  // white-space: pre; 
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
  
  preview.innerHTML = "<div><lively-bibtex-entry>" + (await bibliography.import()).join("</lively-bibtex-entry><lively-bibtex-entry>") + "</lively-bibtex-entry></div>"
  // myCompare()  
  return pane
})()
</script>