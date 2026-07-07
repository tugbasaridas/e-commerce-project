import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import { Urun } from '@/types/Urun'; 

export const urunleriGetir = async (): Promise<Urun[]> => { 
  const response = await axios.get<Urun[]>(`${API_CONFIG.BASE_URL}/urunler`);
  return response.data;
};