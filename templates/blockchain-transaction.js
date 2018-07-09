"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Wallet from 'src/blockchain/model/wallet/wallet.js';
import Transaction from 'src/blockchain/model/transaction/transaction.js';
import TransactionInputCollection from 'src/blockchain/model/transaction/transactionInputCollection.js';
import TransactionOutputCollection from 'src/blockchain/model/transaction/transactionOutputCollection.js';

export default class BlockchainTransaction extends Morph {
  
  async initialize() {
    this.windowTitle = "BlockchainTransactionView";
    this._transaction = null;
  }
  
  set transaction(transaction) {
    this._transaction = transaction;
    this.update();
  }
  
  get transaction() {
    return this._transaction
  }

  async update() {
    if(!this._transaction) {
      return
    }
    this.shadowRoot.querySelector('#hash').innerHTML = this._transaction.displayName;
    this.shadowRoot.querySelector('#sender span').innerHTML = "#" + this._transaction.senderHash.substring(0, 10);
    this.shadowRoot.querySelector('#timestamp span').innerHTML = new Date(this._transaction.timestamp).toISOString();
    this.shadowRoot.querySelector('#inputValue span').innerHTML = "µ" + this._transaction.inputValue;
    this.shadowRoot.querySelector('#outputValue span').innerHTML = "µ" + this._transaction.outputValue;
    this.shadowRoot.querySelector('#fees span').innerHTML = "µ" + this._transaction.fees;
    if(this._transaction.isSigned()) {
      this.shadowRoot.querySelector('#publicKey span').innerHTML = "signed";
    } else {
      this.shadowRoot.querySelector('#publicKey span').innerHTML = "not signed";
    }
    this._createInputList();
    this._createOutputList();
  }
  
  _createInputList() {
    const inputList = this.shadowRoot.querySelector('#input-list');
    this.transaction.inputs.forEach(input => {
      const transactionInputWrapper = document.createElement('div');
      transactionInputWrapper.innerHTML = '<i class="fa fa-sign-in" aria-hidden="true"></i> ' + input.transactionDisplayName + ' <span class="color-red">µ' + input.value + '</span>';
      inputList.appendChild(transactionInputWrapper);
    });
  }
  
  _createOutputList() {
    const outputList = this.shadowRoot.querySelector('#output-list');
    this.transaction.outputs.forEach(output => {
      const transactionInputWrapper = document.createElement('div');
      transactionInputWrapper.innerHTML = '<i class="fa fa-sign-out" aria-hidden="true"></i>' + output.receiverDisplayName + ' <span class="color-green">µ' + output.value + '</span>';
      outputList.appendChild(transactionInputWrapper);
    });
  }
  
  _createNewTransaction() {
    const sender = new Wallet();
    const inputCollection = new TransactionInputCollection(sender);
    const outputCollection = new TransactionOutputCollection();
    this.transaction = new Transaction(sender, inputCollection, outputCollection);
  }
  
  async livelyExample() {
    this._createNewTransaction();
  }
  
  
}