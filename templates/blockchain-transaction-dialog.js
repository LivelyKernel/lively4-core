"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode';
export default class BlockchainTransactionDialog extends Morph {
  
  get receiver() {
    return this._receiver;
  }
  
  set receiver(receiver) {
    this._receiver = receiver;
    this.update();
  }
  
  get amount() {
    return this._amount;
  }
  
  set amount(amount) {
    this._amount = amount;
    this.update();
  }
  
  get node() {
    return this._node;
  }
  
  set node(node) {
    this._node = node;
  }
  
  async initialize() {
    this._sender = null;
    this._receiver = null;
    this._amount = 0;
    this._node = null;
    
    this.windowTitle = "New Blockchain Transaction";
    this.parentNode.style.width = "680px";
    this.parentNode.style.height = "100px";
    this.shadowRoot.querySelector('#buttonSave').addEventListener('click', this.onSave.bind(this));
  }
  
  onSave() {
    this.node.handleTransaction();
    this.parentNode.parentNode.removeChild(this.parentNode);
  }
  
  onClose() {
    this.parentNode.parentNode.removeChild(this.parentNode);
  }
  
  async update() {
    this.shadowRoot.querySelector('#sender').value = this.node.wallet.hash.digest().data;
    this.shadowRoot.querySelector('#receiver').value = this.receiver;
    this.shadowRoot.querySelector('#amount').value = this.amount;
  }
  
  
  async livelyExample() {
    this.node = new BlockchainNode();
  }
  
  
}