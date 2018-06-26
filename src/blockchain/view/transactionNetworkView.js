
export default class TransactionNetworkView {
  constructor(blockchainNodeView) {
    this._nodeView = blockchainNodeView;
    this._nodeView.nodeClickHandler = this._onNodeClick.bind(this);
    
    this._displayedTransactions = [];
    this._newTransactions = [];
    this._nodeIndices = new Map();
  }
  
  reset() {
    this._displayedTransactions = [];
    this._newTransactions = [];
    this._nodeIndices = new Map();
    this._nodeView.reset();
    this.draw();
  }
  
  addTransaction(transaction) {
    this._newTransactions.push(transaction);
    return this;
  }
  
  addTransactions(transactions) {
    this._newTransactions = this._newTransactions.concat(transactions);
    return this;
  }
  
  draw() {
    this._constructNodes();
    this._constructLinks();
    this._nodeView.draw();
    
    this._displayedTransactions = this._displayedTransactions.concat(this._newTransactions);
    this._newTransactions = [];
  }
  
  _constructNodes() {
    this._newTransactions.forEach((transaction) => {
      this._nodeIndices.set(transaction.hash, this._nodeIndices.size);
      this._nodeView.addNode(
        {
          "name": transaction.displayName, 
          "group": 1,
          "hash": transaction.hash
        }
      );
    });
  }
  
  _constructLinks() {
    const allTransactions = this._displayedTransactions.concat(this._newTransactions);
    
    this._newTransactions.forEach((receiver) => {
      receiver.inputs.forEach((input) => {
        allTransactions.forEach((sender) => {
          if (sender === receiver) {
            return;
          }
          
          if (!sender.outputs.hasOutput(input.hash)) {
            return;
          }
          
          this._nodeView.addLink(
            {
              "source": this._nodeIndices.get(sender.hash),
              "target": this._nodeIndices.get(receiver.hash),
              "value": input.amount
            }
          );
        });
      });
    });
  }
  
  _onNodeClick(node) {
    if (!node || !node.hash) {
      return;
    }
    
    let transaction = null;
    
    this._displayedTransactions.forEach((tx) => {
      if (transaction || tx.hash != node.hash) {
        return;
      }
      
      transaction = tx;
    });
    
    if (!transaction) {
      throw new Error("Cannot find transaction to display!");
    }
    
    lively.openComponentInWindow("blockchain-transaction").then((comp) => {
      if (!comp) {
        return;
      }
      
      comp.transaction = transaction;
      return comp;
    });
  }
}