import Morph from 'src/components/widgets/lively-morph.js';
import * as monaco from 'node_modules/@timkendrick/monaco-editor/dist/standalone/index.js';
import { setupMonaco, fetchGithubData } from 'src/client/github-explorer.js';

const preset = '';

export default class GithubExplorer extends Morph {
  constructor() {
    super();
    this.div = null;
    this.queryEditorHeight = 50;
  }

  async initialize() {
    this.windowTitle = 'Github Explorer';
    this.registerButtons();
    // automatically installs handler for some methods
    //lively.addEventListener("template", this, "dblclick", evt => this.onDblClick(evt));
    // console.log(monaco);

    // lively.addEventListener('#content', this.get('#setup'), 'click', e => this.start());
  }

  onSetup(e) {
    this.start();
    this.setupMonacoEditor();
  }

  async start() {
    this.get('#content').removeChild(this.get('#setup'));
    this.get('#content').style.marginTop = '214px';
    this.createRunButton();
    this.createDataPreviewElement();
    
    
    this.createPreview();
  }

  setupMonacoEditor() {
    this.div = <div> </div>;
    // this.div.style.width = "100px";
    this.div.style.height = '200px';
    this.div.style.marginRight = 'auto';
    this.div.style.marginLeft = 'auto';
    this.div.id = 'monaco-editor-custom-lively';

    setupMonaco();

    this.parentNode.appendChild(this.div);

    let editor = monaco.editor.create(this.div, {
      value: preset,
      theme: 'ghExplorerTheme',
      language: 'ghExplorer',
    });
  }

  createRunButton() {
    this.get('#content').appendChild(
      <button onClick={() => this.runQuery}> Run Query </button>,
    );
  }

  createDataPreviewElement() {
    this.get('#content').appendChild(
      <div>
        {' '}
        <h2> Data Preview </h2>
        <table id='dataPreview' />{' '}
      </div>,
    );
  }

  runQuery(value) {
    console.log(value);
  }

  async createPreview() {
    this.get('#dataPreview').innerHTML = '';
    const response = await fetchGithubData('/dummy');
    this.createPreviewHeader(response[0]);

    response.map(row => {
       this.get('#dataPreview').appendChild(this.createPreviewRow(row));
    });
    
  }

  createPreviewHeader(response1) {
    let tableHeader = <tr> </tr>;

    Object.keys(response1).map(field => {
      tableHeader.appendChild(<th> {field} </th>);
    });

    this.get('#dataPreview').appendChild(tableHeader);
  }

  createPreviewRow(row) {
    let tableRow = <tr> </tr>;

    Object.keys(row).map(key => {
      if (Array.isArray(row[key])) {
        // if it is an array of objects
        if (row[key].length === 0) {
          tableRow.appendChild(<td> - </td>);
        } else {
          const element = (
            <td class="clickable">
              <div>
                <i class="right" />{row[key].length} elements
              </div>
            </td>
          );
          element.onclick = () => this.onArrayRowClick(element, row[key]);
          tableRow.appendChild(element);
        }
      } else if (typeof row[key] === 'object' && row[key] !== null) {
        // if it is an object
        const element = <td class="clickable"><i class="right" />Object</td>;
        element.onclick = () => this.onObjectClick(element, row[key]);
        tableRow.appendChild(element);
      } else {
        // if it is a primitive
        tableRow.appendChild(
          <td title={row[key] ? row[key] : '-'}>
            <div>{row[key] ? row[key] : '-'}</div>{' '}
          </td>,
        );
      }
    });

   return tableRow;
  }

  onArrayRowClick(element, arrayOfObjects) {
    if(element.getElementsByClassName("inlineTable").length > 0) {
      element.innerHTML = '';
      element.appendChild(
        <div>
          <i class="right" />
          {arrayOfObjects.length} elements
        </div>
      );
    } else {
      element.innerHTML = '';
      element.appendChild(this.createTable(arrayOfObjects));
    }
  }
  
  createTable(arrayOfObjects) {
    const numberOfEl = arrayOfObjects.length;
    const table = <table class="inlineTable"></table>;

    const tableHeader = <tr> </tr>;
    Object.keys(arrayOfObjects[0]).forEach(key => {
      tableHeader.appendChild(<th> {key} </th>);
    });
    table.appendChild(tableHeader);

    arrayOfObjects.forEach(row => {
      table.appendChild(this.createPreviewRow(row));
    });
    return (
      <div style="height: auto">
        {table}
      </div>
    );
  }
  
  onObjectClick(element, obj) {
    if(element.textContent !== 'Object') {
      element.innerHTML = '';
      element.appendChild(<div><i class="right" />Object</div>);
    } else {
      element.innerHTML = '';
      element.appendChild(this.createTable([obj]));
    }
    
  }

  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
    // this.parentNode.removeChild(document.getElementById("monaco-editor-custom-lively"));
  }

  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty;
    // document.body.removeChild(this.div);
    this.start();
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
    // console.log(this.parentNode);
  }

  livelyPrepareSave() {}

  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the
    this.someJavaScriptProperty = 42;
  }
}
