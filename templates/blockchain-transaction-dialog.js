import Morph from 'src/components/widgets/lively-morph.js';
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';

export default class BlockchainTransactionDialog extends Morph {
  
  get nodes() {
    return this._nodes;
  }
  
  set nodes(nodes) {
    this._nodes = nodes;
    this.nodes.forEach((node) => {
      const option = document.createElement('option');
      option.innerHTML = "Node " + node.wallet.displayName;
      option.setAttribute('value', node.wallet.hash);
      this.shadowRoot.querySelector('#receiverSelect').appendChild(option);
    });
  }
  
  get node() {
    return this._node;
  }
  
  set node(node) {
    this._node = node;
  }
  
  async initialize() {
    this._node = null;
    this._nodes = [];
    this._receivers = [];
    
    this.windowTitle = "New Blockchain Transaction";
    // Set width & height of window (parent node)
    this.parentNode.style.width = "660px";
    this.parentNode.style.height = "200px";

    this.shadowRoot.querySelector('#buttonSave').addEventListener('click', this.onSave.bind(this));
    this.shadowRoot.querySelector('#buttonSaveReceiver').addEventListener('click', this.addReceiver.bind(this))
  }
  
  onSave() {
    const transaction = this.node.sendTransaction(this._receivers);
    this.node.handleTransaction(transaction);
    this.parentNode.parentNode.removeChild(this.parentNode);
  }
  
  onClose() {
    this.parentNode.parentNode.removeChild(this.parentNode);
  }
  
  async update() {
    this.shadowRoot.querySelector('#receiverList').innerHTML = '';
    this._receivers.forEach(receiver => {
      const listElement = document.createElement('li');
      listElement.innerHTML = "Node " + receiver.receiver.displayName + " - μ" + receiver.value;
      lively.components.openIn(this.shadowRoot.querySelector('#receiverList'), listElement).then();
    });
  }
  
  addReceiver() {
    const receiverSelect = this.shadowRoot.querySelector('#receiverSelect');
    const amount = parseFloat(this.shadowRoot.querySelector('#amount').value);
    const receiver = this.nodes[receiverSelect.selectedIndex - 1].wallet;
    if(!amount || !receiver) {
      return;
    }
    
    this._receivers.push({
      'receiver': receiver,
      'value': amount
    });
    this.update();
  }
  
  async livelyExample() {
    this.node = new BlockchainNode();
    this.nodes = [this.node];
  }
  
  
}