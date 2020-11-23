import ohm from "https://unpkg.com/ohm-js@15.2.1/dist/ohm.js";

export default class LeoUIExample{
  static async create () {
    
    var hello = <div id="helloDiv" draggable="true" click={() => lively.notify('hi')}>
        Hi
      </div>

    var world = <div id="worldDiv">
        World
      </div>

    let description = <p id="description"></p>

    hello.addEventListener('dragstart', dragStart);
    hello.addEventListener('dragend', dragEnd);

    world.addEventListener('drop', drop);

    var g = ohm.grammar('Academic { \n  Exp = \n    AcademicQuery \n \n  AcademicQuery = Attribute Comparator Value -- simple \n    | ("And" | "Or") "(" AcademicQuery "," AcademicQuery ")" -- complex \n    | "Composite(" CompositeQuery ")" -- composite \n \n  CompositeQuery = CompositeAttribute Comparator Value -- simple \n    | ("And" | "Or") "(" CompositeQuery "," CompositeQuery ")" -- complex \n \n  Comparator = \n    PartialComparator "="? \n  PartialComparator = \n    "=" | "<" | ">" \n \n  Attribute (an attribute) = \n    letter letter? letter? \n  CompositeAttribute = \n    Attribute "." Attribute \n \n \n  Value (a value) = \n    "\'" alnum* "\'" -- string \n    | Number \n    | Date \n    | ( "[" | "(" ) Number "," Number ( "]" | ")" ) -- numberRange \n    | ( "[" | "(" ) Date "," Date ( "]" | ")" ) -- dateRange \n \n  Number = \n    digit+ \n  Date = \n    "\'" digit digit digit digit "-" digit digit "-" digit digit "\'" \n}');
    
    /*lively.notify(g.match("Composite(And(AA.AuN='mike smith',AA.AfN='harvard university'))").succeeded(), "Composite(And(AA.AuN='mike smith',AA.AfN='harvard university'))");
    lively.notify(g.match("And(AA.AuN='mike smith',AA.AfN='harvard university')").succeeded(), "And(AA.AuN='mike smith',AA.AfN='harvard university')");*/
    
    //var queryObject = {};
    
    var s = g.createSemantics();
    
    s.addOperation(
      'interpret', {
        Exp: function(e) {
          return e.interpret();
        },
        
        AcademicQuery_simple: function(attr, comp, val) {
          var attribute = attr.interpret();
          //var comparator = comp.interpret();
          //var value = val.interpret();
          return { [attribute]: {
            "comparator": "a",//comparator,
            "value": "b"//value,
          }}
        },
        AcademicQuery_complex: function(conj, x, left, y, right, z) {
          var conjunction = conj.interpret();
          
          return {conjunction: [
            left.interpret(),
            right.interpret()
          ]}
        },
        
        Attribute: function(a, b, c) {
          var array = [a.interpret(), b.interpret(), c.interpret()];
          return array.join('');
        },
        
        letter: function(a) {
          return a.sourceString;
        }
      }
    )
    
    var r = g.match("A = 'e'")
    var n = s(r)
    lively.notify("A = 'e'", n.interpret());

    function dragStart(event) {
      description.innerHTML = "dragging";
      event.dataTransfer.setData("element", event.target.id);
    }

    function dragEnd(event) {
      description.innerHTML = "";
    }

    function drop(event) {
      event.preventDefault();
      var data = event.dataTransfer.getData("element");
      console.log("Datatransfer Types" + event.dataTransfer.types);
      event.target.appendChild(lively.query(this, '#'+data))
    }
    
    


    return <div>
      <table>
        <tr>
          <td>
            Title
          </td>
          <td>
            Author
          </td>
          <td>
            Year
          </td>
        </tr>
        <tr style="vertical-align:top">
          <td>
            <input value='something'></input>
          </td>
          <td>
            <table>
              <tr>
                <td>
                  Name
                </td>
                <td>
                  <input value='name'></input>
                </td>
              </tr>
              <tr>
                <td>
                  Institution
                </td>
                <td>
                  <input value='inst'></input>
                </td>
              </tr>
            </table>
          </td>
          <td>
            <input value='2001'></input>
          </td>
        </tr>
      </table>
    </div>
  }
}