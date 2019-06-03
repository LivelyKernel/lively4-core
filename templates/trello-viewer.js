import Morph from 'src/components/widgets/lively-morph.js';
import focalStorage from 'src/external/focalStorage.js';

'<script src="https://api.trello.com/1/client.js?key=848c2ecf80b7f5f4d955e782f10871c9"></script>';

export default class TrelloViewer extends Morph {
  static get DEVELOPER_KEY_FOCAL_STORAGE() { return "TrelloDeveloperKey"; }
  get organizationList() { return this.get('#organizations'); }
  get boardList() { return this.get('#boards'); }
  get listList() { return this.get('#lists'); }
  get cardList() { return this.get('#cards'); }
  
  async initialize() {
    this.windowTitle = "TrelloViewer";
    
    this.get('button').addEventListener('click', e => this.init(e));
  }
  async init(e) {
    var key = await focalStorage.getItem(TrelloViewer.DEVELOPER_KEY_FOCAL_STORAGE);
    if (!key) {
      key = await lively.prompt("Insert your <a target='_blank' href='https://trello.com/app-key'>Trello Developer Key</a>", "");
      focalStorage.setItem(TrelloViewer.DEVELOPER_KEY_FOCAL_STORAGE, key);
    }

    await lively.loadJavaScriptThroughDOM("Trello_script", `https://api.trello.com/1/client.js?key=${key}`);
    
    await new Promise((resolve, reject) => {
      localStorage.removeItem('trello_token');
      const opts = {
        type: 'popup',
        name: 'Trello Sandbox',
        interactive: true,
        scope: { read: true, write: true, account: false },
        expiration: '1day',
        persist: true,
        success: resolve,
        error: reject,
      };
      Trello.authorize(opts);
    });
    lively.notify('Successful Trello Authentification!', 'Have fun with your boards, lists, and cards', undefined, undefined, 'green');
    await this.loadOrganizations();
  }
  
  getRequest(...params) {
    return new Promise((resolve, reject) => Trello.get(...params, resolve, reject));
  }
  async loadOrganizations() {
    //this.getRequest('member/me?fields=all');
    this.organizationList.innerHTML = '';
    let organizations = await this.getRequest('member/me/organizations?fields=all');
    organizations.forEach(org => {
      this.organizationList.appendChild(<li click={e => {
        this.loadBoards(org.id);
      }}><a>{org.displayName}</a></li>);
    });
    if(organizations[0]) {
      this.loadBoards(organizations[0].id);
    }
  }
  async loadBoards(organizationId) {
    this.boardList.innerHTML = '';
    let boards = await this.getRequest(`organizations/${organizationId}/boards?fields=all`);
    boards.forEach(board => {
      // #TODO: 'boards/53da8c65c30fb964fe268467/cards?fields=all'
      this.boardList.appendChild(<li click={e => {
        this.loadLists(board.id);
      }}><a>{board.name}</a></li>);
    });
    if(boards[0]) {
      this.loadLists(boards[0].id);
    }
  }
  async loadLists(boardId) {
    this.listList.innerHTML = '';
    let lists = await this.getRequest(`boards/${boardId}/lists?fields=all`);
    lists.forEach(list => {
      // #TODO: 'lists/53da8c65c30fb964fe268467/cards?fields=all'
      this.listList.appendChild(<li click={e => {
        this.loadCards(list.id);
      }}><a>{list.name}</a></li>);
    });
    if(lists[0]) {
      this.loadCards(lists[0].id);
    }
  }
  async loadCards(listId) {
    this.cardList.innerHTML = '';
    let cards = await this.getRequest(`lists/${listId}/cards?fields=all`);
    cards.forEach(card => {
      this.cardList.appendChild(<li click={e => {
        this.get('#editor').value = JSON.stringify(card, null, 2);
      }}><a>{card.name}</a></li>);
    });
    if(cards[0]) {
      this.get('#editor').value = JSON.stringify(cards[0], null, 2);
    }
  }
  async execute(e) {
    this.get('#editor').setDoitContext(this);
    this.get('#editor').boundEval();
    lively.notify('sent request');
  }
}

function playground() {
  Trello.authorize({
    type: 'popup',
    name: 'Trello Sandbox',
    interactive: true,
    scope: { read: true, write: true, account: false },
    expiration: '1day',
    persist: true,
    success: () => {
      lively.notify("success");
      resolve();
    },
    error: () => {
      lively.notify("error");
      reject();
    },
  });
  Trello.authorized()
  that.get('#editor').boundEval()

    function makeProm(func, ...params) {
    return new Promise((resolve, reject) => {
      func(...params, resolve, reject);
    });
  }

  makeProm(Trello.get.bind(Trello), 'member/me?fields=all')
  makeProm(Trello.get.bind(Trello), 'boards/53da8c65c30fb964fe268467/cards?fields=all')
  makeProm(Trello.get.bind(Trello), 'boards/53da8c65c30fb964fe268467/lists?fields=all')
  makeProm(Trello.get.bind(Trello), 'lists/53da8c65c30fb964fe268469/cards?fields=all')
  makeProm(Trello.get.bind(Trello), 'cards/53da8c65c30fb964fe268470?fields=all')
  makeProm(Trello.get.bind(Trello), 'member/me/organizations?fields=all')
  makeProm(Trello.get.bind(Trello), 'organizations/546effef22c3faabe7b68657/boards?fields=all')
}