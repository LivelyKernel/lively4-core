import Morph from 'src/components/widgets/lively-morph.js';

import OpenAI from "demos/openai/openai.js"

import { querySelectorDeep } from 'src/external/querySelectorDeep/querySelectorDeep.js';

// const scanner = that;
// const editor = that;

import Fuse from 'src/external/fuse.js';

async function cardNamesFromFoto(url) {
  let prompt =  {
    "model": "gpt-4o", 
    "max_tokens": 256,
    "temperature": 1,
    "top_p": 1,
    "n": 1,
    "stream": false,
    // "stop": "VANILLA",
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "messages": [
      { "role": "system", "content": `You are a special-purpose recognition software that recognizes card from an upcoming trading card game in fotos. Cards have their name in the top, however, cards may have rotated or be skewed in the foto.

Given a foto, only answer with the list of names you detected. Print only one name each line.` },
      { "role": "user", "content":  [
        {
          "type": "image_url",
          "image_url": {
            "url": url,
            "detail": "low" // high
          }
        }
      ]}
    ]
  }

  let json = await OpenAI.openAIRequest(prompt).then(r => r.json())
  return json.choices[0].message.content
}

export default class UbgCardsScanner extends Morph {
  
  get video() { return this.get('#videoInput'); }
  get canvas() { return this.get('#output'); }
  get log() { return this.get('#log'); }
  get list() { return this.get('#list'); }
  
  async initialize() {
    this.windowTitle = "UbgCardsScanner";
    this.registerButtons()
    lively.html.registerKeys(this);
    
    this.itemsToCardNames = new Map();
    this.items = this.items || (this.hasAttribute('cardNames') ? this.getJSONAttribute('cardNames') : []);
    this.renderNewItems(this.items)
    this.applyToUBGCards()

    this.init()
  }
  
  async init() {
    await this.captureVideo()

    this.video.addEventListener('click', async evt => {
      this.takeSnapshot()
    })

    const stopOnDetach = () => {
      if(!lively.allParents(lively.query(this, '*'), [], true).includes(document.body)) {
        this.stopVideo()
        lively.warn('BREAK')
      } else {
        // lively.success('CONTINUE')
        requestAnimationFrame(stopOnDetach);
      }
    }
    requestAnimationFrame(stopOnDetach);
  }
  
  async takeSnapshot() {
    if (this.takingSnapshot) {
      lively.warn('already taking a snapshot')
      return
    }
    
    this.takingSnapshot = true
    try {
      if (this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
        lively.error('HAVE NOT ENOUGH DATA')
        return
      }
      
      this.videoFrameToCanvas()
      
      this.stopVideo()
      
      await this.askOpenAI()
      
      this.captureVideo()
    } finally {
      this.takingSnapshot = false
    }
  }
  
  async askOpenAI() {
    const dataURL = this.canvas.toDataURL('image/png');
    const nameString = await cardNamesFromFoto(dataURL)
    this.log.innerText = nameString
    this.mergeResults(nameString.split('\n'))
  }

  mergeResults(newItems) {
    const [old, both, _new] = this.items.computeDiff(newItems);
    // lively.notify([old.length, both.length, _new.length])
    this.items.push(..._new)
    this.renderNewItems(_new)
    this.highlightScannedItems(newItems)
    this.applyToUBGCards()
  }
  
  highlightScannedItems(scanned) {
    [...this.list.children].forEach(element => {
      if (scanned.includes(element.getAttribute('cardName'))) {
        element.animate([
          { transform: 'translate(1px, 1px) rotate(0deg)' }, 
          { transform: 'translate(-1px, -2px) rotate(-1deg)' }, 
          { transform: 'translate(-3px, 0px) rotate(1deg)' }, 
          { transform: 'translate(3px, 2px) rotate(0deg)' }, 
          { transform: 'translate(1px, -1px) rotate(1deg)' }, 
          {
            transform: 'translate(-1px, 2px) rotate(-1deg)',
            color: 'green'
          }, 
          { transform: 'translate(-3px, 1px) rotate(0deg)' }, 
          { transform: 'translate(3px, 1px) rotate(-1deg)' }, 
          { transform: 'translate(-1px, -1px) rotate(1deg)' }, 
          { transform: 'translate(1px, 2px) rotate(0deg)' }, 
          { transform: 'translate(1px, -2px) rotate(-1deg)' }
        ], {
          // timing options
          duration: 500,
          iterations: 1
          // easing: 'cubic-bezier(0.42, 0, 0.58, 1)'
        });
      }
    })
  }
  
  applyToUBGCards() {
    const ubgCards = querySelectorDeep('ubg-cards')
    if (!ubgCards) {
      lively.warn('no ubg-cards found')
      return
    }
    
    const names = this.items
      .filter(item => this.itemsToCardNames.has(item))
      .map(item => '`' + this.itemsToCardNames.get(item) + '`')

    ubgCards.filter.value = `> [${names.join(', ')}].includes(c.getName())`
    ubgCards.filterChanged()
  }
  
  renderNewItems(newItems) {
    const ubgCards = querySelectorDeep('ubg-cards')
    const list = ubgCards ? ubgCards.cards.map(card => ({
      id: card.getId(),
      name: card.getName(),
    })) : []

    const fuseOptions = {
      // isCaseSensitive: false,
      // includeScore: false,
      // shouldSort: true,
      // includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      threshold: 0.5,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      keys: [
        "name"
      ]
    };
    const fuse = new Fuse(list, fuseOptions);

    this.list.append(...newItems.map(name => {
      let displayName = name
      let color = 'gray'
      if (ubgCards) {
        const exactMatch = ubgCards.cards.find(card => card.getName() === name)
        if (exactMatch) {
          color = 'green'
          this.itemsToCardNames.set(name, name)
        } else {
          const match = fuse.search(name).first
          if (match) {
            displayName += ' -> ' + match.item.name
            color = 'yellow'
            this.itemsToCardNames.set(name, match.item.name)
          } else {
            color = 'red'
          }
        }
      }

      return <li cardName={name} style={`color: ${color};`}>{displayName}</li>
    }))
  }
  
  async captureVideo() {
    const videoAccess = navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          ideal: "environment"
        }
      },
      audio: false
    })
      .then((s) => {
      this.stream = s
      this.video.srcObject = s;
      this.video.play();
    })
      .catch(function(err) {
      lively.error("An error occurred! " + err);
    });
    await videoAccess.then(() => lively.sleep(1000))
  }
  
  videoFrameToCanvas() {
    const canvas = this.canvas;
    const context = canvas.getContext('2d');

    canvas.height = this.video.videoHeight;
    canvas.width = this.video.videoWidth;
    context.drawImage(this.video, 0, 0, canvas.width, canvas.height);
  }

  /*MD ## Buttons MD*/
  onKeyDown(evt) {
    if (evt.repeat) {
      return
    }
    
    this.takeSnapshot()
  }
  
  onStartButton() {
    this.captureVideo()
  }
  
  onStopButton() {
    this.stopVideo()
  }

  onTransferButton() {
    this.applyToUBGCards()
  }

  onClearButton() {
    this.items = []
    this.itemsToCardNames = new Map();
    this.list.innerHTML = ''
  }
  
  stopVideo() {
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
      this.stream = null;
    }
    
    this.video.pause()
    this.video.srcObject = null;
  };

  /* Lively-specific API */

  livelyPrepareSave() {
    this.getJSONAttribute('cardNames', this.items) 
  }
  
  livelyPreMigrate() {
    this.stopVideo()
  }
  
  livelyMigrate(other) {
    this.items = other.items
  }

  async livelyExample() {
  }
  
}