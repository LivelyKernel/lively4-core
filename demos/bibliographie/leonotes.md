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