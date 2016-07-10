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
      console.log("processedMovies", processedMovies);
      let mergedMovies = this.mergeMovies(processedMovies)
      console.log("mergedMovies", mergedMovies);
      this.generateTableRows(mergedMovies);
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
        .append($('<td>')
          .append(movie.movieDb.name))
        .append($('<td>')
          .append(movie.movieDb.id))
        .append(ratingTd)
      );
    });
  }
  
  createTableHeader() {
    this.table
      .append($('<tr>')
        .append($('<th>').text("Title"))
        .append($('<th>').text("URL"))
        .append($('<th>').text("DB"))
        .append($('<th>').text("ID"))
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
        this.setMovieDb(movieSubject);
      } else if (this.isSchemaMovie(movieSubject)) {
        movieSubject.url = movieSubject.predicates.filter((predicate) => predicate.property == "http://schema.org/url")[0].value();
        movieSubject.name = movieSubject.predicates.filter((predicate) => predicate.property == "http://schema.org/name")[0].value();
        this.setMovieDb(movieSubject);
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
  
  mergeMovies(movieSubjects) {
    movieSubjects.forEach((movieSubject) => {
      let moviesSameName = movieSubjects.filter((otherMovieSubject) => {
        return otherMovieSubject !== movieSubject
          && movieSubject.name === otherMovieSubject.name
          //&& this.isSameUrl(movieSubject, otherMovieSubject);
      });
      console.log(moviesSameName);
    });
    return movieSubjects;
  }
  /*
  isSameUrl(movieSubject, otherMovieSubject) {
    var prefixRegex = /^https?:\/\//i;
    var domainRegex = /^[^\/]+/;
    
    let url = movieSubject.url.replace(prefixRegex, '');
    let otherUrl = otherMovieSubject.url.replace(prefixRegex, '');
    
    let domain = url.match(domainRegex);
    let otherDomain = otherUrl.match(domainRegex);

    return domain === otherDomain;
  }*/
  
  setMovieDb(movieSubject) {
    let url = movieSubject.url;
    let regexArray = [
      {
        prefix: /^www\.rottentomatoes\.com\//,
        id: /^m\/.*/,
        db: 'rottentomatoes'
      },
      {
        prefix: /^www\.imdb\.com\/title\//,
        id: /^tt[0-9]*\/?/,
        db: 'imdb'
      },
    ];
    let stripedUrl = url.replace(/^https?:\/\//, "");
    for(let regexObj of regexArray) {
      let stripedUrl2 = stripedUrl.replace(regexObj.prefix, '');
      let id = stripedUrl2.match(regexObj.id, '');
      if (id) {
        id = id[0].replace(/\/$/, '');
        movieSubject.movieDb = {
          name: regexObj.db,
          id: id
        };
        break;
      }
    }
  }
}
