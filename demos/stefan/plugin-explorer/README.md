# Babel Plugin Explorer Demo

The babel.js plugin explorer allows developers to live program plugins to the babel transpiler used in Lively4.
Live programming provides instant feedback on the example input.
Further, Lively's self-sustaining nature allows you to apply changes to the compiler on-the-fly, thus, affecting all future module loads without the need to restart lively.

<script>
<button click={async evt => {
    const explorer = await lively.openComponentInWindow('lively-plugin-explorer', undefined, lively.pt(1000, 800))
                explorer.livelyExample();
  }}>Start Babel Plugin Explorer</button>;
</script>

You can go to the trace visualization using the <button><i class='fa fa-search'></i></button> button in top right corner.