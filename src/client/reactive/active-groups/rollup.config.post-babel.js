import nodeResolve from 'rollup-plugin-node-resolve';
//import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: 'test/temp/post-babel.js',
    dest: 'test/temp/out.js',
    plugins: [
        nodeResolve({
            jsnext: true,
            main: true
        })//,
        //commonjs()
    ],
    format: 'iife'
};
