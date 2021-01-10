import Morph from 'src/components/widgets/lively-morph.js';
import ohm from "https://unpkg.com/ohm-js@15.2.1/dist/ohm.js";

var g = ohm.grammar(
  `Academic { 
    Exp =
      AcademicQuery

    AcademicQuery = Attribute Comparator Value -- simple
      | ("And" | "Or") "(" AcademicQuery "," AcademicQuery ")" -- complex
      | "Composite(" CompositeQuery ")" -- composite
    CompositeQuery = Attribute "." Attribute Comparator Value -- simple
      | ("And" | "Or") "(" CompositeQuery "," CompositeQuery ")" -- complex

    Comparator =
      PartialComparator "="?
    PartialComparator =
      "=" | "<" | ">"

    Attribute (an attribute) =
      letter letter? letter? letter?

    Value (a value) =
      "\'" alnum* "\'" -- string
      | Number
      | Date
      | ( "[" | "(" ) Number "," Number ( "]" | ")" ) -- numberRange
      | ( "[" | "(" ) Date "," Date ( "]" | ")" ) -- dateRange

    Number =
      digit+
      Date =
      "\'" Number "-" Number "-" Number "\'"
  }`
);

var s = g.createSemantics();

s.addOperation(
  'interpret', {
    Exp: function(e) {
      return e.interpret();
    },

    AcademicQuery_simple: function(attribute, comparator, value) {
      return {
        "attribute" : attribute.interpret(),
        "comparator" : comparator.interpret(),
        "value" : value.interpret(),
        "type" : "simple"
      }
    },
    AcademicQuery_complex: function(conjunction, _1, left, _2, right, _3) {
      return {
        "conjunction" : conjunction.sourceString,
        "left" : left.interpret(), 
        "right" : right.interpret(),
        "type" : "conjunction"
       }
    },
    AcademicQuery_composite: function(_1, query, _2) {
      return query.interpret();
    },

    CompositeQuery_simple: function(mainAttribute, _, secondaryAttribute, comparator, value) {
      // would it make sense to split main and secondary attribute?
      var main = mainAttribute.interpret();
      var secondary = secondaryAttribute.interpret();
      return {
        "attribute" : main + "." + secondary,
        "comparator" : comparator.interpret(),
        "value" : value.interpret(),
        "type" : "composite"
      }
    },
    CompositeQuery_complex: function(conjunction, _1, left, _2, right, _3) {
      return {
        "conjunction" : conjunction.sourceString,
        "left" : left.interpret(), 
        "right" : right.interpret(),
        "type" : "conjunction"
      }
    },

    Comparator: function(main, secondary) {
      return [main.interpret(), secondary.sourceString].join('');
    },
    PartialComparator: function(comparator) {
      return comparator.sourceString;
    },

    Attribute: function(a, b, c, d) {
      return [a.interpret(), b.interpret(), c.interpret(), d.interpret()].join('');
    },

    Value: function(value) {
      return value.interpret();
    },
    Value_string: function(_1, string, _2) {
      return string.sourceString;
    },
    Value_numberRange: function(leftBracket, nLeft, _, nRight, rightBracket) {
      return "TODO";//arguments.map(a => {a.sourceString}).join('');
    },
    Value_dateRange: function(leftBracket, dLeft, _, dRight, rightBracket) {
      return "TODO";//arguments.map(a => {a.sourceString}).join('');
    },

    Number: function(n) {
      //return parseFloat(n.sourceString);
      return n.sourceString;
    },
    Date: function(_1, year, _2, month, _3, day, _4) {
      return new Date(year.interpret(),
                      month.interpret(),
                      day.interpret())
    },

    letter: function(a) {
      return a.sourceString;
    }
  }
)

var observer;
var timeout;

export default class AcademicSubquery extends Morph {
  constructor() {
    super();
  }
  
  async initialize() {
    this.updateView()
    
    observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        //lively.notify("observation", mutation.type)
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          if (mutation.type == "characterData") {
            this.textContent = await this.viewToQuery();
          }
          if (mutation.type == "childList") {
            clearTimeout(timeout);
            //timeout = setTimeout(() => {
              var div = <div id="update"></div>;
              this.appendChild(div);
              this.removeChild(div);
            //}, 3000);
          }
        }, 1000);
      })
    });
    
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true,
    };
    
    // TODO: Why are we switching focus after editing
    // once we start observing?
    observer.observe(this.get('#pane'), config);
    
    // TODO: falls ich das umbaue, sodass eine subquery einfach als
    // html Element in updateView erstellt wird, muss das hier auch da rein
//     this.addEventListener('dragstart', (evt) => this.onDragStart(evt))
//     this.addEventListener('dragend', (evt) => this.onDragEnd(evt))
//     this.addEventListener('dragover', (evt) => this.onDragOver(evt))
//     this.addEventListener('drop', (evt) => this.onDrop(evt))
    
    this.style.draggable = 'true';
  //   "drag",
  // "dragend",
  // "dragenter",
  // "dragleave",
  // "dragover",
  // "dragstart",
  // "drop",
  }
  
  onDragStart(event) {
    //event.dataTransfer.setData("element", event.target.id);
    this.style.opacity = '0.4';
    this.style.color = "black";
    
    // var id = lively.ensureID(this)
    // this.id = id
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', this.innerHTML);
    //event.dataTransfer.setData("application/lively4id", id);
  }
  
  onDragEnd(event) {
    //event.dataTransfer.setData("element", event.target.id);
    this.style.opacity = '1.0';
  }
  
  onDragOver(event) {
    //event.dataTransfer.setData("element", event.target.id);
    // the next line should not be neccessary with onDragEnter()...
    this.classList.add('over');
    //this.style.border = '3px dotted #666';
  }
  
  onDrop(event) {
    //if (this.dragStart !== this) {
      //var id = event.dataTransfer.getData("application/lively4id")
      //var el = lively.query(this, "#"+id);
      //lively.notify("ELEMENT", el);
    this.innerHTML = event.dataTransfer.getData("text/html");
    this.classList.remove('over');
    //}
  }
  
  onDragEnter(event) {
    event.preventDefault();
    //if (!this.complexQuery) this.style.border = '3px dotted #666';
    //lively.notify("ENTERED THIS", this.classList)
    this.classList.add('over');
  }
  
  onDragLeave(event) {
    event.preventDefault();
    this.classList.remove('over');

    //if (!this.isComplex) this.style.border = '3px dotted #FFF';
  }
  
  
  
  
  async updateView() {
    var pane = this.get("#pane")
    pane.innerHTML = ""
    
    if(this.ui) {
      this.ui.style.draggable = 'true'
      this.ui.style.userSelect = 'none'
      if (!this.isComplex) {
        this.ui.addEventListener('dragstart', this.onDragStart)
        this.ui.addEventListener('dragend', this.onDragEnd)
        this.ui.addEventListener('dragover', this.onDragOver)
        this.ui.addEventListener('dragenter', this.onDragEnter)
        this.ui.addEventListener('dragleave', this.onDragLeave)
        this.ui.addEventListener('drop', this.onDrop)
      }
      pane.appendChild(this.ui)
    }
  }
  
  async setQuery(q) {
    this.textContent = q;
    
    var match = g.match(q);
    var queryObject = s(match).interpret();
    this.ui = await this.queryToView(queryObject);
    
    this.updateView()
  }
  
  getQuery() {
    // dasselbe wie viewToQuery?
    return this.textContent;
  }
  
  async setQueryObject(o) {
    this.ui = await this.queryToView(o);
    
    this.updateView();
    
    // when only setting the query object, the query might not be set yet
    this.textContent = await this.viewToQuery();
  }

  async viewToQuery() {
    var query = this.textContent;
    
    if (this.isComplex) {
      // TODO: Why is this neccessary?
      if (await this.leftSubquery && await this.rightSubquery) {
        var left = await this.leftSubquery.viewToQuery();
        var right = await this.rightSubquery.viewToQuery();
        var conjunction = this.get('#conjunction').textContent;
        query = conjunction + "(" + left + ", " + right + ")";
      }
    } else {
      var innerSpan = this.get('#inner');
      if (innerSpan) {
        //lively.notify("INNERSPAN", innerSpan)
        var [attr, comp, val] = innerSpan
                    .querySelectorAll("span[name='queryPart']")
                    .map(e => e.textContent);
        if (val)
          val = val.slice(0, val.length - 1); // remove last whitespace
        // TODO: keep the '' when parsing query so that we don't have
        // 3 spans here....
        // OOODER ich lass das mit dem Edit Mode, dafür gibt's ja schon
        // das input Feld
        
        // TODO check if attribute has string value
        if (attr.slice(0, attr.length - 1) == "A") {
          val = "'" + val + "'"
        }
        //query = attr + comp + "'" + val + "'";
        if (innerSpan.getAttribute("type") == "composite")
          query = "Composite(" + attr + comp + val + ")";
        else
          query = attr + comp + val;
      }
    }
    
    return query
  }
  
  toggleEditing() {
    var queries = this.get("#inner").querySelectorAll("[name='sub']");
    var edit = this.get('#edit');
    edit.innerHTML = "";
    
    if (!this.editing) {
      this.editing = true;
      edit.appendChild(<i class="fa fa-hand-paper-o" aria-hidden="true"></i>);
      queries.forEach(q => {
        q.setAttribute("contenteditable", true);
        q.style.cursor = "text";
      });
    } else {
      this.editing = false;
      edit.appendChild(<i class="fa fa-pencil" aria-hidden="true"></i>);
      queries.forEach(q => {
        q.setAttribute("contenteditable", false);
        q.style.cursor = "grab";
      });
    }
  }
  
  onMouseOver(event) {
    this.style.color = "orange"
  }
  
  onMouseOut(event) {
    this.style.color = "black"
  }

  async queryToView(object) {
    var span = <span contenteditable="false" id="inner"></span>;
    var subSpan;
      
    switch(object.type) {
      case "conjunction":
        // Textselection in css vielleicht entfernen für Drag & Drop (bzw. erstmal Drag einschalten)
        // events.stoppropagation und preventdefault
        this.isComplex = true;
        subSpan = <span id="conjunction" contenteditable="false" style="font-size: 150%">{object.conjunction}</span>;
        var left = await (<academic-subquery style="font-size: smaller;"></academic-subquery>);
        await left.setQueryObject(object.left);
        this.leftSubquery = left; // for viewToQuery
        var right = await (<academic-subquery style="font-size: smaller;"></academic-subquery>);
        await right.setQueryObject(object.right);
        this.rightSubquery = right; // for viewToQuery
        span.appendChild(
          <table>
            <tr>
              <th>{subSpan}</th>
              <th>
                <table>
                  <tr>{left}</tr>
                  <tr>{right}</tr>
                </table>
              </th>
            </tr>
          </table>
        )
        break;
      
      // "composite" or "simple"
      default:
        this.isComplex = false;
        // make span hoverable
        span =
          <span class="hover" contenteditable="false" id="inner">
            <span class="hovercontent">
              <button
                class="button"
                click={() => {
                  this.setQuery(
                    "And(" + this.textContent + ", A='Placeholder')")
                }}>AND</button>
              <button
                class="button"
                click={() => {
                  this.setQuery(
                    "Or(" + this.textContent + ", A='Placeholder')")
                }}>OR</button>
            </span>
          </span>;
        
        subSpan = <span name="sub" draggable='true'></span>;
        [object.attribute, object.comparator, object.value].forEach(value => {
          subSpan.appendChild(<span class="queryPart" name="queryPart">{value} </span>)
          subSpan.addEventListener('mouseover', (evt) => this.onMouseOver(evt));
          subSpan.addEventListener('mouseout', (evt) => this.onMouseOut(evt));
          subSpan.style.cursor = "grab" // on drag: grabbing
        });
        span.appendChild(subSpan);
        var edit = <span id="edit" title="toggle edit mode" click={() => this.toggleEditing()}><i class="fa fa-pencil" aria-hidden="true"></i></span>;
        edit.style.cursor = "pointer";
        span.appendChild(edit);
        break;
    }
    span.setAttribute("type", object.type);

    var queryElement = <div class="dropTarget"><b>{span}</b></div>;
    
    return queryElement;
  }
  
  async livelyExample() {
    this.setQuery("Composite(AA.AuN=='susan t dumais')");
    //this.setQuery("Composite(AA.AuId=2055148755)")
    //this.setQuery("And(Or(Y=1985, Y=2008), Ti='disordered electronic systems')")
    //this.setQuery("And(O='abc', Y=1000)")
    //this.setQuery("Y='1000'")
  }
  
  
}