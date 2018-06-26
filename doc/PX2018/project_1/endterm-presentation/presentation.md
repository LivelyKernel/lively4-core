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
const wallet = new Wallet();
```

```javascript {.DisplayWallet .Hidden}
lively.openComponentInWindow('blockchain-wallet').then(comp => {
  comp.wallet = wallet;
});

```

<script>runExampleButton("Display Wallet", this, ["BlockchainImports", "InitializeWallet", "DisplayWallet"])</script>

<script>hideHiddenElements(this)</script>



### Receive payment
```javascript {.WalletReceiveTransactionPreparation .Hidden}
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

<script>runExampleButton("Receive Transaction", this, ["BlockchainImports", "InitializeWallet", "WalletReceiveTransactionPreparation", "WalletReceiveTransaction", "DisplayWallet"])</script>

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

<script>runExampleButton("Display Transaction", this, ["BlockchainImports", "InitializeWallet", "WalletReceiveTransactionPreparation", "WalletReceiveTransaction", "DisplayTransactionView"])</script>

<script>hideHiddenElements(this)</script>

---
## Transaction Architecture

<img src="assets/TransactionArchitecture.png" alt="" class="center" />

```javascript {.CreateInputCollection}
// Creates an inputCollection and defines input values
const inputCollection = new TransactionInputCollection(wallet);
// mining reward is used as source of income
inputCollection.addMiningReward({"minerHash": wallet.hash, "reward": 10});
inputCollection.finalize();
```

```javascript {.CreateOutputCollection}
// Creates an outputCollection and defines which wallet will receive money
const outputCollection = new TransactionOutputCollection();
outputCollection.add(wallet, 5);
outputCollection.finalize();
```

```javascript {.CreateTransaction}
// Creates an wallet with the predefined input and outputs.
// Wallet is used to sign the transaction
const transaction = new Transaction(wallet, inputCollection, outputCollection);
```

```javascript {.DisplayTransaction .Hidden}
lively.openComponentInWindow('blockchain-transaction').then(comp => {
  comp.transaction = transaction;
});
```

<script>runExampleButton("Run", this, ["BlockchainImports", "InitializeWallet", "CreateInputCollection", "CreateOutputCollection", "CreateTransaction", "DisplayWallet", "DisplayTransaction"])</script>

<script>hideHiddenElements(this)</script>

---
## Block

<blockchain-wallet id="blockchain-wallet-block"></blockchain-wallet>
<blockchain-node-view id="blockchain-node-view-block"></blockchain-node-view>

```javascript {.PrepareMining .Hidden}
import BlockchainNode from 'src/blockchain/model/blockchainNode/blockchainNode.js';
import BlockNetworkView from 'src/blockchain/view/blockNetworkView.js';
import NetworkComponent from 'src/blockchain/model/blockchainNode/networkComponent.js';

NetworkComponent.peers = [];
blockViewController.reset();

const node = new BlockchainNode();
const blockViewController = new BlockNetworkView(lively.query(this, '#blockchain-node-view-block'));
const walletView = lively.query(this, '#blockchain-wallet-block');
lively.query(this, '#blockchain-node-view-block').resize(600, 300).draw();


node.subscribe(blockViewController, (block) => {
  walletView.reset();
  blockViewController.addBlock(block);
  blockViewController.draw();
  walletView.wallet = node.wallet;
});

blockViewController
  .addBlock(node.blockchain.headOfChain)
  .draw();

walletView.wallet = node.wallet;


```
<script>runExampleButton("Setup Environment", this, ["BlockchainImports", "PrepareMining"])</script>
```javascript {.MineBlock .Hidden}
node.mine();

```
<script>runExampleButton("Mine Block", this, ["MineBlock"])</script>

<script>hideHiddenElements(this)</script>

---


