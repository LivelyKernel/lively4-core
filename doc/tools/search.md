# Search

Search files ([indexed in local indexDB](../files/)). Can be disabled via

<script>
var pref = "FileIndex"
var toggle = (<div> [Preference] 
  <b> {lively.preferences.shortDescription(pref)}:</b>
  <button click={() => {
    lively.preferences.set(pref, !lively.preferences.get(pref))
    toggle.querySelector("button").textContent = lively.preferences.get(pref)
  }}>{lively.preferences.get(pref)}</button>
</div>)
toggle
</script>

When using the local index is disabled, the search will fall back to a "grep" based server version. 

![tools](media/tools.drawio)

![](media/search.png){width=400px}


