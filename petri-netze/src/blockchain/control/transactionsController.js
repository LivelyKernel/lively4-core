import Controller from './controller.js';
import TransactionNode from '../view/transaction/transactionNode.js';

export default class TransactionsController extends Controller {
  constructor(transactions = []) {
    super();
    
    this.addTransactions(transactions);
  }
  
  addTransaction(transaction) {
    this._addTransaction(transaction);
    this._nodesUpdated();
  }
  
  addTransactions(transactions) {
    transactions.forEach(transaction => {
      this._addTransaction(transaction);
    })
    this._nodesUpdated();
  }
  
  _addTransaction(transaction) {
    // private method, used for adding multiple transactions
    // without updating the layouts for each of them
    var node = new TransactionNode(transaction);
    this.nodes.push(node);
  }
}