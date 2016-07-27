'use strict';

import Morph from './Morph.js';

import rdfa from '../../src/client/rdfa/rdfa-api.js';
import RdfaTriple from '../../src/client/rdfa/RdfaTriple.js';
import RdfaPredicate from '../../src/client/rdfa/RdfaPredicate.js';
import RdfaSubject from '../../src/client/rdfa/RdfaSubject.js';
import Firebase from '../../src/client/firebase.js';

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
    this.bucket = DEFAULT_BUCKET;
    this.firebase = new Firebase(rdfa.firebaseSampleConf());
    
    this.table = $(this.shadowRoot.querySelector('#dbTable'));
    this.registerMergeDuplicatesButton();
    this.registerMergeImdbRottenButton();
    this.loadRdfaDataAndFillTable();
    this.updateBucketList();
    this.registerLoadBucketButton();
  }

  loadRdfaDataAndFillTable() {
    this.table.empty();
    this.createTableHeader();
    rdfa.loadDataFrom(this.firebase, this.bucket).then((data) => {
      this.movieProjections = this.filterMovies(data);
      this.enrichMovieProjections(this.movieProjections, data);
      console.log("movieProjections", this.movieProjections);
      this.generateTable(this.movieProjections);
    });
  }

  /*
   * Window methods
   */
  render() {

  }
  
  registerMergeDuplicatesButton() {
    $(this.shadowRoot.querySelector("#merge-duplicates-button")).on('click', () => {
      this.movieProjections = this.mergeDuplicateMovies(this.movieProjections);
      console.log("movieProjections (merged duplicates)", this.movieProjections);
      this.generateTable(this.movieProjections);
    });
  }
  
  registerMergeImdbRottenButton() {
    $(this.shadowRoot.querySelector("#merge-imdb-rotten-button")).on('click', () => {
      this.enrichWithOtherDbMovieId(this.movieProjections).then(() => {
        this.movieProjections = this.mergeImdbRottenMovies(this.movieProjections);
        console.log("movieProjections (merged imdb-rotten)", this.movieProjections);
        this.generateTable(this.movieProjections);
      }).catch((reason) => console.log("Error merging IMDB + rottentomatoes", reason));
    });
  }
  
  generateTable(movieProjections) {
    this.table.empty();
    this.createTableHeader();
    movieProjections.forEach((movieProjection) => {
      let ratingTd = $('<div>')
      let review = movieProjection.review;
      //TODO handle multiple reviews
      if (Array.isArray(review)) {
        review = review[0];
      }
      for (let i = 0; i < 5; i++) {
        let ratingStar;
        if (review && review.reviewRating && review.reviewRating.ratingValue > i) {
          ratingStar = $('<i class="fa fa-star">');
        } else {
          ratingStar = $('<i class="fa fa-star-o">');
        }
        
        ratingTd.append(ratingStar);
        
        const rating = i + 1;
        ratingStar.on("click", () => {
          this.setRating(movieProjection, rating);
        });
      }
      
      const movieName = Array.isArray(movieProjection.name) ? movieProjection.name[0] : movieProjection.name;
      const movieUrl = Array.isArray(movieProjection.url) ? movieProjection.url[0] : movieProjection.url;
      
      this.table.append($('<tr>')
        .append($('<td>')
          .append(movieName))
        .append($('<td>')
          .append($('<a>').attr('href', movieUrl.match(/^http/) ? movieProjection.url : 'http://' + movieUrl).attr('target', '_blank')
            .append(movieUrl)
          )
        )
        .append($('<td>')
          .append(movieProjection.movieDb.name))
        .append($('<td>')
          .append(movieProjection.movieDb.id))
        .append($('<td>')
          .append($('<a>').attr('href', this.dbObjectToUrl(movieProjection.otherDb)).attr('target', '_blank')
            .append(this.dbObjectToUrl(movieProjection.otherDb))
          )
        )
        .append($('<td>')
          .append(ratingTd))
      );
    });
  }
  
  setRating(movieProjection, rating) {
    console.log("setRating", movieProjection, rating);
    const reviewUuid = rdfa.newBlankNodeId();
    const authorUuid = rdfa.newBlankNodeId();
    const ratingUuid = rdfa.newBlankNodeId();
    
    const triples = [];
    
    triples.push(new RdfaTriple(ratingUuid, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://schema.org/Rating'));
    triples.push(new RdfaTriple(ratingUuid, 'http://schema.org/ratingValue', rating.toString()));
    
    triples.push(new RdfaTriple(authorUuid, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://schema.org/Person'));
    triples.push(new RdfaTriple(authorUuid, 'http://schema.org/name', 'TestAuthor'));
    
    triples.push(new RdfaTriple(reviewUuid, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://schema.org/Review'));
    triples.push(new RdfaTriple(movieProjection.getSubject(), 'http://schema.org/Review', reviewUuid));
    triples.push(new RdfaTriple(reviewUuid, 'http://schema.org/reviewRating', ratingUuid));
    triples.push(new RdfaTriple(reviewUuid, 'http://schema.org/Author', authorUuid));
    
    //TODO mymovies
    rdfa.storeRdfTriplesTo(this.firebase, 'mymovies', triples).then(()=> {
      this.loadRdfaDataAndFillTable();
    });
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
      );
  }
  
  filterMovies(data) {
    let movieProjections = [];

    movieProjections = movieProjections.concat(rdfa.queryResolved(data, {
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : "http://schema.org/Movie"
      }, {
        "url" : "http://schema.org/url",
        "name" : "http://schema.org/name",
        "review" : [ "http://schema.org/Review", {
            "author" : [ "http://schema.org/Author", {
                "name" : "http://schema.org/name" } ],
            "reviewRating" : [ "http://schema.org/reviewRating", {
                "ratingValue" : "http://schema.org/ratingValue" } ]
          }
        ]
      })
    );
    
    movieProjections = movieProjections.concat(rdfa.queryResolved(data, {
        "http://ogp.me/ns#type" : "video.movie"
      }, {
        "url" : "http://ogp.me/ns#url",
        "name" : "http://ogp.me/ns#title",
        "review" : [ "http://schema.org/Review", {
            "author" : [ "http://schema.org/Author", {
                "name" : "http://schema.org/name" } ],
            "reviewRating" : [ "http://schema.org/reviewRating", {
                "ratingValue" : "http://schema.org/ratingValue" } ]
          }
        ]
      })
    );

    return movieProjections;
  }
  
  enrichMovieProjections(movieProjections, data) {
    movieProjections.forEach((movieProjection) => {
      this.setMovieDb(movieProjection);
    });
  }
  
  mergeDuplicateMovies(movieProjections) {
    let movies = {};
    let filteredMovieProjections = [];
    movieProjections.forEach((movieProjection) => {
      if (movieProjection.movieDb.name) {
        let dbMovies = movies[movieProjection.movieDb.name];
        if (!dbMovies) {
          dbMovies = {};
          movies[movieProjection.movieDb.name] = dbMovies;
        }
        
        let sameMovieProjection = dbMovies[movieProjection.movieDb.id];
        if (sameMovieProjection) {
          sameMovieProjection.duplicates = sameMovieProjection.duplicates || [];
          sameMovieProjection.duplicates.push(movieProjection);
          if (!sameMovieProjection.review && movieProjection.review) {
            // only for displaying purpose, the triples are not stored to the "sameMovie"
            sameMovieProjection.review = movieProjection.review;
          }
        } else {
          dbMovies[movieProjection.movieDb.id] = movieProjection;
          filteredMovieProjections.push(movieProjection);
        }
      } else {
        filteredMovieProjections.push(movieProjection);
      }
    });
    return filteredMovieProjections;
  }
  
  mergeImdbRottenMovies(movieProjections) {
    let imdbMovies = movieProjections.filter((movieProjection) => movieProjection.movieDb.name == "imdb");
    let rottenMovies = movieProjections.filter((movieProjection) => movieProjection.movieDb.name == "rottentomatoes");
    let duplicates = [];
    
    imdbMovies.forEach((imdbMovie) => {
      let sameMovies = rottenMovies.filter((rottenMovie) => {
        return imdbMovie.otherDb.id == rottenMovie.movieDb.id;
      });
      sameMovies.forEach((sameMovie) => {
        imdbMovie.duplicates = imdbMovie.duplicates || [];
        imdbMovie.duplicates.push(sameMovie);
        duplicates.push(sameMovie);
        if (!imdbMovie.review && sameMovie.review) {
            // only for displaying purpose, the triples are not stored to the "imdbMovie"
            imdbMovie.review = sameMovie.review;
          }
      });
    });
    
    return movieProjections.filter((movieProjection) => !duplicates.includes(movieProjection));
  }
  
  enrichWithOtherDbMovieId(movieProjections) {
    let imdbMovies = movieProjections.filter((movieProjection) => movieProjection.movieDb.name == "imdb");
    let rottenMovies = movieProjections.filter((movieProjection) => movieProjection.movieDb.name == "rottentomatoes");
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
  
  setMovieDb(movieProjection) {
    let url = Array.isArray(movieProjection.url) ? movieProjection.url[0] : movieProjection.url;
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
    
    movieProjection.movieDb = {
      name: null,
      id: null
    };
    
    for(let regexObj of regexArray) {
      let stripedUrl2 = stripedUrl.replace(regexObj.prefix, '');
      let id = stripedUrl2.match(regexObj.id, '');
      if (id) {
        id = id[0].replace(/\/$/, '');
        movieProjection.movieDb = {
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
    
      rdfa.getBucketListFrom(this.firebase).then(buckets => {
      buckets.forEach(bucket => {
        const option = document.createElement("option");
        option.value = bucket;
        bucketList.appendChild(option);
      });
    });
  }
  
  registerLoadBucketButton() {
    $(this.shadowRoot.querySelector("#select-bucket-button")).on('click', () => {
      let bucket = this.shadowRoot.querySelector("#bucketNameInput").value;
      if (!bucket) {
        bucket = window.prompt("Which bucket do you want to load?");
      }
      if (bucket) {
        this.bucket = bucket;
        this.loadRdfaDataAndFillTable();
      }
    });
  }
}
