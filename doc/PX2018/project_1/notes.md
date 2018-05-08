# Blockchain

### 1. How to Time-Stamp a Digital Document (Stuart Haber, W. Scott Stornetta) 1991

- time-stamping ⇒ certifying the date a document was created / last modified
  - e.g.: relevant in context of research work / intellectual property matters
    - physical possibilities: send a letter to yourself / keep a gaples journal and get it stamped by notary public
  - problem:
    - inefficient
    - third parties have to check entire content for manipulation
    - not digital
  - hash functions reduces documents of arbitrary length to a string of fixed length
    - problem:
      - still relying on third parties
      - third party could be manipulative
  - use a pseudorandom generator G to get a number of client ids based on hash
    - clients have to timestamp hash
    - hard to forge since clients are chosen randomly by G and forger would have to control a large fractions of clients
    - time constraint: always linking to an event happened before (taking into account the hash of it) during the creation process achieves back- and forward constraints
    - also enhances authenticity of documents

### 2. Improving the Efficiency and Reliability of Digital Time-Stamping (Dave Bayer, Stuart Haber, W. Scott Stornetta) 1992

- Introduces merkle trees to the idea of time-stamping by hashes
  - solves the problem of high workload for clients to certify a lot of single transactions / documents
  - merkle trees combine multiple hash values (documents / transactions) to one merkle tree has

### 3. Bitcoin: A Peer-to-Peer Electronic Cash System (Satoshi Nakamoto) 2008

- White paper of bitcoin - implemented blockchain the first time

### 4, Blockchains: The great chain of being sure about things (The Economist) 2015

- https://www.economist.com/news/briefing/21677228-technology-behind-bitcoin-lets-people-who-do-not-know-or-trust-each-other-build-dependable good overview / explanation over/of bitcoin and blockchains

## Themenstruktur

- Geschichtlicher Hintergrund
- Blockchain als Datenstruktur
- Eigenschaften einer Blockchain
- <strike>Optimierung (Merkle Trees)</strike>
- Distributed Blockchain
- <strike>Distributed Trust</strike>
- weitere Beispiele
- Anti-Beispiele / Kritik / Hype?