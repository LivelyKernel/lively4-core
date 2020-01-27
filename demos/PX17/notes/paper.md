# Motivation

- Context: Lively programming  of Web-components in Lively4 
  - Collaborative Self-supporting Web-based Development Environments with Lively PX
  - Material: HTML, JavaScript, and CSS
  - New Technology: Web Components and Babel JavaScript
- Problem:
  - Immediate feedback while programming is often restricted to behavior in some kind of simulation loop (ignoring the replaying time live programming scenarios at this point)
  - The effects of changing "initialization" or template code will often only be visible when instantiating new objects therefore rendering existing running example with custom state useless (e.g. examples have to be either recorded and played back or handcrafted #UnitTests in the first place)   
  - Implementation: Web-components are like other new Web-technologies currently often only used in a static (full browser reload setting)

- Scenario: Bouncing Ball + Soap Bubble
  - Ball: observing simulated behavior + feedback for changes made in initialization (template code)
    - template code: declarative form of initializing code that has an effect of complex object structure at runtime
  - Soap Bubble: complex behavior that does not easily lend itself to automatic feedback due to user interaction 
    - behavior over time: bubble will eventually explode
    - interactive behavior: bubble will explode when clicked 
    - interaction with other objects: bubble will combine itself with other objects...
  
- Questions:
  - for what and when can we get feedback when we type code

# Approach

# Implementation

- replace template and prototype with proxies that are updated at runtime (dealing with Web-component technology)
- livleyMigrate -> live programming 
- livelyPrepareSave -> interactive programming, persisting...

# Discussion / Evaluation

- modifying (meta-objects) like classes directly vs. object migration
- manual object migration vs. VM support such as Smalltalk become

# Related Work 

- live programming (bret victor style)

# Conclusion

- object migration allows to combine
- future work
  - pulling back changes from the object into class and template description to enable a direct manipulation workflow.

