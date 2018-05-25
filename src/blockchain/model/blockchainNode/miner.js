import MiningProof from '../block/miningProof.js';
import Block from '../block/block.js';
import TransactionCollection from '../transaction/transactionCollection.js';

const MINING_INTERVALL = 6; // in seconds


export default class Miner {
  constructor(blockchainNode) {
    this._blockchainNode = blockchainNode;
    this._transactions = new TransactionCollection();
    window.setInterval(() => {
      this.mine();
    }, MINING_INTERVALL * 1000);
  }
  
  addTransaction(transaction) {
    if(!transaction.isVerified()) {
      return;
    }
    this._transactions.add(transaction);
  }
  
  async mine() {
    this._transactions.finalize();
    const relevantTransactions = Object.assign({}, this._transactions);
    this._transactions = new TransactionCollection;
    const miningDifficulty = Math.log10(this._blockchainNode.blockchain.size());
    const miningProof = new MiningProof(miningDifficulty);
    await miningProof.work();
    const block = new Block(
      this._blockchainNode.wallet,
      relevantTransactions,
      miningProof,
      this._blockchainNode.blockchain.headOfChain.hash
    );
    this._blockchainNode.propagateBlock(block);
    console.log('[BLOCKCHAIN] Successfully mined a new block');
  }
}