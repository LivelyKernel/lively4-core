import Morph from 'src/components/widgets/lively-morph.js';
import focalStorage from 'src/external/focalStorage.js';

'<script src="https://api.trello.com/1/client.js?key=848c2ecf80b7f5f4d955e782f10871c9"></script>';

export default class TrelloViewer extends Morph {
  async initialize() {
    this.windowTitle = "TrelloViewer";
    
    this.get('#execute').addEventListener('click', e => this.execute(e));
    this.get('#editor').value = `function asyncOutput(output) {
  console.log(JSON.stringify(output));
  $morph("output").innerHTML = JSON.stringify(output, null, 2);
}

var success = function(successMsg) {
  asyncOutput(successMsg);
};

var error = function(errorMsg) {
  asyncOutput(errorMsg);
};

return Trello.get('/boards/Q21U0eYi/lists', success, error);
`;
  }
  
  async execute(e) {
    const trelloKey = "TrelloDeveloperKey";
    
    var key = await focalStorage.getItem(trelloKey);
    lively.notify('get key', key);
    if (!key) {
      lively.notify('get new key');
      key = await lively.prompt("Insert your 222<a target='_blank' href='https://trello.com/app-key'>Trello Developer Key</a>", "");
      focalStorage.setItem(trelloKey, key);
    } else {
      lively.notify('found key', key);
    }

    await lively.loadJavaScriptThroughDOM("Trello", `https://api.trello.com/1/client.js?key=${key}`);
    
    lively.notify('found trello', Trello);

    await new Promise((resolve, reject) => {
      localStorage.removeItem('trello_token');
      const opts = {
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
      };
      lively.notify('before auth');
      Trello.authorize(opts);
      lively.notify('after auth');
    });

    lively.notify('conclude auth');

    this.get('#editor').boundEval();
    lively.notify('sent request');
  }
}