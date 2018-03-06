# User-defined Vivide Scripts

<span style="color: red; font-weight: bold;">CAUTION!</span>
Press the button to delete the corresponding file:

<script>
let scriptFolder = lively4url + '/src/client/vivide/scripts/';

(async () => {
  let folder = JSON.parse(await lively.files.statFile(scriptFolder))
  let fileDescriptors =1;
  let buttonList = folder.contents
    .filter(fileDescriptor => fileDescriptor.type === 'file')
    .map(fileDescriptor => {
      let urlString = scriptFolder + fileDescriptor.name;
      let button = <button click={async evt => {
        let delResponse = await fetch(urlString, { method: 'DELETE' });
        if (delResponse.status === 200) {
          lively.success(`deleted file ${fileDescriptor.name}`);
          button.remove();
        } else {
          lively.notify("could not properly delete " + urlString, (await delResponse.text()));
        }
      }}><span style="color: red; font-weight: bold;">Delete:</span> {urlString}</button>;
      
      return button;
    });
    
  return <div>{...buttonList}</div>;
})();
</script>