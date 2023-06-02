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
      let m = line.match(/- \[(\d+)\] (.*), “(.*)” (.*)(\d\d\d\d)/)
      if (m) {
        let authors = m[2].split(/, (and)?/).join(" and ")
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
        
        entry.get("#title").addEventListener("click", () => {
          lively.openBrowser("scholar://browse/paper/search?query=" + entry.title.replace(/-/g," "))
        })
        
        entry.get("#key").parentElement.insertBefore(<span>{m[1]}, </span>, entry.get("#key"))
        
        entries.push(entry)
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
