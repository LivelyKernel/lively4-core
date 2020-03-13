# Versions

- Context: an `AnnotationSet` references the actual version of a text through a git hashes
- Problem: git hashes change when commits are squashed. It works still in one repository, but when checking an annotation file out in a different location the git hashes can not be used to retrieve an actual text
- Discussion: there we have it, history rewriting is **evil**
- Idea: 
  - a) an `AnnotationSet` should keep the actual text as a copy (the most conservative approach)
  - b) keep a reference to the last commit synced to GitGub. This will be helpfull in determining a common ancestor, if it comes to merge conflicts. 
  
  
  