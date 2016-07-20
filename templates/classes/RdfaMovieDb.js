'use strict';

import Morph from './Morph.js';

import rdfa from '../../src/client/rdfa/rdfa-utils.js';
import RdfaTriple from '../../src/client/rdfa/RdfaTriple.js';
import RdfaPredicate from '../../src/client/rdfa/RdfaPredicate.js';
import RdfaSubject from '../../src/client/rdfa/RdfaSubject.js';
import generateUuid from '../../src/client/uuid.js';

import * as WikiDataAdapter from '../../src/client/wiki-data-adapter.js';

const DEFAULT_BUCKET = "mymovies";

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
    this.registerMergeDuplicatesButton();
    this.registerMergeImdbRottenButton();
    this.createTableHeader();
    this.loadRdfaDataAndFillTable(DEFAULT_BUCKET);
    this.updateBucketList();
    this.registerLoadBucketButton();
  }

  loadRdfaDataAndFillTable(bucket) {
    rdfa.readDataFromFirebase(bucket, true).then((data) => {
      console.log(data);
      let movies = this.filterMovies(data);
      console.log("movies1", movies);
      this.movies = this.enrichMovies(movies);
      console.log("movies", this.movies);
      this.generateTable(this.movies);
    });
  }

  /*
   * Window methods
   */
  render() {

  }
  
  registerMergeDuplicatesButton() {
    $(this.shadowRoot.querySelector("#merge-duplicates-button")).on('click', () => {
      this.movies = this.mergeDuplicateMovies(this.movies);
      console.log("mergedDuplicateMovies", this.movies);
      this.generateTable(this.movies);
    })
  }
  
  registerMergeImdbRottenButton() {
    $(this.shadowRoot.querySelector("#merge-imdb-rotten-button")).on('click', () => {
      this.enrichWithOtherDbMovieId(this.movies).then(() => {
        this.movies = this.mergeImdbRottenMovies(this.movies);
        console.log("mergedImdbRottenMovies", this.movies);
        this.generateTable(this.movies);
      }).catch((reason) => console.log("Error merging IMDB + rottentomatoes", reason));
    })
  }
  
  generateTable(movies) {
    this.table.empty();
    this.createTableHeader();
      
    movies.forEach((movie) => {
      let ratingTd = $('<div>')
      for (let i = 0; i < 5; i++) {
        let ratingStar;
        if (movie.rating > i) {
          ratingStar = $('<i class="fa fa-star">');
        } else {
          ratingStar = $('<i class="fa fa-star-o">');
        }
        
        ratingTd.append(ratingStar);
        
        const rating = i + 1;
        ratingStar.on("click", () => {
          this.setRating(movie, rating);
        });
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
        .append($('<td>')
          .append($('<a>').attr('href', this.dbObjectToUrl(movie.otherDb)).attr('target', '_blank')
            .append(this.dbObjectToUrl(movie.otherDb))
          )
        )
        .append($('<td>')
          .append(ratingTd))
      );
    });
  }
  
  setRating(movie, rating) {
    console.log(movie, rating);
    const reviewUuid = generateUuid();
    const authorUuid = generateUuid();
    const ratingUuid = generateUuid();
    
    const triples = [];
    
    triples.push(new RdfaTriple(ratingUuid, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://schema.org/Rating'));
    triples.push(new RdfaTriple(ratingUuid, 'http://schema.org/ratingValue', rating.toString()));
    
    triples.push(new RdfaTriple(authorUuid, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://schema.org/Person'));
    triples.push(new RdfaTriple(authorUuid, 'http://schema.org/name', 'TestAuthor'));
    
    triples.push(new RdfaTriple(reviewUuid, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://schema.org/Review'));
    triples.push(new RdfaTriple(movie.id, 'http://schema.org/Review', reviewUuid));
    triples.push(new RdfaTriple(reviewUuid, 'http://schema.org/reviewRating', ratingUuid));
    triples.push(new RdfaTriple(reviewUuid, 'http://schema.org/Author', authorUuid));
    
    rdfa.storeRDFaTriplesToFirebase('mymovies', triples);
  }
  
  createTableHeader() {
    this.table
      .append($('<tr>')
        .append($('<th>').text("Title"))
        .append($('<th>').text("URL"))
        .append($('<th>').text("DB"))
        .append($('<th>').text("ID"))
        .append($('<th>').text("Same as"))
        .append($('<th>').text("Rating"))
      )
  }
  
  filterMovies(graph) {
    const movieSubjects = [];
    for (let key in graph.subjects) {
      if (!graph.subjects.hasOwnProperty(key)) continue;
      
      const subject = graph.subjects[key];
      
      for (let key2 in subject.predicates) {
        const predicate = subject.predicates[key2];
        if (predicate.id == "http://ogp.me/ns#type") {
          predicate.objects.forEach(object => {
            if (object.value == "video.movie") {
              movieSubjects.push(subject);
            }
          });
        } else if (predicate.id == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
          predicate.objects.forEach(object => {
            if (object.value == "http://schema.org/Movie") {
              movieSubjects.push(subject);
            }
          });
        }
      }
    }
    return movieSubjects;
  }
  
  enrichMovies(movieSubjects) {
    movieSubjects.forEach((movieSubject) => {
      if (this.isOgpMovie(movieSubject)) {
        let predicate = movieSubject.predicates["http://ogp.me/ns#url"];
        if (predicate) {
          movieSubject.url = predicate.objects[0].value;
        }
        
        predicate = movieSubject.predicates["http://ogp.me/ns#title"];
        if (predicate) {
          movieSubject.name = predicate.objects[0].value;
        }
      } else if (this.isSchemaMovie(movieSubject)) {
        let predicate = movieSubject.predicates["http://schema.org/url"];
        if (predicate) {
          movieSubject.url = predicate.objects[0].value;
        }
        
        predicate = movieSubject.predicates["http://schema.org/name"];
        if (predicate) {
          movieSubject.name = predicate.objects[0].value;
        }
      }
      
      console.log(movieSubject);
      const review = movieSubject.predicates['http://schema.org/Review'];
      if (false && review) {
        console.log(review);
        movie.ratings = review.predicates
          .map(predicate => {
          // TODO extract ratings as {rating, user} objects
          console.log(predicate);
        });
      } else {
        movieSubject.ratings = [];
      }
      
      this.setMovieDb(movieSubject);
    });
    return movieSubjects;
  }

  isOgpMovie(movieSubject) {
    const predicate = movieSubject.predicates["http://ogp.me/ns#type"];
    if (predicate) {
      return predicate.objects[0].value == "video.movie";
    }
    return false;
  }
  
  isSchemaMovie(movieSubject) {
    const predicate = movieSubject.predicates["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"];
    if (predicate) {
      return predicate.objects[0].value == "http://schema.org/Movie";
    }
    return false;
  }
  
  mergeDuplicateMovies(movieSubjects) {
    let movies = {};
    let filteredMovieSubjects = [];
    movieSubjects.forEach((movieSubject) => {
      if (movieSubject.movieDb.name) {
        let dbMovies = movies[movieSubject.movieDb.name];
        if (!dbMovies) {
          dbMovies = {};
          movies[movieSubject.movieDb.name] = dbMovies;
        }
        
        let sameMovieSubject = dbMovies[movieSubject.movieDb.id];
        if (sameMovieSubject) {
          sameMovieSubject.duplicates = sameMovieSubject.duplicates || [];
          sameMovieSubject.duplicates.push(movieSubject);
        } else {
          dbMovies[movieSubject.movieDb.id] = movieSubject;
          filteredMovieSubjects.push(movieSubject);
        }
      } else {
        filteredMovieSubjects.push(movieSubject);
      }
    });
    return filteredMovieSubjects;
  }
  
  mergeImdbRottenMovies(movieSubjects) {
    let imdbMovies = movieSubjects.filter((movieSubject) => movieSubject.movieDb.name == "imdb");
    let rottenMovies = movieSubjects.filter((movieSubject) => movieSubject.movieDb.name == "rottentomatoes");
    let duplicates = [];
    
    imdbMovies.forEach((imdbMovie) => {
      let sameMovies = rottenMovies.filter((rottenMovie) => {
        return imdbMovie.otherDb.id == rottenMovie.movieDb.id;
      });
      sameMovies.forEach((sameMovie) => {
        imdbMovie.duplicates = imdbMovie.duplicates || [];
        imdbMovie.duplicates.push(sameMovie);
        duplicates.push(sameMovie);
      });
    });
    
    return movieSubjects.filter((movieSubject) => !duplicates.includes(movieSubject));
  }
  
  enrichWithOtherDbMovieId(movieSubjects) {
    let imdbMovies = movieSubjects.filter((movieSubject) => movieSubject.movieDb.name == "imdb");
    let rottenMovies = movieSubjects.filter((movieSubject) => movieSubject.movieDb.name == "rottentomatoes");
    let promises = [];
    imdbMovies.forEach((imdbMovie) => {
      promises.push(WikiDataAdapter.imdb2rotten(imdbMovie.movieDb.id).then((rottenId) => {
        if (rottenId && rottenId[0]) {
          imdbMovie.otherDb = {
            id: rottenId[0],
            name: 'rottentomatoes'
          };
        }
      }));
    });
    rottenMovies.forEach((rottenMovie) => {
      promises.push(WikiDataAdapter.rotten2imdb(rottenMovie.movieDb.id).then((imdbId) => {
        if (imdbId && imdbId[0]) {
          rottenMovie.otherDb = {
            id: imdbId[0],
            name: 'imdb'
          };
        }
      }));
    });
    return Promise.all(promises);
  }
  
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
    
    movieSubject.movieDb = {
      name: null,
      id: null
    };
    
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
  
  dbObjectToUrl(movieDb) {
    if (!movieDb) return '';
    
    if (movieDb.name == 'imdb') {
      return "http://www.imdb.com/title/" + movieDb.id;
    } else if (movieDb.name == 'rottentomatoes') {
      return "http://www.rottentomatoes.com/" + movieDb.id;
    }
    return '';
  }
  
  updateBucketList() {
    const bucketList = this.shadowRoot.querySelector("#bucketlist");
    bucketList.innerHTML = "";
    
      rdfa.getBucketListFromFirebase().then(buckets => {
      buckets.forEach(bucket => {
        const option = document.createElement("option");
        option.value = bucket;
        bucketList.appendChild(option);
      });
    })
  }
  
  registerLoadBucketButton() {
    $(this.shadowRoot.querySelector("#select-bucket-button")).on('click', () => {
      let bucket = this.shadowRoot.querySelector("#bucketNameInput").value;
      if (!bucket) {
        window.prompt("Which bucket do you want to load?");
      }
      if (bucket) {
        this.loadRdfaDataAndFillTable(bucket);
      }
    });
  }
}
