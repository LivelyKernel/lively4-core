# Chrome Built-in AI API

<script>
  import {} from './chrome-built-in-ai.js';
  'built-in API loaded'
</script>
  
<script>
  import {autoRunSnippet} from "src/client/essay.js";
</script>

## Summarizer

```javascript {.summarize .snippet}
const input = `Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.`

const summarizer = await ai.summarizer.create({
  type: "tl;dr",
  format: "markdown",
  length: "short",
});

summarizer.summarize(input)
```
<script>
  autoRunSnippet(this, ".summarize")
</script>

```
enum AISummarizerType { "tl;dr", "key-points", "teaser", "headline" };
enum AISummarizerFormat { "plain-text", "markdown" };
enum AISummarizerLength { "short", "medium", "long" };
```

## Language Detection

```javascript {.detectScript .snippet}
const detector = await window.ai.languageDetector.create();
const results = await detector.detect('hello world');
const table = await (<lively-table></lively-table>)
table.setFromJSO(results.slice(0, 5))
table
```
<script>
  autoRunSnippet(this, ".detectScript")
</script>

```javascript {.detectForTranslationScript .snippet}
const canDetect = await globalThis.translation.canDetect();
canDetect
let detector;
if (canDetect === 'no') {
  // The language detector isn't usable.
  return;
}
if (canDetect === 'readily') {
  // The language detector can immediately be used.
  detector = await globalThis.translation.createDetector();
} else {
  // The language detector can be used after model download.
  detector = await globalThis.translation.createDetector();
  detector.addEventListener('downloadprogress', (e) => {
 console.log(e.loaded, e.total);
  });
  await detector.ready;
}
detector
```
<script>
  autoRunSnippet(this, ".detectForTranslationScript")
</script>

## Translation

```javascript {.canDetectScript .snippet}
if ('translation' in self && 'canDetect' in self.translation) {
  // The Language Detector API is available.
}  

const canDetect = await globalThis.translation.canDetect()
canDetect
```
<script>
  autoRunSnippet(this, ".canDetectScript")
</script>

## LLM

```javascript {.llm-simple .snippet}

// Start by checking if it's possible to create a session based on the availability of the model, and the characteristics of the device.
const capabilities = await ai.languageModel.capabilities();
const {available, defaultTemperature, defaultTopK, maxTopK } = capabilities

if (available === "no") {
  throw new Error('no support for llm')
}

// Initializing a new session must either specify both topK and temperature, or neither of them.
const slightlyHighTemperatureSession = await ai.languageModel.create({
  temperature: Math.max(capabilities.defaultTemperature * 1.2, 1.0),
  topK: capabilities.defaultTopK,
});

// Prompt the model and wait for the whole result to come back.  
const result = await slightlyHighTemperatureSession.prompt("Write me a poem");
result
```
<script>
  autoRunSnippet(this, ".llm-simple")
</script>

```javascript {.llm .snippet}
const clonedSession = await slightlyHighTemperatureSession.clone();
clonedSession.prompt("Write a shorter one");
```
<script>
  autoRunSnippet(this, ".llm")
</script>

## Misc.

```javascript {.userAgentScript .snippet}
function getChromeVersion() {
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/Chrome\/(\d+)\./);
  if (match) {
    return parseInt(match[1], 10); // Extracts the major version as a number
  }
  return null; // If not running Chrome
}
getChromeVersion()
```
<script>
  autoRunSnippet(this, ".userAgentScript")
</script>



