const LANGUAGE_DETECTOR_TOKEN = 'Av3bzQBWIWHR9KM7l38VcDX7wJkdFzXyTwfsfOQ4/fbEGUJ9m/ogcSX3jO/shp9ItNcrWfoF1GnD4YVaByNtjgwAAAByeyJvcmlnaW4iOiJodHRwczovL2xpdmVseS1rZXJuZWwub3JnOjQ0MyIsImZlYXR1cmUiOiJMYW5ndWFnZURldGVjdGlvbkFQSSIsImV4cGlyeSI6MTc0OTU5OTk5OSwiaXNTdWJkb21haW4iOnRydWV9';

function addToken(token) {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'origin-trial';
  meta.content = token;
  document.head.appendChild(meta);
}

function hasToken(token) {
  const existingMetaTag = [...document.querySelectorAll('meta[http-equiv="origin-trial"]')]
    .some(meta => meta.content === token);

  if (existingMetaTag) {
    // lively.notify(`Token "${token}" is already applied.`);
    return
  }

  const meta = document.createElement('meta');
  meta.httpEquiv = 'origin-trial';
  meta.content = token;
  document.head.appendChild(meta);
  // lively.notify(`Token "${token}" applied successfully.`);
}

function ensureToken(token) {
  if (!hasToken(token)) {
    addToken(token)
  }
}

ensureToken(LANGUAGE_DETECTOR_TOKEN)