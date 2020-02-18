
Set
import _ from 'src/external/lodash/lodash.js'


export class Annotation {
  constructor(config) {
    this.from = 0, // starts here...
    this.to =  0  // stops before 
    Object.keys(config).forEach(key => {
      this[key] = config[key]
    })
    
    
  }
  
  equals(annotation) {
    // do not check for classes.. we should also compare to structurally indentical objects?
    // if (!(annotation instanceof Annotation)) return false;
    
    for(let key of Object.keys(this)) {
      if (this[key] != annotation[key]) return false
    }
    // and the other way around....
    for(let key of Object.keys(annotation)) {
      if (this[key] != annotation[key]) return false
    }
    return true
  }
  
  get length() {
    return this.to - this.from
    
  }
}

export default class AnnotationSet {

  constructor(annotations=[]) {
    this.list = [];
    this.addAll(annotations)
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

/*MD # Design Challenge

What should a "diff" of annotations actually look like?

should it be based on the Set semantics... and actually look for identical annotations, 
e.g. same "from" and "to" and same payload..

Or should we split up the text annotations in regions... and normalize the annotations through that way?

How do we deal with "duplicates" and or overlapping "annotations" in the first place...



MD*/


  diffAnnotationSet(otherAnnotationSet) {
    
    // var merged = this.clone()
    // merged.addAll(otherAnnotationSet)

    var result = this.compare(otherAnnotationSet)
    
//     var regions = merged.regions()
//     return regions.map(region => {
//       var my = this.annotationsInRegion(region)
//       var others = otherAnnotationSet.annotationsInRegion(region)
      
      
//       return region
//     })
    
    
    return result
    
  }

  has(annotation) {
    // #TODO #Performance bug... lineas with complex equals...
    let found =  this.list.find(ea => ea.equals(annotation)) 
    return found ? true : false
  }


  // private
  compare(b) {
    var a = this
    var same = new AnnotationSet()
    var add = new AnnotationSet()
    var del = new AnnotationSet()
    for(let ea of a) {
      if (b.has(ea)) {
        same.add(ea)
      } else {
        del.add(ea)
      }
    }
    for(let ea of b) {
      if (!same.has(ea)) {
        add.add(ea)
      }
    }
    return {same, add, del}
  } 

  annotationsInRegion(region) {
    var result = new Set()
    this.forEach(ea => {
      if (this.isInRegion(region, ea)) {
        result.add(ea)
      }
    });
    return result
  }

  applyAnnotationDiff(annotationDiff) {
    
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
    if (text) {
      splitters.add(text.length);
    }
    splitters = Array.from(splitters).sort();
    var regions = [];
    var last = 0;

    for (var pos of splitters) {
      regions.push({ from: last, to: pos, content: text && text.slice(last, pos) });
      last = pos;
    }

    return regions;
  }

  clone() {
    return AnnotationSet.fromJSON(this.toJSON());
  }

  static fromJSON(json) {
    return new AnnotationSet(JSON.parse(json));
  }
}


export class AnnotatedText {
  
  constructor(text, annotations) {
    this.text = text
    this.annotations = new AnnotationSet()
    if (annotations instanceof AnnotationSet) {
      this.annotations = annotations
    } else if (_.isString(annotations)) {
      annotations.split("\n").forEach(ea => {
        try {
          var a = JSON.parse(ea)
          this.annotations.add(a)
        } catch(e) {
          console.error("Annotation could not be parsed: " + ea, e)
        }
      })
    } else {
      // JSON?
    }
    
  }
  
  asHTML() {
    return this.annotations.toXML(this.text)
  }
  
}

