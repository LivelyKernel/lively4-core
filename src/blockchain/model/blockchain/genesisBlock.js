import TransactionCollection from '../transaction/transactionCollection.js';
import Block from '../block/block.js';

export default class GenesisBlock extends Block {
  constructor(minerWallet) {
    super(minerWallet, new TransactionCollection(), {isFinalized: () => true}, "");
    this.timestamp = Date.now();
    this.minerHash = minerWallet.hash;
    this.minerPublicKey = minerWallet.publicKey;
    this.transactions = new TransactionCollection().finalize();
    this.miningProof = null;
    this.reward = 0;
    this.previousHash = "";
  }
  
  _sendReward() {
    this.transactions.finalize();
    return;
  }
  
}