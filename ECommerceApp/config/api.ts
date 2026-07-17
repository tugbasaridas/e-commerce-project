import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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

// 1. İSTEK (REQUEST) İNTERCEPTOR'U: Giden her isteğe Access Token ekler
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

// 2. CEVAP (RESPONSE) İNTERCEPTOR'U: 401 hatası alırsa Refresh Token ile yeni anahtar alır (YENİ EKLENDİ)
api.interceptors.response.use(
  (response) => response, // İstek başarılıysa hiçbir şeye dokunma, aynen devam et
  async (error) => {
    const originalRequest = error.config;

    // Hata 401 (Yetkisiz) ise ve bu isteği henüz tekrar denemediysek (_retry bayrağı yoksa)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Sonsuz döngüye girmeyi engelle

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        // Eğer elde refresh token yoksa mecburen çıkışa yönlendir
        if (!refreshToken) {
          throw new Error("Refresh token bulunamadı.");
        }

        // DİKKAT: Burada kendi 'api' örneğimizi DEĞİL, normal 'axios' kullanıyoruz ki döngüye girmeyelim!
        const refreshResponse = await axios.post(`${API_CONFIG.BASE_URL}/kullanicilar/refresh-token`, {
          refreshToken: refreshToken
        });

        // Backend'den gelen yeni token'ları al (C# JSON standardına göre büyük/küçük harf kontrolü)
        const yeniToken = refreshResponse.data.token || refreshResponse.data.Token;
        const yeniRefreshToken = refreshResponse.data.refreshToken || refreshResponse.data.RefreshToken;

        // Yeni token'ları telefona kaydet
        await AsyncStorage.setItem('userToken', yeniToken);
        await AsyncStorage.setItem('refreshToken', yeniRefreshToken);

        // Başarısız olan orijinal isteğin başlığına yepyeni Access Token'ı ekle
        originalRequest.headers.Authorization = `Bearer ${yeniToken}`;
        
        // Orijinal isteği (kullanıcının ruhu bile duymadan) tekrar çalıştır!
        return api(originalRequest);
        
      } catch (refreshError) {
        // Eğer Refresh Token da süresi dolmuşsa (7 gün girilmediyse) veya hatalıysa, her şeyi temizle
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('userRole');
        
        // Kullanıcı giriş ekranına düşecek
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;