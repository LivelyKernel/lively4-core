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
'Academic {
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
}')
```