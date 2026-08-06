import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DestekTalebi, useDestek } from '../hooks/custom/useDestek'; // Kendi dosya yoluna göre kontrol et

export default function Destek() {
  const router = useRouter();
  
  const {
    aktifSekme, setAktifSekme,
    konu, setKonu,
    mesaj, setMesaj,
    gonderiliyor,
    yukleniyor,
    gecmisTalepler,
    aramaAktif,
    aramaMetni, setAramaMetni,
    toggleArama,
    filtrelenmisTalepler,
    destekTalebiGonder
  } = useDestek();

  const renderTalepKart = ({ item }: { item: DestekTalebi }) => {
    const cevaplandiMi = item.durum === 'Cevaplandı';

    return (
      <View style={styles.talepKarti}>
        <View style={[styles.kartRenkBar, cevaplandiMi ? {backgroundColor: '#4CAF50'} : {backgroundColor: '#FF9800'}]} />
        
        <View style={styles.kartIcerik}>
          <View style={styles.talepBaslikSatiri}>
            <Text style={styles.talepKonu} numberOfLines={1}>{item.konu}</Text>
            <View style={[styles.durumRozet, cevaplandiMi ? styles.durumCevaplandi : styles.durumBekliyor]}>
              <Text style={[styles.durumYazi, cevaplandiMi ? styles.durumYaziCevaplandi : styles.durumYaziBekliyor]}>
                {cevaplandiMi ? '✅ Cevaplandı' : '🕒 Bekliyor'}
              </Text>
            </View>
          </View>
          
          <View style={styles.mesajKutusu}>
            <Text style={styles.kullaniciMesaji}>{item.mesaj}</Text>
          </View>

          {cevaplandiMi && item.adminCevabi && (
            <View style={styles.cevapKutusu}>
              <View style={styles.cevapBaslikSatiri}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#FF7A00" />
                <Text style={styles.cevapBaslik}>Destek Ekibi</Text>
              </View>
              <Text style={styles.adminCevabi}>{item.adminCevabi}</Text>
            </View>
          )}
          
          <Text style={styles.tarihYazi}>
            {new Date(item.olusturulmaTarihi).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* MODERN SEKME (TABS) ALANI */}
      <View style={styles.sekmeKapsayici}>
        <View style={styles.sekmeAlani}>
          <TouchableOpacity 
            style={[styles.sekmeButon, aktifSekme === 'yeni' && styles.sekmeAktif]} 
            onPress={() => setAktifSekme('yeni')}
            activeOpacity={0.8}
          >
            <Text style={[styles.sekmeYazi, aktifSekme === 'yeni' && styles.sekmeYaziAktif]}>Bize Yazın ✍️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sekmeButon, aktifSekme === 'gecmis' && styles.sekmeAktif]} 
            onPress={() => setAktifSekme('gecmis')}
            activeOpacity={0.8}
          >
            <Text style={[styles.sekmeYazi, aktifSekme === 'gecmis' && styles.sekmeYaziAktif]}>Mesajlarım 💌</Text>
          </TouchableOpacity>
        </View>

        {aktifSekme === 'gecmis' && gecmisTalepler.length > 0 && (
          <TouchableOpacity onPress={toggleArama} style={styles.aramaIkonButon}>
            <Ionicons name={aramaAktif ? "close" : "search"} size={22} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* ARAMA KUTUSU */}
      {aktifSekme === 'gecmis' && aramaAktif && (
        <View style={styles.aramaKutusu}>
          <Ionicons name="search" size={20} color="#FF7A00" style={{marginRight: 8}} />
          <TextInput
            style={styles.aramaInput}
            placeholder="Konu, mesaj veya cevap ara..."
            placeholderTextColor="#A0AAB5"
            value={aramaMetni}
            onChangeText={setAramaMetni}
            autoFocus={true}
          />
        </View>
      )}

      {/* 1. SEKME: YENİ MESAJ FORMU */}
      {aktifSekme === 'yeni' && (
        <ScrollView style={styles.formAlani} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.etiket}>Konu Başlığı</Text>
          <TextInput 
            style={styles.input}
            placeholder="Örn: Siparişim Eksik Geldi"
            placeholderTextColor="#A0AAB5"
            value={konu}
            onChangeText={setKonu}
          />

          <Text style={styles.etiket}>Mesajınız</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            placeholder="Size nasıl yardımcı olabiliriz? Lütfen detayları yazın..."
            placeholderTextColor="#A0AAB5"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={mesaj}
            onChangeText={setMesaj}
          />

          <TouchableOpacity 
            style={[styles.gonderButon, gonderiliyor && { opacity: 0.7 }]} 
            onPress={destekTalebiGonder}
            disabled={gonderiliyor}
            activeOpacity={0.8}
          >
            {gonderiliyor ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.gonderButonYazi}>Mesajı Gönder 🚀</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* 2. SEKME: GEÇMİŞ MESAJLAR */}
      {aktifSekme === 'gecmis' && (
        <View style={styles.listeAlani}>
          {yukleniyor ? (
            <ActivityIndicator size="large" color="#FF7A00" style={{ marginTop: 50 }} />
          ) : (
            <FlatList 
              data={filtrelenmisTalepler} 
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.bosListe}>
                  <Text style={styles.bosListeIkon}>{aramaMetni ? "🔍" : "🍃"}</Text>
                  <Text style={styles.bosListeMetni}>
                    {aramaMetni ? 'Aramanıza uygun mesaj bulunamadı.' : 'Henüz bir destek talebiniz bulunmuyor.'}
                  </Text>
                </View>
              }
              renderItem={renderTalepKart}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' }, // Ferah arkaplan
  
  // Sekmeler (Modern Pill Tasarımı)
  sekmeKapsayici: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15 },
  sekmeAlani: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  sekmeButon: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  sekmeAktif: { backgroundColor: '#FF7A00', shadowColor: '#FF7A00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  sekmeYazi: { fontSize: 14, fontWeight: '700', color: '#A0AAB5' },
  sekmeYaziAktif: { color: '#fff' },
  
  // Arama Butonu
  aramaIkonButon: { padding: 12, backgroundColor: '#fff', borderRadius: 16, marginLeft: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },

  // Arama Çubuğu
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#EDF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  aramaInput: { flex: 1, fontSize: 15, color: '#2D3436' },

  // Form Alanı
  formAlani: { paddingHorizontal: 20, paddingTop: 10 },
  etiket: { fontSize: 14, fontWeight: '700', color: '#2D3436', marginBottom: 8, marginTop: 15, marginLeft: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 18, padding: 16, fontSize: 15, color: '#2D3436', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  textArea: { height: 160 },
  gonderButon: { backgroundColor: '#FF7A00', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 30, marginBottom: 40, shadowColor: '#FF7A00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  gonderButonYazi: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  // Liste Alanı
  listeAlani: { flex: 1, paddingHorizontal: 20 },
  bosListe: { alignItems: 'center', marginTop: 80 },
  bosListeIkon: { fontSize: 50, marginBottom: 15 },
  bosListeMetni: { fontSize: 16, fontWeight: '600', color: '#718096', textAlign: 'center' },

  // Kart Tasarımı
  talepKarti: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, overflow: 'hidden' },
  kartRenkBar: { width: 6, height: '100%' },
  kartIcerik: { flex: 1, padding: 18 },
  
  talepBaslikSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  talepKonu: { fontSize: 17, fontWeight: '800', color: '#2D3436', flex: 1, marginRight: 10 },
  
  durumRozet: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  durumBekliyor: { backgroundColor: '#FFF3E0' },
  durumCevaplandi: { backgroundColor: '#E8F5E9' },
  durumYazi: { fontSize: 11, fontWeight: '800' },
  durumYaziBekliyor: { color: '#F57C00' },
  durumYaziCevaplandi: { color: '#388E3C' },
  
  mesajKutusu: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  kullaniciMesaji: { fontSize: 14, color: '#475569', lineHeight: 22 },
  
  cevapKutusu: { backgroundColor: '#FFF8E1', padding: 14, borderRadius: 14, marginTop: 5, borderWidth: 1, borderColor: '#FFECB3' },
  cevapBaslikSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cevapBaslik: { fontSize: 13, fontWeight: '800', color: '#FF7A00', marginLeft: 6 },
  adminCevabi: { fontSize: 14, color: '#5D4037', lineHeight: 22 },
  
  tarihYazi: { fontSize: 11, fontWeight: '600', color: '#A0AAB5', textAlign: 'right', marginTop: 12 }
});