import Preferences from "src/client/preferences.js"

export default function indentationWidth() {
  return Preferences.get('EditorIndentation') || 2;
}
