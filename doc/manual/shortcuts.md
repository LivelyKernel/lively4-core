# Keyboard Shortcuts

<script>
async function extractShortCuts(url){
  const content = await fetch(url).then(r => r.text());
  return <table>{...
    content.split("\n")
      .filter(ea => ea.match(/#KeyboardShortcut/))
      .map(ea => {
        const line = ea.replace(/.*#KeyboardShortcut /,"");
        const separatorIndex = line.indexOf(' ');
        const shortcut = line.substr(0, separatorIndex);
        const description = line.substr(separatorIndex + 1);
        return <tr>
          <td style="font-weight: bold">{shortcut}</td>
          <td>{description}</td>
        </tr>;
      })
  }</table>;
}

const result = <div>
  <h2>Global Shortcuts</h2>
  {extractShortCuts(lively4url + "/src/client/keys.js")}
  <h2>Code Mirror Shortcuts</h2>
  {extractShortCuts(lively4url + "/src/components/widgets/lively-code-mirror.js")}
  <h2>Module Specific Shortcuts</h2>
  <h2>Vivide Step Editor Shortcuts</h2>
  {extractShortCuts(lively4url + "/src/client/vivide/components/vivide-step-editor.js")}
  <h2>Expose Shortcuts</h2>
  {extractShortCuts(lively4url + "/src/client/expose.js")}
  <h2>Graffle Shortcuts</h2>
  {extractShortCuts(lively4url + "/src/client/graffle.js")}
</div>;

result
</script>