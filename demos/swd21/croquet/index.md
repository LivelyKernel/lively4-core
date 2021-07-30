# Croquet

<script>
  <a click={() => window.open("https://lively-kernel.org/lively4/swd21-croquet/start.html")}>dev repository</a>
</script>

## Notes / Idea

- use iFrames for clean environment

## Readme

[README](./README.md).

## Scenarios

<script>
  <button style="font-weight:bold; font-size:1em, padding-left:20px" click={async () => {
    var url = "https://lively-kernel.org/lively4/swd21-croquet/demos/swd21/croquet/counter/croquetCounter.md"
    var comp = await lively.openBrowser(url, true)
    comp.parentElement.toggleMaximize()
  }}>Counter Example
  </button>
</script>

## References

- <https://croquet.io/sdk/docs/>
- <https://threejs.org/>