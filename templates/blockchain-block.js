import Morph from 'src/components/widgets/lively-morph.js';
import TransactionNetworkView from 'src/blockchain/view/transactionNetworkView.js';
export default class BlockchainBlock extends Morph {
  
  get block() {
    return this._block;
  }
  
  set block(block) {
    this._block = block;
    block.transactions.forEach(transaction => {
      this.transactionViewController.addTransaction(transaction);
    });
    this.transactionViewController.draw();
  }
  
  async initialize() {
    this._block = null;
    const transactionView = this.shadowRoot.querySelector('#transaction-view');
    this.transactionViewController = new TransactionNetworkView(transactionView);
  }
  
  async livelyExample() {
  }
  
  
}