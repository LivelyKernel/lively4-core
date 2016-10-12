

export default class KeyValueMap extends HTMLDivElement {
    attachedCallback() {
      this.map = {};

    }

    set map(map) {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }

      for(let key in map) {
        let value = map[key];

        let input = document.createElement('lively-key-value-input');
        this.appendChild(input);

        input.key = key;
        if (typeof value == 'object' && typeof value.value != 'undefined') {
          input.value = value.value;
          input.type = value.type;
        } else {
          input.value = value;
          input.type = 'string';
        }

        if (value.readonly) {
          input.readonly = true;
        }
      }

      this._map = map;
    }

    get map() {
      return this._map;
    }
}
