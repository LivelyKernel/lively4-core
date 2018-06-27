<!-- markdown-config presentation=true -->

<!-- begin styles -->
<link rel="stylesheet" type="text/css" href="doc/PX2018/style.css"  />
<link rel="stylesheet" type="text/css" href="src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="templates/livelystyle.css"  />
<link rel="stylesheet" type="text/css" href="doc/PX2018/project_1/endterm-presentation/assets/style.css"  />

<style>
  .lively-slide {
    border: 1px solid rgb(220,220,220)
    page-break-before: always;
  }
  p {
    font-size: 18pt
  }
  pre:not(#LOG) {
    background-color:  rgba(240,240,250,1);
    padding: 6px;
    width: 800px;
  }
</style>
<!-- end styles -->

<!-- begin script -->
<script>
import {hideHiddenElements, toggleLayer, showVariable, runExampleButton} from "src/client/essay.js";
</script>
<!-- end script -->

<div class="title">
  PX 2018: Blockchain - Endterm Presentation
</div>

<div class="authors">
  Johannes Schneider, Julian Weise
</div>

<div class="credentials">
  Software Architecture Group <br>Hasso Plattner Institute<br> University of Potsdam, Germany
</div>

---
<h1 class="centralized">Introduction</h1>


---

<img src="assets/Introduction_001.png" width="500" alt="" class="center" />

---

<img src="assets/Introduction_002.png" width="500" alt="" class="center" />

---

<img src="assets/Introduction_003.png" width="500" alt="" class="center" />

---

<img src="assets/Introduction_004.png" width="500" alt="" class="center" />

---

<img src="assets/Introduction_006.png" width="500" alt="" class="center" />

---

<img src="assets/Introduction_005.png" width="500" alt="" class="center" />

---

<img src="assets/Introduction_007.png" width="500" alt="" class="center" />

---
## Blockchain
<div class="quotation">
"Decentralized, chronological updated database with a network based consensus mechanism for permanent confirmation of ownership."
<div class="author">Prof. Dr. Andreas Mitschele</div>
</div>

---
## Bitcoin
<img src="assets/BC_Logo.png" alt="" class="position-right-upper-corner" width="200" />
<ul>
<li>digital crypto currency
  <ul>
    <li>peek value in 2017: ~ $18.000</li>
  </ul>
</li>

<li>
concept published by Satoshi Nakamoto (pseudonym) in 2008
<ul>
  <li>shared ledger to keep track of all transactions</li>
  <li>aims to remove necessity of banks to clear transactions</li>
</ul>
</li>
<li>first stable implementation in 2009</li>
</ul>

---
<h1 class="centralized">Concepts</h1>

---
## Wallet

<ul>
  <li>
  Necessary to participate in payment transactions
  <ul>
    <li>send transactions</li>
    <li>receive transactions</li>
  </ul>
  </li>
  <li>Basically set of private &amp; public key
    <ul>
      <li>used to sign transactions</li>
      <li>public key as identifier in payment network</li>
    </ul>
  </li>
</ul>


### Usage
```javascript {.BlockchainImports .Hidden}
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';
import Wallet from 'src/blockchain/model/wallet/wallet.js';
import Transaction from 'src/blockchain/model/transaction/transaction.js';
import TransactionInputCollection from 'src/blockchain/model/transaction/transactionInputCollection.js';
import TransactionOutputCollection from 'src/blockchain/model/transaction/transactionOutputCollection.js';
import BlockNetworkView from 'src/blockchain/view/blockchainNetworkView.js';
```

```javascript {.InitializeWallet .NoResult}
import Wallet from 'src/blockchain/model/wallet/wallet.js';
const wallet = new Wallet();
```

```javascript {.DisplayWallet .Hidden}
lively.openComponentInWindow('blockchain-wallet').then(comp => {
  comp.wallet = wallet;
});

```

<script>runExampleButton("Display Wallet", this, ["InitializeWallet", "DisplayWallet"])</script>

<script>hideHiddenElements(this)</script>



### Receive payment
```javascript {.WalletReceiveTransactionPreparation .Hidden}
import Transaction from 'src/blockchain/model/transaction/transaction.js';
import TransactionInputCollection from 'src/blockchain/model/transaction/transactionInputCollection.js';
import TransactionOutputCollection from 'src/blockchain/model/transaction/transactionOutputCollection.js';

const inputCollection = new TransactionInputCollection(wallet);
inputCollection.addMiningReward({"minerHash": wallet.hash, "reward": 10});
inputCollection.finalize();
const outputCollection = new TransactionOutputCollection();
outputCollection.add(wallet, 5);
outputCollection.finalize();
const transaction = new Transaction(wallet, inputCollection, outputCollection);
```

```javascript {.WalletReceiveTransaction}
wallet.receive(transaction);
```

<script>runExampleButton("Receive Transaction", this, ["InitializeWallet", "WalletReceiveTransactionPreparation", "WalletReceiveTransaction", "DisplayWallet"])</script>

<script>hideHiddenElements(this)</script>

---
## Transaction
<ul style="margin-bottom: 30px">
  <li>fundamental component of blockchain data structure</li>
  <li>
    describes one timestamped change within ecosystem
    <ul>
      <li>Bitcoin: single payment flow starting from one wallet</li>
    </ul>
  </li>
</ul>
<blockchain-transaction id="transaction-view" style="display:none; width: 600px;"></blockchain-transaction>

```javascript {.DisplayTransactionView .Hidden}
lively.query(this, '#transaction-view').transaction = transaction;
lively.query(this, '#transaction-view').style.display = 'block';
```

<script>runExampleButton("Display Transaction", this, ["InitializeWallet", "WalletReceiveTransactionPreparation", "WalletReceiveTransaction", "DisplayTransactionView"])</script>

<script>hideHiddenElements(this)</script>

---
## Transaction Architecture

<img src="assets/TransactionArchitecture.png" alt="" class="center" />

```javascript {.CreateInputCollection}
import TransactionInputCollection from 'src/blockchain/model/transaction/transactionInputCollection.js';

// Creates an inputCollection and defines input values
const inputCollection = new TransactionInputCollection(wallet);
// mining reward is used as source of income
inputCollection.addMiningReward({"minerHash": wallet.hash, "reward": 10});
inputCollection.finalize();
```

```javascript {.CreateOutputCollection}
import TransactionOutputCollection from 'src/blockchain/model/transaction/transactionOutputCollection.js';

// Creates an outputCollection and defines which wallet will receive money
const outputCollection = new TransactionOutputCollection();
outputCollection.add(wallet, 5);
outputCollection.finalize();
```

```javascript {.CreateTransaction}
import Transaction from 'src/blockchain/model/transaction/transaction.js';

// Creates an wallet with the predefined input and outputs.
// Wallet is used to sign the transaction
const transaction = new Transaction(wallet, inputCollection, outputCollection);
```

```javascript {.DisplayTransaction .Hidden}
lively.openComponentInWindow('blockchain-transaction').then(comp => {
  comp.transaction = transaction;
});
```

<script>runExampleButton("Run", this, ["InitializeWallet", "CreateInputCollection", "CreateOutputCollection", "CreateTransaction", "DisplayWallet", "DisplayTransaction"])</script>

<script>hideHiddenElements(this)</script>

---
## Block
<ul>
  <li>periodically encapsulates transactions</li>
  <li>comparable to a ledger's page
    <ul>
      <li>each block refers to previous block (chain of blocks &rarr; ledger)</li>
    </ul>
  </li>
  <li>creation of a block is called <i>mining</i>
    <ul>
      <li>requires resource intensive / time consuming work to be done</li>
      <li>mining is rewarded (mining-reward and fees)</li>
    </ul>
  </li>
  <li>transactions mind into a block are interpreted as valid</li>
</ul>

### Mining Challenge

```javascript {.MiningChallengeExample}
import forge from 'node_modules/node-forge/dist/forge.min.js';

const sha256 = forge.md.sha256.create();

const block = {'prevHash': "#3eFg7FA", "data": "...", "nonce": 0};

```
<script>runExampleButton("Setup Mining-Challenge", this, ["MiningChallengeExample"])</script>

```javascript {.MiningChallengeIncraseNonce}
block['nonce'] = block['nonce'] + 1;
sha256.update(block);
sha256.digest().toHex();
```
<script>runExampleButton("Run Mining-Challenge", this, ["MiningChallengeIncraseNonce"])</script>

---
## Block

<script>runExampleButton("Setup Environment", this, ["BlockchainImports", "PrepareMining"])</script>
<blockchain-wallet id="blockchain-wallet-block"></blockchain-wallet>
<blockchain-node-view id="blockchain-node-view-block"></blockchain-node-view>

```javascript {.PrepareMining .Hidden}
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';
import BlockNetworkView from 'src/blockchain/view/blockNetworkView.js';
import NetworkComponent from 'src/blockchain/model/blockchainNode/networkComponent.js';

NetworkComponent.peers = [];

const node = new BlockchainNode();
const blockViewController = new BlockNetworkView(lively.query(this, '#blockchain-node-view-block'));
blockViewController.reset();
blockViewController.draw();
const walletView = lively.query(this, '#blockchain-wallet-block');
lively.query(this, '#blockchain-node-view-block').resize(600, 200).draw();

node.subscribe(blockViewController, (block) => {
  blockViewController.addBlock(block);
  blockViewController.draw();
  walletView.wallet = node.wallet;
});

blockViewController
  .addBlock(node.blockchain.headOfChain)
  .draw();

walletView.wallet = node.wallet;
```
```javascript {.MineBlock .Hidden}
node.mine();

```
<script>runExampleButton("Mine Block", this, ["MineBlock"])</script>

<script>hideHiddenElements(this)</script>

---
<h1 class="centralized">Networking</h1>

---
## Nodes
<ul>
  <li>Participants within network are called nodes</li>
  <li>Each node can perform several actions
    <ul>
      <li>Mine new blocks &rarr; Miner</li>
      <li>Propagate Transactions &rarr; NetworkComponent</li>
      <li>Maintain it's own Blockchain copy &rarr; Storage</li>
    </ul>
  </li>
</ul>

```javascript {.SimulateNode}
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';
new BlockchainNode();

```
<script>runExampleButton("Create Node", this, ["SimulateNode"])</script>

---

## Peer-To-Peer

<ul>
  <li>New nodes contact long-established ones to get up-to-date copy of Blockchain</li>
  <li>Consensus rules ensure same Blockchain on majority of nodes
    <ul>
      <li>Blocks with solved mining-challenge are valid</li>
      <li>Longest Blockchain is the only valid one</li>
      <li>...</li>
    </ul>
  </li>
  <li>Nodes / Miner compete against each other while solving the mining challenge</li>
</ul>

```javascript {.RunFullDemo .Hidden}
lively.openComponentInWindow('blockchain-ui').then(comp => {
    comp.createNewNode();
    comp._nodes[0].subscribe(comp, comp.update.bind(comp));
    comp.update(comp._nodes[0].blockchain.headOfChain);
});

```
<script>runExampleButton("Run full Demo", this, ["RunFullDemo"])</script>
<script>hideHiddenElements(this)</script>

---
## Distributed Trust

<ul>
  <li>Blocks and Transactions are timestamped &rarr; data is stored sequentially</li>
  <li>Every Block contains hash of prevoius block &rarr; tampering impossible</li>
  <li>Thousands of nodes store their copy of the blockchain independently</li>
  <li>Wallets sign transactions using their <i>private Key</i></li>
  <li>Fundamental Assumption: Majority of nodes operates trustworthy
    <ul>
      <li>enough computational power to assert always providing longest chain</li>
    </ul>
  </li>
</ul>

```javascript {.PrepareBlockchainValidation .Hidden}
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';
import NetworkComponent from 'src/blockchain/model/blockchainNode/networkComponent.js';

NetworkComponent.peers = [];

const node = new BlockchainNode();
const blockchain = node.blockchain;
node.mine();
node.mine();
```

```javascript {.ValidateBlockchainSuccessfully}
blockchain.isValid();
```

<script>runExampleButton("Validate Blockchain", this, ["PrepareBlockchainValidation", "ValidateBlockchainSuccessfully"])</script>

```javascript {.ValidateBlockchainUnsuccessfully}
blockchain.headOfChain.timestamp = 123456789;
blockchain.isValid();
```

<script>runExampleButton("Validate Blockchain", this, ["PrepareBlockchainValidation", "ValidateBlockchainUnsuccessfully"])</script>

<script>hideHiddenElements(this)</script>

---
## Blockchain validation

<ul>
  <li>Novel approach to persist data tamper proof without need for central authority</li>
  <li>Requires large number of peers to ensure security and tamper-resistants</li>
  <li>Proof-of-Work-Concept consumes a lot of resources ~ 71 TWh / year &rarr; Energy consumption Czech Republic</li>
  <li>Waste of storage: Blockchain is duplicated multiple times over all nodes</li>
  <li>Bad performance in comparison to conventional (distributed) storage solutions</li>
</ul>

