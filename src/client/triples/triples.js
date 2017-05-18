


export default async function loadDropbox() {
  let text = await lively.files.statFile("https://lively4/dropbox/")
  let json = JSON.parse(text);
  return json;
}

