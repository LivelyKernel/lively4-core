"enable aexpr";

import RenderContext from 'src/blockchain/view/renderContext.js'
import Wallet from 'src/blockchain/model/wallet/wallet.js'
import InputCollection from 'src/blockchain/model/transaction/transactionInputCollection.js'
import OutputCollection from 'src/blockchain/model/transaction/transactionOutputCollection.js'
import Transaction from 'src/blockchain/model/transaction/transaction.js'
import TransactionsController from 'src/blockchain/control/transactionsController.js';

import Morph from 'src/components/widgets/lively-morph.js';

export default class BlockchainCanvas extends Morph {
  
  async initialize() {
    this.windowTitle = "BlockchainCanvas";
    
    this._canvas = this.shadowRoot.querySelector("#blockchain-canvas");
    this._renderContext = new RenderContext(this._canvas);
    this._controller = new TransactionsController();
    this._layout = this._controller.newNetworkLayout(this._renderContext);
  }
  
  get controller() {
    return this._controller;
  }
  
  draw() {
    this._controller.draw();
  }
  
  _newTransaction() {
    const wallet = new Wallet();
    const inputs = new InputCollection(wallet);
    const outputs = new OutputCollection();
    return new Transaction(wallet, inputs, outputs);
  }
  
  async livelyExample() {
    var transactions = [
      this._newTransaction(),
      this._newTransaction(),
      this._newTransaction()
    ];
    
    this.controller.addTransactions(transactions)
  } 
}