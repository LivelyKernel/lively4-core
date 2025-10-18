import moment from "src/external/moment.js"
import github from "src/client/github.js"  
import FileCache from "src/client/fileindex.js"
/*MD 
# Development  [Journal](browse://doc/journal)
MD*/
export default class Journal {
  
  static async createEntry(dir, container) {
    if (!dir) dir = lively4url + "/doc/journal/"
    
    await github.current().loadCredentials()
    let username = github.current().username

    let dateStr = moment(new Date()).format("YYYY-MM-DD")
    let filename =  dateStr + ".md"

    let dirURL = dir   + filename + "/"
    let url = dirURL + "index.md" 

    lively.notify("create " + url)
    if (await lively.files.existFile(dirURL)) {
      lively.notify("Could not create " + dirURL + ", because it already exists!")
    } else {
      let src = "## " + dateStr + "\n" + "*Author: @" + username + "*\n\n"

      await lively.files.saveFile(dirURL, src)
      await lively.files.saveFile(url, src)
    }
    
    if (container) {
      container.followPath(url)
      await container.editFile(url)
      container.focus()
      
      const codeMirror = container.getLivelyCodeMirror();
      if (codeMirror) {
        const editor = codeMirror.editor;
        const lastLine = editor.lastLine();
        const lastCh = editor.getLine(lastLine).length;
        editor.setCursor(lastLine, lastCh);
      }
    }
    
  }
   
  static async listEntries(dir, container) {

    let opts = JSON.parse(await lively.files.statFile(dir))
    let list = document.createElement("ul")

    let stats = _.sortBy(opts.contents, ea => ea.name)
      .reverse()
      .filter(ea => ea.name.match(/\d\d\d\d-\d\d-\d\d\.((html)|(md))$/))

    for(let ea of stats) {
      let li = document.createElement("li")
      let a = document.createElement("a")
      let name = ea.name
      a.innerHTML =  name.replace(/\.md/,"")
      if (ea.type === "directory") {
        name = name + "/index.md"
      }

      a.href = name
      let url = dir  + name

      a.onclick = (evt) => {
        evt.preventDefault()
        container.followPath(url)
        return true
      }

      li.appendChild(a)

      FileCache.current().db.files.get(url).then(file => {
        if (file) {
          let span = document.createElement("span")
          span.style.width = "40px"
          span.style.marginLeft = "5px"
          span.style.display = "inline-block"
          span.innerHTML =  file.size
          li.appendChild(span)
          let titleSpan = document.createElement("span")
          titleSpan.style.width = "40px"
          titleSpan.innerHTML = " " + (file.title ? file.title.replace(/\d\d\d\d-\d\d-\d\d,? ?/,"").replace(/</g,"&lt;") : "")
          li.appendChild(titleSpan)
        }
      })

      list.appendChild(li)
    }
    return list
  }
  
}