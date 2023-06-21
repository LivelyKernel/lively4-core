# Keyboard Shortcuts

<script>

function renderShortCut(shortcut, description, url, pattern) {
  const onClick = evt => {
    lively.openBrowser(url, true, pattern);
    evt.preventDefault()
  }
  return <tr click={onClick} style='cursor: pointer;'>
    <td style="font-weight: bold">{shortcut}</td>
    <td>{description}</td>
  </tr>;
}

async function extractShortCuts(url) {
  const content = await fetch(url).then(r => r.text());
  return <table>{...
    content.split("\n")
      .filter(ea => ea.match(/#KeyboardShortcut/))
      .map(ea => {
        const line = ea.replace(/.*#KeyboardShortcut /,"");
        const separatorIndex = line.indexOf(' ');
        const shortcut = line.substr(0, separatorIndex);
        const description = line.substr(separatorIndex + 1);
        return renderShortCut(shortcut, description, url, line)
      })
  }</table>;
}

async function listShortCuts(title, path) {
  const url = lively4url + '/' + path;
  const onCLick = evt => {
    lively.openBrowser(url, true);
    evt.preventDefault()
  };
  return <div>
    <h2><a href=' ' click={onCLick}>{title}</a></h2>
    {await extractShortCuts(url)}
  </div>;
}

(async () => {
const result = <div>
  {await listShortCuts('Global Shortcuts', 'src/client/keys.js')}
  {await listShortCuts('Reserved Shortcuts', 'src/client/reserved-shortcuts.js')}
  {await listShortCuts('Code Container', 'src/components/tools/lively-container.js')}
  {await listShortCuts('Code Mirror Shortcuts', 'src/components/widgets/lively-code-mirror.js')}
  {await listShortCuts('Code Mirror Modes', 'src/components/widgets/lively-code-mirror-modes.js')}
  {await listShortCuts('Lively Editor', 'src/components/tools/lively-editor.js')}
  <h1>Module Specific Shortcuts</h1>
  {await listShortCuts('Vivide Step Editor Shortcuts', 'src/client/vivide/components/vivide-step-editor.js')}
  {await listShortCuts('Vivide Text Widget Shortcuts', 'src/client/vivide/components/vivide-text-widget.js')}
  {await listShortCuts('Expose Shortcuts', 'src/client/expose.js')}
  {await listShortCuts('Graffle Shortcuts', 'src/client/graffle.js')}
</div>;
  return result
})()

</script>