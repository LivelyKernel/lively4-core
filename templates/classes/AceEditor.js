

export default class AceEditor extends HTMLElement {
  
   // Creates an object based in the HTML Element prototype
    var TomalecAceEditorPrototype = Object.create(HTMLElement.prototype);

    // Fires when an instance was inserted into the document
    TomalecAceEditorPrototype.attachedCallback = function() {
        var text = this.childNodes[0];
        var container = this.container;
        var element = this;

        if(this.editor){
            editor = this.editor;
            this.value = text.textContent || this.value;
        } else {
            // container.appendChild(text);
            container.innerHTML = this.innerHTML || this.value;
            editor = ace.edit(container);
            this.dispatchEvent(new CustomEvent("editor-ready", {detail: editor}));
            this.editor = editor;

            // inject base editor styles
            this.injectTheme('#ace_editor\\.css');
            this.injectTheme('#ace-tm');


            editor.getSession().on('change', function(event){
                element.dispatchEvent(new CustomEvent("change", {detail: event}));
            });
        }

        // handle theme changes
        editor.renderer.addEventListener("themeLoaded", this.onThemeLoaded.bind(this));

        // initial attributes
            editor.setTheme( this.getAttribute("theme") );
            editor.setFontSize( this.getAttribute("fontsize") );
            editor.setReadOnly( this.getAttribute("readonly") );
            var session = editor.getSession();
            session.setMode( this.getAttribute("mode") );
            session.setUseSoftTabs( this.getAttribute("softtabs") );
            this.getAttribute("tabsize") && session.setTabSize( this.getAttribute("tabsize") );
            session.setUseWrapMode( this.hasAttribute("wrapmode") );


        // prevent error message when CTRL+P
        editor.$blockScrolling = Infinity



        // Observe input textNode changes
        // Could be buggy as editor was also added to Light DOM;
            var observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                // console.log("observation", mutation.type, arguments, mutations, editor, text);
                if(mutation.type == "characterData"){
                    element.value = text.data;
                }
              });
            });
            text && observer.observe(text, { characterData: true });
        // container.appendChild(text);
        this._attached = true;

        this.customizeEditor();

        this.loadDictionaries()
        this.enableSpellcheck()
      

        // editor.resize()
        window.setTimeout(function() {
          editor.resize();
        }, 50) // #Hack #Resize #RaceCondition

        var _this = this;
        window.setTimeout(function() {
          // we also use this timeout hack, but we should get rid of it!!
          new ResizeSensor($(_this.container), function() {
            editor.resize();
          });
        }, 500);
    };

    // Fires when an instance was removed from the document
    TomalecAceEditorPrototype.detachedCallback = function() {
        this._attached = false;
    };

    // Fires when an attribute was added, removed, or updated
    TomalecAceEditorPrototype.attributeChangedCallback = function(attr, oldVal, newVal) {
        if(!this._attached){
            return false;
        }
        switch(attr){
            case "theme":
                this.editor.setTheme( newVal );
                break;
            case "mode":
                this.editor.getSession().setMode( newVal );
                break;
            case "fontsize":
                this.editor.setFontSize( newVal );
                break;
            case "softtabs":
                this.editor.getSession().setUseSoftTabs( newVal );
                break;
            case "tabsize":
                this.editor.getSession().setTabSize( newVal );
                break;
            case "readonly":
                this.editor.setReadOnly( newVal );
                break;
            case "wrapmode":
                this.editor.getSession().setUseWrapMode( newVal !== null );
                break;

        }
    };


    TomalecAceEditorPrototype.onThemeLoaded = function(e){
        var themeId = "#" + e.theme.cssClass;
        this.injectTheme(themeId);
        // Workaround Chrome stable bug, force repaint
        this.container.style.display='none';
        this.container.offsetHeight;
        this.container.style.display='';
    };

    // inject the style tag of a theme to the element
    TomalecAceEditorPrototype.injectTheme = function(themeId){
        var n = document.querySelector(themeId);
        this.shadowRoot.appendChild(cloneStyle(n));
    };

    //helper function to clone a style
    function cloneStyle(style) {
        var s = document.createElement('style');
        s.id = style.id;
        s.textContent = style.textContent;
        return s;
    }



    // CUSTOMIZATION
    TomalecAceEditorPrototype.enableAutocompletion = function(filename) {
      return this.aceRequire("ace/ext/language_tools").then( module => {
        this.editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: false
        });
        this.editor.completers[3] =  {
          getCompletions: function(editor, session, pos, prefix, callback) {
              // console.log("getCompletions: " + pos + " prefix " + prefix)
              var curLine = session.getDocument().getLine(pos.row);
              var curTokens = curLine.slice(0, pos.column).split(/\s+/);
              var curCmd = _.last(curTokens);
              // console.log("line : " + curLine + " curTokens: " + curTokens + " curCmd:" + curCmd)
              if (!curCmd) return;
              try {
                var wordList = [];
              curCmd = curCmd.replace(/\.[^.]*$/,"")
              var obj = eval(curCmd);
              wordList = lively.allProperties(obj);
              // console.log("complete: " + curCmd +"\n" + wordList)
                callback(null, _.keys(wordList).map(function(ea) {
                  return {name: ea, value: ea, score: 300, meta: wordList[ea]};
                  }));
              } catch(err) {
                console.log("Could not complete: " + curCmd +", because of:" + err)
              }
            }
          }
      })
    }
    TomalecAceEditorPrototype.changeModeForFile = function(filename) {
      var modelist = ace.require("ace/ext/modelist");
      var mode = modelist.getModeForPath(filename).name;
      console.log(filename + " -> " + mode);

      this.changeMode(mode);

    }

    TomalecAceEditorPrototype.changeMode = function(mode) {
      var Mode;
      try {
        Mode = ace.require("ace/mode/" + mode).Mode;
        editor.session.setMode(new Mode());
      } catch (e) {
        console.log("ace-editor: lazy load ace mode " + mode)
        // mode is not loaded, so try to load it,
        // there must be a way to make ace do all this stuff as with themes... :(
        var script = document.createElement("Script");
        script.type = "text/javascript";
        script.src = lively4url + "/src/external/ace/mode-" + mode + ".js";
        script.onerror = loadError;
        script.onload = function() {
          Mode = ace.require("ace/mode/" + mode).Mode;
          editor.session.setMode(new Mode());
        }

        document.head.appendChild(script);
      }
    }

    TomalecAceEditorPrototype.aceRequire = function(modulePath) {
      return new Promise(function(resolve, fail) {
        var module = ace.require(modulePath);
        if (module) {
          resolve(module)
        } else {
          var realPath = modulePath.replace(/^(ace\/[a-z]+)\//,"$1-")
          var script = document.createElement("Script");
          script.type = "text/javascript";
          script.src = lively4url + "/src/external/" + realPath + ".js";
          script.onload = function() {
            var module = ace.require(modulePath);
            if(module)
              resolve(module)
            else
              fail("ace-editor: could not load " + modulePath + " ("+ realPath +")" )
          }
          document.head.appendChild(script);
        }
      })
    }

    TomalecAceEditorPrototype.changeTheme = function(theme) {
        this.editor.setTheme("ace/theme/" + theme);
    }

    function loadError(err) {
      throw new URIError("Ace config " + err.target.src + " not found. ");
    }

    // var editor = editor = $("lively-editor")[0].shadowRoot.querySelector("#editor").editor;

    TomalecAceEditorPrototype.customizeEditor = function() {
        var editor = this.editor;

        editor.currentSelectionOrLine = function() {
            var sel =  this.getSelectionRange();
            if (sel.start.row == sel.end.row && sel.start.column == sel.end.column) {
                var currline = this.getSelectionRange().start.row;
                text = this.session.getLine(currline);
            } else {
                text = this.getCopyText()
            };
            return text
        }

        editor.commands.addCommand({
            name: "doIt",
            bindKey: {win: "Ctrl-D", mac: "Command-D"},
            exec: (editor) => {
                var text = editor.currentSelectionOrLine()
                var result = this.tryBoundEval(text);
                lively.notify("" + result)
            }
        })

        editor.commands.addCommand({
            name: "printIt",
            bindKey: {win: "Ctrl-P", mac: "Command-P"},
            exec: (editor) => {
                var text = editor.currentSelectionOrLine()
                var result = this.tryBoundEval(text, true);
            }
        });

        editor.commands.addCommand({
            name: "inspectIt",
            bindKey: {win: "Ctrl-I", mac: "Command-I"},
            exec: (editor) => {
                var text = editor.currentSelectionOrLine()
                var result = this.inspectIt(text, true);
            }
        });

        editor.commands.addCommand({
            name: "doSave",
            bindKey: {win: "Ctrl-S", mac: "Command-S"},
            exec: (editor) => {
                this.doSave(this.editor.getValue());
            }
        });
    };

    TomalecAceEditorPrototype.getDoitContext =  function () {
        return this.doitContext
    }

    TomalecAceEditorPrototype.boundEval =  function (str) {
      // just a hack... to get rid of some async....
      // #TODO make this more general
      // works: await new Promise((r) => r(3))
      // does not work yet: console.log(await new Promise((r) => r(3)))
      if (str.match(/^await /)) {
        str = "(async () => window._ = " + str +")()"
      }

      var ctx = this.getDoitContext() || this,
          interactiveEval = function(text) { return eval(text) };
      // #TODO binding "this" does not work yet, this is needed to build interactive debuggers... and cool workspaces
      var transpiledSource = babel.transform(str, {stage: 0}).code
      // #TODO alt: babel.run
      var result =  interactiveEval.call(ctx, transpiledSource);

      return result
  }

    TomalecAceEditorPrototype.printResult = function (result) {
        var editor = this.editor;
        var text = result
        var fromSel =  editor.getSelectionRange().end;
        editor.selection.moveCursorToPosition(fromSel)
        editor.selection.clearSelection() // don't replace existing selection
        editor.insert(text)
        var toSel =  editor.getSelectionRange().start;
        editor.selection.moveCursorToPosition(fromSel)
        editor.selection.selectToPosition(toSel)
    }

    TomalecAceEditorPrototype.tryBoundEval = function (str, printResult) {
        var result;
        try { result =  this.boundEval(str) }
        catch(e) {
            document.LastError = e
            console.log("Error: " + e)
            result = e
        }
        if (printResult) {
            if (str.match(/^await/) && result.then) {
              // we will definitly return a promise on which we can wait here
              result.then( result => this.printResult("" +result))
            } else {
              this.printResult(" " +result)
            }
        }
        return result
    }

    TomalecAceEditorPrototype.inspectIt = function (str) {
        var result;
        try { result =  this.boundEval(str) }
        catch(e) {
            document.LastError = e
            console.log("Error: " + e)
            result = e
        }
        var result = lively.inspector.openInspector(result)
        return result
    }

    TomalecAceEditorPrototype.doSave = function (text) {
        this.tryBoundEval(text) // just a default implementation...
    }

    TomalecAceEditorPrototype.onResize = function() {
      this.editor.resize();
      console.log("resizing");
    }

    // document.registerElement('juicy-ace-editor', {
    //     prototype: TomalecAceEditorPrototype
    // });


    // Fires when an instance of the element is created
    TomalecAceEditorPrototype.createdCallback = function() {
        console.log("TomalecAceEditorPrototype.createdCallback")
        var value = "";
        Object.defineProperty(this, "value", {
            set: function(val){
                this.editor && this.editor.setValue( val );
                value = val;
            },
            get: function(){
                value = this.editor && this.editor.getValue() || value;
                return value;
            }
        });

        // Creates the shadow root
        // var shadowRoot = this.createShadowRoot();

        // Adds a template clone into shadow root
        // var clone = thatDoc.importNode(template, true);
        this.container = this.shadowRoot.getElementById("juicy-ace-editor-container");
        // shadowRoot.appendChild(clone);

        // this.dispatchEvent(new Event("created")); // already taken care...
    };

    var contents_modified = true;
    var currently_spellchecking = false;
    var markers_present = [];

    var lang = "en_US";
    var dicPath = lively4url + "/src/external/dictionaries/en_US/en_US.dic";
    var affPath = lively4url + "/src/external/dictionaries/en_US/en_US.aff";
    
    var dictionary = null;
    
    
    TomalecAceEditorPrototype.loadSpellcheck = function() {
      // Load the dictionary.
      // We have to load the dictionary files sequentially to ensure 
      lively.import("typo").then(() => {
        $.get(dicPath, function(data) {
        	dicData = data;
        }).done(function() {
          $.get(affPath, function(data) {
        	  affData = data;
          }).done(function() {
          	console.log("Dictionary loaded");
            dictionary = new lively.typo(lang, affData, dicData);
            this.enableSpellcheck();
            spell_check();
          });
        });
      })
    };
    
    // Check the spelling of a line, and return [start, end]-pairs for misspelled words.
    TomalecAceEditorPrototype.misspelled = function (line) {
      	var words = line.split(' ');
      	var i = 0;
      	var bads = [];
      	for (word in words) {
      	  var x = words[word] + "";
      	  var checkWord = x.replace(/[^a-zA-Z']/g, '');
      	  if (!dictionary.check(checkWord)) {
      	    bads[bads.length] = [i, i + words[word].length];
      	  }
      	  i += words[word].length + 1;
        }
        return bads;
      }
    
    TomalecAceEditorPrototype.enableSpellcheck = function () {
        this.editor.getSession().on('change', function(e) {
        	contents_modified = true;
      	});
      	setInterval(() => { this.spellCheck()}, 500);
      }
      
    // Spell check the Ace editor contents.
    TomalecAceEditorPrototype.spellCheck = function() {
        // Wait for the dictionary to be loaded.
        if (dictionary == null) {
          return;
        }
      
        if (currently_spellchecking) {
        	return;
        }
      
        if (!contents_modified) {
        	return;
        }
        currently_spellchecking = true;
        var session = this.editor.getSession();
      
        // Clear the markers.
        for (var i in markers_present) {
          session.removeMarker(markers_present[i]);
        }
        markers_present = [];
      
        try {
      	  var Range = ace.require('ace/range').Range
      	  var lines = session.getDocument().getAllLines();
      	  for (var i in lines) {
      	  	// Clear the gutter.
      	    session.removeGutterDecoration(i, "misspelled");
      	    // Check spelling of this line.
      	    var misspellings = this.misspelled(lines[i]);
      	    
      	    // Add markers and gutter markings.
      	    if (misspellings.length > 0) {
      	      session.addGutterDecoration(i, "misspelled");
      	    }
      	    for (var j in misspellings) {
      	      var range = new Range(i, misspellings[j][0], i, misspellings[j][1]);
      	      markers_present[markers_present.length] = 
      	        session.addMarker(range, "misspelled", "typo", true);
      	    }
      	  }
      	} finally {
      		currently_spellchecking = false;
      		contents_modified = false;
      	}
      }
  
  
} 

