import typescript from 'rollup-plugin-typescript2';
import { terser } from "rollup-plugin-terser";

export default {
  input: ['src/client.ts', "src/output.ts"],
  output: {
    dir: 'lib',
    format: 'cjs'
  },
  plugins: [
    typescript(),
    terser()
  ]
};
