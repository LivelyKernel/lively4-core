<link rel="stylesheet" href="doc/PX2018/project_1/assets/css/style.css">
<div class="wrapper">

<div class="center">

# Blockchain
<div class="authors">Johannes Schneider, Julian Weise</div>
<div class="seminar">Programming Experience 2018</div>
</div>
<br/>


## Motivation and historical background
<img src='assets/img/ideas.jpg' width='300' />
<p>For many applications in our world it is important to keep track of certain events and their occurrence date. One very basic example, which apply to nearly everyone, is our birth. Usually, the birth of a person is certified by issuing a birth certificate. Such a birth certificate usually states the date of the event - better known as our birth date. Such a recording of an event and its date is named timestamping.

In former research communities timestamping was a serious issue. How possibly could a researcher proof that she had a disruptive idea, found a new concept to solve a problem or invented something at a specific point of time? In most cases this question became relevant in the context of taking out a patent for an idea / invention.

Researchers started to develop different approaches to tackle the timestamping problem: Some kept a complete log about their activities, ideas and their development. Others copied their research results and sent them as a letter to themselves. The date stamp on the letter served as a trusted timestamp. Nevertheless, all of these approaches had different issues: They were either not forgery-proofed, expensive or simply hard to apply. As a consequence, the research community continued for years to find better solutions for the timestamping problem.

By the end of the 20th century the problem of timestamping documents progressed significantly. Stuart Haber and W. Scott Stornetta developed an approach to timestamp any documents by making use of hash functions and a network of peers. They simply hash an entire document and send it to a subset of peers within their network. Each peer has to check the hash against the document. If it matches, they timestamp it and send it back. All peers of the subset together build the common sense. The timestamp is only valid if all of them agree on the validity and the timestamp of the document. In order to prevent attacker from choosing their preferred peers (e.g.: to forge the timestamp) a random generator determines individually which subset of peers is responsible for timestamping a document.

The ideas of Haber and Stornetta laid the foundation for blockchains as we know them today. Satoshi Nakamoto (a pseudonym - a real person or group of persons is still not known today) built on their idea to come up with the concept of Bitcoin. She published a paper describing the idea behind in 2008 and came up with the first implementation, named Bitcoin Core, in 2009. Bitcoin, a distributed purely digital currency, is the first ever realization of blockchain. In the following chapters we are going to explain the blockchain technology in detail using the example of Bitcoin.
</p>

## Bitcoin
<p>
Haber and Stornetta were able to build up a trustable system to timestamp documents without the need for an central trusted authority. Fascinated by the idea of replacing central authorities, Nakamoto transferred the concept to the financial sector. His goal was to enable financial transactions without the need to clear each and every transaction by a financial institution.
<div id="blockchain-essay-transaction-visualization">
<script>
// Visualize one single transaction
import Wallet from 'src/blockchain/model/wallet/wallet.js'; 
import Transaction from 'src/blockchain/model/transaction/transaction.js'; 
import TransactionInputCollection from 'src/blockchain/model/transaction/transactionInputCollection.js'; 
import TransactionOutputCollection from 'src/blockchain/model/transaction/transactionOutputCollection.js'; 
(() => { 
  const sender = new Wallet(); 
  const inputCollection = new TransactionInputCollection(sender); 
  const outputCollection = new TransactionOutputCollection(); 
  const transactionView = document.createElement("blockchain-transaction"); 
  transactionView.transaction = new Transaction(sender, inputCollection, outputCollection); 
  return transactionView;
})();
</script>
</div>
The fundamental elements of Nakamoto's Bitcoin concept are transactions. They occur in a chronological order and serve as a proof for money transfers. In order to meet these requirements, transactions have to held certain information about the transfer. The given view of an example transaction gives you a good overview about the most important attributes. 

First of all, the timestamp is necessary to sort the transaction correctly into the ledger (we will come the ledger later on). The sender hash describes the address of the wallet which issued the transaction. From this wallet all coins are taken to satisfy the transaction amount. Furthermore, the wallet is also responsible to settle the feeds for this transaction. The amount of fees is defined by the difference between input and output amount of the transaction. All information about the transaction amounts can be inferred from the right column of the view.

</div>