export interface Input {
  action_id?: string;
  item?: Item;
  qty?: number;
}

export interface Output {
  action_id?: string;
  item?: Item;
  qty?: number;
}
export interface Source {
  action_id?: string;
  source_id?: string;
  id?: string;
  name?: string;
  note?: number;
  trust?: string;
}
export interface Action {
  action_type_id?: string;
  id?: string;
  image_url?: string;
  inputs?: Input[];
  outputs?: Output[];
  sources?: Source[];
  station?: string;
}

export interface Item{
  base_harvest?: string;
  id?: string;
  image_url?: string;
  is_base?: string;
  name?: string;
}

export interface Payload {
  selections: string[];
  toggles: Record<string, boolean>
}
export interface State {
  selections: string[];
  toggles: Record<string, boolean>
}
