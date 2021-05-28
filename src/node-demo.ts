import fs from 'fs';
import path from "path";
import {gpx2fitEncoder} from "./gpx2fit";
import {outputFile} from "./output";

readPgx().then(v => {
  console.log('Done!')
}).catch(e => {
  console.error(e)
});

async function readPgx() {
  const pgxPath = path.resolve(process.cwd(), process.argv[process.argv.length - 1]);
  const name = path.basename(pgxPath, '.gpx');
  const encoder = await gpx2fitEncoder(fs.readFileSync(pgxPath, {encoding: 'utf-8'}));
  outputFile(encoder, name);
}

