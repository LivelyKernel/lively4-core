# Hacks needed...


Files acces via windows subsystm for linux (git / emacs) and stored on the windows side (dropbox) will produce problems with the files mode... so we can ignore them via:

```
git config core.fileMode false
```

https://www.overleaf.com/7697303rsdrmvbxhpmv#/38953628/