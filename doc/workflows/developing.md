# Developing


- Issues
- Repositories
- Libraries 
  - Problematic: npm --> problematic, because it does not work with github.io
  - Problematic: ../some-relative-repository (on lively-kernel.org) --> problematic, ... see above
  - OK: static copies of (potentially minified) libraries
  - Best: github repositories subtrees, statically available, but still updateable
    - FEATURE: allows for local adaptation, without giving up, updateabiltiy 
    - #TODO -> provide tool support from inside lively4 to add, update, remove such dependencies
  - Do you have a favorite module/library/package/dependency management system that works clientside only?
