import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../config/api';

export default function AdminSaticiOnay() {
  const router = useRouter();
  
  const [magazalar, setMagazalar] = useState<any[]>([]);
  const [filtrelenmisMagazalar, setFiltrelenmisMagazalar] = useState<any[]>([]);
  const [aramaMetni, setAramaMetni] = useState('');
  const [aktifSekme, setAktifSekme] = useState<'Tümü' | 'Onay Bekleyen' | 'Onaylı'>('Onay Bekleyen'); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    magazalariGetir();
  }, []);

  const magazalariGetir = async () => {
    try {
      // ENDPOINT GÜNCELLENDİ: Backend'deki [HttpGet("magazalar")] rotasına göre ayarlandı
      const response = await api.get('/admin/magazalar');
      setMagazalar(response.data);
      filtreleUygula(aramaMetni, aktifSekme, response.data);
    } catch (error) {
      console.error("Mağazalar çekilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtreleUygula = (text: string, sekme: string, data: any[]) => {
    let sonuc = data;

    if (sekme === 'Onay Bekleyen') sonuc = sonuc.filter(m => !m.onaylandiMi);
    if (sekme === 'Onaylı') sonuc = sonuc.filter(m => m.onaylandiMi);

    if (text) {
      const aranan = text.toLowerCase();
      sonuc = sonuc.filter(m =>
        (m.magazaAdi && m.magazaAdi.toLowerCase().includes(aranan)) ||
        (m.saticiAdi && m.saticiAdi.toLowerCase().includes(aranan))
      );
    }

    setFiltrelenmisMagazalar(sonuc);
  };

  const handleArama = (text: string) => {
    setAramaMetni(text);
    filtreleUygula(text, aktifSekme, magazalar);
  };

  const handleSekmeDegistir = (sekme: 'Tümü' | 'Onay Bekleyen' | 'Onaylı') => {
    setAktifSekme(sekme);
    filtreleUygula(aramaMetni, sekme, magazalar);
  };

  const magazaOnayla = (id: number, magazaAdi: string) => {
    Alert.alert("Mağazayı Onayla", `${magazaAdi} adlı mağazanın pazaryerinde satış yapmasına izin vermek istiyor musunuz?`, [
      { text: "İptal", style: "cancel" },
      { 
        text: "Evet, Onayla", 
        style: "default",
        onPress: async () => {
          try {
            // ENDPOINT GÜNCELLENDİ: [HttpPut("magaza/{id}/onayla")]
            await api.put(`/admin/magaza/${id}/onayla`);
            
            // VERİ EŞLEŞTİRMESİ GÜNCELLENDİ: DTO'dan gelen magazaId kullanılıyor
            const guncelListe = magazalar.map(m => m.magazaId === id ? { ...m, onaylandiMi: true } : m);
            setMagazalar(guncelListe);
            filtreleUygula(aramaMetni, aktifSekme, guncelListe);
            
            Alert.alert("Başarılı", `${magazaAdi} başarıyla onaylandı.`);
          } catch (error: any) {
            Alert.alert("Hata", "Onaylama işlemi başarısız oldu.");
          }
        }
      }
    ]);
  };

  const magazaReddet = (id: number, magazaAdi: string) => {
    Alert.alert("Başvuruyu Reddet", `${magazaAdi} adlı mağazanın başvurusunu reddedip silmek istediğinize emin misiniz?`, [
      { text: "Vazgeç", style: "cancel" },
      { 
        text: "Reddet ve Sil", 
        style: "destructive",
        onPress: async () => {
          try {
            // ENDPOINT GÜNCELLENDİ: [HttpDelete("magaza/{id}/reddet")]
            await api.delete(`/admin/magaza/${id}/reddet`);
            
            // VERİ EŞLEŞTİRMESİ GÜNCELLENDİ: DTO'dan gelen magazaId kullanılıyor
            const guncelListe = magazalar.filter(m => m.magazaId !== id);
            setMagazalar(guncelListe);
            filtreleUygula(aramaMetni, aktifSekme, guncelListe);
            
            Alert.alert("Silindi", "Mağaza başvurusu reddedildi.");
          } catch (error: any) {
            console.log("REDDETME HATASI:", error.response?.data);
            Alert.alert("Hata", "Silme işlemi başarısız oldu.");
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    // DTO'dan dönen kesin ID alanı
    const currentId = item.magazaId; 

    return (
      <View style={[styles.card, !item.onaylandiMi && styles.pendingCardBorder]}>
        
        <View style={[styles.iconContainer, item.onaylandiMi ? { backgroundColor: '#E8F5E9' } : { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="storefront" size={24} color={item.onaylandiMi ? "#28A745" : "#FF9800"} />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.storeName} numberOfLines={1}>{item.magazaAdi || 'İsimsiz Mağaza'}</Text>
          <Text style={styles.sellerName}><Ionicons name="person-outline" size={12} /> {item.saticiAdi}</Text>
          <Text style={styles.detailText}><Ionicons name="call-outline" size={12} /> {item.iletisimTelefonu || 'Belirtilmedi'}</Text>
          
          {item.vergiNo ? (
             <Text style={styles.detailText}><Ionicons name="document-text-outline" size={12} /> Vergi No: {item.vergiNo}</Text>
          ) : null}
        </View>
        
        <View style={styles.actionContainer}>
          <View style={[styles.badge, item.onaylandiMi ? styles.badgeApproved : styles.badgePending]}>
            <Text style={[styles.badgeText, item.onaylandiMi ? styles.badgeTextApproved : styles.badgeTextPending]}>
              {item.onaylandiMi ? 'ONAYLI' : 'BEKLİYOR'}
            </Text>
          </View>
          
          {!item.onaylandiMi ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFF0F0', marginRight: 8 }]} onPress={() => magazaReddet(currentId, item.magazaAdi)}>
                <Ionicons name="close" size={22} color="#FF4757" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]} onPress={() => magazaOnayla(currentId, item.magazaAdi)}>
                <Ionicons name="checkmark" size={22} color="#28A745" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.suspendBtn} onPress={() => {}}>
              <Ionicons name="search-outline" size={16} color="#8E8E93" />
              <Text style={styles.suspendBtnText}>İncele</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/(admin)/admin-islemler' as any)}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mağaza Onay Yönetimi</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Mağaza veya satıcı adı ara..."
          value={aramaMetni}
          onChangeText={handleArama}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.tabContainer}>
        {['Tümü', 'Onay Bekleyen', 'Onaylı'].map((sekme) => (
          <TouchableOpacity 
            key={sekme}
            style={[styles.tabButton, aktifSekme === sekme && styles.activeTab]}
            onPress={() => handleSekmeDegistir(sekme as any)}
          >
            <Text style={[styles.tabText, aktifSekme === sekme && styles.activeTabText]}>{sekme}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3F51B5" /></View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtrelenmisMagazalar} 
          keyExtractor={(item, index) => (item.magazaId || index).toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={60} color="#D1D1D6" />
              <Text style={styles.emptyText}>Bu kategoride mağaza kaydı bulunamadı.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E5EA' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 15, borderRadius: 12, paddingHorizontal: 15, height: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 15, gap: 8 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#E5E5EA', borderRadius: 10 },
  activeTab: { backgroundColor: '#3F51B5' }, 
  tabText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  activeTabText: { color: '#FFF' },
  
  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  pendingCardBorder: { borderLeftWidth: 4, borderLeftColor: '#FF9800' }, 
  
  iconContainer: { padding: 12, borderRadius: 14, marginRight: 15 },
  
  infoContainer: { flex: 1, paddingRight: 10 },
  storeName: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  sellerName: { fontSize: 13, color: '#666', marginBottom: 2 },
  detailText: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  
  actionContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 12 },
  badgePending: { backgroundColor: '#FFF3E0' },
  badgeApproved: { backgroundColor: '#E8F5E9' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeTextPending: { color: '#FF9800' },
  badgeTextApproved: { color: '#28A745' },
  
  buttonRow: { flexDirection: 'row' },
  actionBtn: { padding: 8, borderRadius: 10 },
  
  suspendBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F2F2F7', borderRadius: 8 },
  suspendBtnText: { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginLeft: 4 },
  
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 15, fontSize: 15 }
});