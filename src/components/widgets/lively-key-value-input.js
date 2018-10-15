
export default class KeyValueInput extends HTMLDivElement {
    attachedCallback() {
      let body = '<span class="lively-key-value-input-key"></span><input class="lively-key-value-input-value" value=""><span class="lively-key-value-input-status ok"></span>';
      this.innerHTML = body;
      this.keyElement = this.querySelector('.lively-key-value-input-key');
      this.valueElement = this.querySelector('.lively-key-value-input-value');
      this.statusElement = this.querySelector('.lively-key-value-input-status');

      this.valueElement.addEventListener('keyup', (e) => { this.keyUpHandler(e); });
      this.valueElement.addEventListener('input', (e) => { this.inputEventHandler(e); });
      this.valueElement.addEventListener('change', (e) => { this.changeEventHandler(e); });
      this.valueElement.addEventListener('focus', (e) => { this.gotFocus(e); });
    }

    keyUpHandler(e) {
      switch(e.keyCode) {
        case(13): //enter
          this.commit();
          break;
        case(27): //esc
          this.valueElement.value = this.oldValue;
          this.updateStatus();
          break;

        default:
          break;
      }
    }

    inputEventHandler(e) {
      // change status LED
      this.updateStatus();
    }

    changeEventHandler(e) {
      // save event
      this.commit();
    }

    clickHandler(e) {
      this.valueElement.setSelectionRange();
    }

    gotFocus(e) {
      // select the whole content
      this.valueElement.select();
    }

    commit() {
      let ev = new CustomEvent('commit', {
        bubbles: true,
        detail: {
          key: this._key,
          value: this.valueElement.value,
          oldValue: this.oldValue
        },
        targetElement: this
      });

      this.oldValue = this.valueElement.value;
      this.updateStatus();

      this.dispatchEvent(ev);
    }

    updateStatus() {
      var classList = this.statusElement.classList;
      classList.remove("ok");
      classList.remove("changed");

      if(this.valueElement.value == this.oldValue) {
        classList.add("ok");
      } else {
        classList.add("changed");
      }
    }

    updateType() {
      switch (this.type) {
        case 'number':
          this.valueElement.setAttribute('type', 'number');
          break;
        case 'boolean':
          this.valueElement.setAttribute('type', 'checkbox');
          break;
        case 'string':
        default:
          break;
      }

      if (this.readonly) {
        this.valueElement.setAttribute('readonly', 'readonly');
        this.valueElement.setAttribute('disabled', 'disabled');
      }
    }

    get key() {
      return this._key;
    }

    set key(key) {
      this._key = key;
      this.keyElement.innerHTML = key;
    }

    get value() {
      return this.valueElement.value;
    }

    set value(value) {
      this.oldValue = value;
      this.valueElement.value = value;
    }

    get type() {
      return this._type;
    }

    set type(value) {
      this._type = value;
      this.updateType();
    }

    get readonly() {
      return this._readonly;
    }
    set readonly(value) {
      this._readonly = value;
      this.updateType();
    }
  }