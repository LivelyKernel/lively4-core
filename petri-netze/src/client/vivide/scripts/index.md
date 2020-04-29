# User-defined Vivide Content

<span style="color: red; font-weight: bold;">CAUTION!</span>
Press the button to delete the corresponding file:

<script>
import { allFiles, openFile, getDetails } from 'src/client/vivide/scripts/loading.js';
import { deleteFile, deleteAll } from 'src/client/vivide/scripts/deleting.js';
import { scriptFolder, stepFolder, applicationFolder } from 'src/client/vivide/utils.js';

const folders = [scriptFolder, stepFolder, applicationFolder];


allFiles().then(fileNames => {
  let buttonList = fileNames.map((folder, i) => 
    <div>
      <h5>{folders[i].split('/')[folders[i].split('/').length-2]}/</h5>
      {...folder.map(urlString => {
        let name = urlString.split('/')[urlString.split('/').length-1];
        let delbutton = <button click={() => deleteFile(urlString)}>
          <span style="color: red; font-weight: bold;">Delete</span>
        </button>;

        let openbutton = <button click={() => openFile(urlString)}>
          <span style="color: blue; font-weight: bold;">Open</span>
        </button>;

        let file = <div>
          <div>{name} {delbutton} {openbutton}</div>
          <div>{getDetails(urlString, true).then(d => d.description)}
          </div>
        </div>;
        return file;
      })}
    </div>
  );
  
  let deleteAllScriptsButton = <button click={() => allFiles.then(a => deleteAll(a))}>
    <span style="color: red; font-weight: bold;">DELETE ALL SCRIPTS!</span>
  </button>;

  return <div>
    {deleteAllScriptsButton}
    <div>{...buttonList}</div>
  </div>;
});
</script>