"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';

export default class BlockchainNodeCard extends Morph {
  
  set blockchainNodeName(blockchainNodeName) {
    this._blockchainNodeName = blockchainNodeName;
    this.update();
  }
  
  get blockchainNodeName() {
    return this._blockchainNodeName;
  }
  
  get nodes() {
    return this._nodes;
  }
  
  set nodes(nodes) {
    this._nodes = nodes;
  }
  
  get node() {
    return this._node;
  }
  
  set node(node) {
    if(!node) {
      return;
    }
    
    this._node = node;
    this.shadowRoot.querySelector('#button-node-mine').onclick=(this._node.mine.bind(this._node));
    this.node.unsubscribe(this);
    this.node.subscribe(this, this.update.bind(this));
    this.update();
  }
  
  openAddTransactionView() {
    const transactionDialog = document.createElement('blockchain-transaction-dialog');
    lively.components.openInWindow(transactionDialog).then(() => {
      transactionDialog.node = this.node;
      transactionDialog.nodes = this.nodes;
    });
  }
  
  async initialize() {
    this.blockchainNodeName = 'Unnamed node';
    this.shadowRoot.querySelector('#button-node-send-transaction').addEventListener('click', this.openAddTransactionView.bind(this));
  }
  
  async update() {
    this.shadowRoot.querySelector('#node-title').innerHTML = this.blockchainNodeName;
    if(!this._node) {
      return;
    }
    this.shadowRoot.querySelector('#node-value').innerHTML = "μ" + this._node.wallet.value;
  }
  
  async livelyExample() {
    this.node = new BlockchainNode();
  }
}