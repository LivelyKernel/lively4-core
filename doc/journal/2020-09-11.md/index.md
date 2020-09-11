## 2020-09-11 #MicrosoftAcademic for the Win!
*Author: @JensLincke*

Found it by reverse engineering <https://academic.microsoft.com/>... but maybe it is documented?

```javascript
fetch("https://academic.microsoft.com/api/search", {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8"
  },
  body: JSON.stringify({query: "Jens Lincke 2014", queryExpression: "", filters: [], orderBy: 0, skip: 0, sortAscending: true, take: 10})
}).then(r => r.json())
```


![](microsoft_academic_search.png)


### And here we go

```javascript
import moment from "src/external/moment.js";


var json;

(async () => {
json = await fetch("https://academic.microsoft.com/api/search", {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8"
  },
  body: JSON.stringify({query: "Jens Lincke", queryExpression: "", filters: [], orderBy: 0, skip: 0, sortAscending: true, take: 10})
}).then(r => r.json())
})()




json.pr.map(ea => ({
  authors: ea.paper.a.map(author => author.dn), 
  title: ea.paper.dn, 
  microsoftid: ea.paper.id, 
  year: moment(ea.paper.v.publishedDate).year(),
  publisher: ea.paper.v.displayName,
  keywords: ea.paper.fos.map(kw => kw.dn),
  abstract: ea.paper.d, 
}))
```


![](microsoft_academics_result.png)


![](microsoft_academic_works.png)
