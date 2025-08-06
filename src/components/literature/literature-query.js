import Bibliography from "src/client/bibliography.js"
import FileIndex from "src/client/fileindex.js";
import moment from "src/external/moment.js"
import {Paper, AlexPaper} from "src/client/literature.js"
import Morph from 'src/components/widgets/lively-morph.js';
import Preferences from 'src/client/preferences.js';  


/*MD # Literature Query 

MD*/

export default class LiteratureQuery extends Morph {
  async initialize() {
    this.windowTitle = "LiteratureQuery";
    this.updateView()
  }
  
  
  get queryString() {
    return this.getAttribute("query")
  }

  set queryString(s) {
    this.setAttribute("query", s)
  }
  
  get baseURL() {
    return this.getAttribute("base-url")
  }

  set baseURL(s) {
    this.setAttribute("base-url", s)
  }
  
  get details() {
    return this.get("#content")
  }
  
  updateView() {
    if (this.queryString) {
      this.findBibtex(this.queryString)
    }
  }
  
  close(fireNoEvent=false) {
    if (!fireNoEvent){
      this.dispatchEvent(new CustomEvent("closed"))
    }
    if (this.literatureListing) {
      this.literatureListing.details.hidden = true
      this.literatureListing.details.innerHTML = "" // self destruct...
    }
  }
  
  async findBibtex(queryString) {
    queryString = queryString
    var div = <div></div>;
    
    this.details.innerHTML = ""
    
    var input = <input  id="searchBibtexInput" value={queryString} style="width:400px"></input>
    input.addEventListener("keyup", event => {
      if (event.keyCode == 13) { // ENTER
        this.findBibtexSearch(input.value, div)
      }
    });  
    this.details.appendChild(<div>
      <h3>Searched:{input}</h3>
      <span style="position:absolute; top: 0px; right:0px">
      <a title="close" click={() => this.close()}>
        <i class="fa fa-close" aria-hidden="true"></i>
      </a></span>{div}</div>)
    
    this.findBibtexSearch(queryString, div)
  }

  async findBibtexSearch(queryString, div) {
    div.innerHTML = "searching..."
    var entries
    try {
        var papers = await this.findPapersQuery(queryString, div)
        div.innerHTML = ""
        var rows = []
        for(let paper of papers) {
          var literaturePaper = await <literature-paper mode="short"></literature-paper>
          literaturePaper.paper = paper
          literaturePaper.data = paper.value
          literaturePaper.setAttribute("alexid", paper.alexid)
          literaturePaper.updateView()
          
          rows.push(<tr>
              <td style="vertical-align: top">
                
              </td>
              <td>
                {literaturePaper}</td>
            </tr>)
        }
      div.appendChild(
        <table> {... rows}</table>)
    } catch(err) {
      div.innerHTML = "ERROR: " + err
    }
  }

  async findPapersQuery(queryString, div) {
    var json = await fetch("http://swacopilot:9020/" + queryString).then(r => r.json())
    if (json.error) return [];
    if (!json.results) {
      throw new Error("response <pre>" + JSON.stringify(json, undefined, 2) + "</pre>")
      
    }
    var papers = json.results.map(ea => new AlexPaper(ea))
    return papers
  }
  

  
  async livelyExample() {
      this.queryString = "works?filter=publication_year:>2022,cited_by_count:>5000" 
      // this.queryString = "works/" 
      this.updateView()
  }
  
}