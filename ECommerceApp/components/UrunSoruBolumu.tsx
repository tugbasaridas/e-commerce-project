import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_CONFIG } from '../config/api';

interface UrunSoruBolumuProps {
  urunId: number;
}

export default function UrunSoruBolumu({ urunId }: UrunSoruBolumuProps) {
  const [sorular, setSorular] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalGorunur, setModalGorunur] = useState(false);
  const [yeniSoru, setYeniSoru] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  
  // YENİ: Soruları sınırlandırmak için state
  const [tumunuGoster, setTumunuGoster] = useState(false);
  const MAX_SORU = 1; // Artık ilk açılışta sadece 1 soru görünecek

  useEffect(() => {
    sorulariGetir();
    girisDurumunuKontrolEt();
  }, [urunId]);

  const girisDurumunuKontrolEt = async () => {
    const token = await AsyncStorage.getItem('userToken');
    setIsLogged(!!token);
  };

  const sorulariGetir = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/urunsoru/urun/${urunId}`);
      setSorular(response.data);
    } catch (error) {
      console.error("Sorular getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const soruGonder = async () => {
    if (yeniSoru.trim().length < 5) {
      Alert.alert("Uyarı", "Lütfen en az 5 karakterlik geçerli bir soru yazın.");
      return;
    }

    try {
      setGonderiliyor(true);
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.post(
        `${API_CONFIG.BASE_URL}/urunsoru/sor`,
        { urunId: urunId, soruMetni: yeniSoru.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Başarılı", "Sorunuz satıcıya iletildi. Satıcı yanıtladığında burada görünecektir.");
      setYeniSoru('');
      setModalGorunur(false);
      sorulariGetir(); 
      
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Soru gönderilirken bir hata oluştu.");
    } finally {
      setGonderiliyor(false);
    }
  };

  const soruSorButonunaBas = () => {
    if (!isLogged) {
      Alert.alert("Giriş Yapın", "Satıcıya soru sorabilmek için lütfen önce giriş yapın.");
      return;
    }
    setModalGorunur(true);
  };

  const tarihFormatla = (tarihString: string) => {
    return new Date(tarihString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) return <ActivityIndicator size="small" color="#FF9F00" style={{ marginTop: 20 }} />;

  // Ekranda gösterilecek olan soruları filtreliyoruz
  const gosterilecekSorular = tumunuGoster ? sorular : sorular.slice(0, MAX_SORU);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.baslik}>Satıcıya Sorulan Sorular ({sorular.length})</Text>
        <TouchableOpacity style={styles.soruSorBtn} onPress={soruSorButonunaBas}>
          <Ionicons name="chatbubbles-outline" size={16} color="#FF9F00" />
          <Text style={styles.soruSorTxt}>Soru Sor</Text>
        </TouchableOpacity>
      </View>

      {sorular.length === 0 ? (
        <View style={styles.bosDurum}>
          <Text style={styles.bosDurumText}>Bu ürün için henüz soru sorulmamış. İlk soran siz olun!</Text>
        </View>
      ) : (
        <>
          {gosterilecekSorular.map((item) => (
            <View key={item.id} style={styles.soruKarti}>
              {/* MÜŞTERİ SORUSU (Gri Balon) */}
              <View style={styles.soruBalonu}>
                <View style={styles.isimTarihSatiri}>
                  <Text style={styles.kisiAdi}>{item.musteriAdi}</Text>
                  <Text style={styles.tarihTxt}>{tarihFormatla(item.soruTarihi)}</Text>
                </View>
                <Text style={styles.mesajMetni}>{item.soruMetni}</Text>
              </View>

              {/* SATICI CEVABI */}
              {item.cevaplandiMi ? (
                <View style={styles.cevapBalonu}>
                  <View style={styles.isimTarihSatiri}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="storefront" size={12} color="#28A745" style={{ marginRight: 4 }} />
                      <Text style={styles.saticiAdi}>{item.magazaAdi} (Satıcı)</Text>
                    </View>
                    <Text style={styles.tarihTxt}>{tarihFormatla(item.cevapTarihi)}</Text>
                  </View>
                  <Text style={styles.mesajMetni}>{item.cevapMetni}</Text>
                </View>
              ) : (
                <View style={styles.bekliyorBalonu}>
                  <Ionicons name="time-outline" size={14} color="#8E8E93" />
                  <Text style={styles.bekliyorTxt}>Satıcı yanıtı bekleniyor...</Text>
                </View>
              )}
            </View>
          ))}

          {/* DEVAMINI GÖR BUTONU */}
          {sorular.length > MAX_SORU && (
            <TouchableOpacity 
              style={styles.devaminiGorBtn} 
              onPress={() => setTumunuGoster(!tumunuGoster)}
            >
              <Text style={styles.devaminiGorTxt}>
                {tumunuGoster ? "Daha Az Göster" : `Tüm Soruları Gör (${sorular.length})`}
              </Text>
              <Ionicons name={tumunuGoster ? "chevron-up" : "chevron-down"} size={16} color="#007AFF" />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* SORU SORMA MODALI */}
      <Modal visible={modalGorunur} transparent animationType="slide">
        <View style={styles.modalArkaplan}>
          <View style={styles.modalKutu}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalBaslik}>Satıcıya Soru Sor</Text>
              <TouchableOpacity onPress={() => setModalGorunur(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.bilgiTxt}>Sorunuz satıcı tarafından yanıtlandıktan sonra herkese açık şekilde yayınlanacaktır. Lütfen iletişim bilginizi paylaşmayın.</Text>

            <TextInput
              style={styles.inputArea}
              placeholder="Ürünle ilgili merak ettiklerinizi yazın..."
              multiline
              numberOfLines={4}
              maxLength={250}
              value={yeniSoru}
              onChangeText={setYeniSoru}
            />
            <Text style={styles.karakterSayaci}>{yeniSoru.length}/250</Text>

            <TouchableOpacity 
              style={[styles.gonderBtn, gonderiliyor && { backgroundColor: '#ccc' }]} 
              onPress={soruGonder}
              disabled={gonderiliyor}
            >
              {gonderiliyor ? (
                 <ActivityIndicator size="small" color="#fff" />
              ) : (
                 <Text style={styles.gonderBtnTxt}>Gönder</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20, backgroundColor: '#FFFFFF', padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  baslik: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  soruSorBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  soruSorTxt: { color: '#FF9F00', fontWeight: 'bold', fontSize: 13, marginLeft: 4 },
  bosDurum: { padding: 20, alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12 },
  bosDurumText: { color: '#8E8E93', fontSize: 13 },
  soruKarti: { marginBottom: 20 },
  isimTarihSatiri: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  kisiAdi: { fontSize: 12, fontWeight: 'bold', color: '#48484A' },
  saticiAdi: { fontSize: 12, fontWeight: 'bold', color: '#28A745' },
  tarihTxt: { fontSize: 11, color: '#8E8E93' },
  mesajMetni: { fontSize: 14, color: '#1C1C1E', lineHeight: 20 },
  soruBalonu: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 12, borderBottomLeftRadius: 4 },
  cevapBalonu: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, borderTopRightRadius: 4, marginTop: 8, marginLeft: 20, borderWidth: 1, borderColor: '#E8F5E9' },
  bekliyorBalonu: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 20 },
  bekliyorTxt: { fontSize: 12, color: '#8E8E93', marginLeft: 4, fontStyle: 'italic' },
  
  devaminiGorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: -5, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  devaminiGorTxt: { color: '#007AFF', fontWeight: 'bold', fontSize: 13, marginRight: 6 },

  modalArkaplan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 300 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalBaslik: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  bilgiTxt: { fontSize: 12, color: '#8E8E93', marginBottom: 15, lineHeight: 18 },
  inputArea: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 12, height: 100, textAlignVertical: 'top', fontSize: 14 },
  karakterSayaci: { textAlign: 'right', fontSize: 11, color: '#8E8E93', marginTop: 4 },
  gonderBtn: { backgroundColor: '#FF9F00', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  gonderBtnTxt: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});