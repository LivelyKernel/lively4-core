import { allBenchmarks, runBenchmarks } from './benchmark.js'

describe('All benchmarks', function () {
    it('runs', function () {
        this.timeout(300000)
        runBenchmarks(allBenchmarks())
    })
})
