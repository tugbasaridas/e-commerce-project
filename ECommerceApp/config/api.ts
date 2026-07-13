import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// Not: Eğer token'ı expo-secure-store ile kaydediyorsan, import'u ve getItem kısmını ona göre değiştirmelisin.

export const API_CONFIG = {
  BASE_URL: 'http://192.168.0.23:5110/api', 
  TIMEOUT: 10000,
};

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});
// config/api.ts dosendaki interceptor kısmını buna benzer şekilde güvenli yap:
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    
    // KRİTİK KONTROL: Token varsa ve "null" string değilse başlığa ekle
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Eğer token silindiyse, eski isteklerden kalan başlığı tamamen temizle (Misafir Modu)
      delete config.headers.Authorization;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;