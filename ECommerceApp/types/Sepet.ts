
import { Urun } from './Urun';

export interface SepetUrun {
  id: number;
  urunId: number;
  miktar: number;
  urunler: Urun; 
}