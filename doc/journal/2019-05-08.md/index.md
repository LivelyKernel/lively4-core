## 2019-05-08 

### Circular References in JSON!

TechReport Title: Serializing Object Graphs with circular references in Javascript using JOSN.stringify and JSON.parse with replacer and reviver fucntions

```javascript
import { uuid } from 'utils';

var backref = new Map();

function replacer(key, value) {
  console.log(key, value)
  if (value instanceof Object) {
    if (backref.has(value)) {
      return 'backref:'+value.__livelyId__;
    } else {
      backref.set(value, true)
      value.__livelyId__ = value.__livelyId__ || uuid();
      return value;
    }
  }
  return value;
}

var foo = {foundation: { foo: 131432}, model: "box", week: 45, transport: "car", month: 7};
foo.foundation.bar = foo.foundation;
var str = JSON.stringify(foo, replacer, 2);
```


```javascript
var reviveMap = new Map();

function reviver(key, value) {
  
  if (value instanceof Object && value.__livelyId__ && !reviveMap.has(value.__livelyId__)) {
    reviveMap.set(value.__livelyId__, value)
    // delete value.__livelyId__ // optionally clear
  }
  
  if (typeof value === 'string' && value.match(/^backref:/)) {
    var id = value.replace(/^backref:/, '')
    const obj = reviveMap.get(id)
    if (obj) {
      return obj;
    } else {
      return 'UNRESOLVED:'+id
    }
  }

  return value;
}

JSON.parse(str, reviver)
```

-> does not work directly, as we process the innermost items/objects first
-> we should create a shallow object instead of the unresolved string and fill it later when we come by the actual object. #TODO #Serialization


