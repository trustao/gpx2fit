import typeMaps from './typeMaps';
import { TypeDescriptor } from './interface';

const sint8 = {
  size: 1,
  baseType: 1,
  setValue: DataView.prototype.setInt8
};

const uint8 = {
  size: 1,
  baseType: 2,
  setValue: DataView.prototype.setUint8
};

const sint16 = {
  size: 2,
  baseType: 0x83,
  setValue: DataView.prototype.setInt16
};

const uint16 = {
  size: 2,
  baseType: 0x84,
  setValue: DataView.prototype.setUint16
};

const sint32 = {
  size: 4,
  baseType: 0x85,
  setValue: DataView.prototype.setInt32
};

const uint32 = {
  size: 4,
  baseType: 0x86,
  setValue: DataView.prototype.setUint32
};

const string = {
  size: 0,
  baseType: 7,
  mapValue: (value) => Array.from(encodedStr(value) as ArrayLike<number>),
  setValue: dvSetUint8Array
};

const distance = {
  ...uint32,
  mapValue: (value) => Math.round(value * 100)
};

const date_time = {
  ...uint32,
  mapValue: (value) => Math.round(value / 1000) - 631065600 // "1989-12-31T00:00"
};


const types: {[k: string]: TypeDescriptor} = Object.keys(typeMaps).reduce((res, k) => {
  res[k] = typeDescriptor(k);
  return res;
}, {});
Object.assign(types, {
  sint8,
  uint8,
  sint16,
  uint16,
  sint32,
  uint32,
  string,
  distance,
  date_time
})

export function getTypeDescriptor(type: string): TypeDescriptor {
  return types[type];
}

function dvSetUint8Array(offset, values): void {
  const dv = this;
  for (const value of values) {
    dv.setUint8(offset++, value);
  }
}

export function encodedStrSize(str) {
  return Array.from(encodedStr(str)).length;
}

function* encodedStr(s): any {
  for (const codePoint of codePoints(s)) {
    if (codePoint < 0x80) {
      yield codePoint;
    } else {
      const bytes = [codePoint & 0x3f, (codePoint >> 6) & 0x3f, (codePoint >> 12) & 0x3f, codePoint >> 18];
      if (codePoint < 0x800) {
        yield 0xc0 | bytes[1];
        yield 0x80 | bytes[0];
      } else if (codePoint < 0x10000) {
        yield 0xe0 | bytes[2];
        yield 0x80 | bytes[1];
        yield 0x80 | bytes[0];
      } else {
        yield 0xf0 | bytes[3];
        yield 0x80 | bytes[2];
        yield 0x80 | bytes[1];
        yield 0x80 | bytes[0];
      }
    }
  }
  yield 0;
}

function* codePoints(s): any {
  for (let i = 0; i < s.length; i++) {
    const codePoint = s.codePointAt(i);
    if (codePoint > 0xffff) {
      i++; // skip 2nd surrogate pair
    }
    yield codePoint;
  }
}

function typeDescriptor(name: string): TypeDescriptor {
  const enum_map = typeMaps[name];
  return {
    size: 1,
    baseType: 0,
    mapValue: (value) => enum_map[value],
    setValue: DataView.prototype.setUint8
  };
}
