'use strict';

import Morph from './Morph.js';

export default class RdfaMovieDb extends Morph {

  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.setup();
    this.windowTitle = "RDFa Movie DB";
  }

  /*
   * Initialization
   */
  setup() {
    this.table = $(this.shadowRoot.querySelector('#movieTable'));
    this.createTableHeader();
    this.loadRdfaDataAndFillTable();
  }

  loadRdfaDataAndFillTable() {
    firebase.database().ref("rdfa-movies").once('value').then((moviesWrapper) => {
      let movies = moviesWrapper.val();
      this.generateTableRows(movies);
    });
  }

  /*
   * Window methods
   */
  render() {

  }
  
  generateTableRows(movies) {
    for (let movieId in movies) {
      this.table.append($('<tr>')
        .append($('<td>')
          .append(movieId))
        .append($('<td>')
          .append(movies[movieId]))
      );
    };
  }
  
  createTableHeader() {
    this.table
      .append($('<tr>')
        .append($('<th>').text("Title"))
        .append($('<th>').text("URL"))
      )
  }

}
