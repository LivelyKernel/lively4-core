

#Future Work

- Soap Bubble Example and problems of feedback when it comes to eventual situations and interactivity 
- Open Problem: How to deal with JavaScript object references
  - a) Migration: don't do it.... update the object itself 
    - b) or use proxies in the first place
    - be sure that we don't need JavaScript references... by stronger controlling them? Trowing enough objects away?
- migrating web components used in web components
  - migrate parents?
- continuous editor
  - experiment with record and replay techniques for more magic ``live programming''
    - record more in program execution to augment ``code editor''
- be more aware of semantics of edits in code
  - Smalltalk like notions of a finer granular ``changing a method of class'' 
      vs. having modified a whole ``file'' allows better tool support with better performance 
- propagation of changes back into the source code (think wysiwyg text editor)
- idea: don't throw away instance but just replace the inside... and keep the shell