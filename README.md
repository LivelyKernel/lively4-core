<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" lang="en"><head>
<title>Lively 4 Our First Page</title>
<style type="text/css" media="screen">
    #baseurl {
        width: 800px;
    }
    #editor {
        height: 400px;
        width: 800px;
    }
    #console {
        width: 800px;
        height: 300px;
        max-height: 200px;
        overflow: auto;
        background-color: #eeeeee;
        word-break: normal !important;
        word-wrap: normal !important;
        white-space: pre !important;
    }
    #commandline {
        width: 800px;
    }
</style>

<script src="https://code.jquery.com/jquery-2.1.4.js" type="text/javascript" charset="utf-8"></script>


<!-- BEGIN SYSTEM.JS: should go away, until then we use a "static" global source -->
<script src="https://livelykernel.github.io/lively4-core/src/external/system.src.js" type="text/javascript" charset="utf-8"></script>
<script>
  System.paths['babel'] ='https://livelykernel.github.io/lively4-core/src/external/babel-browser.js'
  System.config({
    transpiler: 'babel',
    babelOptions: { },
    map: {
        babel: 'https://livelykernel.github.io/lively4-core/src/external/babel-browser.js'
    }
  });
</script>
<!-- END SYSTEM.JS-->

<link rel="import" href="/lively4-core/templates/lively-toolbox.html" />

<link rel="stylesheet" type="text/css" href="../src/client/css/morphic.css" /></head>
<body>
<h1>Lively 4 -- Bootstrapping Test Page</h1>



<lively-toolbox><script data-name="initialize" type="lively4script">function anonymous() {

      var dragging, grabbing, inspecting, deleting, copying;
      var baseUrl = "/lively4-core/src/client/morphic/";

      Promise.all([
        "dragging.js", 
        "grabbing.js", 
        "inspecting.js", 
        "deleting.js", 
        "copying.js"
      ]
      .map(name =&gt; { return System.import(baseUrl + name); }))
      .then((modules) =&gt; {
        dragging = modules[0];
        grabbing = modules[1];
        inspecting = modules[2];
        deleting = modules[3];
        copying = modules[4];

        this.createMorphicToolbox();
      }).catch(err =&gt; {
        console.log(err);
      });


      this.createMorphicToolbox = function() {
        var tools = [{
          name: "none",
          default: true
        }, {
          name: "Inspector",
          onActivate: inspecting.activate,
          onDeactivate: inspecting.deactivate
        }, {
          name: "Grabbing",
          onActivate: grabbing.activate,
          onDeactivate: grabbing.deactivate
        }, {
          name: "Dragging",
          onActivate: dragging.activate,
          onDeactivate: dragging.deactivate
        }, {
          name: "Deleting",
          onActivate: deleting.activate,
          onDeactivate: deleting.deactivate
        }, {
          name: "Copying",
          onActivate: copying.activate,
          onDeactivate: copying.deactivate
        }]

        initStylesheet();

        var container = $(this.shadowRoot).find(".container")[0];

        var form = $(this.shadowRoot).find("form")[0];
        container.appendChild(form);
        
        $(form).on("change", function(evt) {
          // deactivate the current tool, if it has a deactivation function
          var deactivate = container.currentTool.onDeactivate;
          if (typeof deactivate === "function") {
            deactivate();
          }
          // activate the new tool, if it has an activation function
          var activate = evt.target.tool.onActivate;
          if (typeof activate === "function") {
            activate();
          }

          container.currentTool = evt.target.tool;
        });

        // create a radio button for each tool
        tools.forEach(function(ea) {
          var radio = document.createElement("input");
          var id = "radio-button-" + ea.name;
          radio.type = "radio";
          radio.name = "tool-selection";
          radio.id = id;
          radio.value = ea.name;
          radio.tool = ea;

          if (ea.default) {
            radio.checked = true;
            container.currentTool = ea;
          }

          var label = document.createElement("label");
          label.for = id;
          label.innerHTML = ea.name;

          form.appendChild(radio);
          form.appendChild(label);
          form.appendChild(document.createElement("br"));
        });

        return container;
      }


      function initStylesheet() {
        $("&lt;link/&gt;", {
           rel: "stylesheet",
           type: "text/css",
           href: "../src/client/css/morphic.css"
        }).appendTo("head");
      }
    
}</script><script data-name="foo" type="lively4script">function anonymous() {

      console.log("hello script");
    
}</script><script data-name="initialize" type="lively4script">function anonymous() {

      var dragging, grabbing, inspecting, deleting, copying;
      var baseUrl = "/lively4-core/src/client/morphic/";

      Promise.all([
        "dragging.js", 
        "grabbing.js", 
        "inspecting.js", 
        "deleting.js", 
        "copying.js"
      ]
      .map(name =&gt; { return System.import(baseUrl + name); }))
      .then((modules) =&gt; {
        dragging = modules[0];
        grabbing = modules[1];
        inspecting = modules[2];
        deleting = modules[3];
        copying = modules[4];

        this.createMorphicToolbox();
      }).catch(err =&gt; {
        console.log(err);
      });


      this.createMorphicToolbox = function() {
        var tools = [{
          name: "none",
          default: true
        }, {
          name: "Inspector",
          onActivate: inspecting.activate,
          onDeactivate: inspecting.deactivate
        }, {
          name: "Grabbing",
          onActivate: grabbing.activate,
          onDeactivate: grabbing.deactivate
        }, {
          name: "Dragging",
          onActivate: dragging.activate,
          onDeactivate: dragging.deactivate
        }, {
          name: "Deleting",
          onActivate: deleting.activate,
          onDeactivate: deleting.deactivate
        }, {
          name: "Copying",
          onActivate: copying.activate,
          onDeactivate: copying.deactivate
        }]

        initStylesheet();

        var container = $(this.shadowRoot).find(".container")[0];

        var form = $(this.shadowRoot).find("form")[0];
        container.appendChild(form);
        
        $(form).on("change", function(evt) {
          // deactivate the current tool, if it has a deactivation function
          var deactivate = container.currentTool.onDeactivate;
          if (typeof deactivate === "function") {
            deactivate();
          }
          // activate the new tool, if it has an activation function
          var activate = evt.target.tool.onActivate;
          if (typeof activate === "function") {
            activate();
          }

          container.currentTool = evt.target.tool;
        });

        // create a radio button for each tool
        tools.forEach(function(ea) {
          var radio = document.createElement("input");
          var id = "radio-button-" + ea.name;
          radio.type = "radio";
          radio.name = "tool-selection";
          radio.id = id;
          radio.value = ea.name;
          radio.tool = ea;

          if (ea.default) {
            radio.checked = true;
            container.currentTool = ea;
          }

          var label = document.createElement("label");
          label.for = id;
          label.innerHTML = ea.name;

          form.appendChild(radio);
          form.appendChild(label);
          form.appendChild(document.createElement("br"));
        });

        return container;
      }


      function initStylesheet() {
        $("&lt;link/&gt;", {
           rel: "stylesheet",
           type: "text/css",
           href: "../src/client/css/morphic.css"
        }).appendTo("head");
      }
    
}</script><script data-name="foo" type="lively4script">function anonymous() {

      console.log("hello script");
    
}</script></lively-toolbox>



<p><input type="text" id="baseurl" value="https://github.lively4/repo/livelykernel/lively4-core/gh-pages/" /></p>

<button onclick="fileEditor.loadFile()">load</button>
<button onclick="fileEditor.saveFile()">save</button>
<input type="text" id="filename" value="README.md" />

<!-- <button onclick="">reload service worker </button> -->

<button onclick="githubAuth.challengeForAuth(Date.now(), function(token){
    console.log('We are authenticated with the Token: ' + token)
})">login</button>

<button onclick="githubAuth.logout(); console.log('logged out of github')">logout</button>

<div id="editor" class=" ace_editor ace-tm"></div>

<pre id="console"></pre>
<input type="text" id="commandline" value="" />

<!-- BEGIN ACE -->
<!-- We also have to load ace "locally", because loading it remotely ends in a race condition -->
<script src="../src/external/ace.js" type="text/javascript" charset="utf-8"></script>
<script>ace.edit("editor");</script>
<!-- END ACE -->


<script>
    var lively4url =  "../" // or any abosolute path to lively4 ? Any idea for computeRoot() ? #JensLincke #OpenQuestion

    //// #TODO The ace editor tries to be very clever, so it cannot be loaded through "import" at the moment
    //// (e.g. AMD promise error)
    // System.import(lively4url + "src/external/ace.js").then(function(){
    //         ace.edit("editor")
    // })

    System.import(lively4url + "/src/client/load.js").then(function(){
        System.import("commandline.js")
        System.import(lively4url + "src/client/debug-serviceworker.js")
    }).catch(function(err) { alert("load Lively4 failed")});

    var morphic;
    System.import(lively4url + "/src/client/morphic/morphic.js").then(m =&gt; {
        morphic = m;
        morphic.initMorphicTools();
    }).catch(function(err) {
        debugger; alert("load morphic failed");
    });

    System.import(lively4url + "/src/client/morphic/toolbox.js").then(toolbox =&gt; {
        //document.body.appendChild(toolbox.createMorphicToolbox());
    }).catch(function(err) {
        debugger; alert("load morphic/toolbox failed");
    });

</script>


</body></html>