import { runBenchmark } from '../CopBenchmark.js'

describe('COP Benchmark', function () {
    it('runs', function (done) {
        this.timeout(300000)
        runBenchmark(done)
    })
})
