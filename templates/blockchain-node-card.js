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
  
  set node(node) {
    if(!node) {
      return;
    }
    this._node = node;
    this.shadowRoot.querySelector('#button-node-mine').addEventListener('click', () => this._node.mine());
    this.shadowRoot.querySelector('#button-node-send-transaction').addEventListener('click', () => console.log('not yet implemented'));
    this.update();
  }
  
  get node() {
    return this._node;
  }
  
  async initialize() {
    this.blockchainNodeName = 'Unnamed node'
  }
  
  async update() {
    this.shadowRoot.querySelector('#node-title').innerHTML = this.blockchainNodeName;
    if(!this._node) {
      return;
    }
    this.shadowRoot.querySelector('#node-value').innerHTML = this._node.wallet.value();
  }
  
  async livelyExample() {
    this.node = new BlockchainNode();
  }
}