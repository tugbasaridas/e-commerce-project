import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// BİLEŞENLER VE HOOK'LAR
import BenzerUrunler from '../components/BenzerUrunler'; // YENİ EKLENEN BENZER ÜRÜNLER BİLEŞENİ
import UrunSoruBolumu from '../components/UrunSoruBolumu';
import { useDetay } from '../hooks/custom/useDetay';

export default function Detay() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  
  const {
    urun, loading, girisYapildiMi, 
    miktar, miktarArtir, miktarAzalt,
    toastGorunur, toastMesaj,
    oylamaModalGorunur, setOylamaModalGorunur, 
    secilenPuan, setSecilenPuan, oyGonderiliyor,
    yorumMetni, setYorumMetni,
    favoriButonunaBasildi, sepeteEkle, oyGonder
  } = useDetay(id as string);

  // Yorumları sınırlandırmak için state (İlk açılışta 1 yorum)
  const [tumYorumlariGoster, setTumYorumlariGoster] = useState(false);
  const MAX_YORUM = 1;

  if (loading) return <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 100 }} />;
  if (!urun) return <Text style={{ textAlign: 'center', marginTop: 50 }}>Ürün bulunamadı.</Text>;

  const stoktaVarMi = urun.stok > 0; 
  
  const yaziliYorumlar = urun.yorumlar ? urun.yorumlar.filter((y: any) => y.yorumMetni && y.yorumMetni.trim() !== '') : [];
  const gosterilecekYorumlar = tumYorumlariGoster ? yaziliYorumlar : yaziliYorumlar.slice(0, MAX_YORUM);

  return (
    <ScrollView style={styles.container}>
      {toastGorunur && <View style={styles.toastKutusu}><Text style={styles.toastYazi}>{toastMesaj}</Text></View>}

      <View>
        <Image source={{ uri: urun.resimUrl }} style={styles.buyukResim} />
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.kalpButon} onPress={favoriButonunaBasildi}>
          <Ionicons name="heart-outline" size={28} color="#ff4757" />
        </TouchableOpacity>
      </View>

      <View style={styles.detayBilgi}>
        <Text style={styles.kategori}>{urun.kategori?.ad || "Genel"}</Text>
        <Text style={styles.baslik}>{urun.ad}</Text>
        
        {urun.magaza?.magazaAdi ? (
          <View style={styles.saticiKutusu}>
            <Ionicons name="storefront-outline" size={16} color="#007AFF" />
            <Text style={styles.saticiMetni}>
              Satıcı: <Text style={styles.saticiAdi}>{urun.magaza.magazaAdi}</Text>
            </Text>
          </View>
        ) : null}
        
        <View style={styles.fiyatKapsayici}>
          {urun.indirimliFiyat ? (
            <View style={styles.indirimliFiyatAlani}>
              <Text style={styles.eskiFiyat}>{urun.fiyat.toFixed(2)} TL</Text>
              <Text style={styles.yeniFiyat}>{urun.indirimliFiyat.toFixed(2)} TL</Text>
              <View style={styles.rozet}>
                <Text style={styles.rozetYazi}>
                  %{Math.round(((urun.fiyat - urun.indirimliFiyat) / urun.fiyat) * 100)} İNDİRİM
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.normalFiyat}>{urun.fiyat.toFixed(2)} TL</Text>
          )}
        </View>

        <TouchableOpacity style={styles.degerlendirmeSatiri} onPress={() => girisYapildiMi ? setOylamaModalGorunur(true) : Alert.alert("Giriş Gerekli", "Puanlamak ve yorum yapmak için giriş yapın.")}>
          <View style={styles.yildizGrup}>
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={styles.yildizPuanYazi}>{urun.ortalamaPuan?.toFixed(1) || "0.0"}</Text>
          </View>
          <Text style={styles.oyVerLinkYazi}>({urun.oylamaSayisi || 0} Değerlendirme)</Text>
        </TouchableOpacity>

        <Text style={styles.aciklama}>{urun.aciklama}</Text>

        {!stoktaVarMi && (
          <View style={styles.stokYokKutusu}>
            <Ionicons name="alert-circle" size={20} color="#D8000C" />
            <Text style={styles.stokYokYazi}>Şu an stokta bulunmamaktadır.</Text>
          </View>
        )}

        {girisYapildiMi && stoktaVarMi && (
          <View style={styles.miktarAlani}>
            <TouchableOpacity style={styles.miktarBtn} onPress={miktarAzalt}><Ionicons name="remove" size={20} /></TouchableOpacity>
            <Text style={styles.miktarText}>{miktar}</Text>
            <TouchableOpacity style={styles.miktarBtn} onPress={miktarArtir}><Ionicons name="add" size={20} /></TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.buton, (!girisYapildiMi || !stoktaVarMi) && styles.butonPasif]} 
          onPress={sepeteEkle}
          disabled={!girisYapildiMi || !stoktaVarMi}
        >
          <Text style={styles.butonYazi}>
            {!stoktaVarMi ? "Stok Tükendi" : "Sepete Ekle"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SATICIYA SOR SİSTEMİ */}
      <View style={styles.ayiriciCizgi}></View>
      <UrunSoruBolumu urunId={urun.id} />
      <View style={styles.ayiriciCizgi}></View>
      
      {/* KULLANICI YORUMLARI BÖLÜMÜ */}
      <View style={styles.yorumlarKapsayici}>
        <Text style={styles.yorumlarBaslik}>Kullanıcı Yorumları ({yaziliYorumlar.length})</Text>
        
        {yaziliYorumlar.length > 0 ? (
          <>
            {gosterilecekYorumlar.map((yorumObj: any) => (
              <View key={yorumObj.id} style={styles.yorumKart}>
                <View style={styles.yorumKartUst}>
                  <Text style={styles.yorumKullaniciAdi}>{yorumObj.kullaniciAdi}</Text>
                  <View style={styles.yorumPuanKutusu}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.yorumPuanYazi}>{yorumObj.puan}</Text>
                  </View>
                </View>
                <Text style={styles.yorumMetni}>{yorumObj.yorumMetni}</Text>
                
                <Text style={styles.yorumTarihi}>
                  {new Date(yorumObj.tarih).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            ))}

            {/* YORUMLAR İÇİN DEVAMINI GÖR BUTONU */}
            {yaziliYorumlar.length > MAX_YORUM && (
              <TouchableOpacity 
                style={styles.devaminiGorBtn} 
                onPress={() => setTumYorumlariGoster(!tumYorumlariGoster)}
              >
                <Text style={styles.devaminiGorTxt}>
                  {tumYorumlariGoster ? "Daha Az Göster" : `Tüm Yorumları Gör (${yaziliYorumlar.length})`}
                </Text>
                <Ionicons name={tumYorumlariGoster ? "chevron-up" : "chevron-down"} size={16} color="#007AFF" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.yorumBosKutu}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#ccc" />
            <Text style={styles.yorumBosYazi}>Henüz yazılı yorum yapılmamış. İlk yorumu siz yapın!</Text>
          </View>
        )}
      </View>

      {/* YENİ EKLENEN: BENZER ÜRÜNLER LİSTESİ */}
      <View style={styles.ayiriciCizgi}></View>
      <BenzerUrunler urunId={urun.id} kategoriId={urun.kategoriId} />

      {/* OYLAMA MODALI */}
      <Modal visible={oylamaModalGorunur} transparent={true} animationType="fade">
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            <TouchableOpacity style={styles.kapatIkonu} onPress={() => setOylamaModalGorunur(false)}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>

            <Text style={styles.modalBaslik}>Ürünü Değerlendir</Text>
            
            <View style={styles.yildizSecici}>
              {[1, 2, 3, 4, 5].map((p) => (
                <TouchableOpacity key={p} onPress={() => setSecilenPuan(p)} style={styles.secimYildizi}>
                  <Ionicons name={p <= secilenPuan ? "star" : "star-outline"} size={40} color="#FFD700" />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.yorumInput}
              placeholder="Ürün hakkındaki düşüncelerinizi yazın (İsteğe bağlı)..."
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={4}
              value={yorumMetni}
              onChangeText={setYorumMetni}
              maxLength={500}
            />

            <TouchableOpacity style={styles.modalGonderButon} onPress={oyGonder} disabled={oyGonderiliyor}>
              {oyGonderiliyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalGonderButonYazi}>Gönder</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  toastKutusu: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: '#28A745', padding: 15, borderRadius: 10, zIndex: 999, alignItems: 'center' },
  toastYazi: { color: '#fff', fontWeight: 'bold' },
  buyukResim: { width: '100%', height: 400 },
  detayBilgi: { padding: 20 },
  kategori: { color: '#888', textTransform: 'uppercase', marginBottom: 5 },
  baslik: { fontSize: 28, fontWeight: 'bold' },
  
  saticiKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F1FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
  saticiMetni: { fontSize: 13, color: '#007AFF', marginLeft: 6 },
  saticiAdi: { fontWeight: 'bold' },

  fiyatKapsayici: { marginTop: 15, marginBottom: 15 },
  indirimliFiyatAlani: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  normalFiyat: { fontSize: 24, color: 'orange', fontWeight: 'bold' }, 
  yeniFiyat: { fontSize: 24, fontWeight: 'bold', color: '#FF4757' }, 
  eskiFiyat: { fontSize: 18, color: '#999', textDecorationLine: 'line-through' }, 
  rozet: { backgroundColor: '#FF4757', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  rozetYazi: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  degerlendirmeSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingVertical: 5 },
  yildizGrup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 10 },
  yildizPuanYazi: { fontSize: 14, fontWeight: 'bold', color: '#333', marginLeft: 5 },
  oyVerLinkYazi: { fontSize: 14, color: '#FFD700', fontWeight: '600', textDecorationLine: 'underline' },
  aciklama: { fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 20 },
  
  stokYokKutusu: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD2D2', padding: 12, borderRadius: 8, marginBottom: 20, gap: 8 },
  stokYokYazi: { color: '#D8000C', fontSize: 16, fontWeight: 'bold' },

  miktarAlani: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' },
  miktarBtn: { padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10 },
  miktarText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 25 },
  buton: { backgroundColor: '#FFD700', padding: 20, borderRadius: 10, alignItems: 'center' },
  butonYazi: { fontWeight: 'bold', fontSize: 16 },
  geriButon: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 20 },
  kalpButon: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 20 },
  butonPasif: { backgroundColor: '#ccc', opacity: 0.5 },

  ayiriciCizgi: { height: 8, backgroundColor: '#F4F5F7' },

  yorumlarKapsayici: { paddingHorizontal: 20, paddingTop: 20 },
  yorumlarBaslik: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  yorumKart: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  yorumKartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  yorumKullaniciAdi: { fontWeight: 'bold', color: '#333', fontSize: 15 },
  yorumPuanKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#EEE' },
  yorumPuanYazi: { fontWeight: 'bold', color: '#333', marginLeft: 4, fontSize: 12 },
  yorumMetni: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 8 },
  yorumTarihi: { fontSize: 11, color: '#999', textAlign: 'right' },
  
  devaminiGorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 5, marginBottom: 15, backgroundColor: '#F8F9FA', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  devaminiGorTxt: { color: '#007AFF', fontWeight: 'bold', fontSize: 13, marginRight: 6 },

  yorumBosKutu: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, backgroundColor: '#FAFAFA', borderRadius: 12 },
  yorumBosYazi: { color: '#888', marginTop: 10, fontSize: 15 },

  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalKutu: { width: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  kapatIkonu: { position: 'absolute', top: 15, right: 15, padding: 5 },
  modalBaslik: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 5 },
  yildizSecici: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 20 },
  secimYildizi: { marginHorizontal: 6 },
  yorumInput: { width: '100%', height: 100, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 15, fontSize: 15, textAlignVertical: 'top', marginBottom: 20, color: '#333' },
  modalGonderButon: { backgroundColor: '#FFD700', width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  modalGonderButonYazi: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});