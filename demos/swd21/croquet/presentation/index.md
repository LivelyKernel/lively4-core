<!-- markdown-config presentation=true -->

<style data-src="../../../../src/client/presentation.css"></style>

<script>
import Presentation from "src/components/widgets/lively-presentation.js"
Presentation.config(this, {
    pageNumbers: true,
    logo: "https://lively-kernel.org/lively4/lively4-seminars/PX2018/media/hpi_logo.png"
})
</script>


<div class="title">
  Croquet — Replicated Computation
</div>

<div class="authors">
  <u>Teresa Lasarow</u>
</div>

<div class="credentials">
  20.07.2021<br>
  <br>
  Software Design Seminar 
</div>

---

# Motivation

### Communication and Collaboration
- <b>Communication</b> as central part of computing experience, e.g., multiplayer games, multi-user apps 
  - Increasing availability of cheaper, more powerful workstations --> Individuals working in different locations
  - Nevertheless requiring the ability to exchange information easily --> Increase in the use of distributed systems

---

# Motivation

### Distributed Computing Systems
- Potential for providing the facilities for cooperative work 
- Potential to be more extensible
- Potential for much greater scaling
- Cause distributed Systems don't share one storage communication has to be executed via messages --> such communication is error prone (e.g. duplicated, loss) --> (Croquet therefore uses the Replicator for event-handling)
- But: to build a fault-tolerant (This means that in case one of the machines fails, the others are still able to operate efficiently.) service in the distributed systems, data had to be into various servers --> <b>Replication</b>

---

# Motivation

### Replicated Computation
- Using replication helps to improve accessibility and fault tolerant services
- A process of keeping copies of data at various locations or in serialized time
  - require processes to handle incoming events
- Employed to reduce user waiting time, increased availability and increased performance
- Challenge: Consistency through sharing of information among redundant resources such as software and hardware
- Replica is deterministic --> produce the same result

---

# Related Work

- MOOS????

---

# Where we come from...

- Client-Server (pessimistic system)
  - Consider the case of a single physical server component A and client components B and C. All client components which need to use A must communicate with it regardless of the load imposed on A. Furthermore, client B may have to wait forA to finish processing the request from client C before its request can be executed.

- Peer-to-peer (optimistic system)

- draw.io graphics here

---

# Croquet

- Croquet = true collaborative environment, where the computer is not just a world unto itself, but a meeting place for many people where ideas can be expressed, explored, and transferred
  - bit-identical for every user
- Model --> Replicated object
  - Instances are not created via new but create() and initialized not via constructor but init() --> only initialized the first time the object comes into existence in the session - later join: model is just deserialized from snapshot <br>
- View --> Non-replicated object
  - Independent local view 
  - Provides mechanism to hook into the replicated model simulation <br>
- Reflector --> Stateless, public, message-passing services located in the cloud
  - Received events from a user are mirrored to all session joined users <br>
- Session --> Instantiating the root model (for new session) or resuming a snapshot <br>
- Events --> Communication between Model and View
  - publish - sending events
  - subscribe - receiving events
  - event-handling ...

---

# Croquet (Event) Architecture 

- Draw.io graphics here

---

# Demo 



