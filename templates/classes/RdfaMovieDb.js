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
    RdfaManager.readDataFromFirebase('mymovies', true).then((data) => {
      let movies = this.filterMovies(data);
      let processedMovies = this.enrichMovies(movies);
      console.log(processedMovies);
      this.generateTableRows(processedMovies);
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
        if (movie.rating > i) {
          ratingTd.append($('<i class="fa fa-star">'));
        } else {
          ratingTd.append($('<i class="fa fa-star-o">'));
        }
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
  
  filterMovies(graph) {
    let movieSubjects = graph.subjects.filter((subject) => {
      return subject.predicates.some((predicate) => {
        return (predicate.property == "http://ogp.me/ns#type"
            && predicate.values[0] == "video.movie")
          || (predicate.property == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            && predicate.values[0] == "http://schema.org/Movie");
      });
    });
    return movieSubjects;
  }
  
  enrichMovies(movieSubjects) {
    movieSubjects.forEach((movieSubject) => {
      if (this.isOgpMovie(movieSubject)) {
        movieSubject.url = movieSubject.predicates.filter((predicate) => predicate.property == "http://ogp.me/ns#url")[0].value();
        movieSubject.name = movieSubject.predicates.filter((predicate) => predicate.property == "http://ogp.me/ns#title")[0].value();
      } else if (this.isSchemaMovie(movieSubject)) {
        movieSubject.url = movieSubject.predicates.filter((predicate) => predicate.property == "http://schema.org/url")[0].value();
        movieSubject.name = movieSubject.predicates.filter((predicate) => predicate.property == "http://schema.org/name")[0].value();
      }
    });
    return movieSubjects;
  }

  isOgpMovie(movieSubject) {
    return movieSubject.predicates.some((predicate) => {
      return (predicate.property == "http://ogp.me/ns#type"
          && predicate.values[0] == "video.movie");
    });
  }
  
  isSchemaMovie(movieSubject) {
    return movieSubject.predicates.some((predicate) => {
      return (predicate.property == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
          && predicate.values[0] == "http://schema.org/Movie");
    });
  }
}
