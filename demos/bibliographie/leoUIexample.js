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

    var g = ohm.grammar('Academic { \n  Exp = \n    AcademicQuery \n \n  AcademicQuery = Attribute Comparator Value -- simpleQuery \n    | ("And" | "Or") "(" AcademicQuery "," AcademicQuery ")" -- complexQuery \n    | "Composite(" CompositeQuery ")" -- compositeQuery \n \n  CompositeQuery = CompositeAttribute Comparator Value -- simpleCompositeQuery \n    | ("And" | "Or") "(" CompositeQuery "," CompositeQuery ")" -- complexCompositeQuery \n \n  Comparator = \n    PartialComparator "="? \n  PartialComparator = \n    "=" | "<" | ">" \n \n  Attribute (an attribute) = \n    letter letter? letter? \n  CompositeAttribute = \n    Attribute "." Attribute \n \n \n  Value (a value) = \n    "\'" alnum* "\'" -- string \n    | Number \n    | Date \n    | ( "[" | "(" ) Number "," Number ( "]" | ")" ) -- numberRange \n    | ( "[" | "(" ) Date "," Date ( "]" | ")" ) -- dateRange \n \n  Number = \n    digit+ \n  Date = \n    "\'" digit digit digit digit "-" digit digit "-" digit digit "\'" \n}');
    
    lively.notify(g.match("Composite(And(AA.AuN='mike smith',AA.AfN='harvard university'))").succeeded(), "Composite(And(AA.AuN='mike smith',AA.AfN='harvard university'))");
    lively.notify(g.match("And(AA.AuN='mike smith',AA.AfN='harvard university')").succeeded(), "And(AA.AuN='mike smith',AA.AfN='harvard university')");
    
    
    // TODO: Add Semantics
    

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