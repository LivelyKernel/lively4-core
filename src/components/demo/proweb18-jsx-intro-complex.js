import Morph from 'src/components/widgets/lively-morph.js';
import { flatMap, upperFirst } from 'utils';

export default class Proweb18JsxIntroComplex extends Morph {
  async initialize() {
    this.windowTitle = "Proweb18JsxIntroComplex";
    
    this.innerHTML = "";

    function labelFor(option) {
      return upperFirst.call(option);
    }
    function divWith(content) {
      const div = <div></div>;
      div.innerHTML = content;
      return div;
    }
    const options = ['email', 'phone', 'mail'];

    // hardcoded
    this.appendChild(divWith(`<form>
      <p>Please select your preferred contact method (Reference):</p>
      <div>
        <input type="radio" id="contactChoice0"
         name="contact" value="email">
        <label for="contactChoice0">Email</label>

        <input type="radio" id="contactChoice1"
         name="contact" value="phone">
        <label for="contactChoice1">Phone</label>

        <input type="radio" id="contactChoice2"
         name="contact" value="mail">
        <label for="contactChoice2">Mail</label>
      </div>
      <button type="submit">Submit</button>
    </form>`));

    // using dedicated API: document.createElement
    let hint = document.createElement('p');
    hint.textContent = 'Please select your preferred contact method (.createElement):';

    let choices = document.createElement('div');
    options.forEach((option, index) => {
      let id = 'contactChoice' + index;

      let input = document.createElement('input');
      input.setAttribute('type', 'radio');
      input.setAttribute('id', id);
      input.setAttribute('name', 'contact');
      input.setAttribute('value', option);
      choices.appendChild(input);

      let label = document.createElement('label');
      label.setAttribute('for', id);
      label.textContent = labelFor(option);
      choices.appendChild(label);
    });

    let button = document.createElement('button');
    button.setAttribute('type','submit');
    button.textContent = 'Submit';

    let form = document.createElement('form');
    form.appendChild(hint);
    form.appendChild(choices);
    form.appendChild(button);

    this.appendChild(form);

    // using innerHTML/dynamic
    function radioButtonFor(option, index) {
      const id = `contactChoice${index}`;
      return `<input type="radio"
        id="${id}"
        name="contact" value="${option}" />
        <label for="${id}">${labelFor(option)}</label>`;
    }

    this.appendChild(divWith(`<form>
      <p>Please select your preferred contact method (innerHTML):</p>
      <div>${
        options.map(radioButtonFor).join('')
      }</div>
      <button type="submit">Submit</button>
    </form>`));

    // JSX
    this.appendChild(<form>
      <p>Please select your preferred contact method (JSX):</p>
      <div>
        {...options::flatMap((option, index) => [
          <input type="radio" id={'contactChoice' + index} name="contact" value={option} />,
          <label for={'contactChoice' + index}>{labelFor(option)}</label>
        ])}
      </div>
      <button type="submit">Submit</button>
    </form>);
  }
}