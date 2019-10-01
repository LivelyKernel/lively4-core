# Keyboard Shortcuts

<lively-script><script>
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

function listShortCuts(title, path) {
  return <div>
    <h2>{title}</h2>
    {extractShortCuts(lively4url + path)}
  </div>;
}

const result = <div>
  {listShortCuts('Global Shortcuts', '/src/client/keys.js')}
  {listShortCuts('Code Mirror Shortcuts', '/src/components/widgets/lively-code-mirror.js')}
  <h1>Module Specific Shortcuts</h1>
  {listShortCuts('Vivide Step Editor Shortcuts', '/src/client/vivide/components/vivide-step-editor.js')}
  {listShortCuts('Vivide Text Widget Shortcuts', '/src/client/vivide/components/vivide-text-widget.js')}
  {listShortCuts('Expose Shortcuts', '/src/client/expose.js')}
  {listShortCuts('Graffle Shortcuts', '/src/client/graffle.js')}
</div>;

result
</script><lively-script>