import Morph from 'src/components/widgets/lively-morph.js';
import ohm from "https://unpkg.com/ohm-js@15.2.1/dist/ohm.js";
import {Author, Paper, MicrosoftAcademicEntities} from "src/client/literature.js";
import files from "src/client/files.js"

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
    this.updateView();
    
    observer = new MutationObserver((mutations) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        mutations.forEach(async mutation => {
          if (mutation.type == "characterData") {
            //this.textContent = await this.viewToQuery();
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
  
  async getPreparedSchema() {
    if (this.schemaFiltered) { return this.schemaFiltered; }
    
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
    
    return this.schemaFiltered;
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
    
    if (this.isComplex) { // conjunction
      // TODO: Why is this neccessary?
      if (await this.leftSubquery && await this.rightSubquery) {
        var left = await this.leftSubquery.viewToQuery();
        var right = await this.rightSubquery.viewToQuery();
        var conjunction = this.get('#conjunction').textContent;
        query = conjunction + "(" + left + ", " + right + ")";
      }
    } else { // simple
      // Do not render the view to the query in read-mode,
      // because nothing should have changed there anyways.
      // However, we might have substituted IDs through names,
      // which could backfire if we call viewToQuery().
      if (!this.editing) { return query; }
      
      var innerSpan = this.get('#inner');
      if (!innerSpan) { return query }
      var attribute, comp, val;
      if (this.editing) { // edit mode
        var attrElement = innerSpan.querySelector('#attribute');
        attribute = attrElement.options[attrElement.selectedIndex].value; // or .text;
        var compElement = innerSpan.querySelector('#comparator');
        comp = compElement.options[compElement.selectedIndex].value; // or .text;
        val = innerSpan.querySelector('#value').value;
      } else { // read mode
        //lively.notify("INNERSPAN", innerSpan)
        [attribute, comp, val] = innerSpan
          .querySelectorAll("span[name='queryPart']")
          .map(e => e.textContent);
      }
      
      var currentAttribute;
      var schema = await this.getPreparedSchema();
      schema.forEach(attr => {
        if (attr.shortDesc == attribute || attr.name == attribute) {
          currentAttribute = attr;
      }})
      
      if (currentAttribute.type == "String" || currentAttribute.type == "Date") {
        val = "'" + val + "'"
      }
      
      if (currentAttribute.name.match(/\./))
        query = "Composite(" + currentAttribute.name + comp + val + ")";
        // TODO: Set type to Composite?
      else
        query = currentAttribute.name + comp + val;
      
      
      
      
    }
    lively.notify("QUERY from view", query)
    return query
  }
  
  async toggleEditing() {
    var currentQuery = await this.viewToQuery()
    this.editing = !this.editing;
    try {
      await this.setQuery(currentQuery); // update query from changes
    } catch(e) {
      this.editing = !this.editing;
      lively.notify("Please enter a value!", e.message)
    }
    //this.ui = await this.queryToView(); // update ui to read-mode
    this.updateView();
  }
  
  // if we change the attribute, we might need to adapt the options for the
  // comparators and the type of the value input
  async onChangeAttribute() {
    var innerSpan = this.get('#inner');
    var compElement = innerSpan.querySelector('#comparator');
    var attrElement = innerSpan.querySelector('#attribute');
    var valElement = innerSpan.querySelector('#value');
    
    var selectedAttribute = attrElement.options[attrElement.selectedIndex].value;
    var currentAttribute;
    var schema = await this.getPreparedSchema();
    schema.forEach(option => {
      if (option.name == selectedAttribute) { currentAttribute = option; }
    })
    
    // comparator
    var selectedComparator = compElement.options[compElement.selectedIndex].value;
    // clear options
    var optionsLength = compElement.options.length;
    for (var i = optionsLength; i >= 0; i--) {
      compElement.remove(i);
    }
    currentAttribute.operations.split(", ")
      .map(operation => this.mapOperationToSymbol(operation)) // map words to arrays of symbols
      .flat()
      .filter((item, pos, self) => self.indexOf(item) == pos) // deduplicate
      .forEach(option => {
        var selected = (option == selectedComparator);
        compElement.options.add(new Option(option, option, selected, selected))
      });
    
    // value
    if (currentAttribute.type.match(/Int/)) {
        valElement.type = "number"
    } else if (currentAttribute.type.match(/Date/)) {
        valElement.type = "date"
    } else {
        valElement.type = "text"
    }
  }
  
  // builds the UI in edit mode
  async buildEditable(ast) {
    var inner = <span id="inner"></span>;
    var query = <span name="sub" draggable='false'></span>;
    
    // attribute
    var attrElement = <select name='attribute' id='attribute'></select>;
    var currentAttribute;
    var schema = await this.getPreparedSchema();
    schema.forEach(option => {
      var selected = (option.name == ast.attribute);
      if (selected) { currentAttribute = option; }
      attrElement.options.add(new Option(option.shortDesc, option.name, selected, selected))
    })
    attrElement.onchange = async () => await this.onChangeAttribute();
    query.appendChild(attrElement);
    
    // comparator
    var compElement = <select name='comparator' id='comparator'></select>;
    currentAttribute.operations.split(", ")
      .map(operation => this.mapOperationToSymbol(operation)) // map words to arrays of symbols
      .flat()
      .filter((item, pos, self) => self.indexOf(item) == pos) // deduplicate
      .forEach(option => {
        var selected = (option == ast.comparator);
        compElement.options.add(new Option(option, option, selected, selected))
      });
    query.appendChild(compElement);
    
    // value
    var valElement = <input id="value" name="value" value={ast.value}></input>;
    // fit input type to attribute type
    if (currentAttribute.type.match(/Int/)) {
        valElement.type = "number"
    } else if (currentAttribute.type.match(/Date/)) {
        valElement.type = "date"
    } else {
        valElement.type = "text"
    } 
    
    query.appendChild(valElement);
    
    inner.appendChild(query);
    
    var edit = <span id="edit" title="toggle edit mode" click={() => this.toggleEditing()}><i class="fa fa-hand-paper-o" aria-hidden="true"></i></span>;
    edit.style.cursor = "pointer";
    inner.appendChild(edit);
    
    return inner;
  }
  
  async buildConjunctionQuery(ast) {
    var query = this.textContent;
    var leftBracket = query.indexOf("(")
    var comma = query.indexOf(", ")
    var leftQuery = query.substring(leftBracket+1, comma)
    var rightQuery = query.substring(comma+1, query.length-1)
    
    var inner = <span id="inner"></span>;
    var conjunction = <span id="conjunction" contenteditable="false" style="font-size: 150%">{ast.conjunction}</span>;
    
    var left = await (<academic-subquery style="font-size: smaller;"></academic-subquery>);
    //await left.setQueryObject(ast.left); // TODO: Remove all traces this ever existed
    await left.setQuery(leftQuery);
    this.leftSubquery = left; // for viewToQuery
    
    var right = await (<academic-subquery style="font-size: smaller;"></academic-subquery>);
    //await right.setQueryObject(ast.right);
    await right.setQuery(rightQuery);
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
  
  async buildSimpleQuery(ast) {
    // setup
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
    var queryElement = <span name="sub" draggable='true'></span>;
    
    var currentAttribute;
    var schema = await this.getPreparedSchema();
    schema.forEach(option => {
      if (option.name == ast.attribute) { currentAttribute = option; }
    })
    
    // substitute IDs
    var attribute = currentAttribute.shortDesc;
    var value = ast.value;
    var comparator = ast.comparator;
    lively.notify(ast)
    
    if (currentAttribute.name.match(/[Ii]d/)) {
      var id = ast.value;
      var raw  = await files.loadJSON(`academic://raw:Id=${id}?attr=AuN,Ty,AA.AuN,Y,Ti,FN`); // vielleicht attr nicht beschränken
      var entity = raw.entities[0];
      // TODO: handle wrong IDs
      if (entity) { // not a valid ID
        var type = MicrosoftAcademicEntities.getEntityType(entity.Ty);
        var nameAttribute = currentAttribute.name.replace("Id", "N"); // AA.AuId --> AA.AuN
        // only the part after the . if there is one
        var maybeUndefinedValue = entity[nameAttribute.substring("AA.AuN".indexOf(".") + 1)];
        if (maybeUndefinedValue) { // might not give a result
          value = maybeUndefinedValue;
          schema.forEach(option => {
            if (option.name == nameAttribute) { attribute = option.shortDesc; }
          })
        }
      }
    }
    
    // attribute
    var attrElement = <span class="queryPart" name="queryPart">{attribute}</span>;
    queryElement.appendChild(attrElement);
    
    // comparator
    var compElement = <span class="queryPart" name="queryPart">{comparator}</span>;
    queryElement.appendChild(compElement);
    
    // value
    var valElement = <span class="queryPart" name="queryPart">{value}</span>;
    queryElement.appendChild(valElement);
    
    queryElement.addEventListener('mouseover', (evt) => this.onMouseOver(evt));
    queryElement.addEventListener('mouseout', (evt) => this.onMouseOut(evt));
    queryElement.style.cursor = "grab"
    
    inner.appendChild(queryElement);
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
        inner = await this.buildSimpleQuery(ast);
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