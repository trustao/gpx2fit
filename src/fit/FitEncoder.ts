import { FitMessage } from './FitMessage';
import { crc } from './crc';

const HEADER_LEN = 14;
const PROTOCOL_VERSION = 0x10; // 1.0
const PROFILE_VERSION = 2078; // 20.78
const MAGIC = 0x2e464954; // ".FIT"

export class FitEncoder {

  localNumMap: {[k: string]: number} = {};
  fitMessages: FitMessage[] = [];
  msgBuffers: ArrayBuffer[] = [];

  get header(): ArrayBuffer {
    const dv = new DataView(new ArrayBuffer(HEADER_LEN));
    dv.setUint8(0, HEADER_LEN);
    dv.setUint8(1, PROTOCOL_VERSION);
    dv.setUint16(2, PROFILE_VERSION, true);
    dv.setUint32(4, this.dataLength, true);
    dv.setUint32(8, MAGIC);
    dv.setUint16(12, crc(dv.buffer.slice(0, 12)), true);

    return dv.buffer;
  }
  get dataLength(): number {
    return this.msgBuffers.reduce((l, msg) => l + msg.byteLength, 0);
  }
  get dataCrc(): number {
    return this.msgBuffers.reduce((l, msg) => crc(msg, l), 0);
  }
  get trailer(): ArrayBuffer {
    const dv = new DataView(new ArrayBuffer(2));
    dv.setUint16(0, this.dataCrc, true);

    return dv.buffer;
  }
  get byteLength(): number {
    return this.header.byteLength + this.dataLength + this.trailer.byteLength;
  }

  get dataArrayBuffer(): ArrayBuffer[] {
    return [
      this.header,
      ...this.msgBuffers,
      this.trailer
    ];
  }

  createBlob() {
    return new Blob(this.dataArrayBuffer, { type: 'application/octet-stream' })
  }

  writeMessage(name: string, values: Record<string, any>) {
    let localNum: number = this.localNumMap[name];
    if (localNum === undefined) {
      localNum = this.localNumMap[name] = Object.keys(this.localNumMap).length;
    }

    const msg = new FitMessage(name, localNum, values);
    // debugger
    const localMsg = this.fitMessages[localNum];
    if (!localMsg || !msg.isSameMsg(localMsg)) {
      this.msgBuffers.push(msg.getSizeBuff());
      this.fitMessages[localNum] = msg;
    }
    this.msgBuffers.push(msg.getDataBuff());
  }
  writeFileId(values: Record<string, any>) {
    this.writeMessage('file_id', values);
  }
  writeEvent(values: Record<string, any>) {
    this.writeMessage('event', values);
  }
  writeRecord(values: Record<string, any>) {
    this.writeMessage('record', values);
  }
}
