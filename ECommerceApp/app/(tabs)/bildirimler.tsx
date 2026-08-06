import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Bildirimler() {
  const router = useRouter();
  const [bildirimler, setBildirimler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      bildirimleriGetir();
    }, [])
  );

  const bildirimleriGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/bildirim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBildirimler(response.data);
    } catch (error) {
      console.log("Bildirimler çekilemedi", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    bildirimleriGetir();
  };

  const tumunuOkunduIsaretle = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/bildirim/tumunu-okundu`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBildirimler(prev => prev.map(b => ({ ...b, okunduMu: true })));
    } catch (error) {
      console.log("Tümünü okundu işaretleme hatası", error);
    }
  };

  const bildirimeTikla = async (item: any) => {
    if (!item.okunduMu) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        await axios.put(`${API_CONFIG.BASE_URL}/bildirim/okundu/${item.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setBildirimler(prev => prev.map(b => b.id === item.id ? { ...b, okunduMu: true } : b));
      } catch (error) {
        console.log("Okundu işaretleme hatası", error);
      }
    }

    if (item.yonlendirmeLinki) {
      router.push(item.yonlendirmeLinki as any);
    }
  };

  const getIconInfo = (tip: string) => {
    switch (tip) {
      case 'Siparis': return { name: 'cube-outline', color: '#007AFF', bg: '#E5F1FF' };
      case 'Kupon': return { name: 'ticket-outline', color: '#4CAF50', bg: '#E8F5E9' };
      case 'Indirim': return { name: 'flame-outline', color: '#FF3B30', bg: '#FFEBEB' };
      case 'SoruCevap': return { name: 'chatbubbles-outline', color: '#8E44AD', bg: '#F4E5FA' };
      default: return { name: 'notifications-outline', color: '#666', bg: '#F0F0F0' };
    }
  };

  const renderBildirim = ({ item }: { item: any }) => {
    const isUnread = !item.okunduMu;
    const icon = getIconInfo(item.bildirimTipi);

    return (
      <TouchableOpacity 
        style={[styles.kart, isUnread && styles.kartOkunmamis]} 
        onPress={() => bildirimeTikla(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.ikonKutusu, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name as any} size={22} color={icon.color} />
        </View>

        <View style={styles.metinKutusu}>
          <Text style={[styles.baslik, isUnread && styles.baslikOkunmamis]} numberOfLines={1}>
            {item.baslik}
          </Text>
          <Text style={styles.icerik} numberOfLines={2}>
            {item.icerik}
          </Text>
          <Text style={styles.tarih}>
            {new Date(item.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {isUnread && <View style={styles.okunmamisNokta} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.geriBtn}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerBaslik}>Bildirimler</Text>
        <TouchableOpacity onPress={tumunuOkunduIsaretle} style={styles.okunduIsaretleBtn}>
          <Ionicons name="checkmark-done-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.merkez}><ActivityIndicator size="large" color="#007AFF" /></View>
      ) : (
        <FlatList
          data={bildirimler}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listeIcerik}
          renderItem={renderBildirim}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
          ListEmptyComponent={
            <View style={styles.bosKutu}>
              <Ionicons name="notifications-off-outline" size={60} color="#D1D1D6" />
              <Text style={styles.bosBaslik}>Bildiriminiz Yok</Text>
              <Text style={styles.bosIcerik}>Yeni gelişmeler olduğunda buradan sizi haberdar edeceğiz.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E5EA' 
  },
  geriBtn: { padding: 5 },
  okunduIsaretleBtn: { padding: 5 },
  headerBaslik: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  listeIcerik: { paddingVertical: 10 },
  
  kart: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    alignItems: 'center',
  },
  kartOkunmamis: {
    backgroundColor: '#F4F9FF', 
  },
  
  ikonKutusu: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  metinKutusu: {
    flex: 1,
    justifyContent: 'center',
  },
  baslik: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  baslikOkunmamis: {
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  icerik: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  tarih: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
  },

  okunmamisNokta: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },

  bosKutu: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 30,
  },
  bosBaslik: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  bosIcerik: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  }
});