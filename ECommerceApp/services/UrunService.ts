import { API_CONFIG } from '@/config/api';
import { Urun } from '@/types/Urun';
import axios from 'axios';

export const urunleriGetir = async (): Promise<Urun[]> => { 
  const response = await axios.get<Urun[]>(`${API_CONFIG.BASE_URL}/urun`);
  return response.data;
};