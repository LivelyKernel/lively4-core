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


export default class AcademicQuery extends Morph {
  constructor() {
    super()
    //this.setQuery('T=1')
  }
  
  async initialize() {
    this.updateView()
  }
  
  async setQuery(q) {
    lively.notify("query", q)
    var match = g.match(q);
    
    this.textContent = q;
    var queryObject = s(match).interpret();
    
    this.ui = await this.queryToView(queryObject);
    
    this.updateView()
  }
  
  async setQueryObject(o) {
    this.ui = await this.queryToView(o);
    
    lively.notify("Object", o)
    
    this.updateView()
  }

  async updateView() {
    // Ansatz: Ein academic query widget ist nur für eine Query oder eine conjunction
    // eine conjunction enthält dann aber zwei weitere query widgets
    var pane = this.get("#pane")
    lively.notify("pane", pane)
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
  
  async queryToView(object) {
      //var subDiv = <div id="innerDiv" style="margin: 5px; border: 1px solid gray;"></div>;
      var span = <span id="inner"></span>
      
    switch(object.type) {
      case "simple":
        // [object.attribute, object.comparator, object.value].forEach(value => {
        //   var input = <input value={value}></input>;
        //   subDiv.appendChild(input)
        // });
        [object.attribute, object.comparator, object.value].forEach(value => {
          var subSpan = <span>{value} </span>;
          span.appendChild(subSpan)
        });
        break;
      case "conjunction":
        // var input = <input value={object.conjunction}></input>;
        // var left = this.queryToView(object.left);
        // var right = this.queryToView(object.right);
        // [input, left, right].forEach(element => {
        //   subDiv.appendChild(element);
        // });
        var subSpan = <span style="font-size: 150%">{object.conjunction}</span>;
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
        // [object.attribute, object.comparator, object.value].forEach(value => {
        //   var input = <input value={value}></input>;
        //   subDiv.appendChild(input)
        // });
        [object.attribute, object.comparator, object.value].forEach(value => {
          var subSpan = <span>{value} </span>;
          span.appendChild(subSpan)
        });
    }
    var queryElement = <b>{span}</b>
    return queryElement;
  }
  
  async livelyExample() {
    this.setQuery("And(Or(Y='1985', Y='2008'), Ti='disordered electronic systems')")
    //this.setQuery("And(O='abc', Y='1000')")
  }
  
  
}