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
      letter letter? letter?

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

    Attribute: function(a, b, c) {
      return [a.interpret(), b.interpret(), c.interpret()].join('');
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
      return parseFloat(n.sourceString);
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

/*const observer = new MutationObserver(function(mutations) {
  mutations.forEach(mutation => {
    //lively.notify("observation", mutation.type)
    if (mutation.type == "characterData") {
      var element = mutation.target;
      lively.notify("ELEMENT",element)
      while (element.parentNode && (element.nodeName != "ACADEMIC-QUERY")) {
        lively.notify("CURRENT ELEMENT",element)
        element = element.parentNode;
      }
      if (element.nodeName == "ACADEMIC-QUERY") {
        element.textContent = element.viewToQuery();
      } else {
        lively.notify("Could not find academic-query");
      }
    }
  })
})
const config = {
  attributes: true,
  childList: true,
  subtree: true,
  attributeOldValue: true,
  characterDataOldValue: true,
  //attributeFilter: true // breaks for some reason
}*/

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
    this.addEventListener('dragstart', (evt) => this.onDragStart(evt))
    this.addEventListener('dragend', (evt) => this.onDragEnd(evt))
    this.addEventListener('dragover', (evt) => this.onDragOver(evt))
    this.addEventListener('drop', (evt) => this.onDrop(evt))
    
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
    event.dataTransfer.setData("element", event.target.id);
  }
  
  onDragEnd(event) {
    event.dataTransfer.setData("element", event.target.id);
  }
  
  onDragOver(event) {
    event.dataTransfer.setData("element", event.target.id);
  }
  
  onDrop(event) {
    event.preventDefault();
    var data = event.dataTransfer.getData("element");
    event.target.appendChild(lively.query(this, '#'+data))
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
  }

  async updateView() {
    var pane = this.get("#pane")
    pane.innerHTML = ""
    
    if(this.ui) {
      this.ui.style.draggable = 'true'
      this.ui.style.userSelect = 'none'
      this.ui.addEventListener('dragstart', (evt) => this.onDragStart(evt))
      this.ui.addEventListener('dragend', (evt) => this.onDragEnd(evt))
      this.ui.addEventListener('dragover', (evt) => this.onDragOver(evt))
      this.ui.addEventListener('drop', (evt) => this.onDrop(evt))
      pane.appendChild(this.ui)
    }
  }

  async viewToQuery() {
    var query = this.textContent;
    
    if (this.isComplex) {
      // TODO: Why is this neccessary?
      if (await this.leftSubquery && await this.rightSubquery) {
        var left = await this.leftSubquery.viewToQuery()
        var right = await this.rightSubquery.viewToQuery()
        var conjunction = this.get('#conjunction').textContent
        query = conjunction + "(" + left + ", " + right + ")";
      }
    } else {
      var [attr, comp, val] = this.get('#inner')
                  .querySelectorAll("span[name='sub']")
                  .map(e => e.textContent);
      query = attr + comp + "'" + val + "'";
    }
    
    return query
  }
  
  enableEditing() {
    var queries = this.get("#inner").querySelectorAll("[name='sub']")
    queries.forEach(q => {
      q.setAttribute("contenteditable", true)
      q.style.cursor = "text";
    })
    //query.setAttribute("contenteditable", true)
    //query.style.cursor = "text;"
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
              <button class="button">AND</button>
              <button class="button">OR</button>
            </span>
          </span>;
        
        subSpan = <span name="sub" draggable='true'></span>;
        [object.attribute, object.comparator, object.value].forEach(value => {
          subSpan.appendChild(<span>{value} </span>)
          subSpan.addEventListener('mouseover', (evt) => this.onMouseOver(evt));
          subSpan.addEventListener('mouseout', (evt) => this.onMouseOut(evt));
          subSpan.style.cursor = "grab" // on drag: grabbing
        });
        span.appendChild(subSpan);
        var edit = <span id="edit" title="edit query" click={() => this.enableEditing()}><i class="fa fa-pencil" aria-hidden="true"></i></span>;
        edit.style.cursor = "pointer";
        span.appendChild(edit);
        break;
    }

    var queryElement = <div><b>{span}</b></div>;
    
    return queryElement;
  }
  
  async livelyExample() {
    this.setQuery("And(Or(Y='1985', Y='2008'), Ti='disordered electronic systems')")
    //this.setQuery("And(O='abc', Y='1000')")
    //this.setQuery("Y='1000'")
  }
  
  
}