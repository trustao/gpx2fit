import {gpx2fitEncoder} from './gpx2fit';
import {outputFile} from "./output";


async function fileChange(ev) {
  const file = ev.target.files[0];
  const gpx = await readFile(file);
  const encoder = await gpx2fitEncoder(gpx);
  outputFile(encoder, file.name.replace('.gpx', ''))
}

async function readFile(file): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ({target: {result}}) => resolve(result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file, 'UTF-8');
  });
}

setTimeout(() => {
  const input = document.querySelector('input') as HTMLInputElement;
  input.onchange = fileChange;
})
