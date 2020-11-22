export default class LeoDragExample{
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

    /*fetch("academic://expr:Composite(AA.AuId=2055148755)?count=1000", {
      method: "GET",
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({query: "Jens Lincke 2014", queryExpression: "", filters: [], orderBy: 0, skip: 0, sortAscending: true, take: 10})
    }).then(r => console.log("JSON", r));*/

    /*var json;

    (async () => {
    json = await fetch("https://academic.microsoft.com/api/search", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({query: "Jens Lincke", queryExpression: "", filters: [], orderBy: 0, skip: 0, sortAscending: true, take: 10})
    }).then(r => r.json())
    })()*/



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
      {hello}
      {world}
      {description}
    </div>
  }
}