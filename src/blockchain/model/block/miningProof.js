import forge from 'node_modules/node-forge/dist/forge.min.js';

const C_MIN_MINING_DIFFICULTY = 1;
const C_MAX_MINING_DIFFICULTY = 5;

export default class MiningProof {
  constructor(miningDifficulty) {
    this.miningDifficulty = Math.max(C_MIN_MINING_DIFFICULTY,
                                     Math.min(C_MAX_MINING_DIFFICULTY, Math.round(miningDifficulty)));
    this.startTimestamp = null;
    this.finishTimestamp = null;
    this.hash = null;
    this.nonce = 0;
  }
  
  get displayName() {
    if (!this._hash) {
      return "#NotAName";
    }
    
    return "#" + this._hash.substring(0, 10);
  }
  
  async work() {
    this.startTimestamp = Date.now();
    await this._solveCryptoPuzzle();
    this.finishTimestamp = Date.now();
    this.hash = this._hash();
  }
  
  isFinalized() {
    return !!this.hash;
  }
  
  _solveCryptoPuzzle() {
    const zeroString = "0".repeat(this.miningDifficulty);
    do {
      this.calculateHash(this.nonce + 1);
    } while(this.hash.substring(this.hash.length - this.miningDifficulty) != zeroString);
  }
  
  calculateHash(nonce) {
    this.nonce = nonce;
    this.hash = this._hash();
    return this.hash;
  }
  
  _hash() {
    const sha256 = forge.md.sha256.create();
    sha256.update(
      this.nonce +
      this.miningDifficulty +
      this.startTimestamp +
      this.finishTimestamp
    );
    return sha256.digest().toHex();
  }
}