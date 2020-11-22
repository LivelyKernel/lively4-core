export default class LeoUIExample{
  static async create () {
    lively.notify('create bla')
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

    
    
    
/*fetch("https://academic.microsoft.com/api/search", {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8"
  },
  body: JSON.stringify({
    query: "", 
    queryExpression: "Composite(AA.AuN='jens lincke')", 
    filters: [], 
    orderBy: 0, 
    skip: 0,
    sortAscending: true, 
    take: 10})
}).then(r => lively.notify(r.json()))

fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "application/json"
  }
}).then(r => r.json())

fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "text/html"
  }
}).then(r => lively.notify(r.text()))

fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "application/bibtex"
  }
}).then(r => r.text()).then(s => {
  lively.notify(s)
  return s
} )*/
    


    /*import ohm from "https://unpkg.com/ohm-js@15.2.1/dist/ohm.js"


    var myGrammar = ohm.grammar('MyGrammar { greeting = "Hello" | "Hola" | "Hallo" }');


    myGrammar

    var userInput = 'Hello';
    var m = myGrammar.match(userInput);


    var userInput = 'Hallo';
    var m = myGrammar.match(userInput);

    m*/

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