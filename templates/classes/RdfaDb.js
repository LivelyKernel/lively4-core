'use strict';

import Morph from './Morph.js';

import RdfaManager from '../../src/client/rdfa-manager.js';

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
    this.createTableHeader();
    this.loadRdfaDataAndFillTable();
  }

  loadRdfaDataAndFillTable() {
    RdfaManager.loadFirebaseConfig();
    RdfaManager.readDataFromFirebase('').then((data) => {
      this.generateTableRows(data);
    });
  }

  /*
   * Window methods
   */
  render() {

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
