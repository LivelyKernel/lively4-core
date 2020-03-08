export function deleteFile(url){
  const name = url.split('/');
  fetch(url, { method: 'DELETE' }).then(() => lively.success(`Deleted ${name[name.length-1].split('.')[0]}`));
}

export function deleteAll(folders) {
  folders.map(folder =>folder.map(file => deleteFile(file)));
}