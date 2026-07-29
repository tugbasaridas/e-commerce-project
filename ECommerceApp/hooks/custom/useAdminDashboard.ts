import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import api from '../../config/api';

export interface EnCokSatanUrun {
  urunId: number;
  urunAdi: string;
  resimUrl?: string;     
  magazaAdi?: string;    
  toplamSatisAdedi: number;
  toplamKazanc: number;
}

export interface DashboardVeri {
  aktifUrun: number;
  pasifUrun: number;
  toplamMusteri: number; 
  toplamSatici: number;  
  toplamCiro: number;
  platformKazanci: number; 
  aylikCiro: number;
  basariliSiparisSayisi: number;
  enCokSatanlar: EnCokSatanUrun[];
  
  // YENİ: BİLDİRİM SAYILARI EKLENDİ
  bekleyenSiparis: number;
  bekleyenMagaza: number;
  bekleyenUrun: number;
  bekleyenDestek: number;
}

export const useAdminDashboard = () => {
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardVeri>({
    aktifUrun: 0, 
    pasifUrun: 0, 
    toplamMusteri: 0, 
    toplamSatici: 0, 
    toplamCiro: 0, 
    platformKazanci: 0, 
    aylikCiro: 0, 
    basariliSiparisSayisi: 0, 
    enCokSatanlar: [],
    
    bekleyenSiparis: 0,
    bekleyenMagaza: 0,
    bekleyenUrun: 0,
    bekleyenDestek: 0
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