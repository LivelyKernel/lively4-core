import { runBenchmark } from './benchmark.js'

describe('COP Benchmark', function () {
    it('runs', function (done) {
        this.timeout(300000)
        runBenchmark(done)
    })
})
