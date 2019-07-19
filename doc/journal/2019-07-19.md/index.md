## 2019-07-19 Abstract Web Component live programming

What works

- dependent modules are unloaded
- updateTemplate is called, ... suuuuure ;)

What does not work

- dependent list is resetted somehow, but should not
  - the root cause mgiht be that `System.import` does not work as intended
    - idea: maybe a timing issue: unloading takes time, and we do not wait long enough
- updateTemplate does not seem to work?

---

<script>
import B from './b.js';

new B().foo();
</script>

