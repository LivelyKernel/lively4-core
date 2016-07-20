'use strict';

import Morph from './Morph.js';

import rdfa from '../../src/client/rdfa/rdfa-utils.js';

export default class RdfaDb extends Morph {

  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.setup();
    this.windowTitle = "RDFa DB";
  }

  /*
   * Initialization
   */
  setup() {
    this.table = $(this.shadowRoot.querySelector('#dbTable'));
    rdfa.loadFirebaseConfig();
    this.registerReloadButton();
  }

  loadRdfaDataAndFillTable() {
    this.table.empty();
    this.createTableHeader();
    let result = window.prompt("Wich bucket to load triples from?");
    if (!result) return;
    rdfa.readDataFromFirebase(result).then((data) => {
      this.generateTableRows(data);
    });
  }

  /*
   * Window methods
   */
  render() {

  }
  
  registerReloadButton() {
    $(this.shadowRoot.querySelector("#reload-button")).on('click', () => {
      this.loadRdfaDataAndFillTable();
    })
  }
  
  generateTableRows(dataArray) {
    dataArray.forEach((triple) => {
      if (!triple.isRoot) {
        return;
      }
      this.table.append($('<tr>')
        .append($('<td>')
          .append(triple.getReadableUrl()))
        .append($('<td>')
          .append(triple.property))
        .append($('<td>')
          .append(triple.toString()))
      );
    });
  }
  
  createTableHeader() {
    this.table
      .append($('<tr>')
        .append($('<th>').text("Subject"))
        .append($('<th>').text("Property"))
        .append($('<th>').text("Value"))
      )
  }

}
