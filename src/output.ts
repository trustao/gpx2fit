import {FitEncoder} from "./fit/FitEncoder";

export function outputFile(encoder: FitEncoder, name: string): void {
  if (typeof window === 'undefined') {
    writerFit(encoder, name);
  } else {
    downloadFit(encoder, name);
  }
}

function writerFit(encoder: FitEncoder, name: string) {
  const fs = require('fs');
  const path = require('path');
  const {Buffer} = require('buffer');
  const buffers = encoder.dataArrayBuffer;
  const dv = Buffer.concat(buffers.map(i => Buffer.from(i)));
  fs.writeFileSync(path.resolve(process.cwd(), './' + name + '.fit'), dv, {encoding: 'binary'})
}

function downloadFit(encoder: FitEncoder, name: string) {
  const blob = encoder.createBlob();
  const a = document.createElement('a');
  a.download = name + '.fit';
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
