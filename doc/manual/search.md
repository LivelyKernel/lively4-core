# Search API

The `lively.search` module provides a unified API for searching files, content, and code structures in Lively4.

## File Search

Search for files by filename pattern using `lively.search.files()`.

### Basic Usage

```javascript
// Find files matching "lively-ball"
const results = await lively.search.files("lively-ball");

// Results: [
//   {
//     url: "http://localhost:9005/lively4-core/src/components/demo/lively-ball.html",
//     name: "lively-ball.html",
//     type: "file",
//     modified: "2025-08-07 16:08:47",
//     version: "0b6ae3a109537787c53d1d52d70e749504d1c183",
//     size: "415"
//   },
//   {
//     url: "http://localhost:9005/lively4-core/src/components/demo/lively-ball.js",
//     name: "lively-ball.js",
//     type: "file",
//     modified: "2025-08-07 16:12:36",
//     version: "0b6ae3a109537787c53d1d52d70e749504d1c183",
//     size: "1323"
//   }
// ]

// Open the first result in a browser
if (results.length > 0) {
  lively.openBrowser(results[0].url);
}
```

### Search Options

```javascript
const results = await lively.search.files(pattern, options);
```

**Parameters:**
- `pattern` (string) - Search pattern (regex supported)
- `options` (object) - Optional configuration:
  - `paths` (Array<string>) - Root directories to search (default: `lively4url` + `ExtraSearchRoots`)
  - `recursive` (boolean) - Search subdirectories (default: `true`)
  - `type` (string) - Filter by 'file', 'directory', or 'both' (default: `'file'`)
  - `limit` (number) - Maximum results (default: `50`)

### Examples

**Search in specific directory:**
```javascript
const tests = await lively.search.files("test", { 
  paths: [lively4url + "/test"] 
});
```

**Limit results:**
```javascript
const top10 = await lively.search.files("lively", { limit: 10 });
```

**Regex pattern matching:**
```javascript
// Find all JavaScript files
const jsFiles = await lively.search.files(".*\\.js$", { 
  paths: [lively4url + "/src/client"]
});
```

**Search multiple directories:**
```javascript
const results = await lively.search.files("component", {
  paths: [
    lively4url + "/src/components",
    lively4url + "/templates"
  ]
});
```

### Integration with FileIndex

The search API uses [FileIndex](browse://src/client/fileindex.js) for efficient lookups. Files must be indexed before they appear in search results.

**Related:**
- [FileIndex](browse://src/client/fileindex.js) - Underlying index database
- [lively-generic-search](browse://src/components/tools/lively-generic-search.js) - UI component using search API
- Press `F8` to open the generic search widget

## Future Extensions

The following search methods are planned for future implementation:

```javascript
// Content search (planned)
await lively.search.content(query, options);

// Code structure search (planned)
await lively.search.classes(query, options);
await lively.search.methods(query, options);
await lively.search.functions(query, options);
```
