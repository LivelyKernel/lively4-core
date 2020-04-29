import { allBenchmarks, runBenchmarks } from './benchmark.js'
import * as benchmarks from './benchmark.js'

describe('All benchmarks', function () {
    it('runs all benchmarks', function () {
        this.timeout(300000)
        runBenchmarks(allBenchmarks())
    })
})

describe('Layered methods slowdown', function () {
    this.timeout(60000)
    
    function printQuartiles(sample) {
        sample.sort()
        console.log('   min   ' + sample[0])
        console.log('low qart ' + sample[sample.length / 4 >> 0])
        console.log('> median ' + sample[sample.length / 2 >> 0] + ' <')
        console.log('upr qart ' + sample[sample.length * 3 / 4 >> 0])
        console.log('   max   ' + sample[sample.length - 1])
    }

    it('unlayered', function () {
        const workload = benchmarks.makeWorkloadWithoutLayersAndParameters()
        const timesamples = benchmarks.benchmark(workload)
        printQuartiles(timesamples)
    });

    it('layered', function () {
        const workload = benchmarks.makeWorkloadWithDisabledLayersWithoutParameters()
        const timesamples = benchmarks.benchmark(workload)
        printQuartiles(timesamples)
    });
})
