export interface MessageFieldDef {
  num: number;
  fields: MessageFieldDefItem[];
}

export interface MessageFieldDefItem {
  name: string;
  number: number;
  type: string;
  scale: number;
  offset: number;
  units: string;
}

export interface MessageField extends MessageFieldDefItem {
  value: any;
}

export interface FieldSize {
  number: number;
  size: number;
  baseType: number;
}

export interface TypeDescriptor {
  size: number;
  baseType: number;
  mapValue?: (v: any) => any;
  setValue: Function;
}
