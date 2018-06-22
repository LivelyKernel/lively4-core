import Morph from 'src/components/widgets/lively-morph.js';
import Strings from 'src/client/strings.js'
import _ from 'src/external/underscore.js'
import {getDeepProperty} from "utils"
import {pt} from "src/client/graphics.js"
import html from 'src/client/html.js'


export default class PlexMedia extends Morph {

  async initialize() {
    html.registerAttributeObservers(this);
    this.get("#controls audio").addEventListener('ended',() => this.onAudioEnded())
    this.render()
  }
  
  // #TODO generate this?
  get src() {
    return this.getAttribute("src")
  }
  set src(value) {
    return this.setAttribute("src", value)
  }

  onSrcChanged() {
    this.render()
  }

  async fetchJSON(url) {
    try {
      return fetch(url, {
        method: "GET",
        headers: {
          "content-type": "application/json"
        }
      }).then(r => r.json())
    } catch(e) {
      this.get("#media").innerHTML = "Error: " + e
      return false
    }
  }
  
  async render() {
    if (!this.src || this.src == "") return;
    lively.notify("render")
    var media = await this.fetchJSON(this.src)  
    if (!media) return
    this.media = media
    
    var mediaElement = this.get("#media");
    if (media.children) {
      media.children.forEach(ea => {
        var dirElement = <a class={"directory " + ea.type} href={"plex:/" + ea.key.replace(/\/children$/,"/")} 
            click={() => {event.preventDefault(); this.showDetails(dirElement, ea)}}>
            {
              !ea.thumb ? "" :
                <img class="thumb" src={lively.swxURL("plex:/" + ea.thumb)}></img>
            } <br />
            <span class="title"><b>{ea.parentTitle}</b><br />{ea.title}</span>
          </a>
        dirElement.media = ea
        dirElement.setAttribute("data-url", "plex:/" + ea.key)
        mediaElement.appendChild(dirElement)    
      })      
      var detailsURL = this.getAttribute("details")
      if (detailsURL || media.children.length == 1) {
        if (!detailsURL) {
          detailsURL = "plex:/" + media.children[0].key
          var removeDir = true;
        }
        var dir = mediaElement.querySelector(`[data-url="${detailsURL}"]`)
        if (dir) {
          await this.showDetails(dir, dir.media)
          if (removeDir) {
            // if there is only one element, just schow the details
            dir.remove()
          }
        }
      }
    }
    // special container full extent #TODO, how to handle the generally?
    var containerContent = this.parentElement && this.parentElement.get("#container-content")
    if (containerContent) {
      lively.setPosition(this, pt(0,0))
      lively.setExtent(this, lively.getExtent(this.parentElement.get("#container-content")))
    }
  }
  
  elementsInMyLine(elementInLine, container) {
    var pos = lively.getGlobalPosition(elementInLine)
    return Array.from(container.childNodes).filter(ea => {
      var eaPos = lively.getGlobalPosition(ea)
      return Math.abs(pos.y - eaPos.y) < 2
    })
  }
  
  onAudioEnded() {
    this.playNextTrack()
  }
  
  playNextTrack() {
    if (!this.nextTracks) {
      return
    }
    var nextTrack = this.nextTracks.shift()
    if (nextTrack) {
       this.play(nextTrack) 
    }    
  }
  
  playTracks(tracks) {
    this.nextTracks = tracks;
    this.playNextTrack()
  }
  
  play(track) {
    var audio = this.get("audio")
    var media = track.media
    var src = lively.swxURL("plex:/" + getDeepProperty(media, "media.0.part.0.key"))
    this.get("#track-info").innerHTML = media.title
    audio.pause()
    audio.src = src
    
    
    // audio.innerHTML = `<source src="${src}" type="audio/mpeg" />`
    audio.play()
  }

  select(track) {
    if (this.currentTrack) {
      this.currentTrack.classList.remove("selected")
    }
    track.classList.add("selected")
    this.currentTrack = track
  }

  titleOf(media) {
    if (media.originalTitle) {
      return <span><b>{media.originalTitle}</b> &mdash; {media.title}</span>
    } else {
      return <span>{media.title}</span>
    }
  }
  
  async showDetails(element) {
    var media = element.media
    lively.notify("details")
    var lastElementInLine = _.last(this.elementsInMyLine(element, element.parentElement))

    var url = "plex:/" + media.key
    if (this.details && this.detailsURL == url) {
      this.details.remove();
      this.details = null;
      return; // toggle details 
    }
    
    this.detailsURL = url
    this.setAttribute("details", this.detailsURL)
    var detailMedia = await this.fetchJSON(this.detailsURL)  
    if (!detailMedia) return

    this.detailMedia = detailMedia
    if (this.details) this.details.remove();
    this.details = <div class="details">
        <a href={url.replace(/\/children/,"/")} click={() => event.preventDefault()} >
          <img class="thumb" src={lively.swxURL("plex:/" + detailMedia.thumb)}></img>
        </a>
        <div class="title">{media.title}</div>
        <div class="parentTitle">{media.parentTitle}{media.year ? " (" + media.year +")"  : ""}</div>
        <table class="tracks">
        {...(detailMedia.children.map(ea => {
            let track = <tr class="track">
                  <td>{(ea.index !== undefined ? ea.index + ". " : "")}</td>
                  <td>{this.titleOf(ea)}</td>
            </tr>
            track.media = ea
            track.addEventListener("dblclick", () => {
              var tracks = Array.from(track.parentElement.querySelectorAll(".track"))
              tracks = tracks.filter(ea => tracks.indexOf(ea) >= tracks.indexOf(track)) // rest of album
              this.playTracks(tracks) 
            })
            track.addEventListener("click", () => {
              this.select(track)       
            })
            return track
        }))}
        </table>
      </div>
    element.parentElement.insertBefore(this.details, lastElementInLine.nextSibling); // insert after
  }
  
  livelyInspect(contentNode, inspector) {
     if (this.media) {
      contentNode.appendChild(inspector.display(this.media, false, "#media", this));
    }
     if (this.detailMedia) {
      contentNode.appendChild(inspector.display(this.detailMedia, false, "#detailMedia", this));
    }
  }
  
  async livelyExample() {
    // plex://library/sections/2/genre/48422/
    // plex://library/sections/3/year/2000/
    // plex://library/sections/2/decade/2000/
    this.setAttribute("src", "plex://library/sections/3/decade/1980/")
  }
  
  
  
}