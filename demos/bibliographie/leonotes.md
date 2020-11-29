# Leo Notes

```javascript
 let info = ""
    for(var m of Strings.matchAll(/[Ii]d=([0-9]+)/, this.queryString())) {
      let id = m[1]
      let raw  = await files.loadJSON(`academic://raw:Id=${id}?attr=AuN,Ty,AA.AuN,Y,Ti,FN`)
      
      var entity = raw.entities[0]
      var type = MicrosoftAcademicEntities.getEntityType(entity.Ty)
      var label = ""
      if(type =="author") { 
        label = entity["AuN"]
      } else if(type == "field-of-study") { 
        label =  entity["FN"] 
      } else if(type =="paper") { 
        label =  entity["Ti"] 
      }
      
      info += `<span>${id}: ${type}, ${label}</span><br>` 
    }
    this.pane.querySelector("#info").innerHTML = info
```


```javascript
import ohm from "https://unpkg.com/ohm-js@15.2.1/dist/ohm.js"


var myGrammar = ohm.grammar('MyGrammar { greeting = "Hello" | "Hola" | "Hallo" }');


myGrammar

var userInput = 'Hello';
var m = myGrammar.match(userInput);


var userInput = 'Hallo';
var m = myGrammar.match(userInput);

m
```

```javascript
import ohm from "https://unpkg.com/ohm-js@15.2.1/dist/ohm.js"


var myGrammar = ohm.grammar(
`Academic {
  Exp =
    AcademicQuery

  AcademicQuery = Attribute Comparator Value -- simpleQuery
    | ("And" | "Or") "(" AcademicQuery "," AcademicQuery ")" -- complexQuery
    | "Composite(" CompositeQuery ")" -- compositeQuery

  CompositeQuery = CompositeAttribute Comparator Value -- simpleCompositeQuery
    | ("And" | "Or") "(" CompositeQuery "," CompositeQuery ")" -- complexCompositeQuery

  Comparator =
    PartialComparator "="?
  PartialComparator =
    "=" | "<" | ">"

  Attribute (an attribute) =
    letter letter? letter?
  CompositeAttribute =
    Attribute "." Attribute


  Value (a value) =
    "'" alnum* "'" -- string
    | Number
    | Date
    | ( "[" | "(" ) Number "," Number ( "]" | ")" ) -- numberRange
    | ( "[" | "(" ) Date "," Date ( "]" | ")" ) -- dateRange

  Number =
    digit+
  Date =
    "'" digit digit digit digit "-" digit digit "-" digit digit "'"
}`)



'Academic {
\n  Exp =
\n    AcademicQuery
\n
\n  AcademicQuery = Attribute Comparator Value -- simpleQuery
\n    | ("And" | "Or") "(" AcademicQuery "," AcademicQuery ")" -- complexQuery
\n    | "Composite(" CompositeQuery ")" -- compositeQuery
\n
\n  CompositeQuery = CompositeAttribute Comparator Value -- simpleCompositeQuery
\n    | ("And" | "Or") "(" CompositeQuery "," CompositeQuery ")" -- complexCompositeQuery
\n
\n  Comparator =
\n    PartialComparator "="?
\n  PartialComparator =
\n    "=" | "<" | ">"
\n
\n  Attribute (an attribute) =
\n    letter letter? letter?
\n  CompositeAttribute =
\n    Attribute "." Attribute
\n
\n
\n  Value (a value) =
\n    "'" alnum* "'" -- string
\n    | Number
\n    | Date
\n    | ( "[" | "(" ) Number "," Number ( "]" | ")" ) -- numberRange
\n    | ( "[" | "(" ) Date "," Date ( "]" | ")" ) -- dateRange
\n
\n  Number =
\n    digit+
\n  Date =
\n    "'" digit digit digit digit "-" digit digit "-" digit digit "'"
\n}'



'Academic { Exp = AcademicQuery AcademicQuery = Attribute Comparator Value -- simpleQuery | ("And" | "Or") "(" AcademicQuery "," AcademicQuery ")" -- complexQuery | "Composite(" CompositeQuery ")" -- compositeQuery CompositeQuery = CompositeAttribute Comparator Value -- simpleCompositeQuery | ("And" | "Or") "(" CompositeQuery "," CompositeQuery ")" -- complexCompositeQuery Comparator = PartialComparator "="? PartialComparator = "=" | "<" | ">" Attribute (an attribute) = letter letter? letter? CompositeAttribute = Attribute "." Attribute Value (a value) = "'" alnum* "'" -- string | Number | Date | ( "[" | "(" ) Number "," Number ( "]" | ")" ) -- numberRange | ( "[" | "(" ) Date "," Date ( "]" | ")" ) -- dateRange Number = digit+ Date = "'" digit digit digit digit "-" digit digit "-" digit digit "'" }'

'Academic { \n  Exp = \n    AcademicQuery \n \n  AcademicQuery = Attribute Comparator Value -- simpleQuery \n    | ("And" | "Or") "(" AcademicQuery "," AcademicQuery ")" -- complexQuery \n    | "Composite(" CompositeQuery ")" -- compositeQuery \n \n  CompositeQuery = CompositeAttribute Comparator Value -- simpleCompositeQuery \n    | ("And" | "Or") "(" CompositeQuery "," CompositeQuery ")" -- complexCompositeQuery \n \n  Comparator = \n    PartialComparator "="? \n  PartialComparator = \n    "=" | "<" | ">" \n \n  Attribute (an attribute) = \n    letter letter? letter? \n  CompositeAttribute = \n    Attribute "." Attribute \n \n \n  Value (a value) = \n    "'" alnum* "'" -- string \n    | Number \n    | Date \n    | ( "[" | "(" ) Number "," Number ( "]" | ")" ) -- numberRange \n    | ( "[" | "(" ) Date "," Date ( "]" | ")" ) -- dateRange \n \n  Number = \n    digit+ \n  Date = \n    "'" digit digit digit digit "-" digit digit "-" digit digit "'" \n}'
```



```javascript
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
}).then(r => lively.notify(r.json()))

fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "application/json"
  }
}).then(r => r.json())

fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "text/html"
  }
}).then(r => lively.notify(r.text()))

fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "application/bibtex"
  }
}).then(r => r.text()).then(s => {
  lively.notify(s)
  return s
} )
```