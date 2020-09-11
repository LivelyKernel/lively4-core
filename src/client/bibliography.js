/*MD # Bibliography 

META: #ExamplesInCode #BabylonianProgramming #Lightweight

MD*/

/*MD ## Example

<lively-bibtex-entry>
@inproceedings{berger2016efficiency,
  title={Efficiency of projectional editing: A controlled experiment},
  author={Berger, Thorsten and V{\"o}lter, Markus and Jensen, Hans Peter and Dangprasert, Taweesap and Siegmund, Janet},
  booktitle={Proceedings of the 2016 24th ACM SIGSOFT International Symposium on Foundations of Software Engineering},
  Keywords = {Foo, Bar},
  pages={763--774},
  year={2016},
  organization={ACM}
  }
</lively-bibtex-entry>

```javascript{.example}

```

<script>  
import Parser from 'src/external/bibtexParse.js';
import Bibliography from 'src/client/bibliography.js';
  
var html = lively.query(this, "lively-bibtex-entry");
var source = html.textContent
var bib = Parser.toJSON(source, false)
var json = JSON.stringify(bib, undefined, 2)
var key =  Bibliography.generateCitationKey(bib[0])
;(<dl>
  <dt>Bibtex</dt><dd><pre>{source}</pre></dd>
  <dt>Parser.toJSON</dt><dd><pre>{json}</pre></dd>
  <dt>generateCitationKey</dt><dd><pre>{key}</pre></dd>
</dl>)
</script>  

MD*/


// import Parser from 'src/external/bibtexParse.js'
import FileIndex from 'src/client/fileindex.js'


export default class Bibliography {

  
      /*MD
<style>* {background-color:lightgray}</style>
```javascript
[Bibliography.splitAuthors("Abi Bulbus and Deus, Curus "),
Bibliography.splitAuthors(`Dan Ingalls and Marko R\\"{o}der`)]
```

<script>
  // #TODO refactor and hide tooling code
  import Bibliography from 'src/client/bibliography.js';
  var start = performance.now();
  var result =   eval(this.parentElement.querySelector("code").textContent);
  var time = performance.now() - start;
  <div>{result} <i>({time} ms)</i></div>
</script>
  MD*/

  
  
  static splitAuthors(authorString="") {
     return authorString.split(" and ").map(ea => {
       var m = ea.match(/(.*),(.*)/)
       if (m) {
         return m[2] + " " + m[1] // take care of comma separated author
       } else {
         return ea
       }
     }).map(ea => ea.replace(/[{}]/g,"")
            .replace(/\\"a/g,"ä").replace(/\\"A/g,"Ä") // take care of some umlauts
            .replace(/\\"o/g,"ö").replace(/\\"O/g,"Ö")
            .replace(/\\"u/g,"ü").replace(/\\"U/g,"Ü")
            .replace(/^ */,"").replace(/ *$/,"").replace(/ +/g," ")) // unify whitespace...
  }
  
  
  
    /*MD
<style>* {background-color:lightgray}</style>
```javascript
Bibliography.cleanTitle("{{This is my Title}}")
```

<script>
  // #TODO refactor and hide tooling code
  import Bibliography from 'src/client/bibliography.js';
  var start = performance.now();
  var result =   eval(this.parentElement.querySelector("code").textContent);
  // var time = performance.now() - start;
  <div>{result} </div> // <i>({time} ms)</i>
</script>
  MD*/
  
  static cleanTitle(titleString="") {
     return titleString.replace(/[{}]/g,"")
  }
  
  
  // #TODO this method obviously will need a lot of tweaking...
  static generateCitationKey(entry) {
    if (!entry || !entry.entryTags) return undefined
    var firstAuthor = entry.entryTags.author.split("and")[0]
    if (firstAuthor.match(",")) {
      firstAuthor = firstAuthor.replace(/,.*/,"")
    } else {
      firstAuthor = firstAuthor.replace(/ *$/,"").split(" ").last
    }
    firstAuthor = firstAuthor.replace(/ /g,"")
    firstAuthor = firstAuthor.split("").map((ea,i) => i == 0 ? ea.toUpperCase() : ea.toLowerCase()).join("")

    var year  =  entry.entryTags.year
  
    return firstAuthor + year + this.threeSignificantInitialsFromTitle(entry.entryTags.title)
  }
  
  static threeSignificantInitialsFromTitle(title) {
    return title.split(" ")
      .map(ea => ea.toLowerCase())
      .filter(ea => ea.length >  2  && !["the", "and", "from", "out", "for"].includes(ea))
      .slice(0,3)
      .map(ea => ea[0])
      .join("")
      .toUpperCase()
  } 
  
  
  /*MD
<style>* {background-color:lightgray}</style>
```javascript
[Bibliography.filenameToKey("AuthorSecondauthor_1981_TitleInCammelCase_BOOK.pdf"),
Bibliography.filenameToKey("00_Winograd_1996_Introduction.pdf")]
```

<script>
  // #TODO refactor and hide tooling code
  import Bibliography from 'src/client/bibliography.js';
  var start = performance.now();
  var result =   eval(this.parentElement.querySelector("code").textContent);
  var time = performance.now() - start;
  <div>{result} <i>({time} ms)</i></div>
</script>
  MD*/
  
  static filenameToKey(filename) {
    filename = filename.replace(/^[0-9][0-9]*[A-Z]?_/,"") // strip index number
    
    var a = filename.split("_")
    if (a.length < 3) return
    var authors = a[0]
    var year = a[1]
    var titleAndRest = a[2]
    
    var firstAuthor = authors.split(/(?=[A-Z])/)[0]
    
    
    var title = titleAndRest.replace(/(?<=[a-z])(?=[A-Z])/g, " ")
    return firstAuthor + year + this.threeSignificantInitialsFromTitle(title)
  }

  static urlToKey(url) {
    if (!url) return
    var filename = url.toString().replace(/[#?].*]/,"").replace(/.*\//,"")
    return this.filenameToKey(filename)    
  }

  /*MD
<style>* {background-color:lightgray}</style>
```javascript
Bibliography.searchCitationKey("Fog2019MLL")
```
<script>
  import Bibliography from 'src/client/bibliography.js';
  (async () => {
    var start = performance.now()
    var result = await eval(this.parentElement.querySelector("code").textContent)
    var time = performance.now() - start
    return <div><ul>{...result.map(ea => <li>{ea.url}</li>)}</ul>in {time}ms</div>
  })()   
</script>
  MD*/
  // find all files that map to that key
  static async searchCitationKey(key) {
   
    var result = []
    await FileIndex.current().db.files.each(file => {
      // if (file.url.match(/foobar/)) {
      //     result.push(file)
      // }
      
      if (file.url && this.urlToKey(file.url) == key) {
          result.push(file)
      }
    })
    return result
  }
  
  /*MD
<style>* {background-color:lightgray}</style>  
```javascript
Bibliography.searchFilename("foobar")
```
<script>
  import Bibliography from 'src/client/bibliography.js';
  (async () => {
    return <ul>{...(await eval(this.parentElement.querySelector("code").textContent))
          .map(ea => <li>{ea.url}</li>)}</ul>
  })()   
</script>
MD*/  
  
  static async searchFilename(searchString) {
    var result = []
    await FileIndex.current().db.files.each(file => {
      if (file.url.match(searchString)) {
           result.push(file)

      }
    }) 
    return result
  }
  
}
