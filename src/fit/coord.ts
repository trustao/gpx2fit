import coordtransform from 'coordtransform';

coordtransform.bod09towgs84 = function (...args) {
  return coordtransform.bd09togcj02(...coordtransform.gcj02towgs84(...args))
}


export function transformCoord(lon: number, lat: number) {
  const point = coordtransform.bod09towgs84(lon, lat);
  return {lon: point[0], lat: point[1]}
}
