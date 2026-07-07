import { Kategori } from '@/types/Urun';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';
import api from '../../config/api';

export default function AdminUrunGuncelle() {
  const router = useRouter();
  
  // URL'den gelen ürün id parametresini yakalıyoruz
  const { id } = useLocalSearchParams();

  // Form Stateleri
  const [ad, setAd] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [fiyat, setFiyat] = useState('');
  const [stok, setStok] = useState('');
  const [resimUrl, setResimUrl] = useState('');
  const [seciliKategoriId, setSeciliKategoriId] = useState<number | null>(null);
  
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [guncellemeLoading, setGuncellemeLoading] = useState(false);

  useEffect(() => {
    if (id) {
      sayfaVerileriniYukle();
    } else {
      Alert.alert("Hata", "Ürün ID bilgisi bu sayfaya ulaşmadı.");
      setLoading(false); 
    }
  }, [id]);

  const sayfaVerileriniYukle = async () => {
    try {
      
      const [kategoriResponse, urunResponse] = await Promise.all([
        api.get('/kategoriler'),
        api.get(`/urunler/${id}`)
      ]);

      setKategoriler(kategoriResponse.data);

      const urun = urunResponse.data;
      setAd(urun.ad);
      setAciklama(urun.aciklama || '');
      setFiyat(urun.fiyat.toString());
      setStok(urun.stok?.toString() || '0'); 
      setResimUrl(urun.resimUrl || '');
      setSeciliKategoriId(urun.kategoriId);

    } catch (error: any) {
      console.error("Veriler yüklenirken backend hatası oluştu:", error);
      Alert.alert(
        "Backend Hatası", 
        error.message || "İsteklerden biri başarısız oldu veya backend yanıt vermiyor."
      );
    } finally {
      setLoading(false);
    }
  };

  const guncelle = async () => {
    if (!ad || !fiyat || !stok || !seciliKategoriId) {
      Alert.alert("Uyarı", "Lütfen zorunlu alanları doldurun.");
      return;
    }

    setGuncellemeLoading(true);
    try {
      const guncelUrunData = {
        ad: ad,
        aciklama: aciklama,
        fiyat: parseFloat(fiyat),
        stok: parseInt(stok, 10),
        resimUrl: resimUrl,
        kategoriId: seciliKategoriId
      };

      await api.put(`/urunler/${id}`, guncelUrunData);
      
      Alert.alert("Başarılı", "Ürün başarıyla güncellendi!", [
        { text: "Tamam", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Ürün güncellenirken hata:", error);
      Alert.alert("Hata", "Ürün güncellenemedi.");
    } finally {
      setGuncellemeLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF9F00" />
        <Text style={styles.loadingText}>Ürün bilgileri getiriliyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Üst Bilgi Başlığı */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ürünü Düzenle</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
        
        {/* Ürün Adı */}
        <View style={styles.inputGrup}>
          <Text style={styles.label}>Ürün Adı <Text style={styles.zorunlu}>*</Text></Text>
          <TextInput 
            style={styles.input}
            value={ad}
            onChangeText={setAd}
          />
        </View>

        {/* Fiyat ve Stok */}
        <View style={styles.yanYanaGrup}>
          <View style={[styles.inputGrup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Fiyat (TL) <Text style={styles.zorunlu}>*</Text></Text>
            <TextInput 
              style={styles.input}
              keyboardType="numeric"
              value={fiyat}
              onChangeText={setFiyat}
            />
          </View>
          
          <View style={[styles.inputGrup, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>Stok Adedi <Text style={styles.zorunlu}>*</Text></Text>
            <TextInput 
              style={styles.input}
              keyboardType="numeric"
              value={stok}
              onChangeText={setStok}
            />
          </View>
        </View>

        {/* Kategori Seçimi */}
        <View style={styles.inputGrup}>
          <Text style={styles.label}>Kategori <Text style={styles.zorunlu}>*</Text></Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kategoriScroll}>
            {kategoriler.map((kat) => (
              <TouchableOpacity 
                key={kat.id}
                style={[
                  styles.kategoriChip, 
                  seciliKategoriId === kat.id && styles.kategoriChipSecili
                ]}
                onPress={() => setSeciliKategoriId(kat.id)}
              >
                <Text style={[
                  styles.kategoriChipYazi,
                  seciliKategoriId === kat.id && styles.kategoriChipYaziSecili
                ]}>
                  {kat.ad}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Açıklama */}
        <View style={styles.inputGrup}>
          <Text style={styles.label}>Ürün Açıklaması</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={aciklama}
            onChangeText={setAciklama}
            textAlignVertical="top"
          />
        </View>

        {/* Resim URL */}
        <View style={styles.inputGrup}>
          <Text style={styles.label}>Resim URL</Text>
          <TextInput 
            style={styles.input}
            autoCapitalize="none"
            value={resimUrl}
            onChangeText={setResimUrl}
          />
        </View>

        {/* Güncelleme Butonu */}
        <TouchableOpacity style={styles.guncelleButon} onPress={guncelle} disabled={guncellemeLoading}>
          {guncellemeLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="sync-outline" size={24} color="#FFF" />
              <Text style={styles.guncelleButonYazi}>Değişiklikleri Kaydet</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    color: '#8E8E93',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  geriButon: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  formContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  inputGrup: {
    marginBottom: 20,
  },
  yanYanaGrup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    marginLeft: 4,
  },
  zorunlu: {
    color: '#EF233C',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1C1C1E',
  },
  textArea: {
    minHeight: 100,
  },
  kategoriScroll: {
    flexDirection: 'row',
    marginTop: 5,
  },
  kategoriChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  kategoriChipSecili: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FF9F00',
  },
  kategoriChipYazi: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  kategoriChipYaziSecili: {
    color: '#FF9F00',
    fontWeight: 'bold',
  },
  guncelleButon: {
    backgroundColor: '#FF9F00',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: '#FF9F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  guncelleButonYazi: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});