export async function parseGpx(gpxString: string) {
  return await parseRoute(await parseXml(gpxString));
}

async function parseXml(xmlString: string) {
  return new Promise((resolve, reject) => {
    // const doc = parse(xmlString);
    let doc;
    if (typeof DOMParser === 'function') {
      const parser = new DOMParser(); /* global DOMParser */
      doc = parser.parseFromString(xmlString, 'application/xml');
    } else {
      const { parse } = require('node-html-parser')
      doc = parse(xmlString);
    }


    const gpx = doc.querySelector('gpx');
    console.log(gpx)
    if (gpx) {
      resolve(gpx)
    } else {
      console.error('Parse Error')
      reject('Parse Error')
    }
  });
}

function findChild(node: HTMLElement, nodeName: string): HTMLElement | null {
  return Array.from(node?.childNodes || []).find((i: HTMLElement) => i.tagName?.toUpperCase() === nodeName.toUpperCase()) as HTMLElement;
}

function haversine({ lat: lat1, lon: lon1 }, { lat: lat2, lon: lon2 }) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d;
}

function* trackPoints(trkseg: HTMLElement): Generator<Record<string, any>> {
  let lastPoint;
  let distance = 0;

  // @ts-ignore;
  for (const node of trkseg.childNodes) {
    if ( node.tagName?.toUpperCase() === 'trkpt'.toUpperCase()) {
      const lat = parseFloat(node.getAttribute('lat'));
      const lon = parseFloat(node.getAttribute('lon'));
      const ele = findChild(node, 'ele');
      const time = findChild(node, 'time');
      const extensions = findChild(node, 'extensions');

      if (lastPoint) {
        distance += haversine(lastPoint, { lat, lon });
      }

      const point: Record<string, any> = {
        lat,
        lon,
        ele: ele && parseFloat(ele.textContent),
        distance,
        time: time && Date.parse(time.textContent)
      };

      if (extensions) {
        const d = findChild(extensions, 'distance');
        if (d) point.distance = parseFloat(d.textContent);
        const track = findChild(extensions, 'gpxtpx:TrackPointExtension');
        if (track) {
          const heart_rate = findChild(track, 'gpxtpx:hr')?.textContent;
          const cadence = findChild(track, 'gpxtpx:cad')?.textContent;
          const speed = findChild(track, 'gpxtpx:speed')?.textContent;
          const temperature = findChild(track, 'gpxtpx:atemp')?.textContent;
          if (heart_rate)point.heart_rate = parseFloat(heart_rate);
          if (cadence)point.cadence = parseFloat(cadence);
          if (speed)point.speed = parseFloat(speed);
          if (temperature)point.temperature = parseFloat(temperature);
        }
      }

      lastPoint = point;
      yield point;
    }
  }
}

function* routePoints(rte: HTMLElement) {
  let lastPoint;
  let distance = 0;

  // @ts-ignore
  for (const node of rte.childNodes) {
    if (node.tagName?.toUpperCase() === 'rtept'.toUpperCase()) {
      const lat = parseFloat(node.getAttribute('lat'));
      const lon = parseFloat(node.getAttribute('lon'));
      const time = undefined;

      if (lastPoint) {
        distance += haversine(lastPoint, { lat, lon });
      }

      const point = {
        lat,
        lon,
        time,
        distance
      };

      lastPoint = point;
      yield point;
    }
  }
}

function elevationChange(points) {
  let eleGain = 0;
  let eleLoss = 0;
  let lastEle;

  for (const { ele } of points) {
    if (ele === undefined) {
      return {};
    }

    if (lastEle === undefined) {
      lastEle = ele;
      continue;
    }

    const delta = ele - lastEle;
    if (Math.abs(delta) >= 4) {
      lastEle = ele;
      if (delta > 0) {
        eleGain += delta;
      } else {
        eleLoss -= delta;
      }
    }
  }

  return { eleGain, eleLoss };
}

async function parseRoute(doc): Promise<GPXInfo> {
  const metadata = findChild(doc, 'metadata');
  const metadataName = metadata && findChild(metadata, 'name');

  const trk = findChild(doc, 'trk');
  const trkseg = trk && findChild(trk, 'trkseg');
  const trkName = trk && findChild(trk, 'name');

  const rte = findChild(doc, 'rte');
  const rteName = rte && findChild(rte, 'name');

  const name =
    (metadataName && metadataName.textContent) ||
    (trkName && trkName.textContent) ||
    (rteName && rteName.textContent) ||
    'Unnamed';
  const points = (trkseg && Array.from(trackPoints(trkseg))) || (rte && Array.from(routePoints(rte)));
  const { eleGain, eleLoss } = (points && elevationChange(points)) || {};

  return points && { name, points, eleGain, eleLoss };
}

export interface GPXInfo {
  name: string;
  points: Record<string, any>[];
  eleGain: number;
  eleLoss: number;
}
