# Polymorphic-Identifiers

```JavaScript
'pi';
import { PIScheme } from 'polymorphic-identifiers';

// example scheme
class qa extends PIScheme {
  read() {
    const { elements } = this.parse();
    return elements;
  }
  write(v) {
    const { elements, type, prop } = this.parse();

    if (type === 'style') {
      return elements.forEach(e => e.style[prop] = v)
    }
    elements.forEach(e => e.innerHTML = v)
  }

  // helper
  parse() {
    const [selector, type, prop] = this.strings.first.split('/');
    const elements = this.query(selector);
    return { selector, type, prop, elements };
  }
  query(selector) {
    return Array.from(document.querySelectorAll(selector));
  }
}

// usage
// calls `read`
qa`lively-window`.forEach(lw => lively.showElement(lw))

// assignments with <<
// calls `write`
qa`#rect` << 'html'
qa`#rect/style/border-color` << 'green'
```
