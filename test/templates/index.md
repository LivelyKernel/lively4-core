# Tests

<a href="../../templates/">templates</a> | <a href="../../src/client/">src</a>
  
  <script>
  import moment from "src/external/moment.js";
  import Strings from "src/client/strings.js"
  var container = lively.query(this, "lively-container")

  async function visitURL(url) {
    container.followPath(url)
    await container.editFile(url)
  }

  async function copyTemplate(dir, component, type) {
    var filename = component + "." + type
    var classname = component.split(/-/).map(ea => Strings.toUpperCaseFirst(ea)).join("")
    var url = dir  + "/" + filename
    if (await lively.files.existFile(url)) {
      lively.notify("Could not create " + url + ", beacuse it already exists!")
    } else {
      var templatejs_src = await lively.files.loadFile(dir + "/template." + type)
      templatejs_src = templatejs_src.replace(/\$\$TEMPLATE_CLASS/g, classname)
      templatejs_src = templatejs_src.replace(/\$\$TEMPLATE_ID/g, component.replace(/-test/,""))
      await lively.files.saveFile(url, templatejs_src)
    }
  }

  async function createEntry(input) {
    var path = "" + container.getPath();
    var dir = path.replace(/[^/]*$/,"");
    var test = input.value + "-test"

    await copyTemplate(dir, test, "js")
    visitURL(dir + "/" + test + ".js")
  }

  async function createUI() { 
    var div  = document.createElement("div");
    var input = document.createElement("input");
    input.value= "lively-component";
    div.appendChild(input);
    var button = document.createElement("button");
    button.addEventListener("click", () => {
      createEntry(input)
    });
    button.innerHTML = "create test";
    div.appendChild(button);
    return div;
  }

  async function createList() {
    var path = "" + container.getPath();
    var dir = path.replace(/[^/]*$/,"")
    var opts = JSON.parse(await lively.files.statFile(dir))
    var testdir = dir + "../test/templates/"
    // var tests = JSON.parse(await lively.files.statFile(testdir)).contents.map(ea => ea.name)

    var list = document.createElement("ul")
    _.sortBy(opts.contents, ea => ea.name)
      .filter(ea => ea.name.match(/-test.js$/))
      .forEach(ea => {
        var li = document.createElement("li")

        var span = document.createElement("span")
        span.textContent = ea.name.replace(/\-test.js/," ")
        li.appendChild(span)

        var a = document.createElement("a")
        a.innerHTML = "js"
        a.href = "edit://test/templates/" + ea.name
        a.onclick = (evt) => {
          evt.preventDefault()
          container.followPath(a.getAttribute("href"))
          return true
        }
        li.appendChild(a)

        var span = document.createElement("span")
        span.textContent = " "
        li.appendChild(span)


        list.appendChild(li)
      })
    return list
  }

  async function createButton() { 
    if (!container) {
      debugger
    }
    var button = document.createElement("button");
    button.addEventListener("click", () => {
      lively.openComponentInWindow("lively-testrunner")
    });
    button.innerHTML = "run tests";
    return button;
  }


  ;(async () => {
    return  <div>
      {await createUI()}
      {await createList()}
      {await createButton()}
    </div>
  })()
</script>

