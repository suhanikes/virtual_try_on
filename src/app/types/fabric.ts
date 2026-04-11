export interface FabricMaps {
  colorMapUrl: string;
  normalMapUrl: string;
  roughnessMapUrl: string;
  displacementMapUrl: string;
  aoMapUrl?: string;
}

export interface FabricOption {
  id: string;
  label: string;
  previewUrl: string;
  repeat: [number, number];
  maps: FabricMaps;
}
