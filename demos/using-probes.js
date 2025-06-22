var a = __probes__['using-probes 1 533bf53b'] = 25

function inc(by) {
  __probes__['using-probes 4 d9ef9c05'] = a += by
}

inc(2)
inc(3)

__probes__['using-probes 10 89dbecf8'] = <span id='my-span' class='foo bar'></span>
