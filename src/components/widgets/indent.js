import Preferences from "src/client/preferences.js"

export default function indentationWidth() {
  return Preferences.get('WiderIndentation') ? 4 : 2;
}