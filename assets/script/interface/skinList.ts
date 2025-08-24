export interface SkinList {
  skins: SkinDetail[];
}

export interface SkinDetail {
  id: number;
  name: string;
  effect_name: string;
  sprite_frame: string;
  defines: any;
}
