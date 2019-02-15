import Morph from 'src/components/widgets/lively-morph.js';
import * as monaco from 'node_modules/@timkendrick/monaco-editor/dist/standalone/index.js';
import { setupMonaco, fetchGithubData } from 'src/client/github-explorer.js';
import {pt} from 'src/client/graphics.js'

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
  }

  setupMonacoEditor() {
    this.div = <div style='margin: 0 auto; border: 1px solid grey;'></div>;
    this.div.style.height = '200px';
    this.div.appendChild(<h2 style="color: #2B547E; font-size: 1.5em; text-align: center;">Query and Explore</h2>)
    this.div.id = 'monaco-editor-custom-lively';

    setupMonaco();

    this.parentNode.appendChild(this.div);

    this.editor = monaco.editor.create(this.div, {
      value: preset,
      theme: 'ghExplorerTheme',
      language: 'ghExplorer',
      automaticLayout: true 
    });
  }

  createRunButton() {
    const runButton = <button class="runButton">Run Query</button>
    runButton.onclick = () => this.runQuery();
    this.get('#content').appendChild(runButton);
  }

  createDataPreviewElement() {
    this.get('#content').appendChild(
      <div style="max-height: 250px; overflow-y: scroll">
        <h2> Data Preview </h2> <table id='dataPreview' />
      </div>,
    );
  }

  async runQuery() {
    const response = await fetchGithubData('/query?q=' + this.editor.getValue().replace(/\n/g, " "));
    this.createPreview(response);
    
    this.get('#content').appendChild(<div id="visualization"></div>)
    const showDataExplorerButton = <button class="visualizeButton">Visualize Data</button>;
    showDataExplorerButton.onclick = () => this.createExplorer(response);
    this.get('#visualization').innerHTML = '';
    this.get('#visualization').appendChild(showDataExplorerButton);
  }

  createPreview(response) {
    this.get('#dataPreview').innerHTML = '';
    const div = <div> Inspector Mode: </div>;
    this.inspectorModeCheckbox = <input type='checkbox' id='inspector-check' />;
    div.appendChild(this.inspectorModeCheckbox);
    this.get('#dataPreview').appendChild(div);
    
    this.createPreviewHeader(response[0]);

    response.map((row, index) => {
      this.get('#dataPreview').appendChild(this.createPreviewRow(row, index));
    });
  }

  createPreviewHeader(response1) {
    let tableHeader = <tr />;
    
    const rowIndexHeader = <th class="rowIndex">#</th>;
    rowIndexHeader.onclick = () => lively.openInspector(response1, undefined, 'Whole Datapreview');
    tableHeader.appendChild(rowIndexHeader);
    
    Object.keys(response1).map(field => {
      tableHeader.appendChild(<th> {field} </th>);
    });

    this.get('#dataPreview').appendChild(tableHeader);
  }

  createPreviewRow(row, index=undefined) {
    let tableRow = <tr />;
    if(index !== undefined) {
      const indexRow = <td class='rowIndex'>{index}</td>;
      indexRow.onclick = () => lively.openInspector(row);
      tableRow.appendChild(indexRow); 
    }


    Object.keys(row).map(key => {
      if (Array.isArray(row[key])) {
        // if it is an array of objects
        if (row[key].length === 0) {
          tableRow.appendChild(<td> - </td>);
        } else {
          const element = (
            <td class='clickable'>
              <div>
                <i class='right' /> {row[key].length} elements{' '}
              </div>{' '}
            </td>
          );
          element.onclick = () => {
            if (this.inspectorModeCheckbox.checked) {
              lively.openInspector(row[key]);
            } else {
              this.onArrayRowClick(element, row[key]);
            }
          };
          tableRow.appendChild(element);
        }
      } else if (typeof row[key] === 'object' && row[key] !== null) {
        // if it is an object
        const element = (
          <td class='clickable'>
            <i class='right' /> Object{' '}
          </td>
        );

        element.onclick = () => {
          if (this.inspectorModeCheckbox.checked) {
            lively.openInspector(row[key]);
          } else {
            this.onObjectClick(element, row[key]);
          }
        };

        tableRow.appendChild(element);
      } else {
        // if it is a primitive
        tableRow.appendChild(
          <td title={row[key] ? row[key] : '-'}>
            <div> {row[key] ? row[key] : '-'} </div>
          </td>,
        );
      }
    });

    return tableRow;
  }

  onArrayRowClick(element, arrayOfObjects) {
    if (element.getElementsByClassName('inlineTable').length > 0) {
      element.innerHTML = '';
      element.appendChild(
        <div>
          <i class='right' /> {arrayOfObjects.length} elements{' '}
        </div>,
      );
    } else {
      element.innerHTML = '';
      element.appendChild(this.createTable(arrayOfObjects));
    }
  }

  createTable(arrayOfObjects) {
    const numberOfEl = arrayOfObjects.length;
    const table = <table class='inlineTable'> </table>;

    const tableHeader = <tr> </tr>;
    Object.keys(arrayOfObjects[0]).forEach(key => {
      tableHeader.appendChild(<th> {key} </th>);
    });
    table.appendChild(tableHeader);

    arrayOfObjects.forEach(row => {
      table.appendChild(this.createPreviewRow(row));
    });
    return <div style='height: auto'> {table} </div>;
  }

  onObjectClick(element, obj) {
    if (element.textContent.trim() !== 'Object') {
      element.innerHTML = '';
      element.appendChild(
        <div>
          {' '}
          <i class='right' /> Object{' '}
        </div>,
      );
    } else {
      element.innerHTML = '';
      element.appendChild(this.createTable([obj]));
    }
  }
  
  async createExplorer(response) {
    this.dataExplorerWindow = await lively.openComponentInWindow('data-explorer');
    this.dataExplorerWindow.setData(response);
  }

  livelyMigrate(other) {
    this.someJavaScriptProperty = other.someJavaScriptProperty;
    this.start();
  }

  async livelyExample() {
    this.someJavaScriptProperty = 42;
  }
}
