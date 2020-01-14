# Conclusion NOTES

- but: they do not work on nicely with HTML. 
  (Tools consider HTML as an implementation details below the surface.)
- morphs (and parts) are an abstraction over HTML/SVG/(and by design Canvas) 

- Normal HTML comes with surprisingly dynamic features (innerHTML setter/getter) 

- In Lively4 we try to combine the two approaches...
  - we want to go more vanilla.js (which we think will incorporate Web Components sooner than later) 
    - and work with HTML and Web Components the way we did with morphs. This includes:
      - direct manipulation through halos (drag, grab, clone, resize)
        - reflective tool support in inspector (object editor)
        - respecting the abstraction border of the Shadow DOM: by default ignoring it, but allow to go deeper when the user wants it 
          - (shift click halos and access in inspector)
            - The chrome debugging tools do a decent job there, so we tried to provide user land (page intern) tools that mimic their UI and behavior  
