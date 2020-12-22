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

const observer = new MutationObserver(function(mutations) {
  mutations.forEach(mutation => lively.notify("observation", mutation.type))
})
const config = {
  attributes: true,
  childList: true,
  subtree: true,
  attributeOldValue: true,
  characterDataOldValue: true,
  //attributeFilter: true // breaks for some reason
}

export default class AcademicQuery extends Morph {
  constructor() {
    super()
  }
  
  async initialize() {
    this.updateView()
  }
  
  async setQuery(q) {
    var match = g.match(q);
    
    this.textContent = q;
    var queryObject = s(match).interpret();
    
    this.ui = await this.queryToView(queryObject);
    
    this.updateView()
  }
  
  async setQueryObject(o) {
    this.ui = await this.queryToView(o);
    
    this.updateView()
  }

  async updateView() {
    // Ansatz: Ein academic query widget ist nur für eine Query oder eine conjunction
    // eine conjunction enthält dann aber zwei weitere query widgets
    var pane = this.get("#pane")
    pane.innerHTML = ""
    
    if(this.ui) {
      pane.appendChild(this.ui)
    }
      //<b><span class="blub">Query:</span>{this.textContent}</b>)
  }

  viewToQuery() {
    var pane = this.get("#pane")
        
    var s = "... parsed from ui"
    
    return s
  }
  
  enableEditing() {
    var queries = this.get("#inner").querySelectorAll("[name='sub']")
    queries.forEach(q => {
      q.setAttribute("contenteditable", true)
      q.style.cursor = "text";
    })
    //query.setAttribute("contenteditable", true)
    //query.style.cursor = "text;"
    lively.notify("QUERIES", queries)
  }
  
  onMouseOver(event) {
    this.style.color = "orange"
    // vielleicht lieber wie so ein Halo
    // --> 0 breites span oder so, das relative ist und dem den Button als Kind
    var span = <span id="button" style="height: 0px; position: relative"></span>
    var button = <button>+</button>
    span.appendChild(
      //<div id="button" style="width: 100%; max-width: max">
        button
      //</div>
    )
    //event.target.parentElement.appendChild(this)
    //lively.query(this, "#inner").appendChild(span)
  }
  
  onMouseOut(event) {
    // checken, ob nach 5 Sekunden nicht mehr über Objekt oder Button (und dann wieder...)
    this.style.color = "black"
    //this.removeChild(lively.query(this, "#button"))
  }
  
  async queryToView(object) {
      var span =
          <span class="tooltip" contenteditable="false" id="inner">
            <span class="tooltiptext"><button>AND</button><button>OR</button></span>
          </span>
      
    switch(object.type) {
      case "simple":
        [object.attribute, object.comparator, object.value].forEach(value => {
          var subSpan = <span name="sub">{value} </span>;
          span.appendChild(subSpan)
          span.addEventListener('mouseover', (evt) => this.onMouseOver(evt));
          span.addEventListener('mouseout', (evt) => this.onMouseOut(evt));
          span.style.cursor = "grab" // on drag: grabbing
        });
        var edit = <span id="edit" title="edit query" click={() => this.enableEditing()}><i class="fa fa-pencil" aria-hidden="true"></i></span>;
        span.appendChild(edit);
        break;

      case "conjunction":
        // Textselection in css vielleicht entfernen für Drag & Drop (bzw. erstmal Drag einschalten)
        // events.stoppropagation und preventdefault
        var subSpan = <span contenteditable="true" style="font-size: 150%">{object.conjunction}</span>;
        var left = await (<academic-query style="font-size: smaller;"></academic-query>);
        left.setQueryObject(object.left);
        var right = await (<academic-query style="font-size: smaller;"></academic-query>);
        right.setQueryObject(object.right);
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

      case "composite":
        [object.attribute, object.comparator, object.value].forEach(value => {
          var subSpan = <span contenteditable="true">{value} </span>;

          span.appendChild(subSpan)
        });
    }

    var queryElement = <div><b>{span}</b></div>;
    //lively.notify("queryElement", typeof queryElement)
    //lively.notify("pane", typeof this.get('#pane'))
    observer.observe(this.get('#pane'), config)
    return queryElement;
  }
  
  async livelyExample() {
    this.setQuery("And(Or(Y='1985', Y='2008'), Ti='disordered electronic systems')")
    //this.setQuery("And(O='abc', Y='1000')")
    //this.setQuery("Y='1000'")
  }
  
  
}