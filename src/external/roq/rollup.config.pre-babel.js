import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
//import * as path from 'path';
import multiEntry from 'rollup-plugin-multi-entry';

export default {
    entry: 'test/**/!(layer)*.spec.js',
    dest: 'test/temp/pre-babel.js',
    external: ['aexpr-source-transformation-propagation'],
    plugins: [
        nodeResolve({
            jsnext: true,
            main: true
        }),
        commonjs(),
        multiEntry()
    ]
};
