import Morph from 'src/components/widgets/lively-morph.js';
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';
import BlockchainNodeCard from 'templates/blockchain-node-card.js';
import BlockNetworkView from 'src/blockchain/view/blockNetworkView.js';
import TransactionNetworkView from 'src/blockchain/view/transactionNetworkView.js';
import NetworkComponent from 'src/blockchain/model/blockchainNode/networkComponent.js';

export default class BlockchainUI extends Morph {
  
  async initialize() {
    this.windowTitle = "Blockchain - UI";
    this._nodes = [];
    
    // Set width & height of window (parent node)
    this.parentNode.style.width = "1400px";
    this.parentNode.style.height = "400px";
    
    this.shadowRoot.querySelector('#new-node-button').addEventListener('click', this.createNewNode.bind(this));
    this.shadowRoot.querySelector('#reset-environment').addEventListener('click', this.resetEnvironment.bind(this));
    const blockchainView = this.shadowRoot.querySelector('#blockchain-view');
    const transactionView = this.shadowRoot.querySelector('#transaction-view');
    this.blockchainViewController = new BlockNetworkView(blockchainView);
    this.transactionViewController = new TransactionNetworkView(transactionView);
  }

  async update(block) {
    this.blockchainViewController.addBlock(block);
    block.transactions.forEach(transaction => this.transactionViewController.addTransaction(transaction));
    this.blockchainViewController.draw();
    this.transactionViewController.draw();
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
  
  resetEnvironment() {
    this._nodes = [];
    NetworkComponent.peers = [];
    var nodeListView = this.shadowRoot.querySelector('#node-list');
    while (nodeListView.firstChild) {
        nodeListView.removeChild(nodeListView.firstChild);
    }
    this.blockchainViewController.reset();
    this.transactionViewController.reset();
    
    this.createNewNode();
    this._nodes[0].subscribe(this, this.update.bind(this));
    this.update(this._nodes[0].blockchain.headOfChain);
  }
  
  async livelyExample() {
    this.createNewNode();
    this._nodes[0].subscribe(this, this.update.bind(this));
    this.update(this._nodes[0].blockchain.headOfChain);
  }
  
  
}