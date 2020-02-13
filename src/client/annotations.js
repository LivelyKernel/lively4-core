
/*MD # Annotations

```javascript
var annotation = {
  from: 10, // starts here...
  to: 15  // stops before 
}
```

`length` of annotation is "to - from"


MD*/

class Annotation {
  constructor(config) {
    Object.keys(config).forEach(key => {
      this[key] = config[key]
    })
  }
  
}

export default class Annotations {

  constructor(annotations=[]) {
    this.list = [];
    annotations.forEach(ea => {
      this.add(ea)
    })
  }
  
  *[Symbol.iterator] () {
    for(var ea of this.list) {
      yield ea;  
    }  
  }

  get size() {
    return this.list.length
  }
  
  add(annotation) {
    this.list.push(new Annotation(annotation))
  }

  addAll(annotations) {
    for(let annotation of annotations) {
      this.add(annotation)
    }
  }
  
  applyDiff(diff) {
    let pos = 0;
    for (let change of diff) {
      let isAdd = change[0] == 1;
      let isDel = change[0] == -1;
      let isSame = change[0] == 0;
      let length = change[1].length;
      let newpos = pos + length;
      let delOrAdd = isDel ? -1 : 1;
      if (isAdd || isDel) {
        for (let annotation of this.list) {

          // simplest implementation... just grow and shrink with the diff
          if (pos <= annotation.from) {
            annotation.from += delOrAdd * length;
          }
          if (pos <= annotation.to) {
            annotation.to += delOrAdd * length;
          }
        }
      }
      if (isAdd || isSame) {
        pos = newpos;
      }
    }
  }

  toJSON() {
    return JSON.stringify(this.list);
  }

  toXML(text) {
    let regions = this.regions(text);
    var xml = regions.map(ea => {
      var s = ea.content;
      this.list.forEach(annotation => {
        if (this.isInRegion(ea, annotation)) {
          s = `<${annotation.name}>${s}</${annotation.name}>`;
        }
      });
      return s;
    }).join("");
    return xml;
  }

  isInRegion(region, annotation) {
    return region.from < annotation.to && annotation.to < region.to 
      || region.from <= annotation.from && annotation.from < region.to;
  }

  regions(text) {
    var splitters = new Set();
    this.list.forEach(ea => {
      splitters.add(ea.from);
      splitters.add(ea.to);
    });
    splitters.add(text.length);
    splitters = Array.from(splitters).sort();
    var regions = [];
    var last = 0;

    for (var pos of splitters) {
      regions.push({ from: last, to: pos, content: text.slice(last, pos) });
      last = pos;
    }

    return regions;
  }

  clone() {
    return Annotations.fromJSON(this.toJSON());
  }

  static fromJSON(json) {
    return new Annotations(JSON.parse(json));
  }

}