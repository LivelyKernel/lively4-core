"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';

export default class BlockchainUI extends Morph {
  
  async initialize() {
    this.windowTitle = "Blockchain - UI";
    this._nodes = [];
    this.shadowRoot.querySelector('#new-node-button').addEventListener('click', this.createNewNode.bind(this));
  }

  async update() {
  }
  
  createNewNode() {
    const node = new BlockchainNode();
    this._nodes.push(node);
    const nodeUI = document.createElement('blockchain-node-card');
    nodeUI.node = node;
    nodeUI.blockchainNodeName = "Node #" + this._nodes.length;
    this.shadowRoot.querySelector('#node-list').appendChild(nodeUI);
  }
  
  async livelyExample() {
    this.createNewNode();
  }
  
  
}