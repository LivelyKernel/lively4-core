import ContextMenu from 'src/client/contextmenu.js';
import Morph from 'src/components/widgets/lively-morph.js';



export default class MovieListing extends Morph {
  
  initialize() {
    
  }
  
  attachedCallback() {
    this.get("#content").innerHTML = ""
    var container = lively.query(this, "lively-container");
    this.createView(container).then(view => {
      this.get("#content").appendChild(view)
    })
  }
  
  get moviesSrc() {
    return this.getAttribute("movies") 
  }
  
  get selectedMoviesSrc() {
    return this.getAttribute("selected") ||  "selected_movies"
  }
  
  async createView(container) {

    this.directory = container.getDir();
    // "cached://" +
    var listSource = await fetch(this.directory + "/" + this.moviesSrc).then(r => r.text())
    this.selectedMoviesURL = this.directory + "/" + this.selectedMoviesSrc

    this.selectedMovies = new Set()
    var selectedMoviesResp = await fetch(this.selectedMoviesURL)
    if (selectedMoviesResp.status == 200) {
      try {
        var selectedMoviesSource = await selectedMoviesResp.text()
        this.selectedMovies = new Set(selectedMoviesSource.split("\n"))
        lively.notify("loaded " + this.selectedMovies.size) 
      } catch(e) {
        lively.error("Error loading selected movies", e)
      }
    } else {
        lively.notify("could not load selected movies")
    }

    var files  = listSource.split("\n").map(ea => {
      try {
        return JSON.parse(ea)
      } catch(e) {
        return null
      }
    }).filter(ea => ea)


    var movies = files
        .filter(ea => ea.imdb)
        .map(ea => ea.imdb)
        .uniq().map(ea => {
          var all =files.filter(file => file.imdb == ea)
          var first = all[0]
          first.files = all
          return first
        })
        .filter(ea => ea.year)

    this.genres = new Map()
    this.collections = new Map()
    
    for(let movie of movies) {
      for(let genre of (movie.genre || "").split(/, /)) {
        let bag = this.genres.get(genre) || []
        bag.push(movie)
        this.genres.set(genre, bag)
      }
      if (movie.filename.match(/\//)) {
        var collection = movie.filename.replace(/\/.*/,"")
      } else {
        collection = "none"
      }
      // #TODO refactor, pull out are there methods to reuse for this?
      // use _.groupBy ?
      let bag = this.collections.get(collection) || []
      bag.push(movie)
      this.collections.set(collection, bag)
    }

  this.serverURL = lively.files.serverURL(this.directory)
          // does only make sense when accessing a localhost server, 
          // otherwise a pdf viewer would be opened on a remote machine?


  this.movieItems = movies.map(movie => {
        var title = <a class="title" click={() => {
            lively.openInspector(movie)
          }}></a>
        title.innerHTML = movie.files[0].title // contains HTML


        if (movie.year == movie.extract_year) {
          var year = <span class="year">({movie.year})</span> 
        } else {
          year = <span class="year conflict">({movie.extract_year})</span> 
        }

        var item =  <div class="movie">
          <div class="poster">
          <img src={this.directory + "_imdb_/posters/" + movie.imdb+ ".jpg"}
            click={() => window.open("https://www.imdb.com/title/" + movie.imdb)}
          ></img>
          </div>
          {title} 
          {year}
          <span class="rating">({movie.rating})</span> 
          <br />
          <span class="genre">{movie.files[0].genre || ""}</span>
          {... movie.files.map(file => {
            var checkbox = <input class="checkbox" type="checkbox"></input>
            if (this.selectedMovies.has(file.filename)) {
              checkbox.checked = true
            }

            checkbox.addEventListener("click", evt => this.selectFile(file, checkbox))

            var fileItem = <div class="file">{checkbox}<a click={() => {
              this.playFile(file)
            }}>{file.filename.replace(/.*\//,"")}</a></div>
            fileItem.addEventListener('contextmenu',  evt => {
              if (!evt.shiftKey) {
                evt.stopPropagation();
                evt.preventDefault();
                var menu = new ContextMenu(fileItem, [
                      ["open", () => this.playFile(file)],
                      [`rename`, () => container.renameFile(this.directory + file.filename, false)],
                    ]);
                menu.openIn(document.body, evt, fileItem);
                return true;
              }

            }, false);

            return fileItem

          })}
        </div>

        item.movie = movie
        return item
      });
    this.currentMovieItems = this.movieItems


    this.pane = <div class="movies">
      {...this.movieItems}
      </div>

    this.currentReverse=true

    this.navbar = container.get("lively-container-navbar")
    this.navbarDetails = this.navbar.get("#details")
    this.navbarDetails.querySelector("ul").innerHTML = "" // #TODO, be nicer to other content?
    
    
    this.createNavbarItem("Filter", 1)    
    
    this.createSelectedMoviesFilter()
    this.createConflictingYearMoviesFilter()
    this.createShowAllMoviesFilter()

    this.createNavbarItem("Genre", 1)
    
    for(let genre of this.genres.keys()) {
      this.createGenreFilter(genre)
    }
    
    
    
    this.createNavbarItem("Collections", 1) 
    for(let collection of Array.from(this.collections.keys()).sort()) {
      this.createCollectionFilter(collection)
    }


    var view = <div>
      <div>
        <button click={() => this.sortByYear()}>by year</button>
        <button click={() => this.sortByRating()}>by rating</button>
        <button click={() => this.deselectAll()}>deselect all</button>
      </div>
      {this.pane}
    </div>
    view.model = this
    return view
  }
  
  
  createNavbarItem(name, level=1) {
    var detailsItem = this.navbar.createDetailsItem(name)
    detailsItem.classList.add("subitem")
    detailsItem.classList.add("level" + level)
    this.navbarDetails.querySelector("ul").appendChild(detailsItem)
    return detailsItem
  }
  
  deselectAll() {
    this.selectedMovies = new Set()
  }
  
  
  playFile(file) {
    var url = this.directory + "/"+ encodeURI(file.filename)
    let playPath = url.replace(this.serverURL,"").replace(/^\//,"")
    var openURL = this.serverURL + "/_open/" + playPath 
    lively.notify("open " + openURL)
    fetch(openURL)
  }

  async selectFile(file, checkbox) {
    if (checkbox.checked) {
      this.selectedMovies.add(file.filename)
    } else {
      this.selectedMovies.delete(file.filename)
    }
    this.saveSelectedMovies()
  }

  async saveSelectedMovies() {
    var newSource = Array.from(this.selectedMovies).sort().join("\n") + "\n"
    await lively.files.saveFile(this.selectedMoviesURL, newSource)
    lively.notify("updated  selected movies")
  }
  
  createGenreFilter(genre) {
    var bag = this.genres.get(genre)
    var detailsItem = this.createNavbarItem(genre + " (" + bag.length+")", 2)
    detailsItem.addEventListener("click", () => this.filterGenre(genre))
  }

  createCollectionFilter(collection) {
    var bag = this.collections.get(collection)
    var detailsItem = this.createNavbarItem(collection + " (" + bag.length+")", 2)
    detailsItem.addEventListener("click", () => this.filterCollection(collection))
  }

  filterCollection(collection) {
    var movies = this.collections.get(collection)
    this.setCurrentMovieItems(this.movieItems
      .sortBy(ea => ea.movie.year)
      .reverse()
      .filter(ea => movies.includes(ea.movie)))
  }
  
  
  filterGenre(genre) {
      this.setCurrentMovieItems(this.movieItems
        .sortBy(ea => ea.movie.year)
        .reverse()
        .filter(ea => ea.movie.genre && ea.movie.genre.match(genre)))
  }

  sortByYear() {
      this.sortBy(ea => ea.movie.year, this.currentReverse)
  }

  sortByRating() {
      this.sortBy(ea => Number(ea.movie.rating) || 0 , this.currentReverse) 
  }
  
  sortBy(func, reverse) {
      this.pane.innerHTML = ""
      let items = this.currentMovieItems.sortBy(func)
      if(reverse) {
        items = items.reverse()
      }
      items.forEach(ea => {
        this.pane.appendChild(ea)
      })
  }
  
  setCurrentMovieItems(items) {
    this.currentMovieItems = items
    this.pane.innerHTML = ""
    this.currentMovieItems.forEach(ea => {
        this.pane.appendChild(ea)
      })
  }

  createSelectedMoviesFilter() {
    var detailsItem = this.createNavbarItem("_selected", 2)
    detailsItem.addEventListener("click", () => this.filterSelected())
  }
  
  filterSelected() {
    this.setCurrentMovieItems(this.movieItems
        .sortBy(ea => ea.movie.year)
        .reverse()
        .filter(ea => {
          return ea.movie.files.find(file => this.selectedMovies.has(file.filename))
    }))
  }
  
  filterConflictingYear() {
    this.setCurrentMovieItems(this.movieItems
      .sortBy(ea => ea.movie.year)
      .reverse()
      .filter(ea => ea.movie.year != ea.movie.extract_year))
  }
  
  showAllMovies() {
    this.setCurrentMovieItems(this.movieItems
      .sortBy(ea => ea.movie.filename)
      .reverse())
  }
  
  createConflictingYearMoviesFilter() {
    var detailsItem = this.createNavbarItem("_conflicting", 2)
    detailsItem.addEventListener("click", () => this.filterConflictingYear())
  }
  
  createShowAllMoviesFilter(){
    var detailsItem = this.createNavbarItem("_all", 2)
    detailsItem.addEventListener("click", () => this.showAllMovies())
  }
}
