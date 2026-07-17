import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import api from '../../config/api';

export interface EnCokSatanUrun {
  urunId: number;
  urunAdi: string;
  toplamSatisAdedi: number;
  toplamKazanc: number;
}

export interface DashboardVeri {
  toplamUrun: number;
  toplamKullanici: number;
  bekleyenSiparisler: number;
  toplamCiro: number;
  aylikCiro: number;
  basariliSiparisSayisi: number;
  enCokSatanlar: EnCokSatanUrun[];
}

export const useAdminDashboard = () => {
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardVeri>({
    toplamUrun: 0, toplamKullanici: 0, bekleyenSiparisler: 0,
    toplamCiro: 0, aylikCiro: 0, basariliSiparisSayisi: 0, enCokSatanlar: []
  });
  
  const [loading, setLoading] = useState(true);
  
  // YENİ: Admin adını tutacağımız state
  const [adminAdi, setAdminAdi] = useState<string>('Yönetici'); 

  const fetchDashboardVerileri = async () => {
    try {
      const response = await api.get('/admin/dashboard'); 
      setStats(response.data);
    } catch (error) {
      console.error("Dashboard verisi çekilirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardVerileri();

      // YENİ: AsyncStorage'dan ismi çekme işlemi
      const adminIsminiGetir = async () => {
        try {
          // NOT: Giriş yaparken ismini 'adSoyad' olarak mı kaydettin? 
          // Eğer farklıysa ('isim', 'kullaniciAdi' vb.) burayı ona göre değiştirmelisin.
          const isim = await AsyncStorage.getItem('adSoyad'); 
          if (isim) {
            setAdminAdi(isim);
          }
        } catch (error) {
          console.log("İsim okunamadı", error);
        }
      };
      adminIsminiGetir();

    }, [])
  );

  const oturumuKapat = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      // İstersen çıkışta ismi de silebilirsin: await AsyncStorage.removeItem('adSoyad');
      router.replace('/' as any); 
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
    }
  };

  // adminAdi'ni de dışarı aktarıyoruz
  return { stats, loading, oturumuKapat, yenile: fetchDashboardVerileri, adminAdi };
};