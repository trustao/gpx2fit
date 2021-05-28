import typescript from 'rollup-plugin-typescript2';

export default {
  input: ['src/index.ts', "src/output.ts"],
  output: {
    dir: 'lib',
    format: 'cjs'
  },
  plugins: [typescript({lib: ["es5","es6","es7","es8", "es9", "dom"], target: "es5"})]
};
