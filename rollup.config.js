import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    entry: 'aexpr.js',
    //format: 'cjs',
    plugins: [
        nodeResolve()
    ],
    dest: 'bundle3.js' // equivalent to --output
};
