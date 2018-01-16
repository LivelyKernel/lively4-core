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
    this.get('#execute').addEventListener('click', e => this.execute(e));
    this.get('#editor').value = `function asyncOutput(output) {
  console.log(JSON.stringify(output));
  $morph("output").innerHTML = JSON.stringify(output, null, 2);
}
var success = function(successMsg) { asyncOutput(successMsg); };
var error = function(errorMsg) { asyncOutput(errorMsg); };
return Trello.get('/boards/Q21U0eYi/lists', success, error);
`;
  }
  async init(e) {
    var key = await focalStorage.getItem(TrelloViewer.DEVELOPER_KEY_FOCAL_STORAGE);
    if (!key) {
      key = await lively.prompt("Insert your <a target='_blank' href='https://trello.com/app-key'>Trello Developer Key</a>", "");
      focalStorage.setItem(TrelloViewer.DEVELOPER_KEY_FOCAL_STORAGE, key);
    }

    await lively.loadJavaScriptThroughDOM("Trello", `https://api.trello.com/1/client.js?key=${key}`);
    
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
  }
  async loadBoards(organizationId) {
    this.boardList.innerHTML = '';
    let boards = await this.getRequest(`organizations/${organizationId}/boards?fields=all`);
    boards.forEach(board => {
      // #TODO: 'boards/53da8c65c30fb964fe268467/cards?fields=all'
      this.boardList.appendChild(<li><a>{board.name}</a></li>);
    });
  }
  async execute(e) {
    this.get('#editor').setDoitContext(this);
    this.get('#editor').boundEval();
    lively.notify('sent request');
  }
}