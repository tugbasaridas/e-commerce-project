import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function KayitliBilgilerim() {
  const router = useRouter();
  const [kayitliAdresler, setKayitliAdresler] = useState<any[]>([]);
  const [kayitliKartlar, setKayitliKartlar] = useState<any[]>([]);

  const [adresModalGorunur, setAdresModalGorunur] = useState(false);
  const [kartModalGorunur, setKartModalGorunur] = useState(false);

  const [yeniAdresBaslik, setYeniAdresBaslik] = useState('');
  const [yeniAcikAdres, setYeniAcikAdres] = useState('');
  const [yeniIl, setYeniIl] = useState('');
  const [yeniIlce, setYeniIlce] = useState('');
  const [yeniTelefon, setYeniTelefon] = useState('');

  const [yeniKartNo, setYeniKartNo] = useState('');
  const [yeniKartSahibi, setYeniKartSahibi] = useState('');
  const [yeniSkt, setYeniSkt] = useState('');

  useEffect(() => {
    bilgileriGetir();
  }, []);

  const bilgileriGetir = async () => {
    const userId = await AsyncStorage.getItem('userId') || 'ortak';
    const adresVeri = await AsyncStorage.getItem(`@kayitliAdresler_${userId}`);
    const kartVeri = await AsyncStorage.getItem(`@kayitliKartlar_${userId}`);

    if (adresVeri) setKayitliAdresler(JSON.parse(adresVeri));
    if (kartVeri) setKayitliKartlar(JSON.parse(kartVeri));
  };

  const bilgiyiSil = async (tur: 'adres' | 'kart', id: string) => {
    Alert.alert(
      "Emin misiniz?",
      `Kayıtlı ${tur === 'adres' ? 'adresinizi' : 'kartınızı'} silmek istediğinize emin misiniz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: 'destructive',
          onPress: async () => {
            const userId = await AsyncStorage.getItem('userId') || 'ortak';
            
            if (tur === 'adres') {
              const guncelAdresler = kayitliAdresler.filter(a => a.id !== id);
              await AsyncStorage.setItem(`@kayitliAdresler_${userId}`, JSON.stringify(guncelAdresler));
              setKayitliAdresler(guncelAdresler);
            } else {
              const guncelKartlar = kayitliKartlar.filter(k => k.id !== id);
              await AsyncStorage.setItem(`@kayitliKartlar_${userId}`, JSON.stringify(guncelKartlar));
              setKayitliKartlar(guncelKartlar);
            }
          } 
        }
      ]
    );
  };

  // 🌟 Akıllı Kart Numarası Formatlayıcı
  const handleYeniKartNoChange = (text: string) => {
    const cleaned = text.replace(/\D/g, ''); 
    const match = cleaned.match(/.{1,4}/g);
    setYeniKartNo(match ? match.join(' ').substring(0, 19) : cleaned);
  };

  // 🌟 Akıllı Son Kullanma Tarihi Formatlayıcı
  const handleYeniSktChange = (text: string) => {
    let cleaned = text.replace(/\D/g, ''); 
    
    if (cleaned.length > 0) {
      if (cleaned.length === 1 && parseInt(cleaned[0]) > 1) {
        cleaned = '0' + cleaned;
      }
      
      if (cleaned.length >= 2) {
        let ay = parseInt(cleaned.substring(0, 2), 10);
        if (ay > 12) {
          cleaned = '12' + cleaned.substring(2);
        } else if (ay === 0) {
          cleaned = '01' + cleaned.substring(2);
        }
      }
    }

    if (cleaned.length >= 3) {
      setYeniSkt(`${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`);
    } else {
      setYeniSkt(cleaned);
    }
  };

  // 🌟 YENİ: Akıllı Telefon Numarası Formatlayıcı
  const handleYeniTelefonChange = (text: string) => {
    // Silme işlemine izin ver
    if (text.length < yeniTelefon.length) { 
      setYeniTelefon(text); 
      return; 
    }
    
    let cleaned = text.replace(/\D/g, ''); // Sadece rakam
    if (cleaned.length === 0) { 
      setYeniTelefon(''); 
      return; 
    }
    
    // İlk hane 0 değilse 0 ekle
    if (cleaned[0] !== '0') cleaned = '0' + cleaned;
    
    // Maksimum 11 haneye izin ver
    if (cleaned.length > 11) cleaned = cleaned.substring(0, 11);

    // (05XX) XXX XX XX formatı
    let formatted = cleaned;
    if (cleaned.length > 3) formatted = `(${cleaned.substring(0, 4)}) ${cleaned.substring(4)}`;
    if (cleaned.length > 6) formatted = `(${cleaned.substring(0, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    if (cleaned.length > 8) formatted = `(${cleaned.substring(0, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9)}`;
    
    setYeniTelefon(formatted);
  };

  const adresKaydet = async () => {
    // 🌟 YENİ: Telefon numarası kontrolü de eklendi (15 karakter: (05XX) XXX XX XX)
    if (!yeniAdresBaslik || !yeniAcikAdres || !yeniIl || !yeniIlce || yeniTelefon.length < 15) {
      Alert.alert("Uyarı", "Lütfen tüm adres alanlarını ve telefon numarasını eksiksiz doldurun.");
      return;
    }

    const yeniAdres = {
      id: Date.now().toString(),
      baslik: yeniAdresBaslik,
      acikAdres: yeniAcikAdres,
      il: yeniIl,
      ilce: yeniIlce,
      telefon: yeniTelefon
    };

    const guncelAdresler = [...kayitliAdresler, yeniAdres];
    setKayitliAdresler(guncelAdresler);
    
    const userId = await AsyncStorage.getItem('userId') || 'ortak';
    await AsyncStorage.setItem(`@kayitliAdresler_${userId}`, JSON.stringify(guncelAdresler));

    setAdresModalGorunur(false);
    setYeniAdresBaslik(''); setYeniAcikAdres(''); setYeniIl(''); setYeniIlce(''); setYeniTelefon('');
  };

  const kartKaydet = async () => {
    if (yeniKartNo.length < 19 || !yeniKartSahibi || yeniSkt.length < 5) {
      Alert.alert("Uyarı", "Lütfen kart bilgilerini eksiksiz ve doğru formatta girin.");
      return;
    }

    const yeniKart = {
      id: Date.now().toString(),
      kartNo: yeniKartNo,
      kartSahibi: yeniKartSahibi,
      skt: yeniSkt
    };

    const guncelKartlar = [...kayitliKartlar, yeniKart];
    setKayitliKartlar(guncelKartlar);
    
    const userId = await AsyncStorage.getItem('userId') || 'ortak';
    await AsyncStorage.setItem(`@kayitliKartlar_${userId}`, JSON.stringify(guncelKartlar));

    setKartModalGorunur(false);
    setYeniKartNo(''); setYeniKartSahibi(''); setYeniSkt('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.baslik}>Kayıtlı Bilgilerim</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* KAYITLI KARTLAR BÖLÜMÜ */}
        <Text style={styles.bolumBaslik}>Kayıtlı Kredi Kartlarım ({kayitliKartlar.length})</Text>
        {kayitliKartlar.length > 0 ? (
          kayitliKartlar.map((kart, index) => (
            <View key={kart.id || index} style={styles.sanalKartContainer}>
              <View style={styles.sanalKart}>
                <View style={styles.kartUstSatir}>
                  <View style={styles.kartCip} />
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="wifi-outline" size={24} color="#FFF" style={{ transform: [{ rotate: '90deg' }], marginRight: 15 }} />
                    <TouchableOpacity onPress={() => bilgiyiSil('kart', kart.id)}>
                      <Ionicons name="trash-outline" size={22} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.kartNoYazi}>{kart.kartNo}</Text>
                
                <View style={styles.kartAltSatir}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.kartEtiket}>KART SAHİBİ</Text>
                    <Text style={styles.kartDeger} numberOfLines={1}>{kart.kartSahibi.toUpperCase()}</Text>
                  </View>
                  <View style={{ marginRight: 20 }}>
                    <Text style={styles.kartEtiket}>SKT</Text>
                    <Text style={styles.kartDeger}>{kart.skt}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.bosKutu}>
            <Ionicons name="card-outline" size={40} color="#ccc" />
            <Text style={styles.bosKutuYazi}>Henüz kaydedilmiş bir kartınız bulunmuyor.</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.ekleButon, { borderColor: '#FF7597' }]} onPress={() => setKartModalGorunur(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#FF7597" />
          <Text style={[styles.ekleButonYazi, { color: '#FF7597' }]}>Yeni Kart Ekle</Text>
        </TouchableOpacity>

        {/* KAYITLI ADRESLER BÖLÜMÜ */}
        <Text style={[styles.bolumBaslik, { marginTop: 30 }]}>Kayıtlı Teslimat Adreslerim ({kayitliAdresler.length})</Text>
        {kayitliAdresler.length > 0 ? (
          kayitliAdresler.map((adres, index) => (
            <View key={adres.id || index} style={styles.adresKutu}>
               <TouchableOpacity style={styles.silIkonAdres} onPress={() => bilgiyiSil('adres', adres.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF4757" />
                </TouchableOpacity>
              <View style={styles.adresSatir}>
                <Ionicons name="home" size={20} color="#FFB800" />
                <Text style={styles.adresBaslik}>{adres.baslik}</Text>
              </View>
              <View style={styles.adresDetay}>
                <Text style={styles.adresMetin}>{adres.acikAdres}</Text>
                <Text style={styles.adresMetin}>{adres.ilce} / {adres.il}</Text>
                <Text style={[styles.adresMetin, { fontWeight: 'bold', color: '#333', marginTop: 10 }]}>
                  <Ionicons name="call-outline" size={14} color="#666" /> {adres.telefon}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.bosKutu}>
            <Ionicons name="location-outline" size={40} color="#ccc" />
            <Text style={styles.bosKutuYazi}>Henüz kaydedilmiş bir adresiniz bulunmuyor.</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.ekleButon, { borderColor: '#FFB800' }]} onPress={() => setAdresModalGorunur(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#FFB800" />
          <Text style={[styles.ekleButonYazi, { color: '#FFB800' }]}>Yeni Adres Ekle</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 🌟 YENİ KART EKLEME MODALI */}
      <Modal visible={kartModalGorunur} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>Yeni Kart Ekle</Text>
            
            <TextInput style={styles.input} placeholder="Kart Numarası (Örn: 4444 5555 6666 7777)" value={yeniKartNo} onChangeText={handleYeniKartNoChange} keyboardType="numeric" maxLength={19} />
            <TextInput style={styles.input} placeholder="Kart Üzerindeki İsim" value={yeniKartSahibi} onChangeText={setYeniKartSahibi} autoCapitalize="characters" />
            <TextInput style={styles.input} placeholder="Son Kullanma Tarihi (AA/YY)" value={yeniSkt} onChangeText={handleYeniSktChange} keyboardType="numeric" maxLength={5} />
            
            <View style={styles.modalButonSatiri}>
              <TouchableOpacity style={[styles.modalButon, { backgroundColor: '#f0f0f0' }]} onPress={() => setKartModalGorunur(false)}>
                <Text style={{ color: '#333', fontWeight: 'bold' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButon, { backgroundColor: '#FF7597' }]} onPress={kartKaydet}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🌟 YENİ ADRES EKLEME MODALI */}
      <Modal visible={adresModalGorunur} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>Yeni Adres Ekle</Text>
            
            <TextInput style={styles.input} placeholder="Adres Başlığı (Ev, İş vb.)" value={yeniAdresBaslik} onChangeText={setYeniAdresBaslik} />
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Açık Adres (Mahalle, Sokak, No...)" value={yeniAcikAdres} onChangeText={setYeniAcikAdres} multiline />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="İl" value={yeniIl} onChangeText={setYeniIl} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="İlçe" value={yeniIlce} onChangeText={setYeniIlce} />
            </View>
            {/* 🌟 YENİ FORMATLAYICI BURAYA BAĞLANDI VE maxLength EKLENDİ */}
            <TextInput style={styles.input} placeholder="Telefon (05...)" value={yeniTelefon} onChangeText={handleYeniTelefonChange} keyboardType="phone-pad" maxLength={16} />
            
            <View style={styles.modalButonSatiri}>
              <TouchableOpacity style={[styles.modalButon, { backgroundColor: '#f0f0f0' }]} onPress={() => setAdresModalGorunur(false)}>
                <Text style={{ color: '#333', fontWeight: 'bold' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButon, { backgroundColor: '#FFB800' }]} onPress={adresKaydet}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Adresi Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  geriButon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  baslik: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  bolumBaslik: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 15, paddingLeft: 5 },
  
  sanalKartContainer: { alignItems: 'center', marginBottom: 15 },
  sanalKart: { width: '100%', height: 200, backgroundColor: '#FF7597', borderRadius: 16, padding: 20, justifyContent: 'space-between', shadowColor: '#FF7597', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  kartUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kartCip: { width: 45, height: 32, backgroundColor: '#FFE3E8', borderRadius: 6, opacity: 0.9 },
  kartNoYazi: { color: '#FFF', fontSize: 21, fontWeight: '600', letterSpacing: 2, textAlign: 'center', marginVertical: 15 },
  kartAltSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  kartEtiket: { color: '#FFF', opacity: 0.7, fontSize: 10, fontWeight: '500', marginBottom: 4 },
  kartDeger: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  adresKutu: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 15 },
  adresSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  adresBaslik: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  adresDetay: { paddingLeft: 28 },
  adresMetin: { fontSize: 14, color: '#666', lineHeight: 22 },
  silIkonAdres: { position: 'absolute', top: 15, right: 15, zIndex: 1, padding: 5 },

  bosKutu: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#eee', borderStyle: 'dashed' },
  bosKutuYazi: { color: '#888', marginTop: 10, fontSize: 14 },

  ekleButon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 5,
    marginBottom: 20,
  },
  ekleButonYazi: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, shadowColor: '#000', elevation: 10 },
  modalBaslik: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', padding: 14, borderRadius: 12, fontSize: 14, marginBottom: 12, color: '#333' },
  modalButonSatiri: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 10 },
  modalButon: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' }
});