"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';
import BlockchainNodeCard from 'templates/blockchain-node-card.js';

export default class BlockchainUI extends Morph {
  
  async initialize() {
    this.windowTitle = "Blockchain - UI";
    this._nodes = [];
    
    // Set width & height of window (parent node)
    this.parentNode.style.width = "1400px";
    this.parentNode.style.height = "400px";
    
    this.shadowRoot.querySelector('#new-node-button').addEventListener('click', this.createNewNode.bind(this));
  }

  async update() {
  }
  
  createNewNode() {
    const node = new BlockchainNode();
    this._nodes.push(node);
    const nodeUI = document.createElement('blockchain-node-card');
    nodeUI.node = node;
    nodeUI.blockchainNodeName = "Node " + node.wallet.displayName;
    lively.components.openIn(this.shadowRoot.querySelector('#node-list'), nodeUI).then( () => {
      nodeUI.node = node;
      nodeUI.nodes = this._nodes;
      nodeUI.blockchainNodeName = "Node " + node.wallet.displayName;
    });
  }
  
  async livelyExample() {
    this.createNewNode();
  }
  
  
}