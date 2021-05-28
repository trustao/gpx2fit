# GPX to FIT

## usage

#### node
```javascript
import {gpx2fitEncoder} from 'gpx2fit'
import {outputFile} from 'gpx2fit/lib/output'

gpx2fitEncoder(gpxString).then(encoder => outputFile(encoder, 'fileName'));
```

#### web
```javascript
  import {gpx2fitEncoder} from 'gpx2fit'
  gpx2fitEncoder(gpxString).then(encoder => {
    const blob = encoder.createBlob()
    const url = URL.createObjectURL(blob);
    const anchorElement = document.createElement('a');
    anchorElement.download = `test.fit`;
    anchorElement.href = url;
    anchorElement.click();
  })
```


## API

#### gpx2fitEncoder: (gpxString: string): Promise<FitEncoder>
```javascript
import {gpx2fitEncoder} from 'gpx2fit'
import {outputFile} from 'gpx2fit/lib/output'

const encoder = gpx2fitEncoder(gpxString);
outputFile(encoder, 'file');
```

#### FitEncoder

* writeMessage: (name: string, values: Record<string, any>) => void;
```javascript
import {FitEncoder} from 'gpx2fit'

const encoder = new FitEncoder();
encoder.writeMessage('record', {
    altitude: 31.6,
    cadence: 67,
    distance: 6.27,
    heart_rate: 129,
    position_lat: 39.836671,
    position_long: 116.5075257,
    speed: 5.963,
    temperature: 20,
    timestamp: 1620512424000,
  });
encoder.header
encoder.trailer
encoder.msgBuffers
encoder.dataArrayBuffer
encoder.createBlob()
```
* createBlob: () => Blob; *only web*

* dataArrayBuffer: ArrayBuffer[];
fit file ArrayBuffer;

* header: ArrayBuffer
* trailer: ArrayBuffer
* msgBuffers: ArrayBuffer[]
