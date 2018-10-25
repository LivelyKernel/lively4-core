## 2018-10-25

Ok, journal works again... after fixing a bug in `lively.files.exists`!


## Tasks

- [X] don't render  index.md files  while in editing mode
- [ ] fixed module paths in lively4-seminars
- [ ] booting lively and specially code mirror takes to long

## script tags as modules

We support absolute path requirements in script tags, but this makes it hard to deploy code in external repositories such as `lively4-seminars`. 

Idea: hand in a working path for script tags, e.g. `foo/bar.md` for all `script` tags inside that Markdown file!

