## 2026-04-02
*Author: @JensLincke*

 Perfect! Here's a summary of our investigation:

## Summary: DrawIO PDF Export Fix

### What We Discovered

1. **The endpoint WORKS** - `https://convert.diagrams.net/node/export` is fully functional
2. **The problem was our approach** - We were using `fetch()` but the service expects **browser form POST submission**
3. **Curl works perfectly** - We successfully generated PDFs via curl with the correct parameters

### Key Requirements for Success

**Critical parameters:**
- `format=pdf`
- `bg=#ffffff` (URL-encoded: `%23ffffff`)
- `base64=0` (returns binary PDF, NOT base64)
- `embedXml=1` (embeds diagram data in PDF)
- `xml=` **uncompressed mxfile XML** (not the compressed .drawio format!)
- Pagination params: `scale=1`, `pageMargin=27`, `crop=0`, `fit=0`, `shadows=0`, `sheetsAcross=1`, `sheetsDown=1`
- `extras={"globalVars":{"filename":"...","pagecount":1,"page":"...","pagenumber":1}}`
- Headers: `Origin: https://app.diagrams.net`, `Referer: https://app.diagrams.net/`

**Critical XML format:**
```xml
<mxfile host="app.diagrams.net" agent="Mozilla/5.0...">
  <diagram name="Page-1" id="...">
    <mxGraphModel dx="..." dy="..." ...>
      <!-- uncompressed diagram data -->
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Working Curl Command

```bash
curl -X POST 'https://convert.diagrams.net/node/export' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Origin: https://app.diagrams.net' \
  -H 'Referer: https://app.diagrams.net/' \
  --data 'format=pdf&bg=%23ffffff&base64=0&embedXml=1&...' \
  -o output.pdf
```

### Current Code Status

**File:** `src/components/widgets/lively-drawio.js`

**Methods:**
- `exportAsPDF()` - Entry point, calls submitPDFExportForm()
- `submitPDFExportForm()` - Creates hidden form and submits (opens in new tab - **NOT what you want**)

### Next Steps

**Refactor to fetch PDF data directly:**

1. Use `fetch()` instead of form submission to get binary response
2. Convert binary to blob/data URL
3. Save using `lively.files.copyURLtoURL()` as originally intended

**Alternative: Use server-side curl** via lively4-server if browser fetch still fails.

### Code Location

- Main file: `/home/jens/lively4/lively4-core/src/components/widgets/lively-drawio.js`
- Methods to update: `exportAsPDF()`, `submitPDFExportForm()` (rename to `getPDFDataURL()`)
- Lines: ~462-535

The key insight: **The endpoint works fine, we just need to fetch the response as a blob instead of opening it in a new tab!**