# Vivide/JS CheatSheet

## Vivide Widget Properties

<script>
lively.files.walkDir(lively4url + '/src/client/vivide/components').then(async files => {
  const list = <div></div>;
  for (let file of files) {
    const text = await file.fetchText();
    const match = text.match(/#VivideWidget (.*)/g);
    if (match) {
      list.appendChild(<h3><span>{match[0].replace('#VivideWidget ', '')}</span></h3>);
      const headerStyle = 'font-weight: bold; color: steelblue;';
      list.append(<table><tr>
              <td style={headerStyle}>Property</td>
              <td style={headerStyle}>Type</td>
              <td style={headerStyle}>Description</td>
            </tr>{...
        text.split("\n")
          .filter(ea => ea.match(/#VivideProperty /))
          .map(ea => {
            const matches = ea.match(/.*#VivideProperty (.*)\((.*)\)\s(.*)/);
            return <tr>
              <td style='font-weight: bold'>{matches[1]}</td>
              <td>{matches[2]}</td>
              <td>{matches[3]}</td>
            </tr>;
          })
      }</table>);
    }
  }
  return list;
})
</script>
