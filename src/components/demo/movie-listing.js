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
  
  async createView(container) {

    var dir = container.getDir()
    // "cached://" +
    var listSource = await fetch( dir + "/movies.jsonl").then(r => r.text())
    var selectedMoviesURL = dir + "/selected_movies"

    this.selectedMovies = new Set()
    var selectedMoviesResp = await fetch(selectedMoviesURL)
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

    var genres = new Map()
    for(let movie of movies) {
      for(let genre of (movie.genre || "").split(/, /)) {
        var bag = genres.get(genre) || []
        bag.push(movie)
        genres.set(genre, bag)
      }
    }

    let serverURL = lively.files.serverURL(dir)
          // does only make sense when accessing a localhost server, 
          // otherwise a pdf viewer would be opened on a remote machine?

    var style = document.createElement("style")
    style.textContent = `
      


    `
    let playFile = (file) => {
      var url = dir + "/"+ encodeURI(file.filename)
      let playPath = url.replace(serverURL,"").replace(/^\//,"")
      var openURL = serverURL + "/_open/" + playPath 
      lively.notify("open " + openURL)
      fetch(openURL)
    }

    let selectFile = async (file, checkbox) => {
      if (checkbox.checked) {
        this.selectedMovies.add(file.filename)
      } else {
        this.selectedMovies.delete(file.filename)
      }
      saveSelectedMovies()
    }

    let saveSelectedMovies = async () => {
      var newSource = Array.from(this.selectedMovies).sort().join("\n") + "\n"
      await lively.files.saveFile(selectedMoviesURL, newSource)
      lively.notify("updated  selected movies")
    }


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
          <img src={dir + "_imdb_/posters/" + movie.imdb+ ".jpg"}
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

            checkbox.addEventListener("click", evt => selectFile(file, checkbox))

            var fileItem = <div class="file">{checkbox}<a click={() => {
              playFile(file)
            }}>{file.filename.replace(/.*\//,"")}</a></div>
            fileItem.addEventListener('contextmenu',  evt => {
              if (!evt.shiftKey) {
                evt.stopPropagation();
                evt.preventDefault();
                var menu = new ContextMenu(fileItem, [
                      ["open", () => playFile(file)],
                      [`rename`, () => container.renameFile(dir + file.filename, false)],
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


    let sortBy = (func, reverse) => {
        this.pane.innerHTML = ""
        let items = this.currentMovieItems.sortBy(func)
        if(reverse) {
          items = items.reverse()
        }
        items.forEach(ea => {
          this.pane.appendChild(ea)
        })
    }
    let currentReverse=true

    let sortByYear = () => {
        sortBy(ea => ea.movie.year, currentReverse)
    }

    let sortByRating = () => {
        sortBy(ea => Number(ea.movie.rating) || 0 , currentReverse) 

    }

    let filterGenre = (genre) => {
        this.setCurrentMovieItems(this.movieItems
          .sortBy(ea => ea.movie.year)
          .reverse()
          .filter(ea => ea.movie.genre && ea.movie.genre.match(genre)))
    }



    this.navbar = container.get("lively-container-navbar")
    this.navbarDetails = this.navbar.get("#details")

    let createGenreFilter = (genre) => {
      var bag = genres.get(genre)

      var detailsItem = this.navbar.createDetailsItem(genre + " (" + bag.length+")")
      detailsItem.classList.add("subitem")
      detailsItem.classList.add("level2")
      this.navbarDetails.querySelector("ul").appendChild(detailsItem)
      detailsItem.addEventListener("click", () => filterGenre(genre))
    }





    this.createSelectedMoviesFilter()
    this.createConflictingYearMoviesFilter()

    for(let genre of genres.keys()) {
      createGenreFilter(genre)
    }


    var view = <div>
      {style}
      <div>
        <button click={() => sortByYear()}>by year</button>
        <button click={() => sortByRating()}>by rating</button>
        <button click={() => this.deselectAll()}>deselect all</button>
      </div>
      {this.pane}
    </div>
    view.model = this
    return view
  }
  
  deselectAll() {
    this.selectedMovies = new Set()
  }
  
  setCurrentMovieItems(items) {
    this.currentMovieItems = items
    this.pane.innerHTML = ""
    this.currentMovieItems.forEach(ea => {
        this.pane.appendChild(ea)
      })
  }

  createSelectedMoviesFilter() {
    var detailsItem = this.navbar.createDetailsItem("_selected")
    detailsItem.classList.add("subitem")
    detailsItem.classList.add("level2")
    this.navbarDetails.querySelector("ul").appendChild(detailsItem)
    detailsItem.addEventListener("click", () => this.filterSelected())
  }
  
  filterSelected() {
    this.setCurrentMovieItems(this.movieItems
        .sortBy(ea => ea.movie.year)
        .reverse()
        .filter(ea => this.selectedMovies.has(ea.movie.filename)))
  }
  
  filterConflictingYear() {
    this.setCurrentMovieItems(this.movieItems
      .sortBy(ea => ea.movie.year)
      .reverse()
      .filter(ea => ea.movie.year != ea.movie.extract_year))
  }
  
  createConflictingYearMoviesFilter(){
    var detailsItem = this.navbar.createDetailsItem("_conflicting")
    detailsItem.classList.add("subitem")
    detailsItem.classList.add("level2")
    this.navbarDetails.querySelector("ul").appendChild(detailsItem)
    detailsItem.addEventListener("click", () => this.filterConflictingYear())
  }
}
