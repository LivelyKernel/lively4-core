# Transpiled

- files are cached in `.transpiled/` directory, the path is flattened by replaceing `/` with `_`
- the transpiled files are included in the bundle in this way:

```
cat bootfilelist | xargs zip -r test.zip .transpiled/* 
```