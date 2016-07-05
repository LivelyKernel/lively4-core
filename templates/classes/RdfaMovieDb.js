'use strict';

import Morph from './Morph.js';

import RdfaManager from '../../src/client/rdfa-manager.js';

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
    this.table = $(this.shadowRoot.querySelector('#dbTable'));
    this.createTableHeader();
    this.loadRdfaDataAndFillTable();
  }

  loadRdfaDataAndFillTable() {
    RdfaManager.loadFirebaseConfig();
    RdfaManager.readDataFromFirebase('').then((data) => {
      let movieTriples = this.filterSchemaOrgMovies(data);
      let movies = this.buildMoviesFromSchemaOrgTriples(movieTriples, data);
      let ogpMovieTriples = this.filterOgpMovies(data);
      let ogpMovies = this.buildMoviesFromOgpTriples(ogpMovieTriples, data);
      this.generateTableRows(movies.concat(ogpMovies));
    });
  }

  /*
   * Window methods
   */
  render() {

  }
  
  generateTableRows(movies) {
    movies.forEach((movie) => {
      let ratingTd = $('<td>')
      for (let i = 0; i < 5; i++) {
        ratingTd.append($('<i class="fa fa-star-o">'));
      }
      
      this.table.append($('<tr>')
        .append($('<td>')
          .append(movie.name))
        .append($('<td>')
          .append($('<a>').attr('href', movie.url.match(/^http/) ? movie.url : 'http://' + movie.url).attr('target', '_blank')
            .append(movie.url)
          )
        )
        .append(ratingTd)
      );
    });
  }
  
  createTableHeader() {
    this.table
      .append($('<tr>')
        .append($('<th>').text("Title"))
        .append($('<th>').text("URL"))
        .append($('<th>').text("Rating"))
      )
  }
  
  filterSchemaOrgMovies(data) {
    let movieTriples = data.filter((triple) => {
      return triple.property == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        && triple.values[0]== "http://schema.org/Movie"
    });
    return movieTriples;
  }
  
  buildMoviesFromSchemaOrgTriples(movieTriples, data) {
    let movies = [];
    movieTriples.forEach((movieTriple) => {
      let movie = {};
      movie.subject = movieTriple.subject;
      let sameSubjectTriples = data.filter((triple) => triple.subject == movie.subject);
      movie.url = sameSubjectTriples.filter((triple) => triple.property == "http://schema.org/url")[0];
      movie.url = movie.url ? movie.url.values[0]: null;
      movie.name = sameSubjectTriples.filter((triple) => triple.property == "http://schema.org/name")[0];
      movie.name = movie.name ? movie.name.values[0] : null;
      movies.push(movie);
    });
    return movies;
  }
  
  filterOgpMovies(data) {
    let movieTriples = data.filter((triple) => {
      return triple.property == "http://ogp.me/ns#type"
        && triple.values[0] == "video.movie"
    });
    return movieTriples;
  }
  
  buildMoviesFromOgpTriples(movieTriples, data) {
    let movies = [];
    movieTriples.forEach((movieTriple) => {
      let movie = {};
      movie.subject = movieTriple.subject;
      let sameSubjectTriples = data.filter((triple) => triple.subject == movie.subject);
      movie.url = sameSubjectTriples.filter((triple) => triple.property == "http://ogp.me/ns#url")[0];
      movie.url = movie.url ? movie.url.values[0] : null;
      movie.name = sameSubjectTriples.filter((triple) => triple.property == "http://ogp.me/ns#title")[0];
      movie.name = movie.name ? movie.name.values[0] : null;
      movies.push(movie);
    });
    return movies;
  }

}
