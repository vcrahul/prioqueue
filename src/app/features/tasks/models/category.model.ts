export interface Category {
  id?: number;
  name: string;
  color: string;
  createdAt: number;
}

export const PRESET_COLORS = [
  '#e05252',  // red
  '#e07838',  // orange
  '#e0b84f',  // amber
  '#b3d44e',  // lime
  '#4ec87a',  // green
  '#3dbccc',  // teal
  '#4f8fe0',  // blue
  '#6466e0',  // indigo
  '#9b65e0',  // violet
  '#d45fc8',  // pink
  '#e05a8a',  // rose
  '#c9a15a',  // gold
  '#7c8194',  // slate
  '#9bafcc',  // steel blue
  '#c8ccd8',  // silver
];
