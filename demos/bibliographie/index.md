# Bibliographie



## Notes
```
var a = 3
```

<script> 
var a = 3
a+4
</script>

GenerateCitationKey als Vergleich und Prüfung

```javascript
var entry = `Stefan Ramson, Jens Lincke, Harumi Watanabe, and Robert Hirschfeld. <span class="marked"> Zone-based Layer Activation: Context-specific Behavior Adaptations Across Logically-connected Asynchronous Operations. </span> In Proceedings of the Virtual Workshop on Context-oriented Programming (COP) 2020, co-located with the European Conference on Object-oriented Programming (ECOOP), Berlin, Germany, July 21, 2020, ACM DL. (<a href="./media/RamsonLinckeWatanabeHirschfeld_2020_ZoneBasedLayerActivationContextSpecificBehaviorAdaptationsAcrossLogicallyConnectedAsynchronousOperations_AcmDL.pdf" rel="external">pdf</a>)
    <ul class="no-bullet">
      <li> <span class="small"> © ACM, 2020. This is the authors' version of the work. It is posted here by permission of ACM for your personal use. Not for redistribution. The definitive version will be published in the proceedings of the Workshop on Context-oriented Programming. </span> </li>
    </ul>`.split(/<.*?>/g)


entry[0].split(/, /g).map(ea => ea.replace(/^and / , "")) 

```

### Errors


SyntaxError: Unexpected number in JSON at position 25
    at JSON.parse (<anonymous>)
    at Function.parseAuthInfoFromUrl /src/client/auth.js
    at eval /src/client/auth.js

TypeError: Cannot read property 'clear' of undefined
    at Animation.animation.onfinish /src/components/tools/lively-editor.js





## Input:



<script>
import BibtexParser from 'src/external/bibtexParse.js';
import Bibliography from "src/client/bibliography.js"

var url = "https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/input.html";

(async () => {
  var text = await fetch(url).then( resp => resp.text())

  var htmlElement = <div></div>
  htmlElement.innerHTML = text

  // return "<pre>" + text.replace(/\</g,"&gt;") + "</pre
  
  var pubList = htmlElement.querySelectorAll(".publist")

  var items = []

  for(var list of pubList ) {
    for(var ea of list.querySelectorAll("li") ) {      
      items.push(ea)
    }
  }
  return items

  // return items.map(ea => "EINTRAG:" + ea.innerHTML )
  
  // return htmlElement.querySelectorAll(".publist").length
})

function bibtexGen(){
  var a = items[2].split(/<.*?>/g)


  var authors = a[0].split(/, /g).map(ea => 
    ea.replace(/^and / , "").replace(/\. $/ , "")) 

  var year = a[2].match(/[0-9]{4}/)[0]


  var entry = { 
    entryType: 'article',
    entryTags: { 
      author: authors.join(" and "),
      year: year,
      title: a[1].replace(/\. $/,"").replace(/^ /,"") },
      published: a[2]
  }


  entry.citationKey = Bibliography.generateCitationKey(entry)


  var bibString = BibtexParser.toBibtex([entry ], false);


  fetch("https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/output.bib", {
    method: "PUT",
    body: bibString
  })
  
  return "fucke you" + bibString
}



</script>




## Example 


```javascript
import BibtexParser from 'src/external/bibtexParse.js';
import Bibliography from "src/client/bibliography.js"

var a = `Stefan Ramson, Jens Lincke, Harumi Watanabe, and Robert Hirschfeld. <span class="marked"> Zone-based Layer Activation: Context-specific Behavior Adaptations Across Logically-connected Asynchronous Operations. </span> In Proceedings of the Virtual Workshop on Context-oriented Programming (COP) 2020, co-located with the European Conference on Object-oriented Programming (ECOOP), Berlin, Germany, July 21, 2020, ACM DL. (<a href="./media/RamsonLinckeWatanabeHirschfeld_2020_ZoneBasedLayerActivationContextSpecificBehaviorAdaptationsAcrossLogicallyConnectedAsynchronousOperations_AcmDL.pdf" rel="external">pdf</a>)
    <ul class="no-bullet">
      <li> <span class="small"> © ACM, 2020. This is the authors' version of the work. It is posted here by permission of ACM for your personal use. Not for redistribution. The definitive version will be published in the proceedings of the Workshop on Context-oriented Programming. </span> </li>
    </ul>`.split(/<.*?>/g)


var authors = a[0].split(/, /g).map(ea => 
  ea.replace(/^and / , "").replace(/\. $/ , "")) 

var year = a[2].match(/[0-9]{4}/)[0]


var entry = { 
  entryType: 'article',
  entryTags: { 
    author: authors.join(" and "),
    year: year,
    title: a[1].replace(/\. $/,"").replace(/^ /,"") },
    published: a[2]
}


entry.citationKey = Bibliography.generateCitationKey(entry)


var bibString = BibtexParser.toBibtex([entry ], false);


fetch("https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/output.bib", {
  method: "PUT",
  body: bibString
})

```



