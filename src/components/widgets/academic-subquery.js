import Morph from 'src/components/widgets/lively-morph.js';
import ohm from "https://unpkg.com/ohm-js@15.2.1/dist/ohm.js";
import {Author, Paper, MicrosoftAcademicEntities} from "src/client/literature.js";

/*MD 
# Blabla 
Strg + Alt + P
oder Alt + P MD*/

/*MD <edit://src/components/widgets/academic-subquery.html>
oder browse:// 
 #TODO MD*/
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
  
  /*MD ## Init MD*/
  async initialize() {
    // load the schema of a paper
    this.schema = await MicrosoftAcademicEntities.generateSchema("paper");
    // to use the descriptions in the UI, we need to shorten some
    var createShortDescriptions = attr => {
      switch(attr.name) {
        case "AA.AdId": 
          attr.shortDesc = "Affiliation ID";
          break;
        case "AA.AfN": 
          attr.shortDesc = "Affiliation Name (normalized)";
          break;
        case "AA.AuN": 
          attr.shortDesc = "Author Name (normalized)";
          break;
        case "AA.DAuN": 
          attr.shortDesc = "Author Name (original)";
          break;
        case "AA.DAfN": 
          attr.shortDesc = "Affiliation Name (original)";
          break;
        case "AW": 
          attr.shortDesc = "Unique words in abstract";
          break;
        case "BT":
          attr.shortDesc = "BibTex document type";
          break;
        case "CitCon":
          attr.shortDesc = "Citation contexts";
          break;
        case "D":
          attr.shortDesc = "Date";
          break;
        case "DN": 
          attr.shortDesc = "Paper Title";
          break;
        case "DOI":
          attr.shortDesc = "Digital Object Identifier";
          break;
        case "E":
          attr.shortDesc = "Extended metadata";
          break;
        case "FamId":
          attr.shortDesc = "Family Group ID";
          break;
        case "F.DFN": 
          attr.shortDesc = "Field of Study Name (original)";
          break;
        case "F.FN": 
          attr.shortDesc = "Field of Study Name (normalized)";
          break;
        case "LP":
          attr.shortDesc = "Last Page";
          break;
        case "Pt":
          attr.shortDesc = "Publication type";
          break;
        case "RId":
          attr.shortDesc = "Referenced Paper IDs";
          break;
        case "Ti": 
          attr.shortDesc = "Title";
          break;
        case "VFN":
          attr.shortDesc = "Journal or Conf. name (full)";
          break;
        case "VSN":
          attr.shortDesc = "Journal or Conf. name (short)";
          break;
        case "W":
          attr.shortDesc = "Unique words in title";
          break;
        default:
          attr.shortDesc = attr.description;
      }
      return attr;
    }
    this.schemaFiltered = this.schema
                            .filter(attr => attr.operations != "None")
                            .map(attr => createShortDescriptions(attr));
    // map words for operations to symbols for the query 
    this.mapOperationToSymbol = op => {switch(op) {
        case "Equals":
          return ["==", "="];
        case "StartsWith":
          return ["="];
        case "IsBetween":
          return [">", ">=", "<", "<=", "="];
        default:
          return op;
      }};
    
    this.updateView();
    
    observer = new MutationObserver((mutations) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        mutations.forEach(async mutation => {
          if (mutation.type == "characterData") {
            this.textContent = await this.viewToQuery();
          }
          if (mutation.type == "childList") {
            // TODO: better propagation to super elements
            var div = <div id="update"></div>;
            this.appendChild(div);
            this.removeChild(div);
          
          }
        })
      }, 300);
    });
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true,
    };
    observer.observe(this.get('#pane'), config);
    
    // TODO: falls ich das umbaue, sodass eine subquery einfach als
    // html Element in updateView erstellt wird, muss das hier auch da rein
    /* this.addEventListener('dragstart', (evt) => this.onDragStart(evt))
     this.addEventListener('dragend', (evt) => this.onDragEnd(evt))
     this.addEventListener('dragover', (evt) => this.onDragOver(evt))
     this.addEventListener('dragenter', (evt) => this.onDragEnter(evt))
     this.addEventListener('dragleave', (evt) => this.onDragLeave(evt))
     this.addEventListener('drop', (evt) => this.onDrop(evt))
    */
    this.style.draggable = 'true';
  }
  
  onDragStart(event) {
    //event.dataTransfer.setData("element", event.target.id);
    this.style.opacity = '0.4';
    this.style.color = "black";
    
    // var id = lively.ensureID(this)
    // this.id = id
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', this.queryElement.getQuery()); // set Query as info
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
    event.preventDefault();
    event.stopPropagation();
    //if (this.dragStart !== this) {
      //var id = event.dataTransfer.getData("application/lively4id")
      //var el = lively.query(this, "#"+id);
      //lively.notify("ELEMENT", el);
    var query = event.dataTransfer.getData("text/html");
    this.queryElement.setQuery(event.dataTransfer.getData("text/html")); // read query in
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
    if(!this.ui) { return }
    var pane = this.get("#pane")
    pane.innerHTML = ""
    
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
    this.ui.queryElement = this; // for drag and drop
    /*if (!this.isComplex) {
      this.addEventListener('dragstart', this.onDragStart)
      this.addEventListener('dragend', this.onDragEnd)
      this.addEventListener('dragover', this.onDragOver)
      this.addEventListener('dragenter', this.onDragEnter)
      this.addEventListener('dragleave', this.onDragLeave)
      this.addEventListener('drop', this.onDrop)
    }*/
    pane.appendChild(this.ui)
  }
  
  async setQuery(q) {
    this.textContent = q;
    
    var match = g.match(q);
    this.ast = s(match).interpret();
    this.ui = await this.queryToView(this.ast);
    
    this.updateView()
  }
  
  getQuery() {
    return this.textContent;
  }
  
  async setQueryObject(o) {
    this.ast = o
    this.ui = await this.queryToView();
    
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
      if (!innerSpan) { return query }
      var attribute, comp, val;
      if (this.editing) { // edit mode
        var attrElement = innerSpan.querySelector('#attribute');
        attribute = attrElement.options[attrElement.selectedIndex].value // or .text;
        var compElement = innerSpan.querySelector('#comparator');
        comp = compElement.options[compElement.selectedIndex].value // or .text;
        val = innerSpan.querySelector('#value').value;
      } else { // read mode
        //lively.notify("INNERSPAN", innerSpan)
        [attribute, comp, val] = innerSpan
                              .querySelectorAll("span[name='queryPart']")
                              .map(e => e.textContent);
      }
      
      var currentAttribute;
      this.schemaFiltered.forEach(attr => {
        if (attr.name == attribute) {
          currentAttribute = attr;
      }})
      
      if (currentAttribute.type == "String") {
        val = "'" + val + "'"
      }
      
      if (currentAttribute.name.includes("."))
        query = "Composite(" + attribute + comp + val + ")";
        // TODO: Set type to Composite?
      else
        query = attribute + comp + val;
      
      
      
      
    }
    lively.notify("QUERY from view", query)
    return query
  }
  
  async toggleEditing() {
    await this.setQuery(await this.viewToQuery()); // update query from changes
    this.editing = !this.editing;
    this.ui = await this.queryToView(); // update ui to read-mode
    this.updateView();
  }
  
  // builds the UI in edit mode
  async buildEditable(ast) {
    var inner = <span id="inner"></span>;
    var query = <span name="sub" draggable='false'></span>;
    
    // attribute
    var attribute = <select name='attribute' id='attribute'></select>;
    //var selectedAttribute; // TODO: Klassenvariable?
    this.schemaFiltered.forEach(option => {
      var selected = (option.name == ast.attribute);
      if (selected) { this.selectedAttribute = option; }
      attribute.options.add(new Option(option.shortDesc, option.name, selected, selected))
    })
    query.appendChild(attribute);
    
    // comparator
    var comparator = <select name='comparator' id='comparator'></select>;
    this.selectedAttribute.operations.split(", ")
      .map(operation => this.mapOperationToSymbol(operation)) // map words to arrays of symbols
      .flat()
      .filter((item, pos, self) => self.indexOf(item) == pos) // deduplicate
      .forEach(option => {
        var selected = (option == ast.comparator);
        comparator.options.add(new Option(option, option, selected, selected))
      });
    query.appendChild(comparator);
    
    // value
    var value = <input id="value" name="value" value={ast.value}></input>;
    // TODO: fit input type to attribute type
    query.appendChild(value);
    
    inner.appendChild(query);
    
    var edit = <span id="edit" title="toggle edit mode" click={() => this.toggleEditing()}><i class="fa fa-hand-paper-o" aria-hidden="true"></i></span>;
    edit.style.cursor = "pointer";
    inner.appendChild(edit);
    
    return inner;
  }
  
  async buildConjunctionQuery(ast) {
    var inner = <span id="inner"></span>;
    var conjunction = <span id="conjunction" contenteditable="false" style="font-size: 150%">{ast.conjunction}</span>;
    var left = await (<academic-subquery style="font-size: smaller;"></academic-subquery>);
    await left.setQueryObject(ast.left);
    this.leftSubquery = left; // for viewToQuery
    var right = await (<academic-subquery style="font-size: smaller;"></academic-subquery>);
    await right.setQueryObject(ast.right);
    this.rightSubquery = right; // for viewToQuery
    inner.appendChild(
      <table>
        <tr>
          <th>{conjunction}</th>
          <th>
            <table>
              <tr>{left}</tr>
              <tr>{right}</tr>
            </table>
          </th>
        </tr>
      </table>
    )
    return inner;
  }
  
  onMouseOver(event) {
    this.style.color = "orange"
  }
  
  onMouseOut(event) {
    this.style.color = "black"
  }
  
  buildSimpleQuery(ast) {
    var inner =
      <span class="hover" contenteditable="false" id="inner">
        <span class="hovercontent">
          <button
            class="button"
            click={() => {
              this.setQuery(
                "And(" + this.textContent + ", " + this.textContent + ")")
            }}>AND</button>
          <button
            class="button"
            click={() => {
              this.setQuery(
                "Or(" + this.textContent + ", " + this.textContent + ")")
            }}>OR</button>
        </span>
      </span>;
    var query = <span name="sub" draggable='true'></span>;
    [ast.attribute, ast.comparator, ast.value].forEach(value => {
      query.appendChild(<span class="queryPart" name="queryPart">{value}</span>)
      query.addEventListener('mouseover', (evt) => this.onMouseOver(evt));
      query.addEventListener('mouseout', (evt) => this.onMouseOut(evt));
      query.style.cursor = "grab"
    });
    inner.appendChild(query);
    var edit = <span id="edit" title="toggle edit mode" click={() => this.toggleEditing()}><i class="fa fa-pencil" aria-hidden="true"></i></span>;
    edit.style.cursor = "pointer";
    inner.appendChild(edit);
    return inner;
  }

  async queryToView() {
    const ast = this.ast;
    var inner = <span id="inner"></span>;
    if (ast.type == "conjunction") {
      this.isComplex = true;
      inner = await this.buildConjunctionQuery(ast);
    } else { // "composite" or "simple"
      this.isComplex = false;
      if (this.editing) { // edit mode
        inner = await this.buildEditable(ast);
      } else { // read mode
        inner = this.buildSimpleQuery(ast);
      }
    }
    inner.setAttribute("type", ast.type);

    var queryElement = <div class="dropTarget"><b>{inner}</b></div>;
    
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