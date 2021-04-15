import _ from 'src/external/lodash/lodash.js'
import diff from 'src/external/diff-match-patch.js';
const dmp = new diff.diff_match_patch();
import Github from "src/client/github.js"

import { uuid as genUUID } from 'utils';

import tinycolor from 'src/external/tinycolor.js';




export class Annotation {
  constructor(config) {
    this.from = 0, // starts here...
    this.to =  0  // stops before 
    Object.keys(config).forEach(key => {
      this[key] = config[key]
    })
  }
  
  equalsRegion(region) {
    return this.from == region.from && this.to == region.to
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
  
  codeMirrorMark(cm) {
    var color = this.color || "lightgray"
    
    color = tinycolor(color)
    color.setAlpha(0.4)

    
    var fromPos = cm.posFromIndex(this.from)
    var toPos = cm.posFromIndex(this.to)
      
    var marker = cm.markText(fromPos, toPos, 
      {
        className: "lively-annotation",
        attributes: {
          "data-annotation": JSON.stringify(this)
        },
        css: `background-color: ${color.toString()}`});
    return marker
  }
  
  annotateInDOM(node, pos=0, parent) {
    var annotation = this
    if (node instanceof Text) {
      var from = pos
      var to = from + node.length
      var intersection = annotation.intersectRegion({from, to})
      if (intersection && parent) {
        // lively.notify("replace from " + intersection.from  + " to " + intersection.to)
        var s = node.textContent
        var a  = intersection.from - pos
        var b  = intersection.to - pos
        parent.insertBefore(new Text(s.slice(0, a )), node)
        var style = `text-decoration-color: ${annotation.color};`
        var replacement = <u style={style}>{s.slice(a, b)}</u>
        parent.insertBefore(replacement, node)
        var rest = new Text(s.slice(b, s.length))
        parent.insertBefore(rest, node)
        node.remove()
      }
      pos = to
    } else {
      for(var ea of Array.from(node.childNodes)) {
        pos = this.annotateInDOM(ea, pos,  node)
      }
    }
    return pos
  }
  
  intersectRegion(region) {
    if (this.to < region.from) return null
    if (region.to < this.from) return null
    return {from: Math.max(this.from, region.from), to: Math.min(this.to, region.to)}
  }
  
  isInRegion(region) {
    // could alternatively use insersectRegion ...
    return region.from < this.to && this.to < region.to 
      || region.from <= this.from && this.from < region.to;
  }
  
  cutRegion(region) {
    var intersection = this.intersectRegion(region)
    if (!intersection) return this
    if (this.equalsRegion(intersection)) return null // cut complete
    if (intersection.from == this.from) {
      this.from = intersection.to
      return this
    } else if (intersection.to == this.to) {
      this.to = intersection.from
      return this
    } else {
      // split annotation
      var rest = this.clone()
      this.to = intersection.from
      rest.from = intersection.to
      return [this, rest] // and here we #Alias, annotations should deal with this with indirection 
                          // (e.g. ids that point to the real data if necessary)
    }
  }
}

export default class AnnotationSet {

  constructor(annotationsAndVersions=[]) {
    this.list = [];
    this.reference;
    for(let ea of annotationsAndVersions) {
      if (ea.type == "Reference") {
        this.textVersion = ea.version // multiple text references per annotations file not (yet) supported 
        this.textContent = ea.content
      } else {
        this.add(ea)
      }
    }
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
    if (!this.has(annotation)) {
      this.list.push(new Annotation(annotation))
    }
  }

  addAll(annotations) {
    for(let ea of annotations) {
      this.add(ea)
    }
  }

  remove(annotation) {
    this.list = this.list.filter(ea => !ea.equals(annotation))
  }

  removeAll(annotations) {
    this.list = this.list.filter(ea => !annotations.has(ea))
  }


  equals(other) {
    if (this.size != other.size) return false
    for(let ea of this) {
      if (!other.has(ea)) return false
    }
    return true
  }
/*MD # Design Challenge

What should a "diff" of annotations actually look like?

should it be based on the Set semantics... and actually look for identical annotations, 
e.g. same "from" and "to" and same payload..

Or should we split up the text annotations in regions... and normalize the annotations through that way?

How do we deal with "duplicates" and or overlapping "annotations" in the first place...



MD*/

  
  mergeWithTransform(mytransformDiff, other, otherTransformDiff, parent, parentTransformDiff) {
    var transformedMe = this.applyTextDiff(mytransformDiff)
    var transformedOther = otherTransformDiff.applyTextDiff(otherTransformDiff)
    var transformedParent = this.applyTextDiff(parentTransformDiff)
    return transformedMe.merge(transformedOther, transformedParent)
  }


  merge(other, lastCommonParent) {
    // {from, to} of {this, other, lastCommonParent} reference same text    

    var diffA = lastCommonParent.diff(this)
    var diffB = lastCommonParent.diff(other)
  
    var result = lastCommonParent.clone()
    result.removeAll(diffA.del)
    result.removeAll(diffB.del)
    result.addAll(diffA.add)
    result.addAll(diffB.add)
    
    return result
  }

  diff(otherAnnotationSet) {
    var result = this.compare(otherAnnotationSet)
    
    // #TODO 
    // compare is very basic... some of the added and deleteted might be mutatated?

    return result
    
  }

  has(annotation) {
    // #TODO #Performance bug... lineas with complex equals...
    let found =  this.list.find(ea => ea.equals(annotation)) 
    return found ? true : false
  }


  // basic comparison... of actual annotations...
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

  removeFromTo(from, to) {
    var region = {from, to}
    for(let ea of this) {
      var intersection = ea.intersectRegion(region)
      if (intersection) {
        var result = ea.cutRegion(intersection)
        if (result == null) {
          this.remove(ea)
        } else if (result == ea) {
          // do nothing
        }else if (result.length == 2) {
          this.add(result[1]) // we are cut in half
        }
      } 
    }
  }
  
  annotationsInRegion(region = {from: 0, to:0, content: ""}) {
    var result = new Set()
    for(let ea of this) {
      if (this.isInRegion(region, ea)) {
        this.add(ea)       
      }
    }
    return result
  }

  applyTextDiff(textDiff) {
    let pos = 0;
    for (let change of textDiff) {
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

  toJSONL() {
    var config = []
    if (this.textVersion ||  this.textContent) {
      config.push({type: "Reference", version: this.textVersion, content: this.textContent})
    }
    return config.concat(this.list).map(ea => JSON.stringify(ea)).join("\n");    
  }

  toXML(text) {
    let regions = this.regions(text);
    var xml = regions.map(ea => {
      var s = ea.content;
      for(let annotation of this) {
        if (annotation.isInRegion(ea)) {
          s = `<${annotation.name}>${s}</${annotation.name}>`;
        }
      }
      return s;
    }).join("");
    return xml;
  }

  static fromJSONL(source) {
    var list = source.split("\n").map(ea => {
      try{ 
        return JSON.parse(ea) 
      } catch(e) {
        console.warn("[annotations] could not parse linke: " + ea)
      }
    }).filter(ea => ea)
    return new AnnotationSet(list)
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
    splitters = Array.from(splitters).sort((a, b) => a-b);
    var regions = [];
    var last = 0;

    for (var pos of splitters) {
      regions.push({ from: last, to: pos, content: text && text.slice(last, pos) });
      last = pos;
    }

    return regions;
  }
  

  clearCodeMirrorMarks(cm) {
    cm.getAllMarks().forEach(ea => ea.clear())
  }

  renderCodeMirrorMarks(cm) {
    this.clearCodeMirrorMarks(cm)
    for(let ea of this) {
      ea.codeMirrorMark(cm)
    }
  }


  clone() {
    var r =  AnnotationSet.fromJSON(this.toJSON());
    r.lastVersion = this.lastVersion // keep meta information
    return r
  }

  static fromJSON(json) {
    return new AnnotationSet(JSON.parse(json));
  }

  static async fromURL(url, version) {
    var source = await lively.files.loadFile(url, version)
    return this.fromJSON(JSON.parse(source))
  }

 
  livelyInspect(contentNode, inspector) {
    if (this.list) contentNode.appendChild(inspector.display(this.list, false, "list", this));
    if (this.textVersion) contentNode.appendChild(inspector.display(this.textVersion, false, "textVersion", this));
    if (this.textContent) contentNode.appendChild(inspector.display(this.textContent, false, "textContent", this));
  
  }
}


export class AnnotatedText {
  
  constructor(text, annotations) {
    this.text = text || ""
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
    
  static async fromURL(fileURL, annotationsURL, annotationsVersion, force) {
    
    
    var version;
    if (annotationsVersion) {
      var annotationsResp = await lively.files.loadFileResponse(annotationsURL, annotationsVersion)
      if (annotationsResp.status != 200) {
        if (force) {
          return this.fromSource("", fileURL, annotationsURL)
        } 
        return // nothing to see here...
      }
      var source = await annotationsResp.text()      
    } else {
      debugger
      source = await lively.files.loadFile(annotationsURL)
      version = undefined; // does not work: annotationsResp.headers.get("fileversion")
    }
    
    return this.fromSource(source, fileURL, annotationsURL, version)
  }  
  
  static async fromSource(source, fileURL, annotationsURL, lastVersion) {
    var annotations = AnnotationSet.fromJSONL(source)
    annotations.fileURL = fileURL
    annotations.annotationsURL = annotationsURL
    annotations.lastVersion = lastVersion
    // hopefully we have the full text content... 
    if (annotations.textContent) {
      var text = annotations.textContent         
    } else if(fileURL){      
      // if not, we can try to get it...
      var textResp = await lively.files.loadFileResponse(fileURL, annotations.textVersion || lastVersion)
      if (textResp.status !== 200) {
        console.error("[annotations] could not load reference text for annotations")
      }
      text = await textResp.text()
      annotations.textVersion = textResp.headers.get("fileversion")
      annotations.textContent = text
    }
    var annotatedText = new AnnotatedText(text, annotations)    
    return annotatedText 
  }
  
  toSource() {
    return this.annotations.toJSONL() 
  }
  
  async saveToURL(fileURL=this.annotations.fileURL, annotationsURL=this.annotations.annotationsURL) {
    await lively.files.saveFile(fileURL, this.text) 
    await lively.files.saveFile(annotationsURL, this.annotations.toJSONL()) 
  }
  
  equals(otherText) {
    if (!otherText) return false
    if (!otherText.annotations) return false
    return this.text == otherText.text && this.annotations.equals(otherText.annotations)
  }
  
  
  // set text and upate annotations
  setText(string, version) {
    var oldText = this.text
    this.text = string
    if (version) {
      // #TODO find last online commited version (e.g. uploaded to GitHub) that will not be squashed...
      // this.annotations.syncedTextVersion = version
      this.annotations.textVersion = version
    }
    this.annotations.textContent = string // we cannot rely on the version alone
    let textDiff = dmp.diff_main(oldText, this.text);
    this.annotations.applyTextDiff(textDiff)
  }
  
  toHTML() {
    return this.annotations.toXML(this.text)
  }
  
  clearCodeMirrorMarks(cm) {
    return this.annotations.clearCodeMirrorMarks(cm)
  }
  
  static fromHTML(html) {
    
    var annotations = new AnnotationSet();
    
    var string = ""
  
    function visit(node, notfirst) {
      if (!node || !node.childNodes) return;
      if (node instanceof Text) {
        string += node.textContent
      } else {
        if (notfirst) {
          var annotation = new Annotation({
            from: string.length, 
            to: string.length + node.textContent.length, 
            name: node.localName})
          annotations.add(annotation)
        }
        // for (let attr of node.attributes) {
        //   //  TODO
        // }
      }
      for(let ea of node.childNodes) {
        visit(ea, true)
      }
    }
    
    var parser = new DOMParser();
    var doc = parser.parseFromString(html,"text/html");
    visit(doc.body)
    annotations.textContent = string
    var annotatedText = new AnnotatedText(string, annotations);
    return annotatedText
  }
  
  clone() {
    return new AnnotatedText(this.text, this.annotations.clone())
  }
  
  


  static async solveAnnotationConflict(textURL, annotationURL) {
    var sourceWithConflict = await annotationURL.fetchText() 
    var textResp = await fetch(textURL)
    var text =  await textResp.text()
    var textVersion = textResp.headers.get("fileversion")
    
    var serverURL = lively.files.serverURL(textURL)
    var repositoryName = lively.files.repositoryName(textURL)
    
    
    if (!serverURL || !repositoryName) throw new Error("Can only merge conflicts lively repository")
    
    var versions = lively.files.extractGitMergeConflictVersions(sourceWithConflict) 
    if (versions.length == 0) return // nothing to do
    
    if (versions.length != 2) throw new Error("merge  != 2 not support yet")
    var versionA= versions[0]
    var versionB = versions[1]
    
        
    // use git to find a common ancestor for merging:
    //   lively4@livelygraph:~/lively4/lively4-dummyA$ git merge-base HEAD fd956
    //   7d66773a9d35de3c95b0478b2fccf70c97c0061a

    var versionBase = await Github.current().getGitMergeBase(serverURL, repositoryName, versionA, versionB)
    var a = await this.fromURL(textURL, annotationURL, versionA)
    var b = await this.fromURL(textURL, annotationURL, versionB)
    var base = await this.fromURL(textURL, annotationURL, versionBase)

    
    return this.mergeAnnotations(a, b, base, text, textVersion)
  }
  
  static async mergeAnnotations(a, b, base, mergedText, mergedTextVersion) {
    // update the index positions of to fit text of a
    base.setText(mergedText)
    a.setText(mergedText)
    b.setText(mergedText)

    var mergedAnnotations = a.annotations.merge(b.annotations, base.annotations) 
    mergedAnnotations.textVersion = mergedText
    mergedAnnotations.textContent = mergedTextVersion
    
    return new AnnotatedText(a.text, mergedAnnotations)
  }
  

}

