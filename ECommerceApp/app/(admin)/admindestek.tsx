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

  // Modal State'leri
  const [seciliTalep, setSeciliTalep] = useState<DestekTalebi | null>(null);
  const [modalGörünür, setModalGörünür] = useState(false);
  const [cevapMetni, setCevapMetni] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useFocusEffect(
    useCallback(() => {
      talepleriGetir();
    }, [])
  );

  const talepleriGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/destek/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTalepler(response.data);
    } catch (error) {
      console.error("Talepler getirilemedi:", error);
    } finally {
      setYukleniyor(false);
    }
  };

  // ARAMA VE FİLTRELEME MANTIĞI
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
      Alert.alert('Uyarı', 'Lütfen bir cevap yazın.');
      return;
    }
    setGonderiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/destek/cevapla/${seciliTalep?.id}`, 
        { cevap: cevapMetni }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Başarılı', 'Cevabınız iletildi.');
      setTalepler(prev => prev.map(t => 
        t.id === seciliTalep?.id ? { ...t, durum: 'Cevaplandı', adminCevabi: cevapMetni } : t
      ));
      setModalGörünür(false);
      setCevapMetni('');
    } catch (error) {
      Alert.alert('Hata', 'Cevap gönderilemedi.');
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={26} color="#333" /></TouchableOpacity>
        <Text style={styles.baslik}>Destek Talepleri</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ARAMA VE FİLTRE ÇUBUĞU */}
      <View style={styles.filtreAlani}>
        <View style={styles.aramaKutusu}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput 
            style={styles.aramaInput} 
            placeholder="İsim veya konu ara..." 
            value={aramaMetni} 
            onChangeText={setAramaMetni} 
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['Tümü', 'Bekliyor', 'Cevaplandı'].map(d => (
            <TouchableOpacity key={d} style={[styles.chip, seciliDurum === d && styles.chipAktif]} onPress={() => setSeciliDurum(d)}>
              <Text style={[styles.chipYazi, seciliDurum === d && styles.chipYaziAktif]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {yukleniyor ? (
        <ActivityIndicator size="large" color="#FFB800" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={filtrelenmisTalepler} 
          keyExtractor={item => item.id.toString()} 
          contentContainerStyle={{ padding: 20 }} 
          renderItem={({ item }) => {
            const bekliyorMu = item.durum === 'Bekliyor';
            return (
              <TouchableOpacity style={[styles.kart, bekliyorMu ? styles.kartBekliyor : styles.kartCevaplandi]} onPress={() => { setSeciliTalep(item); setCevapMetni(item.adminCevabi || ''); setModalGörünür(true); }} activeOpacity={0.8}>
                <View style={styles.kartUstSatir}>
                  <View style={styles.kullaniciBilgi}>
                    <View style={styles.kullaniciIkon}><Ionicons name="person" size={14} color="#666" /></View>
                    <Text style={styles.kullaniciAdi}>{item.kullaniciAdi}</Text>
                  </View>
                  <View style={[styles.rozet, bekliyorMu ? styles.rozetTuruncu : styles.rozetYesil]}>
                    <Text style={[styles.rozetYazi, bekliyorMu ? {color: '#FFB800'} : {color: '#2E7D32'}]}>{item.durum}</Text>
                  </View>
                </View>
                <Text style={styles.konu}>{item.konu}</Text>
                <Text style={styles.mesajOzeti} numberOfLines={2}>{item.mesaj}</Text>
              </TouchableOpacity>
            );
          }} 
          ListEmptyComponent={<Text style={styles.bosMetin}>Sonuç bulunamadı.</Text>}
        />
      )}

      {/* MODAL */}
      <Modal visible={modalGörünür} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalArkaPlan} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalKutu}>
            <View style={styles.modalCizgi} />
            <View style={styles.modalBaslikSatiri}>
              <Text style={styles.modalBaslik}>Talep Detayı</Text>
              <TouchableOpacity onPress={() => setModalGörünür(false)}><Ionicons name="close" size={24} color="#555" /></TouchableOpacity>
            </View>
            {seciliTalep && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.musteriKart}>
                  <Text style={styles.modalBilgiDeger}>{seciliTalep.kullaniciAdi}</Text>
                  <Text style={styles.modalBilgiEmail}>{seciliTalep.kullaniciEmail}</Text>
                  <Text style={styles.modalBilgiBaslik}>{seciliTalep.konu}</Text>
                </View>
                <View style={styles.musteriMesajKutu}><Text style={styles.mesajMetni}>{seciliTalep.mesaj}</Text></View>
                <Text style={styles.cevapEtiketi}>Cevabınız:</Text>
                <TextInput style={styles.inputArea} multiline textAlignVertical="top" value={cevapMetni} onChangeText={setCevapMetni} placeholder="Cevabı yazın..." />
                <TouchableOpacity style={styles.gonderButon} onPress={cevapGonder} disabled={gonderiliyor}>
                  {gonderiliyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.gonderButonYazi}>Cevabı Gönder</Text>}
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#F0F0F0' },
  baslik: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  filtreAlani: { paddingHorizontal: 20, paddingTop: 10, backgroundColor: '#fff' },
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10, marginBottom: 10 },
  aramaInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  chipScroll: { paddingBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8 },
  chipAktif: { backgroundColor: '#FFB800' },
  chipYazi: { fontSize: 12, fontWeight: '600', color: '#666' },
  chipYaziAktif: { color: '#fff' },
  kart: { backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  kartBekliyor: { borderLeftWidth: 4, borderLeftColor: '#FFB800' },
  kartCevaplandi: { borderLeftWidth: 4, borderLeftColor: '#2E7D32' },
  kartUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  kullaniciBilgi: { flexDirection: 'row', alignItems: 'center' },
  kullaniciIkon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  kullaniciAdi: { fontSize: 14, fontWeight: '600', color: '#444' },
  rozet: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  rozetTuruncu: { backgroundColor: '#FFF3E0' },
  rozetYesil: { backgroundColor: '#E8F5E9' },
  rozetYazi: { fontSize: 11, fontWeight: 'bold' },
  konu: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  mesajOzeti: { fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
  bosMetin: { textAlign: 'center', color: '#999', marginTop: 50 },
  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, maxHeight: '90%' },
  modalCizgi: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  modalBaslikSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalBaslik: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  musteriKart: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#EFEFEF' },
  modalBilgiBaslik: { fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: '700', marginTop: 4 },
  modalBilgiDeger: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  modalBilgiEmail: { fontSize: 13, color: '#666', marginTop: 2 },
  musteriMesajKutu: { backgroundColor: '#FFF9C4', padding: 15, borderRadius: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#FFB800' },
  mesajMetni: { fontSize: 15, color: '#333', lineHeight: 22 },
  cevapEtiketi: { fontSize: 13, fontWeight: 'bold', color: '#FFB800', marginBottom: 8, textTransform: 'uppercase' },
  inputArea: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 16, padding: 15, height: 110, fontSize: 15, color: '#333' },
  gonderButon: { backgroundColor: '#FFB800', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 15, marginBottom: 10 },
  gonderButonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});