"enable aexpr";

import RenderContext from 'src/blockchain/view/renderContext.js'
import TransactionView from 'src/blockchain/view/transaction/transactionView.js'
import Wallet from 'src/blockchain/wallet/wallet.js'
import InputCollection from 'src/blockchain/transaction/transactionInputCollection.js'
import OutputCollection from 'src/blockchain/transaction/transactionOutputCollection.js'
import Transaction from 'src/blockchain/transaction/transaction.js'

import Morph from 'src/components/widgets/lively-morph.js';

export default class BlockchainCanvas extends Morph {
  async initialize() {
    this.windowTitle = "BlockchainCanvas";
    
    this._canvas = this.shadowRoot.querySelector("#blockchain-canvas");
    this._renderContext = new RenderContext(this._canvas);
    this._transactionView = new TransactionView(this._renderContext);
  }
  
  set transaction(transaction) {
    this._transactionView.transaction = transaction;
    this.draw();
  }
  
  draw() {
    this._renderContext.startFrame();
    
    this._transactionView.draw();
    
    this._renderContext.endFrame();
  }
  
  async livelyExample() {
    var wallet = new Wallet();
    var inputs = new InputCollection(wallet);
    var outputs = new OutputCollection();
    var transaction = new Transaction(wallet, inputs, outputs);
    this.transaction = transaction;
  } 
}