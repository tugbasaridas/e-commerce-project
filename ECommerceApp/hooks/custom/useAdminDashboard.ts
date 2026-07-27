import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import api from '../../config/api';

export interface EnCokSatanUrun {
  urunId: number;
  urunAdi: string;
  resimUrl?: string;     // YENİ: Backend'den gelecek ürün resmi
  magazaAdi?: string;    // YENİ: Backend'den gelecek satıcı/mağaza adı
  toplamSatisAdedi: number;
  toplamKazanc: number;
}

export interface DashboardVeri {
  aktifUrun: number;
  pasifUrun: number;
  toplamMusteri: number; 
  toplamSatici: number;  
  bekleyenSiparisler: number;
  toplamCiro: number;
  platformKazanci: number; // YENİ: Senin cebine girecek %10 komisyon toplamı
  aylikCiro: number;
  basariliSiparisSayisi: number;
  enCokSatanlar: EnCokSatanUrun[];
}

export const useAdminDashboard = () => {
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardVeri>({
    aktifUrun: 0, 
    pasifUrun: 0, 
    toplamMusteri: 0, 
    toplamSatici: 0, 
    bekleyenSiparisler: 0,
    toplamCiro: 0, 
    platformKazanci: 0, 
    aylikCiro: 0, 
    basariliSiparisSayisi: 0, 
    enCokSatanlar: []
  });
  
  const [loading, setLoading] = useState(true);
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

      const adminIsminiGetir = async () => {
        try {
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
      router.replace('/' as any); 
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
    }
  };

  return { stats, loading, oturumuKapat, yenile: fetchDashboardVerileri, adminAdi };
};