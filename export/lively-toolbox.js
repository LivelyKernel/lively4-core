(function () {
  var lively4Url = 'http://localhost:8081/';
  document.head.appendChild(systemScriptNode);
  var toolboxTemplate = document.createElement('template');
  toolboxTemplate.setAttribute('id', "lively-toolbox");
  toolboxTemplate.innerHTML = '' + '\n' +
'        <style>' + '\n' +
'        :host {' + '\n' +
'          display: inline-block;' + '\n' +
'        }' + '\n' +
'        .container {' + '\n' +
'            width: 120px;' + '\n' +
'            padding: 5px;' + '\n' +
'            border-radius: 5px;' + '\n' +
'            background-color: rgb(238, 238, 238);' + '\n' +
'        }' + '\n' +
'        </style>' + '\n' +
'        <div class="container">' + '\n' +
'            <form>' + '\n' +
'            </form>' + '\n' +
'        </div>' + '\n' +
'        <script type="lively4script" data-name="initialize">' + '\n' +
'          function () { var dragging, grabbing, inspecting, deleting, copying, exporting;' + '\n' +
'          var baseUrl = "' + lively4Url + '/src/client/morphic/";' + '\n' +
'' + '\n' +
'          Promise.all([' + '\n' +
'            "dragging.js",' + '\n' +
'            "grabbing.js",' + '\n' +
'            "inspecting.js",' + '\n' +
'            "deleting.js",' + '\n' +
'            "copying.js",' + '\n' +
'            "component-creator.js",' + '\n' +
'            "selecting.js"' + '\n' +
'          ]' + '\n' +
'          .map(name => { return System.import(baseUrl + name); }))' + '\n' +
'          .then((modules) => {' + '\n' +
'            dragging = modules[0];' + '\n' +
'            grabbing = modules[1];' + '\n' +
'            inspecting = modules[2];' + '\n' +
'            deleting = modules[3];' + '\n' +
'            copying = modules[4];' + '\n' +
'            exporting = modules[5];' + '\n' +
'' + '\n' +
'            this.createMorphicToolbox();' + '\n' +
'          }).catch(err => {' + '\n' +
'            console.log(err);' + '\n' +
'          });' + '\n' +
'' + '\n' +
'' + '\n' +
'          this.createMorphicToolbox = function() {' + '\n' +
'            var tools = [{' + '\n' +
'              name: "none",' + '\n' +
'              default: true' + '\n' +
'            }, {' + '\n' +
'              name: "Inspect",' + '\n' +
'              handle: inspecting.handle' + '\n' +
'            }, {' + '\n' +
'              name: "Grabbing",' + '\n' +
'              onActivate: grabbing.activate,' + '\n' +
'              onDeactivate: grabbing.deactivate' + '\n' +
'            }, {' + '\n' +
'              name: "Dragging",' + '\n' +
'              onActivate: dragging.activate,' + '\n' +
'              onDeactivate: dragging.deactivate' + '\n' +
'            }, {' + '\n' +
'              name: "Delete",' + '\n' +
'              handle: deleting.handle' + '\n' +
'            }, {' + '\n' +
'              name: "Copy",' + '\n' +
'              handle: copying.handle' + '\n' +
'            }, {' + '\n' +
'              name: "Export",' + '\n' +
'              handle: exporting.handle' + '\n' +
'            }]' + '\n' +
'' + '\n' +
'            initStylesheet();' + '\n' +
'' + '\n' +
'            var container = $(this.shadowRoot).find(".container")[0];' + '\n' +
'' + '\n' +
'            var form = $(this.shadowRoot).find("form")[0];' + '\n' +
'            container.appendChild(form);' + '\n' +
'' + '\n' +
'            $(form).on("change click", function(evt) {' + '\n' +
'              if (evt.target.tool) {' + '\n' +
'                // deactivate the current tool, if it has a deactivation function' + '\n' +
'                var deactivate = container.currentTool.onDeactivate;' + '\n' +
'                if (typeof deactivate === "function") {' + '\n' +
'                  deactivate();' + '\n' +
'                }' + '\n' +
'                // activate the new tool, if it has an activation function' + '\n' +
'                var activate = evt.target.tool.onActivate;' + '\n' +
'                if (typeof activate === "function") {' + '\n' +
'                  activate();' + '\n' +
'                }' + '\n' +
'                // activate the new tool, if it has a handle function' + '\n' +
'                var handle = evt.target.tool.handle;' + '\n' +
'                if (typeof handle === "function" && window.that) {' + '\n' +
'                  handle(window.that);' + '\n' +
'                }' + '\n' +
'' + '\n' +
'                container.currentTool = evt.target.tool;' + '\n' +
'              }' + '\n' +
'            });' + '\n' +
'' + '\n' +
'            // create a radio button for each tool' + '\n' +
'            tools.forEach(function(ea) {' + '\n' +
'              var toolType = typeof ea.handle === "function" ? "button" : "radio";' + '\n' +
'              var el = document.createElement("input");' + '\n' +
'              var id = toolType + "-" + ea.name;' + '\n' +
'              el.type = toolType;' + '\n' +
'              el.name = "tool-selection";' + '\n' +
'              el.id = id;' + '\n' +
'              el.value = ea.name;' + '\n' +
'              el.tool = ea;' + '\n' +
'' + '\n' +
'              if (ea.default) {' + '\n' +
'                el.checked = true;' + '\n' +
'                container.currentTool = ea;' + '\n' +
'              }' + '\n' +
'' + '\n' +
'              form.appendChild(el);' + '\n' +
'' + '\n' +
'              // append a label to radio buttons' + '\n' +
'              if (toolType === "radio") {' + '\n' +
'                var label = document.createElement("label");' + '\n' +
'                label.setAttribute("for", id);' + '\n' +
'                label.innerHTML = ea.name;' + '\n' +
'                form.appendChild(label);' + '\n' +
'              }' + '\n' +
'' + '\n' +
'              form.appendChild(document.createElement("br"));' + '\n' +
'            });' + '\n' +
'' + '\n' +
'            return container;' + '\n' +
'          }' + '\n' +
'' + '\n' +
'' + '\n' +
'          function initStylesheet() {' + '\n' +
'            $("<link/>", {' + '\n' +
'               rel: "stylesheet",' + '\n' +
'               type: "text/css",' + '\n' +
'               href: "../src/client/css/morphic.css"' + '\n' +
'            }).appendTo("head");' + '\n' +
'          }}' + '\n' +
'        </script>' + '\n' +
'        <script type="lively4script" data-name="foo">' + '\n' +
'          function () { // this is just a test of another script' + '\n' +
'          console.log("hello script"); }' + '\n' +
'        </script>';
  document.head.appendChild(toolboxTemplate);
  var template = document.querySelector('#lively-toolbox');
  var clone = document.importNode(template.content, true);
  System.import(lively4Url + 'src/client/morphic/component-loader.js').then(loader => { loader.register('lively-toolbox', clone); });
})()
