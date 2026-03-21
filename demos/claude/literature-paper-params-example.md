# FileIndex Method Data for `literature-paper.js`

Based on the parameter extraction implementation, here's what would be stored in the FileIndex database for `src/components/literature/literature-paper.js`:

## Class: `LiteraturePaper`
- **Extends**: `Morph`
- **Lines of code**: 732
- **Methods**: 47

### Method Details with Parameters

1. **async initialize()**
   - Lines: 8
   - Parameters: (none)

2. **get id()**
   - Lines: 3
   - Parameters: (none)

3. **set id(id)**
   - Lines: 3
   - Parameters:
     - `id` : simple

4. **get type()**
   - Lines: 3
   - Parameters: (none)

5. **set type(type)**
   - Lines: 3
   - Parameters:
     - `type` : simple

6. **get authorId()**
   - Lines: 3
   - Parameters: (none)

7. **set authorId(id)**
   - Lines: 5
   - Parameters:
     - `id` : simple

8. **get scholarId()**
   - Lines: 3
   - Parameters: (none)

9. **set scholarId(id)**
   - Lines: 5
   - Parameters:
     - `id` : simple

10. **get scholarPaper()**
    - Lines: 3
    - Parameters: (none)

11. **set scholarPaper(id)**
    - Lines: 5
    - Parameters:
      - `id` : simple

12. **get alexId()**
    - Lines: 3
    - Parameters: (none)

13. **set alexId(id)**
    - Lines: 5
    - Parameters:
      - `id` : simple

14. **get alexAuthorId()**
    - Lines: 3
    - Parameters: (none)

15. **get mode()**
    - Lines: 3
    - Parameters: (none)

16. **set mode(s)**
    - Lines: 3
    - Parameters:
      - `s` : simple

17. **get searchQuery()**
    - Lines: 3
    - Parameters: (none)

18. **get authorSearchQuery()**
    - Lines: 3
    - Parameters: (none)

19. **set searchQuery(id)**
    - Lines: 5
    - Parameters:
      - `id` : simple

20. **fields()**
    - Lines: 3
    - Parameters: (none)

21. **async ensureData()**
    - Lines: 40
    - Parameters: (none)

22. **async ensurePaper()**
    - Lines: 25
    - Parameters: (none)

23. **async updateView()**
    - Lines: 48
    - Parameters: (none)

24. **async renderPaper(paper)**
    - Lines: 16
    - Parameters:
      - `paper` : simple

25. **fixLinks()**
    - Lines: 8
    - Parameters: (none)

26. **searchURLOffsetURL(offset, limit)**
    - Lines: 12
    - Parameters:
      - `offset` : simple
      - `limit` : simple

27. **getPDFs()**
    - Lines: 3
    - Parameters: (none)

28. **async renderLong()**
    - Lines: 77
    - Parameters: (none)

29. **async loadReferences(paper)**
    - Lines: 33
    - Parameters:
      - `paper` : simple

30. **async loadRerferencedBy(paper)**
    - Lines: 28
    - Parameters:
      - `paper` : simple

31. **async loadRelated(paper)**
    - Lines: 19
    - Parameters:
      - `paper` : simple

32. **async renderAuthor(data)**
    - Lines: 35
    - Parameters:
      - `data` : simple

33. **async renderSearch(data)**
    - Lines: 30
    - Parameters:
      - `data` : simple

34. **async renderAuthorSearch(data)**
    - Lines: 38
    - Parameters:
      - `data` : simple

35. **renderNoPaper()**
    - Lines: 3
    - Parameters: (none)

36. **async renderShort()**
    - Lines: 17
    - Parameters: (none)

37. **renderCitationKey()**
    - Lines: 3
    - Parameters: (none)

38. **renderAuthorsLinks(authors = this.paper.authors)**
    - Lines: 8
    - Parameters:
      - `authors` : default = ...
      - Note: Has default value `this.paper.authors`

39. **async renderPaperList(papers, authorName)**
    - Lines: 9
    - Parameters:
      - `papers` : simple
      - `authorName` : simple

40. **renderYear()**
    - Lines: 3
    - Parameters: (none)

41. **renderTitle()**
    - Lines: 9
    - Parameters: (none)

42. **renderDOI()**
    - Lines: 12
    - Parameters: (none)

43. **renderPDFs(renderHeading = false)**
    - Lines: 17
    - Parameters:
      - `renderHeading` : default = ...

44. **renderPublication()**
    - Lines: 10
    - Parameters: (none)

45. **renderJournalSnippet()**
    - Lines: 18
    - Parameters: (none)

46. **renderConferenceSnippet()**
    - Lines: 12
    - Parameters: (none)

47. **renderCitationCount()**
    - Lines: 8
    - Parameters: (none)

48. **async papersToShortEntriesList(papers)**
    - Lines: 10
    - Parameters:
      - `papers` : simple

49. **async openIFrame(url)**
    - Lines: 6
    - Parameters:
      - `url` : simple

50. **async livelyExample()**
    - Lines: 18
    - Parameters: (none)

## Summary Statistics

- **Total methods**: 50
- **Methods with parameters**: 14 (28%)
- **Methods without parameters**: 36 (72%)
- **Getters**: 11
- **Setters**: 9
- **Async methods**: 15
- **Methods with default parameters**: 2

## Parameter Type Breakdown

- **Simple parameters**: 24 occurrences
- **Default parameters**: 2 occurrences
  - `renderAuthorsLinks(authors = this.paper.authors)`
  - `renderPDFs(renderHeading = false)`

## Example JSON Structure (as stored in database)

```json
{
  "name": "LiteraturePaper",
  "url": "https://lively-kernel.org/lively4/lively4-core/src/components/literature/literature-paper.js",
  "superClassName": "Morph",
  "loc": 732,
  "methods": [
    {
      "name": "renderPaper",
      "kind": "method",
      "static": false,
      "loc": 16,
      "start": 241,
      "end": 256,
      "params": [
        {
          "name": "paper",
          "type": "simple"
        }
      ]
    },
    {
      "name": "searchURLOffsetURL",
      "kind": "method",
      "static": false,
      "loc": 12,
      "start": 269,
      "end": 280,
      "params": [
        {
          "name": "offset",
          "type": "simple"
        },
        {
          "name": "limit",
          "type": "simple"
        }
      ]
    },
    {
      "name": "renderAuthorsLinks",
      "kind": "method",
      "static": false,
      "loc": 8,
      "start": 585,
      "end": 593,
      "params": [
        {
          "name": "authors",
          "type": "default",
          "defaultValue": "..."
        }
      ]
    }
  ]
}
```

## Usage Examples

### Query all methods with their signatures:
```javascript
const index = FileIndex.current();
const classes = await index.db.classes
  .where("name").equals("LiteraturePaper")
  .toArray();

classes[0].methods.forEach(m => {
  const sig = m.params.map(p => p.name).join(', ');
  console.log(`${m.name}(${sig})`);
});
```

### Find methods by parameter count:
```javascript
// Find methods with 2+ parameters
const methodsWithMultipleParams = classes[0].methods
  .filter(m => m.params && m.params.length >= 2);

console.log("Methods with 2+ params:", methodsWithMultipleParams.map(m => m.name));
// Output: ["searchURLOffsetURL", "renderPaperList"]
```

### Generate documentation:
```javascript
function generateMethodSignature(method) {
  const params = method.params.map(p => {
    if (p.type === 'default') return `${p.name}?`;
    return p.name;
  }).join(', ');
  
  return `${method.name}(${params})`;
}

// Example: "renderAuthorsLinks(authors?)"
```

## Notes

- This data is automatically extracted when the file is indexed
- Re-index the file to populate this data: `FileIndex.current().updateFile(url)`
- Parameters with default values are marked as type `'default'`
- The actual default value expression is currently stored as `'...'` (can be enhanced later)
