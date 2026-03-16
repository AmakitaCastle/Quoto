import { FontConfig } from '@/types';

export interface FontsData {
  bodyFonts: FontConfig[];
  handwritingFonts: FontConfig[];
}

declare const fontsData: FontsData;
export default fontsData;
