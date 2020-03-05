"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';
import { getMatches, setScript } from 'src/client/vivide/scripts/loading.js';

export default class LivelyHaloVivideScriptSuggestion extends HaloItem {
  initialize(){
    this.shadowRoot.getElementById('suggestion-search').addEventListener("keydown", evt => {
      this.updateList(evt.target.value);
    });
    this.updateList();
  }
  
  async updateList(search){
    const list = this.shadowRoot.getElementById('suggestion-list');
    list.innerHTML = "";
    if (!window.that || !window.that.input) return;
    const suggestions = await getMatches(JSON.stringify(window.that.input[0], (_, value) => typeof value === "object" ? value : typeof value), search);
    suggestions.forEach(s => {
      list.appendChild(<li click={() => setScript(s.url, window.that)}>{s.name}</li>)})
  }
}