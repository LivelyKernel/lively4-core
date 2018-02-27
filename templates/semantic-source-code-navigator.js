import Morph from 'src/components/widgets/lively-morph.js';
import { promisedEvent } from "utils";
import {NodeTypes, SignatureManipulator} from 'https://lively-kernel.org/lively4/lively4-theresa/src/client/signature-db.js';

  
var DEMO_DIRECTORY = 'demos/systembrowser/';

export default class SemanticSourceCodeNavigator extends Morph {

  get codeEditor() { return this.get('#code-mirror'); }
  async initialize() {
    this.windowTitle = "SemanticSourceCodeNavigator";
    this.sig = new SignatureManipulator();
    await this.prepareEditor();
    this.components = [];
    this.currentTopLvl = {};
    this.currentFile = '';
    this.currentMethod = {};
    
    this.get('#file-list').addEventListener('click', (ev) => {
      this.currentMethod = {};
      this.removeCheckedClass('#class-list');
      this.removeCheckedClass('#function-list');
      if(ev.target.classList.contains('checked')) {
        this.removeCheckedClass('#file-list');
        this.loadClasses('none');
        this.loadFunctions('none');
        this.removeEditorContent();
        this.currentFile = '';
      } else {
        this.removeCheckedClass('#file-list');
        ev.target.classList.toggle('checked');
        this.loadClasses('block', ev.target.innerHTML);
        this.currentFile = ev.target.innerHTML;
        this.loadFunctions('none');
      }
    }, false);
    
    this.get('#class-list').addEventListener('click', (ev) => {
      this.currentMethod = {};
      this.removeCheckedClass('#function-list');
      if(ev.target.classList.contains('checked')) {
        this.removeCheckedClass('#class-list');
        this.loadFunctions('none');
        this.removeEditorContent();
        this.currentTopLvl = {};
      } else {
        var text = ev.path[0].innerText;
        var type = '';
        if(text.toLowerCase().includes('class')) {
          type = NodeTypes.CLASS;
        } else if(text.toLowerCase().includes('var')) {
          type = NodeTypes.VAR;
        } else {
          type = NodeTypes.FUNCTION;
        }
        this.removeCheckedClass('#class-list');
        ev.target.classList.toggle('checked');
        this.currentTopLvl = this.components[type][ev.path[0].id];
        this.loadFunctions('block', ev.target, ev.path[0].id, type);
      }
    }, false);
    
    this.get('#function-list').addEventListener('click', (ev) => {
      this.removeCheckedClass('#function-list');
      ev.target.classList.toggle('checked');
      this.loadFunctionContent(ev.path[0].id);
      this.currentMethod = this.currentTopLvl.methods[ev.path[0].id];
    }, false);
  }
  
  removeCheckedClass(list) {
    list = this.get(list).children;
      for(var i = 0; i < list.length; i++) {
        list[i].classList.remove('checked');
      }
  }
  
  loadClasses(style, fileName) {
    var classList = this.get('#class-list');
    classList.style.display = style;
    classList.innerHTML = '';
    if(typeof(fileName) !== 'undefined' ) {
      this.sig.parseAndExtractFile(fileName).then(extraction => {
        this.codeEditor.editor.setValue(extraction.content); 
        this.root = extraction.ast;
        this.components = extraction.sigs;
        this.components.classes.forEach((cls, i) => {
           this.addListElement('#class-list', cls.sig.declaration, i);
        });
        this.components.variables.forEach((topLvlVar, i) => {
           this.addListElement('#class-list', topLvlVar.declaration, i);  
        });
        this.components.functions.forEach((func, i) => {
           this.addListElement('#class-list', func.declaration, i);    
        });
      });
    }
  }
  
  
  loadFunctions(style, className, id, type) {
    var functionList = this.get('#function-list')
    functionList.style.display = style;
    functionList.innerHTML = '';
    if(style != 'none') {
      if(type === NodeTypes.CLASS) {
        this.currentTopLvl.methods.forEach((func, i) => {
          this.addListElement('#function-list', func.declaration, i);
        });  
        this.codeEditor.editor.setValue(this.currentTopLvl.sig.content); 
      } else {
        this.codeEditor.editor.setValue(this.currentTopLvl.content); 
      }
    }
  }
  
  async prepareEditor() {
    const editorComp = this.codeEditor;

    await promisedEvent(editorComp, "editor-loaded");

    editorComp.editor.setOption("mode", "gfm");
    editorComp.editor.setOption("lineWrapping", true);
    editorComp.doSave = text => {
      var type, id;
      //TODO: add type to the signatures object
      if(this.currentMethod.hasOwnProperty('id')) {
        type = NodeTypes.METHOD;
        id = this.currentMethod.id;
      }
      else if(this.currentTopLvl.hasOwnProperty('sig')) {
        type = NodeTypes.CLASS;
        id = this.currentTopLvl.sig.id;
      } else if(this.currentTopLvl.hasOwnProperty('id')) {
        type = this.currentTopLvl.declaration.includes('var') ? 
               NodeTypes.VAR : NodeTypes.FUNCTION;
        id = this.currentTopLvl.id;
      } else {
        type = NodeTypes.FILE;
        id = '';
      }
      this.saveFile(text, type, id);
    }
    await this.loadFiles(DEMO_DIRECTORY); 
  }
  
  async loadFiles(path) {
    var dirContents = await fetch(path, {method: 'OPTIONS'}).then(r=>r.json());
    for (var obj of dirContents.contents) {
      if (obj.type === 'file' && obj.name.split('.').pop() === 'js') {
        this.addListElement('#file-list', path + obj.name);
      }
      else if (obj.type === 'directory') {
        this.loadFiles(path + obj.name + '/')
      }
    }
  }
  
  loadFunctionContent(id) {
    this.codeEditor.editor.setValue(this.currentTopLvl.methods[id].content);
  }
  
  removeEditorContent() {
     this.codeEditor.editor.setValue('');
  }
  
  addListElement(targetList, content, id) {
    var node = document.createElement('li');
    node.setAttribute("id", id);
    node.appendChild(document.createTextNode(content));
    this.get(targetList).appendChild(node);
  }
  
  /**
  Save the currently active file, replacing the content of an element
  of type `type` (one of 'method', 'variable', 'function', 'class') with the
  identifier `id` (available in the ['id']-field of the signatures object) with
  the new content `content` (valid JS as string)
  */
  saveFile(content, type, id) {
    var parent = (type === 'method')? this.currentTopLvl.sig.id : '';
    this.sig.setNewContent(this.currentFile,
                  type,
                  id, 
                  content,
                  parent)
  }

}