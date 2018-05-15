"enable aexpr";

import RenderContext from 'src/blockchain/view/renderContext.js'
import TransactionNode from 'src/blockchain/view/transaction/transactionNode.js';
import Wallet from 'src/blockchain/model/wallet/wallet.js'
import InputCollection from 'src/blockchain/model/transaction/transactionInputCollection.js'
import OutputCollection from 'src/blockchain/model/transaction/transactionOutputCollection.js'
import Transaction from 'src/blockchain/model/transaction/transaction.js'

import Morph from 'src/components/widgets/lively-morph.js';

export default class BlockchainCanvas extends Morph {
  async initialize() {
    this.windowTitle = "BlockchainCanvas";
    
    this._canvas = this.shadowRoot.querySelector("#blockchain-canvas");
    this._renderContext = new RenderContext(this._canvas);
    this._transactionNode = new TransactionNode();
  }
  
  set transaction(transaction) {
    this._transactionNode.transaction = transaction;
    this.draw();
  }
  
  draw() {
    this._renderContext.startFrame();
    
    this._transactionNode.draw(this._renderContext);
    
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