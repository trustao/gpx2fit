import {FitEncoder} from "./fit/FitEncoder";
import {GPXInfo, parseGpx} from "./gpx/GpxParser";

export async function gpx2fitEncoder(str: string): Promise<FitEncoder> {
  const gpx = await parseGpx(str);
  return encodeFit(gpx);
}

function encodeFit(gpx: GPXInfo): FitEncoder {
  const start = gpx.points[0];
  const finish = gpx.points[gpx.points.length - 1];

  const encoder = new FitEncoder();
  encoder.writeFileId({type: 'activity', time_created: start.time});

  encoder.writeEvent({
    timestamp: start.time,
    event: 'timer',
    event_type: 'start',
    event_group: 0
  });

  let prev: Record<string, any> = {distance: 0, time: start.time};
  let maxS = 0;
  let movingT = 0;
  let minA = Infinity;
  let maxA = -Infinity;
  const t = [];
  for (let {lat, lon, ele, time, distance, speed, heart_rate, cadence, temperature} of gpx.points) {
    speed = speed || 0;
    const dur = Math.round((time - prev.time) / 1000);
    if (!speed && dur > 0) {
      speed = (distance - prev.distance) / dur;
    }
    if (speed > .5) {
      movingT += dur;
    }
    maxS = speed > maxS ? speed : maxS;
    minA = ele < minA ? ele : minA;
    maxA = ele > maxA ? ele : maxA;
    prev = {lat, lon, ele, time, distance, speed};
    const item = {
      timestamp: time,
      position_lat: lat,
      position_long: lon,
      altitude: ele,
      distance,
      heart_rate,
      cadence,
      speed,
      temperature
    };
    t.push(item);
    encoder.writeRecord(item);
  }


  const totalTime = Math.round((finish.time - start.time) / 1000);
  const overview = {
    event: 'lap',
    event_type: 'stop',
    sport: 'cycling',
    start_time: start.time,
    start_position_lat: start.lat,
    start_position_long: start.lon,
    avg_speed: finish.distance / movingT,
    total_moving_time: movingT,
    total_elapsed_time: totalTime,
    total_timer_time: totalTime,
    max_speed: maxS,
    max_altitude: maxA,
    min_altitude: minA,
    total_distance: finish.distance,
    total_ascent: gpx.eleGain,
    total_descent: gpx.eleLoss
  };

  encoder.writeEvent({
    timestamp: finish.time,
    event: 'timer',
    event_type: 'stop_disable_all',
    event_group: 0
  });

  encoder.writeMessage('lap', overview);
  encoder.writeMessage('session', {...overview, num_laps: 1, first_lap_index: 0});

  encoder.writeMessage('activity', {
    'timestamp': finish.time,
    'total_timer_time': overview.total_timer_time,
    'local_timestamp': finish.time,
    'num_sessions': 1,
    'type': 'manual',
    'event': 'activity',
    'event_type': 'stop'
  });


  return encoder;
}
