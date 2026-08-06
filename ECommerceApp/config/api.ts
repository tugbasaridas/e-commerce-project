import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router'; // YENİ: Başarısızlıkta yönlendirme için eklendi

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

// ÇOKLU İSTEK YÖNETİMİ İÇİN DEĞİŞKENLER (Kuyruk Mantığı)
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function, reject: Function }> = [];

// Kuyrukta bekleyen tüm istekleri yeni token ile çalıştırır veya hata fırlatır
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. İSTEK (REQUEST) İNTERCEPTOR'U
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. CEVAP (RESPONSE) İNTERCEPTOR'U
api.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;

    // Eğer hata 401 ise ve bu istek henüz tekrar edilmediyse
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // EĞER ZATEN YENİLEME İŞLEMİ SÜRÜYORSA: Gelen yeni isteği sıraya (kuyruğa) al
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error("Refresh token bulunamadı.");
        }

        const refreshResponse = await axios.post(`${API_CONFIG.BASE_URL}/kullanicilar/refresh-token`, {
          refreshToken: refreshToken
        });

        const yeniToken = refreshResponse.data.token || refreshResponse.data.Token;
        const yeniRefreshToken = refreshResponse.data.refreshToken || refreshResponse.data.RefreshToken;

        await AsyncStorage.setItem('userToken', yeniToken);
        await AsyncStorage.setItem('refreshToken', yeniRefreshToken);

        // Kuyrukta bekleyen diğer isteklere "Müjde, token geldi!" de ve onları çalıştır
        processQueue(null, yeniToken);

        // Orijinal başarısız olan isteği yeni token ile tekrar çalıştır
        originalRequest.headers.Authorization = `Bearer ${yeniToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh token da patladıysa: Kuyruktakilere iptal haberi ver
        processQueue(refreshError, null);
        
        // Verileri temizle
        await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'userRole']);
        
        // Kullanıcıyı acımasızca ama güvenli bir şekilde Giriş sayfasına postala
        router.replace('/(auth)/giris' as any);
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;