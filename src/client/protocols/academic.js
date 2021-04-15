import { Scheme } from "src/client/poid.js";
import PolymorphicIdentifier from "src/client/poid.js";
import focalStorage from "src/external/focalStorage.js";

import {Author, Paper, MicrosoftAcademicEntities} from "src/client/literature.js"


import _ from 'src/external/lodash/lodash.js';
/*MD 
# Microsoft Academic Search 
MD*/

/*MD 
<style>* {background-color:lightgray}</style>

### Documentation

<https://docs.microsoft.com/en-us/academic-services/project-academic-knowledge/reference-paper-entity-attributes>

### Microsoft Academic Raw Query:

```javascript{.example}
  fetch("https://academic.microsoft.com/api/search", {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
          query: "", 
          queryExpression: "Composite(AA.AuN='jens lincke')", 
          filters: [], 
          orderBy: 0, 
          skip: 0,
          sortAscending: true, 
          take: 10})
        }).then(r => r.json())
```


### And with our Scheme

```javascript
fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "application/json"
  }
}).then(r => r.json())
```

We also support different content type, e.g. the default is HTML

```javascript
fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "text/html"
  }
}).then(r => r.text())
```

or bibtex

```javascript
fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "application/bibtex"
  }
}).then(r => r.text()).then(s => {
  return s
} )
```


MD*/


const academicSubscriptionKeyId = "microsoft-academic-key";





export default class AcademicScheme extends Scheme {

  get scheme() {
    return "academic";
  }

  resolve() {
    return true;
  }

  static async setSubscriptionKey(key) {
      return focalStorage.setItem(academicSubscriptionKeyId, key);
  }
  
  static async getSubscriptionKey() {
    var key = await focalStorage.getItem(academicSubscriptionKeyId);
    if (!key) {
      key = await lively.prompt(`Enter your <a href="https://msr-apis.portal.azure-api.net/developer" target="_">Project Academic Knowledge</a> key`, "");
      await this.setSubscriptionKey(key);
    }
    return key
  }

  response(content, contentType = "text/html") {
    return new Response(content, {
      headers: {
        "content-type": contentType
      },
      status: 200
    });
  }

  notfound(content, contentType = "text/html") {
    return new Response(content, {
      headers: {
        "content-type": contentType
      },
      status: 303
    });
  }

  academicKnowledgeAttributes() {
    return [
        ["Ty", "Type"],
        ["AA.AfId","Author affiliation ID"],
        ["AA.AfN","Author affiliation name"],
        ["AA.AuId","Author ID"],
        ["AA.AuN","Normalized author name"],
        ["AA.DAuN","Original author name"],
        ["AA.DAfN","Original affiliation name"],
        ["AA.S","Numeric position in author list"],
        ["AW","Unique, normalized words in abstract, excluding common/stopwords"],
        ["BT","BibTex document type ('a':Journal article, 'b':Book, 'c':Book chapter, 'p':Conference paper)"],
        ["BV","BibTex venue name"],
        ["C.CId","Conference series ID"],
        ["C.CN","Conference series name"],
        ["CC","Citation count"],
        ["CitCon","Citation contexts</br></br>List of referenced paper ID's and the corresponding context in the paper (e.g. [{123:[\"brown foxes are known for jumping as referenced in paper 123\", \"the lazy dogs are a historical misnomer as shown in paper 123\"]})"],
        ["D","Date published in YYYY-MM-DD format"],
        ["DN","Original paper title"],
        ["DOI","Digital Object Identifier</br></br>IMPORTANT: The DOI is normalized to uppercase letters, so if querying the field via evaluate/histogram ensure that the DOI value is using all uppercase letters"],
        //["E","Extended metadata</br></br>IMPORTANT: This attribute has been deprecated and is only supported for legacy applications. Requesting this attribute individually (i.e. attributes=Id,Ti,E) will result in all extended metadata attributes being returned in a serialized JSON string</br></br>All attributes contained in the extended metadata are now available as a top-level attribute and can be requested as such (i.e. attributes=Id,Ti,DOI,IA)"],
        ["ECC","Estimated citation count"],
        ["F.DFN","Original field of study name"],
        ["F.FId","Field of study ID"],
        ["F.FN","Normalized field of study name"],
        ["FamId","If paper is published in multiple venues (e.g. pre-print and conference) with different paper IDs, this ID represents the main/primary paper ID of the family. The field can be used to find all papers in the family group, i.e. FamId=<paper_id>"],
        ["I","Publication issue"],
        ["IA","Inverted abstract"],
        ["Id","Paper ID"],
        ["J.JId","Journal ID"],
        ["J.JN","Journal name"],
        ["FP","First page of paper in publication"],
        ["LP","Last page of paper in publication"],
        ["PB","Publisher"],
        ["Pt","Publication type (0:Unknown, 1:Journal article, 2:Patent, 3:Conference paper, 4:Book chapter, 5:Book, 6:Book reference entry, 7:Dataset, 8:Repository"],
        ["RId","List of referenced paper IDs"],
        ["S","List of source URLs of the paper, sorted by relevance"],
        ["Ti","Normalized title"],
        ["V","Publication volume"],
        ["VFN","Full name of the Journal or Conference venue"],
        ["VSN","Short name of the Journal or Conference venue"],
        ["W","Unique, normalized words in title"],
        ["Y","Year published"]
      ].map(ea => ea[0]).join(",")
  }
  
  async rawQueryInterpret(textQuery, count) {
      var interpretation = await fetch(
        `https://api.labs.cognitive.microsoft.com/academic/v1.0/interpret?query=`
            + encodeURI(textQuery)
            + `&complete=1`
            + `&subscription-key=${await AcademicScheme.getSubscriptionKey()}`).then(r => r.json())
      if (!interpretation.interpretations[0] || !interpretation.interpretations[0].rules[0]) {
        return {error: "no interpretations", value: interpretation}
      }
      
      var queryExpr = interpretation.interpretations[0].rules[0].output.value
      return this.rawQueryExpr(queryExpr, count)
  }
  
  async rawQueryExpr(queryExpr, count=10, attributes) {
    var attributes =  attributes || this.academicKnowledgeAttributes()    
    var result = await fetch(`cached:https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?expr=`
            + encodeURI(queryExpr)
            + `&count=${count}`
            + `&attributes=${attributes}`
            +`&subscription-key=${await AcademicScheme.getSubscriptionKey()}`).then(r => r.json())
      return result
  }
  
  async rawQueryHist(queryExpr, attributes=["Y"], count=10) {
    var result = await fetch(`cached:https://api.labs.cognitive.microsoft.com/academic/v1.0/calchistogram?expr=`
            + encodeURI(queryExpr)
            + `&count=${count}`
            + `&attributes=${attributes}`
            +`&subscription-key=${await AcademicScheme.getSubscriptionKey()}`).then(r => r.json())
      return result
  }

  async entityQuery(queryString, queryType, count, attributes) {
    let raw;
    if (queryType=="expr") {
      raw = (await this.rawQueryExpr(queryString, count, attributes))
    } else {
      raw = (await this.rawQueryInterpret(queryString, count))
    }
    if (raw.entities)  {
      return  raw.entities
    } else {
      return { 
        error: "could not find entities", 
        value: raw
      }
    }
  }

  async content(entities) {
    var content = ``;
    if (entities.error) return `<span class="error">${entities.error}</span>`
    


    if (this.query.startsWith("expr:")) {
      var code = `lively.openMarkdown(lively4url + "/demos/visualizations/academic.md", 
        "Academic Visualizaton", {
          query: ${JSON.stringify(this.query)},
          "count": ${this.count},
          "min_cc_in": 2,
          "min_refs_out": 10,
      })`
      content += `<button onclick="${code.replace(/"/g,"&quot;")}">visualize</button>`
      
      var histogramCode = `lively.openMarkdown(lively4url + "/demos/visualizations/academic-histogram.md", 
        "Academic Histogram", {
          query: ${JSON.stringify(this.query.replace(/^expr\:/,""))},
          "count": ${this.count},
      })`
      content += `<button onclick="${histogramCode.replace(/"/g,"&quot;")}">histogram</button>`
      
      var inspectCode = `
        let url = "academic://${this.query}?count=${this.count}"
        lively.notify("inspect: " + url);
        lively.files.loadJSON(url).then(json => {
           lively.openInspector(json)
        })  
      `
      content += `<button onclick="${inspectCode.replace(/"/g,"&quot;")}">inspect</button>`
    }
    
    
    if (entities.length > 1) {
      content += `<style>${Paper.shortPaperCSS()}</style>\n`
      for(var entity of entities) {
        let paper = await Paper.ensure(entity)
        content += await paper.toShortHTML();
      }      
    } else if (entities.length == 1) {
      let paper = await Paper.ensure(entities[0])
      content += await paper.toHTML() + "\n";
    } else {
      content += "<h1>No entities found</h1>" + "\n";
    }
    return content;
  }

  async GET(options) {
    var query = this.url.replace(new RegExp(this.scheme + "\:\/\/"), "");
    if (query.length < 2) return this.response(`{"error": "query to short"}`);
    
    
    var argsString = query.replace(/.*\?/,"")
    query = query.replace(/\?.*/,"") // strip arguments
   
    this.query = decodeURI(query);
    
    // adhoc url paremeter decoding...
    var args = {}
    argsString.split(/[?&]/).forEach(ea => {
      var pair = ea.split("=")
      args[pair[0]] = pair[1]
    })
    this.count = args["count"] || 10
    
    var attributes = args["attr"]; // optional
   
    // example: 
    //  "expr:Id=3" -> expr is query type
    var typeRegex = /^([a-z]*):/
    var m = query.match(typeRegex)
    query = decodeURI(query);
    if (m) {
      var queryType = m[1]
      query = query.replace(typeRegex,"")
    }
    
    
    options = options || {}
    var headers = new Headers(options.headers); // #Refactor we should unify options before
    
    if (queryType=="meta") {
      var schemas = await MicrosoftAcademicEntities.schemas()
      var result = schemas
      var path = query.split("/")
      for(let key of path) {
        try {
          if (key) {
            result = result[key]
          }
        } catch(e) {
          this.response("could not find " + query + " in schemas");
        }
      }
      
      
      return this.response(JSON.stringify(result, undefined, 2), "application/json");
    }
    
    if (queryType=="raw") {
      let raw = await this.rawQueryExpr(query, this.count, attributes)
      return this.response(JSON.stringify(raw, undefined, 2), "application/json");      
    }
    
    if (queryType=="hist") {
      if (headers.get("content-type") == "application/json") {
        let raw = (await this.rawQueryHist(query, attributes, this.count))
        return this.response(JSON.stringify(raw, undefined, 2), "application/json");
      } else {
        return this.response(`
<html>
<lively-script><script>
  (async () => {
      var url = lively4url + "/demos/visualizations/academic-histogram.md"
      var comp = await (<lively-markdown style="width:100%; height:100%"></lively-markdown>);
      var src = await fetch(url).then(r => r.text());
      comp.parameters = {
        query: ${JSON.stringify(decodeURI(query))},
        attr: "${attributes}",
        "count": 100,
      };
      comp.setContent(src);
      comp.parentElement.setAttribute("title", "Academic Histogram");
      return comp;
    })()
</script><lively-script>        
        

</html>
`)        
  
      
      
      }
    } 
    
    let entities = await this.entityQuery(query, queryType, args.count, attributes);
    if (options && options.headers) {
      if (headers.get("content-type") == "application/json") {
        return this.response(JSON.stringify(entities), "application/json");
      }
      
      if (headers.get("content-type") == "application/bibtex") {
        var papers = []
        for(let ea of entities) {
          papers.push(await Paper.ensure(ea))
        }        
        return this.response(papers.map(ea => ea.toBibtex()).join("\n"), "application/bibtex");
      } 
    }
    // default is HTML
    var content = await this.content(entities);
    return this.response(content);
  }

  async OPTIONS(options) {
    var content = JSON.stringify({}, undefined, 2);
    return new Response(content, {
      headers: {
        "content-type": "application/json"
      },
      status: 200
    });
  }

}

PolymorphicIdentifier.register(AcademicScheme);

// import Tracing from "src/client/tracing.js"
// Tracing.traceClass(Paper)
