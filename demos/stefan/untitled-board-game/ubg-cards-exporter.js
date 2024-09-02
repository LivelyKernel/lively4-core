/* global globalThis */
"disable deepeval"

import moment from "src/external/moment.js";

// #TODO: remove duplication
const POKER_CARD_SIZE_INCHES = lively.pt(2.5, 3.5);
const POKER_CARD_SIZE_MM = POKER_CARD_SIZE_INCHES.scaleBy(25.4);

export default class CardExporter {

  /*MD ## Helper MD*/
  static async printWithSavedWorld(fn) {
    const oldBody = window.oldBody = Array.from(document.body.childNodes)
    const bodyCSS = document.body.style.cssText
    const title = document.title
    
    try {
      await Promise.race([fn(), lively.sleep(5 * 60 * 1000)])

      document.querySelectorAll('lively-notification-list').forEach(list => list.remove())
      const mutationIndicator = document.querySelector('#mutationIndicator')
      if (mutationIndicator) {
        mutationIndicator.remove()
      }
      document.title = `cards-${moment().format('YYYY-MM-DD-HH-mm-ss')}`
      
      await lively.sleep(1000)
      window.print()
      await lively.sleep(1000)
      return 
    } finally {
      document.body.innerHTML = ""
      document.body.style = bodyCSS
      document.body.append(...oldBody)
      document.title = title
    }
  }

  /*MD ## Layout & Rendering MD*/
  static async execute(cardsToPrint, ubgCards, skipCardBack) {
    this.printWithSavedWorld(async () => {
      const body = document.body
      body.innerHTML = ''
      // body.style = ""
    
      await this.buildCards(undefined, cardsToPrint, skipCardBack, ubgCards)
    })
  }

  static addGridPage() {
    const grid = <div class='grid'></div>;
    document.body.append(<div class='page'><div class='grid-wrapper'>{grid}</div></div>);
    return grid;
  }

  static placeHolder() {
      return <div style={`
display: flex;
justify-content: center;
align-items: center;

width: ${POKER_CARD_SIZE_INCHES.x}in;
height: ${POKER_CARD_SIZE_INCHES.y}in;

box-shadow: inset 0px 0px 0px 2px black;
`}>placeholder</div>
  }

  
  static createCardPreview(card, ubgCards) {
    const cardPreview = document.createElement('ubg-card')
    cardPreview.setCard(card)
    cardPreview.setCards(ubgCards.cards)
    cardPreview.setSrc(ubgCards.src)
    return cardPreview
  }

  static async cardBack(card, ubgCards) {
    const cardPreview = this.createCardPreview(card, ubgCards)
    await cardPreview.renderCardBack()
    return cardPreview
  }

  static async renderCard(card, ubgCards) {
    const cardPreview = this.createCardPreview(card, ubgCards)
    await cardPreview.render()
    return cardPreview
  }

  static async buildCards(doc, cardsToPrint, skipCardBack, ubgCards) {
    const GAP = lively.pt(.2, .2);
    const A4_WIDTH = 210
    const A4_HEIGHT = 297

    const rowsPerPage = Math.max(((A4_HEIGHT + GAP.y) / (POKER_CARD_SIZE_MM.y + GAP.y)).floor(), 1);
    const cardsPerRow = Math.max(((A4_WIDTH + GAP.x) / (POKER_CARD_SIZE_MM.x + GAP.x)).floor(), 1);
    const cardsPerPage = rowsPerPage * cardsPerRow;

    this.prepareGridSizes(cardsPerRow)

    let currentPage = 0;
    while (cardsToPrint.length > cardsPerPage * currentPage) {
      const frontGrid = this.addGridPage()

      let backGrid
      if (!skipCardBack) {
        backGrid = this.addGridPage()
      }

      for(let rowIndex = 0; rowIndex < rowsPerPage; rowIndex++) {
        for(let cIndex = 0; cIndex < cardsPerRow; cIndex++) {
          const card = cardsToPrint[cIndex + rowIndex * cardsPerRow + currentPage * cardsPerPage];
          if (card) {
            frontGrid.append(await this.renderCard(card, ubgCards))
          } else {
            frontGrid.append(this.placeHolder())
          }
          
          if (!skipCardBack) {
            const cardBack = cardsToPrint[cardsPerRow - cIndex - 1 + rowIndex * cardsPerRow + currentPage * cardsPerPage];
            if (cardBack) {
              backGrid.append(await this.cardBack(cardBack, ubgCards))
            } else {
              backGrid.append(this.placeHolder())
            }
          }
        }
      }

      currentPage++;
    }
  }
  
  static prepareGridSizes(cardsPerRow) {
    const style = <style></style>;
    style.textContent = `
@page { 
size: A4 portrait;
margin: 0;
}

.page {
page-break-before: always;

<!-- outline: orange solid 10px; -->

width: 100vw;
height: 100vh;
}

.grid-wrapper {
display: grid;
place-items: center;
height: 100vh;
}

.grid {
<!-- outline: green solid 30px; -->
z-index: 100;
display: grid;
gap: .2mm;
grid-template-columns: repeat(${cardsPerRow}, ${POKER_CARD_SIZE_INCHES.x}in);
width: min-content;
}
`;
    document.body.append(style);
  }

}

globalThis.__ubg_html_to_pdf_exporter__ = CardExporter
