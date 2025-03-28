## Context
*What is the broad context of the work? What is the importance of the general research area?*

- *rp* important/rp is a cornerstone for modern software development
- contemporary software
  - is interactive and reacts to user input, network messages and other events.
- by providing dedicated language concepts to describe constraints, data dependencies, cause-action relationships

## Inquiry
*What problem or question does the paper address? How has this problem or question been addressed by others (if at all)?*

- rpcs are challenging to implement
- in particular, *change detection* represents a hard but inevitable nessecity when integrating rpcs into oo host environments.
- even worse, change detection mechas are typically tightly coupled to the particular change resolution mechanism and, thus, not available for reuse.
- As a result, system developers have to re-implement similar strats over and over again.

## Approach/Knowledge
*What was done that unveiled new knowledge?*
*What new facts were uncovered? If the research was not results oriented, what new capabilities are enabled by the work?*

- In this thisis, we present **aexprs** as a reusable primitive for change detection in oo envs.
- aexprs abstract change detection for all rpcs that express their dependencies as oo expressions over program state and reify it into a programmable hook.
- Aexprs invoke assiciated behavior whenever the result of the monitored expression changes.
- Using this simple mechanism, aexprs act as a foundation when implementing rpcs.

## Grounding
*What argument, feasibility proof, artifacts, or results and evaluation support this work?*

- To show the feasibility of aexprs, we implement three different rpcs, signals, constraints, and roqs, using aexprs.
- For each concept, aexprs reduce the implementation effort in terms of amount of code required compared to traditional implementation techniques.

- Further, aexprs may even remove limitations imposed by traditional implementation techniques.
- We exemplify this capabilty byimplementing a push-based variant of implicit layer activation and combine it life-cycle callbacks for context-oriented pprogramming layers.

## Importance
*Why does this work matter?*

- Given these results, we hope that \aexprs will aid the development of novel \rpcs and improve system and application code alike.

---
---
---

Modern software development without \rp is hard to imagine.
\Rp favors a wide class of contemporary software systems that respond to user input, network messages, and other events.

\Rpcs are hard to implement.
One major hurdle is the change detection in object-oriented host environments.




\missingsec{OLD ABSTRACT:}
%
## Context
*What is the broad context of the work? What is the importance of the general research area?*

- rp important

- Modern software development without \rp is hard to imagine.
- **%** *rp*
- **%** *Für viele Anwendungen geeignet*
- **%** *Reactive applications is a wide class of software that responds to user input, network messages, and other events*
- **%** *Many contemporary software system respond to user input, network messages, and other events.*
- \Rp favors a wide class of contemporary software systems that respond to user input, network messages, and other events.
- **%** *A wide class of contemporary software systems responds to user input, network messages, or other events and, thus, favors \rp concepts.*

## Inquiry
*What problem or question does the paper address? How has this problem or question been addressed by others (if at all)?*

- While \rp is an active field of research, the implementation of reactive concepts remains challenging.
- In particular, change detection represents a hard but inevitable necessity when implementing reactive concepts.\todo{this needs to go one level deeper here!!!}
- **%** *In particular, implementing change detection is a hard/tedious but unavoidable/inevitable necessity/chore.*
- Typically, change detection mechanisms are not intended for reuse but are tightly coupled to the particular change resolution mechanism.
- **%** *Typically, one change detection mechanism is designed to match a particular change resolution and are not intended for reuse.*
- **%** *Most implementations of change detection mechanisms regard a single, specific concept and are not designed for reuse.*
- **%** *Most implementations of change detection are not intended for reuse.*
- As a result, developers often have to re-implement similar abstractions.
- **%** *are forced*
- **%** *Thus, even though these abstractions are conceptually exchangeable,*
- A reusable primitive for change detection is still missing.% to build upon
- **%** *We address the question of how to ease the development of novel \rp concepts.*

## Approach
*What was done that unveiled new knowledge?*

- To find a suitable primitive, we identify commonalities in existing reactive concepts.
- **%** *and exploit*
- **%** *To provide a reusable primitive, we identify and exploit commonalities in existing reactive concepts.*
- We discover a class of reactive concepts, \emph{state-based reactive concepts}. All state-based reactive concepts share a common change detection mechanism:
- they detect changes in the evaluation result of an expression.
- **%** *they detect changes of the state of a program.*
- **%** *each of those concepts reacts to changes in the evaluation result of an expression.*

## Knowledge
*What new facts were uncovered? If the research was not results oriented, what new capabilities are enabled by the work?*

- **%** *The discovered underlying commonality.*
- **%** *reason about concepts in terms of a unified primitive*
- On the basis of the identified common change detection mechanism, we propose \emph{\aexprs} as a reusable primitive.
- **%** *we reify the identified commonality as a reusable primitive, called \emph{\aexprs}.*
- **%** *easier implementation of novel rp concepts*
- By abstracting the tedious implementation details of change detection, \aexprs can ease the implementation of reactive programming concepts\todo{patrick The potential impact comes very late in the abstract}.
- **%** *relieve developers from this recurring task.*

## Grounding
*What argument, feasibility proof, artifacts, or results and evaluation support this work?*

- We evaluate the design of \aexprs by re-implementing a number of existing state-based reactive concepts using them.
- **%** *To substantiate this claim, we provide a prototypical implementation of \aexprs.*
- The resulting implementations highlight the expressiveness of \aexprs.
- **%** *These implementations show promising results.*
- **%** *Preliminary results are promising in that *
- **%** *Full-functional implementations *
- **%** *Preliminary implementations of state-based reactive concepts using \aexprs are promising.*

## Importance
*Why does this work matter?*

- \Aexprs enable the separation of essential from non-essential parts when reasoning about \rp concepts.
- By using \aexprs as a primitive for change detection,
- **%** *developers may focus on the reactive behavior when implementing reactive concepts.*
- developers of reactive language constructs and runtime support can now focus on the design of how application programmers should be able to react to change.
- **%** *Ultimately, \aexprs encourage to experiment with novel \rp concepts.*
- Ultimately, we would like active expressions to encourage experiments with novel reactive programming concepts and with that to yield a wider variety of them to explore.
- **%** *explore*

%Research School Abstract:

%Reactive programming simplifies the implementation of complex, interconnected behavior by completely automating the propagation of changes. Researchers proposed a huge variety of approaches to execute on this initial idea. Most approaches present specialized solutions to maximize expressiveness and meet unique use cases. But usually, they are not intended for reuse. Thus, when implementing novel reactive concepts, developers often have to start from scratch.

%We identify a class of reactive programming concepts, \emph{state-based reactive programming}, that incorporates a common underlying change notification mechanism. Furthermore, we propose a reusable primitive, \emph{active expressions}, to facilitate the implementation of instances of this class of reactive concepts. Finally, we present an implementation of active expressions along with multiple strategies for state change monitoring.
