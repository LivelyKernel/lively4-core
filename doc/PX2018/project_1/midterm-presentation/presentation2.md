<!-- markdown-config presentation=true -->

<!-- #TODO make style links in container content relative to url -->
<!-- <link rel="stylesheet" type="text/css" href="style.css" /> -->
<link rel="stylesheet" type="text/css" href="doc/PX2018/style.css"  />
<link rel="stylesheet" type="text/css" href="src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="templates/livelystyle.css"  />
<link rel="stylesheet" type="text/css" href="doc/PX2018/project_1/midterm-presentation/style.css"  />
<style>
  .lively-slide {
    border: 1px solid rgb(220,220,220)
    page-break-before: always;
/*     border: 2px solid red
 */
  }
  p {
    font-size: 18pt
  }
  @media print {
    .lively-slide {
      page-break-before: always;
      border: 0px solid white;
/*       border: 2px solid blue; */
    }      
  }
  
</style>

<div class="title">
  PX 2018: Blockchain - Midterm Presentation
</div>

<div class="authors">
  Johannes Schneider, Julian Weise
</div>

<div class="credentials">
  Software Architecture Group <br>Hasso Plattner Institute<br> University of Potsdam, Germany
</div>

<script>
  var button = document.createElement("button")
  button.textContent = "print"
  button.onclick = async () => {
   var presentation = lively.query(this, "lively-presentation")
   presentation.print()
  }
  button.style = "position: absolute; bottom: 10px; left: 10px"
  button
</script>

---
## Blockchain
<div class="quotation">
"Decentralized, chronological updated database with a network based consensus mechanism for permanent confirmation of ownership."
<div class="author">Prof. Dr. Andreas Mitschele</div>
</div>

--- 
## Historical Background

<ul>
  <li>1991: timestamping
    <ul>
      <li>proof creation date of scientific documents</li>
    </ul>
  </li>
  <li>1992: introducing merkle trees
    <ul>
      <li>improving efficiency</li>
    </ul>
  </li>
  <li>2008: append-only ledger
    <ul>
      <li>first working implementation in Bitcoin</li>
    </ul>
  </li>
</ul>

---
## Blockchain as data structure

<ul>
  <li>Transactions
    <ul>
      <li>stores arbitrary data and their occurrence</li>  
    </ul>
  </li>
  <li>Blocks
    <ul>
      <li>contains a strictly ordered set of transactions</li>
    </ul>
  </li>
  <li>Chain of blocks
    <ul>
      <li>connects several blocks using hashing algorithms</li>
    </ul>
  </li>
</ul>

---
## Attributes of blockchains

<ul>
  <li>append-only
    <ul>
      <li>tamper-proof</li>
    </ul>
  </li>
    <li>strictly ordered
    <ul>
      <li>chronological sequence unambiguously</li>
    </ul>
  </li>
</ul>

---
## Distributed blockchain

<ul>
  <li>decentralized ledger
    <ul>
      <li>replicated data on every node in the p2p-network</li>
    </ul>
  </li>
  <li>network-defined consensus for data validation
    <ul>
      <li>every node is enabled to independently validate transactions</li>
    </ul>
  </li>
  <li>distributed trust
    <ul>
      <li>there is no central authority &rarr; every node is able to determine its own truth</li>
    </ul>
  </li>
</ul>

---
## Examples
<ul>
  <li>Bitcoin
    <ul>
      <li>presentation follows along Bitcoin architecture due to historical background</li>
    </ul>
  </li>
  <li>other crypto currencies
    <ul>
      <li>Ethereum, FileCoin, BlockStack</li>
    </ul>
  </li>
  <li>other usages of blockchain technology
    <ul>
      <li>data ownership / access rights, voting, naming systems</li>
    </ul>
  </li>
</ul>

---
## Blockchain hype technology!?
<ul>
  <li>hardly any usecases with the need of blockchain technology (so far)</li>
  <li>high consumption of energy (e.g.: proof of work in Bitcoin)</li>
  <li>trust based on the assumption that the major part of the network behaves honestly</li>
  <li>redundancy in many cases not necessary to fulfill requirements &rarr; waste of storage</li>
</ul> 
