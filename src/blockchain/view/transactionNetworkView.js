
export default class TransactionNetworkView {
  constructor(blockchainNodeView, transactions) {
    this._nodeView = blockchainNodeView;
    this._transactions = transactions;
  }
  
  draw() {
    const nodeIndices = this._constructNodes();
    this._constructLinks(nodeIndices);
    this._nodeView.draw();
  }
  
  _constructNodes() {
    const nodeIndices = new Map();
    this._nodeView.nodes = [];
    
    this._transactions.forEach((transaction) => {
      nodeIndices.set(transaction.hash, this._nodeView.nodes.length);
      this._nodeView.nodes.push(
        {
          "name": transaction.hash.digest().toHex(), 
          "group": 1
        }
      );
    });
    
    return nodeIndices;
  }
  
  _constructLinks(nodeIndices) {
    this._nodeView.links = [];
    
    this._transactions.forEach((receiver) => {
      receiver.inputs.forEach((input) => {
        this._transactions.forEach((sender) => {
          if (sender === receiver) {
            return;
          }
          
          if (!sender.outputs.has(input)) {
            return;
          }
          
          this._nodeView.links.push(
            {
              "source": nodeIndices.get(sender.hash),
              "target": nodeIndices.get(receiver.hash),
              "value": input.amount
            }
          );
        });
      });
    });
  }
}