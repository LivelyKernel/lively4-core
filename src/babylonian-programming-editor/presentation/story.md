When thinking about program behavior, Programmers often simulate the behavior of code in their mind. They simulate the program execution and runtime state, form hypothesis about the program behavior and then evaluate the hypothesis by executing the program and looking at some form of output on the program. Through live programming we generally try to shorten this loop by providing as much feedback on the runtime state within a short distance of any kind as possible. Feedback can be any form of program output or traces of runtime values. A simple way to get feedback on the runtime behavior is simply executing the code. But for that we need example input data to execute the code on.

Making use of example input data and system state has been proposed in various ways before in the live programming community.

(list of designs) Each of these designs provides a number of interesting and novel features but remain somewhat limited with regard to the scale of the systems which can be developed with them (with regard to the number of modules)

To make use of examples in more complex systems, we reviewed the features of the existing systems with regard to their applicability to larger systems (list of rough requirements)

Short explanation: Example is a set of input values for a function/method (example invocation), context is the system state in which the example invocation is to be executed 

-	Feedback on runtime state
  -	Feedback granularity
  -	State over time
  -	State over modules
  -	Arbitrary objects
  -	Domain-specific feedback
-	Associating Examples with code
  -	Multiple examples for one part of the application
  -	Reusing parts of examples
-	Determining Relevant Sections of Code
  -	Control flow
  -	Runtime state
  -	Program output
-	Specifying Context
-	Keeping Track of Assumptions
-	Navigating the Trace

Based on these requirements, we designed a live programming tool -> Demo

Plan of evaluation: Based on this tool we plan to conduct a controlled experiment on the effects of liveness onto programmer behavior. So far only a few controlled experiments exist on the impact of liveness (as “short distance between feedback on runtime behavior is provided”) itself. Thus, the results are rather inconclusive so far. Some works mention task complexity as potential factor for the effects of liveness, e.g. on debugging performance of programmers. Most of these studies were conducted with simple or medium task complexity. As we can increase the complexity of systems to be developed with the Babylonian editor, we will run a set of controlled experiments on the moderation effects of task complexity. In particular, we will investigate the moderation of the impact of varying levels of introspection or feedback delays onto the debugging performance of programmers.


(In the study, we plan to work with software engineering student which have programming in Smalltalk for 2 semesters. To gather insights into their programming behavior with respect to liveness, we have started with a longitudinal study on their programming behavior and how it changes over the course of the 2 semesters. We finished gathering the data but have not started the analysis yet.)

