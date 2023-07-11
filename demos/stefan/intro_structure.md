# Context and Motivation/Challenges in Implementing Reactive Programming Concepts
## Why Reactive Programming?
### Working Principles of Reactive Programming
#### Advantages
### Combining Reactive Programming and Object-oriented Programming
#### Adding Reactivity to an Object-oriented Host Language
#### Example Application
###### **THE CATCH/HOOK** 
## Challenges
#### Implementing Reactive Programming Concepts By Example
#### Why \RPCs are Challenging to Implement
###### **Problems:**  WHAT is complicated in this implementation? (Symptome)
##### Complexity of Host Languages
##### Limitations of Meta Programming
##### Edge Cases
##### Vertical Slice Through Layers of Abstraction
#### Consequences of High Complexity
###### **Consequences:**  Was wird schlechter durch die hohe Komplexität?/Konsequenzen, die die Komplexität der Implementierungen nach sich ziehen
##### Leaking Implementation Details
##### Offload Work to the User
##### Limited Variety Leads to Improper Usage
##### Hinders Innovation in Research
#### Reasons for Complexity in \RPCs
###### **Reasons:** WHY are such implementations of RP on top of OOP complex/complicated/difficult/challenging (in the first place)?
##### Research Question
##### Accidental Complexity due to Semantic Mismatch
##### Disregarding Software Engineering Principles
#### Goals of this Thesis
###### **Goals:** What do we want to accomplish in this Thesis?
## Approach
###### **Solution/Idea:** was kann getan werden und wie hilft das gegen Probleme und deren Gründe?
##### Thesis Statement
###### **Benefits:** Was für (positive) Folgen hat der Einsatz der Lösung?
#### Reusable Abstraction Lowers Accidental Complexity
#### Rigorous Integration Improves Libraries
#### Abstraction Enables Task-specific Reactive Solutions
## Contributions
##  Organization

---

```javascript
const intro =  document.getElementById('intro')
intro.value.split('\n').filter(line => {
    debugger
  const starts = [
    /^\\chapter{/g,
    /^\\section\*?{/g,
    /^\\subsection\*?{/g,
    /^\\subsubsection\*?{/g,
    /^\\paragraph\*?{/g,
    /^\\item\[/g,
    /^\\contenthint/g,
  ];
  return starts.some(start => line.match(start))
}).join('\n')
```