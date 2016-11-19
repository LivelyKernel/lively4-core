# Snippets

How can we store/reuse such tiny snippets of code or regular expressions?

## Mediawiki links to markdown
```
REPLACE: \[(http.*?) (.*)\]
WITH: [$2]($1)
```