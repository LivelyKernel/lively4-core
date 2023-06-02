import Morph from 'src/components/widgets/lively-morph.js';

// import Literature from 'src/client/literature.js'
import Bibliography from "src/client/bibliography.js"

export default class LivelyBibliography extends Morph {
  async initialize() {
    this.update()

  }

  async update() {
    var source = this.textContent
    var entries = []

    for (let line of source.split("\n")) {
      let entry = await (<lively-bibtex-entry mode="readonly"></lively-bibtex-entry>)
      let m = line.match(/- \[(\d+)\] (.*), “(.*)” (.*)((?:(?:18)|(?:19)|(?:20))\d\d)/)
      if (m) {
        debugger
        let authors = m[2].split(/, (?:and)?/g).join(" and ")
        let entryValue = {
          citationKey: "x",
          entryType: "Article",
          entryTags: {
            year: m[5],
            author: authors,
            title: m[3],
            published: m[4]
          }
        }
        entryValue.citationKey = Bibliography.generateCitationKey(entryValue)
        entry.value = entryValue
        
        let text = entry.get("#title").textContent
        entry.get("#title").innerHTML = ""
        let href = "scholar://browse/paper/search?query=" + entry.title.replace(/-/g," ")
        entry.get("#title").appendChild(<a click={() => lively.openBrowser(href)}>{text}</a>) // 
        
        
        let author = entry.get("#author").textContent
        entry.get("#author").innerHTML = ""
        for(let ea of author.split(/, /)) {
          entry.get("#author").appendChild(<span><a click={() => lively.openBrowser("scholar://browse/author/search?query=" + ea)}>{ea}</a>, </span>)   
        }
        
        scholar://browse/author/search?query=T. Petricek
        
//         entry.get("#title").addEventListener("click", () => {
//           lively.openBrowser()
//         })
        
        
        entry.get("#key").parentElement.insertBefore(<span>{m[1]}, </span>, entry.get("#key"))
        
        entries.push(entry)
      } else {
        entries.push(<div>{line}</div>)
      }
    }
    var result = this.get("#result")
    result.innerHTML = ""
    result.appendChild( <div> { ...entries } < /div>)
  }

  async livelyExample() {
    this.innerHTML =`- [1] M. Fowler, “Projectional editing,” 2008. [Online]. Available: https: //martinfowler.com/bliki/ProjectionalEditing.html
- [2] J. Horowitz and J. Heer, “Live, Rich, and Composable: Qualities for Programming Beyond Static Text,” in PLATEAU Workshop, 2023.`
    this.update()
  }

}
