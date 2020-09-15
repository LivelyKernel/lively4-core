import { Scheme } from "src/client/poid.js";
import PolymorphicIdentifier from "src/client/poid.js";
import focalStorage from "src/external/focalStorage.js";
import { parseQuery, getDeepProperty } from 'utils';

import FileIndex from "src/client/fileindex.js";

import _ from 'src/external/lodash/lodash.js';
/*MD 
# Microsoft Academic Search 
MD*/

/*MD 
<style>* {background-color:lightgray}</style>

### Example:  

```javascript{.example}
  import {MicrosoftAcademicEntities} from "src/client/protocols/academic-scheme.js"
  MicrosoftAcademicEntities.schemas()
``` 

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

MD*/

import MarkdownIt from "src/external/markdown-it.js";

export class MicrosoftAcademicEntities {

  
  static get baseURL() {
    return "https://raw.githubusercontent.com/MicrosoftDocs/microsoft-academic-services/live/academic-services/project-academic-knowledge/";
  }

  static async generateSchema(entityName) {
    var md = new MarkdownIt();
    var content = await fetch(this.baseURL + "reference-" + entityName + "-entity-attributes.md").then(r => r.text());
    var html = md.render(content);
    var div = <div></div>;
    div.innerHTML = html;
    var tbody = div.querySelector("tbody");
    return tbody ? Array.from(tbody.querySelectorAll("tr").map(ea => Array.from(ea.querySelectorAll("td").map(td => td.textContent))).map(ea => ({ name: ea[0], description: ea[1], type: ea[2], operations: ea[3] }))) : [];
  }

  static async allSchemas() {
    var all = {};
    for (var ea of ["affiliation", "author", "conference-instance", "conference-series", "field-of-study", "journal", "paper"]) {
      var list = await this.generateSchema(ea);
      var obj = {};
      for (var item of list) {
        obj[item.name] = item;
      }

      all[ea] = obj;
    }
    return all;
  }

  static async schemas() {
    // window.lively4academicSchemas = null
    if (!window.lively4academicSchemas) {
      window.lively4academicSchemas = await this.allSchemas();
    }
    return window.lively4academicSchemas;
  }

}

const academicSubscriptionKeyId = "microsoft-academic-key";

class Author {
 
  constructor(value) {
    this.value = value
  }

  get name() {
   return this.value.DAuN // "Original author name"
  }
  
}


class Paper {
  
  constructor(value) {
    this.value = value
  }
  
  get authors() {
    return this.value.AA.map(ea => new Author(ea)) 
  }

  get year() {
    return this.value.Y 
  }

  get title() {
    return this.value.DN // "Original paper title"
      .replace(/["{}]/g,"")  // some cleanup
  }

  get doi() {
    return this.value.DOI 
  }

  get bibtexType() {
    return ({
      'a': "article", 
      'b': "book", 
      'c': "incollection", 
      'p': "inproceedings"})[this.value.BT]  
  }
  
  toHTML() {
    return `<div class="paper">
      <span class="authors">${
        this.authors.map(ea => ea.name).join(", ")
      }</span>.
      <span class="year">${
        this.year
      }</span>.
      <span class="title">${
        this.title
      }</span>. 
      <span class="doi"><a href="https://doi.org/${this.doi}" target="_blank">${
        this.doi
      }</a></span>. 

  </div>`
  }
  
  toBibtex() {
    return `@${this.bibtexType}{${this.bibtexKey},
  author      = "${this.authors.map(ea => ea.name).join(" and ")}",
  title       = "${this.title}",
  year        = ${this.year},
}`
  }
  
}

export default class AcademicScheme extends Scheme {

  get scheme() {
    return "academic";
  }

  get isUsingAcademicKnowledgeQuery() {
    return true // proper API vs. Hack
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

  
  
  async rawAcademicKnowledgeQuery(textQuery) {
      var attributes =  [
        ["AA.AfId","Author affiliation ID"],
        ["AA.AfN","Author affiliation name"],
        ["AA.AuId","Author ID"],
        ["AA.AuN","Normalized author name"],
        ["AA.DAuN","Original author name"],
        ["AA.DAfN","Original affiliation name"],
        ["AA.S","Numeric position in author list"],
        //["AW","Unique, normalized words in abstract, excluding common/stopwords"],
        ["BT","BibTex document type ('a':Journal article, 'b':Book, 'c':Book chapter, 'p':Conference paper)"],
        ["BV","BibTex venue name"],
        ["C.CId","Conference series ID"],
        ["C.CN","Conference series name"],
        //["CC","Citation count"],
        //["CitCon","Citation contexts</br></br>List of referenced paper ID's and the corresponding context in the paper (e.g. [{123:[\"brown foxes are known for jumping as referenced in paper 123\", \"the lazy dogs are a historical misnomer as shown in paper 123\"]})"],
        ["D","Date published in YYYY-MM-DD format"],
        ["DN","Original paper title"],
        ["DOI","Digital Object Identifier</br></br>IMPORTANT: The DOI is normalized to uppercase letters, so if querying the field via evaluate/histogram ensure that the DOI value is using all uppercase letters"],
        //["E","Extended metadata</br></br>IMPORTANT: This attribute has been deprecated and is only supported for legacy applications. Requesting this attribute individually (i.e. attributes=Id,Ti,E) will result in all extended metadata attributes being returned in a serialized JSON string</br></br>All attributes contained in the extended metadata are now available as a top-level attribute and can be requested as such (i.e. attributes=Id,Ti,DOI,IA)"],
        ["ECC","Estimated citation count"],
        //["F.DFN","Original field of study name"],
        //["F.FId","Field of study ID"],
        //["F.FN","Normalized field of study name"],
        ["FamId","If paper is published in multiple venues (e.g. pre-print and conference) with different paper IDs, this ID represents the main/primary paper ID of the family. The field can be used to find all papers in the family group, i.e. FamId=<paper_id>"],
        ["I","Publication issue"],
        //["IA","Inverted abstract"],
        ["Id","Paper ID"],
        ["J.JId","Journal ID"],
        ["J.JN","Journal name"],
        ["FP","First page of paper in publication"],
        ["LP","Last page of paper in publication"],
        ["PB","Publisher"],
        ["Pt","Publication type (0:Unknown, 1:Journal article, 2:Patent, 3:Conference paper, 4:Book chapter, 5:Book, 6:Book reference entry, 7:Dataset, 8:Repository"],
        //["RId","List of referenced paper IDs"],
        ["S","List of source URLs of the paper, sorted by relevance"],
        ["Ti","Normalized title"],
        ["V","Publication volume"],
        ["VFN","Full name of the Journal or Conference venue"],
        //["VSN","Short name of the Journal or Conference venue"],
        //["W","Unique, normalized words in title"],
        ["Y","Year published"]
      ].map(ea => ea[0]).join(",")
      debugger
      var interpretation = await fetch(`https://api.labs.cognitive.microsoft.com/academic/v1.0/interpret?query=`
            + encodeURI(textQuery)
            + `&complete=1&count=1&subscription-key=${await AcademicScheme.getSubscriptionKey()}`).then(r => r.json())
      if (!interpretation.interpretations[0] || !interpretation.interpretations[0].rules[0]) {
        return {error: "no interpretations", value: interpretation}
      }
      
      var queryExpr = interpretation.interpretations[0].rules[0].output.value
      var result = await fetch(`https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?expr=`
            + encodeURI(queryExpr)
            + `&complete=1&count=1`
            + `&attributes=${attributes}`
            +`&subscription-key=${await AcademicScheme.getSubscriptionKey()}`).then(r => r.json())
      return result
  }
  
  // Alternive but slightly different product API that does not require a key
  // "https://academic.microsoft.com/api/search"
  
  async rawQuery(queryString) {    
    return await fetch("https://academic.microsoft.com/api/search", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        query: queryString,
        queryExpression: "",
        filters: [],
        orderBy: 0,
        skip: 0,
        sortAscending: true,
        take: 1 // feeling lucky
      }) }).then(r => r.json());
  }

  async paperQuery(queryString, usingAcademicKnowledgeQuery=this.isUsingAcademicKnowledgeQuery) {
    if (usingAcademicKnowledgeQuery) {
          let raw = (await this.rawAcademicKnowledgeQuery(queryString))
          if (raw.entities)  {
            return  { 
              type: "paper",
              entity: raw.entities[0]
            }
          } else {
            return { 
              error: "could not find paper", 
              value: raw
            }
          }
    } else {  
      let raw = await this.rawQuery(queryString);
      let paper = raw && raw.pr && raw.pr[0] && raw.pr[0].paper;
      if (paper) {
        // does not fit entirely.... shit!
        // var schema =  (await MicrosoftAcademicEntities.schemas()).paper       
        return {
          type: "paper",
          entity: paper
        };
      }
      return { type: "none", error: "no paper found" };
    }
  }

  async content(queryString) {
    var content = `<h2>${this.scheme}: ${queryString}</h2>`;

    var json = await this.paperQuery(queryString, true);

    if (json.error) return `<span class="error">${json.error}</span>`
    if (!json.entity) {
      debugger
      return `<span class="error">no entity</span>`
    }
    var paper = new Paper(json.entity)
    content += paper.toHTML();
    return content;
  }

  async GET(options) {
    var query = this.url.replace(new RegExp(this.scheme + "\:\/\/"), "");
    if (query.length < 2) return this.response(`{"error": "query to short"}`);

    if (options && options.headers) {
      var headers = new Headers(options.headers); // #Refactor we should unify options before
      if (headers.get("content-type") == "application/json") {
        let json = await this.paperQuery(query);
        return this.response(JSON.stringify(json), "application/json");
      }
      
      if (headers.get("content-type") == "application/bibtex") {
        let json = await this.paperQuery(query);
        if (!json.entity) return this.error("no entity")
        return this.response(new Paper(json.entity).toBibtex(), "application/bibtex");
      }
      
    }

    query = decodeURI(query);
    var content = await this.content(query);

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