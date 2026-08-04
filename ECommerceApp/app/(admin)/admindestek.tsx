import { API_CONFIG } from '@/config/api';
import { DestekTalebi } from '@/types/DestekTalebi';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminDestekPanel() {
  const router = useRouter();
  const [talepler, setTalepler] = useState<DestekTalebi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Arama ve Filtre State'leri
  const [aramaMetni, setAramaMetni] = useState('');
  const [seciliDurum, setSeciliDurum] = useState('Tümü');
  const [seciliRol, setSeciliRol] = useState<'Tümü' | 'Müşteri' | 'Satıcı'>('Tümü');

  // Modal State'leri
  const [seciliTalep, setSeciliTalep] = useState<DestekTalebi | null>(null);
  const [modalGörünür, setModalGörünür] = useState(false);
  const [cevapMetni, setCevapMetni] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useFocusEffect(
    useCallback(() => {
      talepleriGetir(seciliRol);
    }, [seciliRol])
  );

  const talepleriGetir = async (rol: string) => {
    setYukleniyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      let endpoint = `${API_CONFIG.BASE_URL}/destek/admin/tum`;
      if (rol === 'Müşteri') endpoint = `${API_CONFIG.BASE_URL}/destek/admin/musteri`;
      if (rol === 'Satıcı') endpoint = `${API_CONFIG.BASE_URL}/destek/admin/satici`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTalepler(response.data);
    } catch (error) {
      console.error("Talepler getirilemedi:", error);
    } finally {
      setYukleniyor(false);
    }
  };

  const filtrelenmisTalepler = useMemo(() => {
    return talepler.filter(t => {
      const durumUyar = seciliDurum === 'Tümü' || t.durum === seciliDurum;
      const aramaKucuk = aramaMetni.toLowerCase();
      const aramaUyar = 
        t.kullaniciAdi.toLowerCase().includes(aramaKucuk) ||
        t.konu.toLowerCase().includes(aramaKucuk);
      return durumUyar && aramaUyar;
    });
  }, [talepler, aramaMetni, seciliDurum]);

  const cevapGonder = async () => {
    if (!cevapMetni.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir cevap yazın 🌸');
      return;
    }
    setGonderiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/destek/cevapla/${seciliTalep?.id}`, 
        { cevap: cevapMetni }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Harika!', 'Cevabınız başarıyla iletildi 🚀');
      setTalepler(prev => prev.map(t => 
        t.id === seciliTalep?.id ? { ...t, durum: 'Cevaplandı', adminCevabi: cevapMetni } : t
      ));
      setModalGörünür(false);
      setCevapMetni('');
    } catch (error) {
      Alert.alert('Hata', 'Cevap gönderilemedi 😔');
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.navigate('/(admin)/admin-islemler' as any)}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.baslik}>Destek Merkezi 💬</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filtreAlani}>
        {/* ROL SEÇİM TABLARI */}
        <View style={styles.rolTabContainer}>
          {['Tümü', 'Müşteri', 'Satıcı'].map((rol) => (
            <TouchableOpacity 
              key={rol} 
              style={[styles.rolTab, seciliRol === rol && styles.rolTabAktif]} 
              onPress={() => setSeciliRol(rol as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rolTabYazi, seciliRol === rol && styles.rolTabYaziAktif]}>{rol}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ARAMA ÇUBUĞU */}
        <View style={styles.aramaKutusu}>
          <Ionicons name="search" size={22} color="#FF7A00" />
          <TextInput 
            style={styles.aramaInput} 
            placeholder="Kimi veya neyi arıyorsun? 🔍" 
            placeholderTextColor="#999"
            value={aramaMetni} 
            onChangeText={setAramaMetni} 
          />
        </View>
        
        {/* DURUM CHIPLERİ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['Tümü', 'Bekliyor', 'Cevaplandı'].map(d => (
            <TouchableOpacity 
              key={d} 
              style={[styles.chip, seciliDurum === d && styles.chipAktif]} 
              onPress={() => setSeciliDurum(d)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipYazi, seciliDurum === d && styles.chipYaziAktif]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LİSTELEME */}
      {yukleniyor ? (
        <ActivityIndicator size="large" color="#FF7A00" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={filtrelenmisTalepler} 
          keyExtractor={item => item.id.toString()} 
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }} 
          renderItem={({ item }) => {
            const bekliyorMu = item.durum === 'Bekliyor';
            const saticiMi = item.gonderenRol === 'Satici' || item.gonderenRol === 'Satıcı';

            return (
              <TouchableOpacity 
                style={styles.kart} 
                onPress={() => { setSeciliTalep(item); setCevapMetni(item.adminCevabi || ''); setModalGörünür(true); }} 
                activeOpacity={0.75}
              >
                {/* Sol taraftaki renkli bar efekti yerine çok yumuşak bir border left */}
                <View style={[styles.kartRenkBar, bekliyorMu ? {backgroundColor: '#FF9800'} : {backgroundColor: '#4CAF50'}]} />
                
                <View style={styles.kartIcerik}>
                  <View style={styles.kartUstSatir}>
                    <View style={styles.kullaniciBilgi}>
                      <View style={[styles.kullaniciIkon, saticiMi ? styles.ikonSatici : styles.ikonMusteri]}>
                        <Ionicons name={saticiMi ? "storefront" : "person"} size={16} color={saticiMi ? "#9C27B0" : "#0097A7"} />
                      </View>
                      <View>
                        <Text style={styles.kullaniciAdi}>{item.kullaniciAdi}</Text>
                        <Text style={[styles.rolAltYazi, saticiMi ? {color: '#9C27B0'} : {color: '#0097A7'}]}>
                          {saticiMi ? 'Satıcı Talebi' : 'Müşteri Talebi'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.rozet, bekliyorMu ? styles.rozetTuruncu : styles.rozetYesil]}>
                      <Text style={[styles.rozetYazi, bekliyorMu ? {color: '#F57C00'} : {color: '#388E3C'}]}>
                        {bekliyorMu ? '🕒 Bekliyor' : '✅ Cevaplandı'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.konu}>{item.konu}</Text>
                  <Text style={styles.mesajOzeti} numberOfLines={2}>{item.mesaj}</Text>
                </View>
              </TouchableOpacity>
            );
          }} 
          ListEmptyComponent={
            <View style={styles.bosDurum}>
              <Text style={styles.bosMetinIcon}>🍃</Text>
              <Text style={styles.bosMetin}>Buralar çok sessiz...</Text>
              <Text style={styles.bosMetinAlt}>Aradığın kritere uygun talep bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* MODAL */}
      <Modal visible={modalGörünür} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalArkaPlan} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalKutu}>
            <View style={styles.modalCizgi} />
            <View style={styles.modalBaslikSatiri}>
              <Text style={styles.modalBaslik}>Talep Detayı 💌</Text>
              <TouchableOpacity onPress={() => setModalGörünür(false)} style={styles.kapatButon}>
                <Ionicons name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>

            {seciliTalep && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.musteriKart}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.modalBilgiDeger}>{seciliTalep.kullaniciAdi}</Text>
                    <View style={[styles.modalRolRozeti, (seciliTalep.gonderenRol === 'Satici' || seciliTalep.gonderenRol === 'Satıcı') ? styles.modalRolSatici : styles.modalRolMusteri]}>
                      <Text style={[styles.modalRolYazi, (seciliTalep.gonderenRol === 'Satici' || seciliTalep.gonderenRol === 'Satıcı') ? {color: '#9C27B0'} : {color: '#0097A7'}]}>
                        {(seciliTalep.gonderenRol === 'Satici' || seciliTalep.gonderenRol === 'Satıcı') ? '✨ SATICI' : '👤 MÜŞTERİ'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalBilgiEmail}>{seciliTalep.kullaniciEmail}</Text>
                  
                  <View style={styles.ayiriciCizgi} />
                  <Text style={styles.modalBilgiBaslik}>KONU</Text>
                  <Text style={styles.konuMetni}>{seciliTalep.konu}</Text>
                </View>

                <View style={styles.musteriMesajKutu}>
                  <Text style={styles.mesajMetni}>{seciliTalep.mesaj}</Text>
                </View>

                <Text style={styles.cevapEtiketi}>Sizin Cevabınız ✍️</Text>
                <TextInput 
                  style={styles.inputArea} 
                  multiline 
                  textAlignVertical="top" 
                  value={cevapMetni} 
                  onChangeText={setCevapMetni} 
                  placeholder="Kullanıcıya tatlı bir cevap yazın..." 
                  placeholderTextColor="#999"
                />
                
                <TouchableOpacity style={styles.gonderButon} onPress={cevapGonder} disabled={gonderiliyor} activeOpacity={0.8}>
                  {gonderiliyor ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.gonderButonYazi}>Gönder Yolla 🚀</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' }, // Daha ferah mavi-gri arka plan
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20, backgroundColor: '#fff', borderBottomLeftRadius: 25, borderBottomRightRadius: 25, shadowColor: '#FF7A00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4, zIndex: 10 },
  geriButon: { padding: 5, backgroundColor: '#F5F5F5', borderRadius: 12 },
  baslik: { fontSize: 22, fontWeight: '800', color: '#2D3436' },
  
  filtreAlani: { paddingHorizontal: 20, paddingTop: 20, backgroundColor: 'transparent' },
  
  rolTabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 6, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  rolTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  rolTabAktif: { backgroundColor: '#FF7A00', shadowColor: '#FF7A00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  rolTabYazi: { fontSize: 14, fontWeight: '700', color: '#A0AAB5' },
  rolTabYaziAktif: { color: '#fff' },
  
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#EDF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  aramaInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },
  
  chipScroll: { paddingBottom: 15 },
  chip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#EDF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  chipAktif: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  chipYazi: { fontSize: 13, fontWeight: '700', color: '#718096' },
  chipYaziAktif: { color: '#fff' },
  
  kart: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 24, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, overflow: 'hidden' },
  kartRenkBar: { width: 6, height: '100%' },
  kartIcerik: { flex: 1, padding: 20 },
  kartUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  kullaniciBilgi: { flexDirection: 'row', alignItems: 'center' },
  kullaniciIkon: { width: 38, height: 38, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  ikonMusteri: { backgroundColor: '#E0F7FA' }, // Tatlı cyan
  ikonSatici: { backgroundColor: '#F3E5F5' }, // Tatlı mor
  kullaniciAdi: { fontSize: 15, fontWeight: '800', color: '#2D3436' },
  rolAltYazi: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  
  rozet: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  rozetTuruncu: { backgroundColor: '#FFF3E0' },
  rozetYesil: { backgroundColor: '#E8F5E9' },
  rozetYazi: { fontSize: 11, fontWeight: '800' },
  
  konu: { fontSize: 17, fontWeight: '800', color: '#2D3436', marginBottom: 8 },
  mesajOzeti: { fontSize: 14, color: '#718096', marginBottom: 5, lineHeight: 22 },
  
  bosDurum: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  bosMetinIcon: { fontSize: 40, marginBottom: 10 },
  bosMetin: { fontSize: 18, fontWeight: 'bold', color: '#2D3436' },
  bosMetinAlt: { fontSize: 14, color: '#A0AAB5', marginTop: 5 },
  
  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: Platform.OS === 'ios' ? 45 : 25, maxHeight: '92%' },
  modalCizgi: { width: 50, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalBaslikSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalBaslik: { fontSize: 22, fontWeight: '800', color: '#2D3436' },
  kapatButon: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 20 },
  
  musteriKart: { backgroundColor: '#F8FAFC', padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' },
  modalBilgiDeger: { fontSize: 18, fontWeight: '800', color: '#2D3436' },
  modalBilgiEmail: { fontSize: 14, color: '#718096', marginTop: 4, fontWeight: '500' },
  modalRolRozeti: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  modalRolSatici: { backgroundColor: '#F3E5F5' },
  modalRolMusteri: { backgroundColor: '#E0F7FA' },
  modalRolYazi: { fontSize: 11, fontWeight: '800' },
  
  ayiriciCizgi: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  modalBilgiBaslik: { fontSize: 12, color: '#A0AAB5', fontWeight: '800', letterSpacing: 1, marginBottom: 5 },
  konuMetni: { fontSize: 16, fontWeight: '700', color: '#2D3436' },
  
  musteriMesajKutu: { backgroundColor: '#FFF8E1', padding: 18, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#FFECB3' },
  mesajMetni: { fontSize: 15, color: '#5D4037', lineHeight: 24 },
  
  cevapEtiketi: { fontSize: 14, fontWeight: '800', color: '#FF7A00', marginBottom: 10 },
  inputArea: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 20, padding: 18, height: 120, fontSize: 15, color: '#2D3436', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  gonderButon: { backgroundColor: '#FF7A00', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 20, marginBottom: 10, shadowColor: '#FF7A00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  gonderButonYazi: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 }
});