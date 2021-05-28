import msgDefns from './msgDefns';
import { FieldSize, MessageField, MessageFieldDef, MessageFieldDefItem } from './interface';
import { encodedStrSize, getTypeDescriptor } from './types';

export class FitMessage {

  msgNum: number;
  fields: MessageField[];
  fieldsSize: FieldSize[];
  constructor(
    public name: string,
    public localNum: number,
    values: Record<string, any>
  ) {
    const {num, fields} = msgDefns[name];
    this.msgNum = num;
    this.fields = this.createFields(fields, values);
    this.fieldsSize = this.getFieldSize();
  }

  isSameMsg(msg: FitMessage) {
    return this.msgNum === msg.msgNum &&
      this.localNum === msg.localNum &&
      this.fieldsSize?.length === msg.fieldsSize?.length &&
      this.fieldsSize.every((item, i) => this.isSameSize(item, msg.fieldsSize[i]))
  }

  isSameSize(a: FieldSize, b: FieldSize) {
    return a.number === b.number && a.size === b.size && a.baseType === b.baseType;
  }

  createFields (fieldDefs: MessageFieldDefItem[], fieldValues: Record<string, any>): MessageField[] {
    return fieldDefs
      .map((fieldDef) => ({ ...fieldDef, value: fieldValues[fieldDef.name] }))
      .filter(({ value }) => value !== undefined);
  }

  getFieldSize(): FieldSize[] {
    return this.fields.map(({ type, number, value }) => {
      const {size, baseType} = getTypeDescriptor(type);
      return {number, baseType, size: type === 'string' ? encodedStrSize(value) : size}
    })
  }

  getSizeBuff(): ArrayBuffer {
    const size = this.fieldsSize;
    const length =  6 + 3 * size.length;
    const dv = new DataView(new ArrayBuffer(length));

    dv.setUint8(0, 0x40 | this.localNum);
    dv.setUint8(2, 1);
    dv.setUint16(3, this.msgNum);
    dv.setUint8(5, size.length);

    let offset = 6;
    for(const item of size) {
      dv.setUint8(offset++, item.number);
      dv.setUint8(offset++, item.size);
      dv.setUint8(offset++, item.baseType);
    }

    return dv.buffer;
  }

  getDataBuff(): ArrayBuffer {
    const length = this.fieldsSize.reduce((l, { size }) => l + size, 1);
    const dv = new DataView(new ArrayBuffer(length));

    dv.setUint8(0, this.localNum);
    let dvOffset = 1;
    for (const { value, type, units, scale, offset } of this.fields) {
      const { size, mapValue, setValue } = getTypeDescriptor(type);
      let val = mapValue ? mapValue(value) : value;
      if (units === 'semicircles') {
        val = Math.round((value / 180) * 0x80000000)
      }
      if (isNum(offset)) {
        val -= offset;
      }
      if (isNum(scale)) {
        val *= scale
      }
      setValue.call(dv, dvOffset, val);
      dvOffset += size;
    }

    return dv.buffer;
  }
}

function isNum(n) {
  return typeof n === 'number' && isFinite(n);
}
