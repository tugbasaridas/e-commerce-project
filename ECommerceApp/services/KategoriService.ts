import api from '@/config/api';

export const kategorileriGetir = async () => {
  try {
    const response = await api.get('/kategori'); 
    return response.data;
  } catch (error) {
    console.log("Kategorileri Getirme Hatası:", error);
    return [];
  }
};