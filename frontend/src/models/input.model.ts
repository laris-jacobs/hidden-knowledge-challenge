export interface Input {
  actionId?: string;
  itemId?: string;
  qty?: number;
}

export interface Output {
  actionId?: string;
  itemId?: string;
  qty?: number;
}
export interface Source {
  actionId?: string;
  sourceId?: string;
}
export interface Item{
  actionTypeId?: string;
  id?: string;
  imageUrl?: string;
  inputs?: Input[];
  outputs?: Output[];
  sources?: Source[];
  station?: string;
}
