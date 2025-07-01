// Ctrl-S to run this file
// Ctrl-Shift-Alt-P to add a probe to beginning of a selection

// Probes show you its latest value and how often its code path was hit
// Right-click the probe to examine its last 10 values

let a = __probes__['using-probes 1 533bf53b'] = 1

function inc(by) {
  __probes__['using-probes 7 148e91c1'] = a += by
  return a
}

__probes__['using-probes 14 855f7b40'] = inc(2)
__probes__['using-probes 15 34a84349'] = inc(3)

__probes__['using-probes 10 89dbecf8'] = <span id='my-span' class='foo bar'></span>
