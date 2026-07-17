import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface SiparisDurumModalProps {
  visible: boolean;
  siparis: any; // Seçili sipariş objesi
  onClose: () => void;
  onDurumSec: (durum: string) => void;
}

export default function SiparisDurumModal({ visible, siparis, onClose, onDurumSec }: SiparisDurumModalProps) {
  if (!siparis) return null;

  const mevcutDurum = siparis.durum;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalTutacak} />
              <Text style={styles.modalBaslik}>Sipariş Durumunu Güncelle</Text>
              <Text style={styles.modalAltBaslik}>#{siparis.id} numaralı sipariş şu an <Text style={{fontWeight: 'bold', color: '#1C1C1E'}}>{mevcutDurum}</Text> aşamasında.</Text>
              
              {/* MANTIK FİLTRESİ: Sadece mantıklı olan sonraki adımları göster */}
              
              {mevcutDurum === 'Hazırlanıyor' && (
                <TouchableOpacity style={[styles.modalSecenek, { borderLeftColor: '#4EA8DE' }]} onPress={() => onDurumSec('Kargoya Verildi')}>
                  <View style={[styles.modalSecenekIcon, { backgroundColor: '#E1F5FE' }]}><Ionicons name="cube-outline" size={20} color="#4EA8DE" /></View>
                  <Text style={styles.modalSecenekYazi}>Kargoya Verildi Olarak İşaretle</Text>
                </TouchableOpacity>
              )}

              {mevcutDurum === 'Kargoya Verildi' && (
                <TouchableOpacity style={[styles.modalSecenek, { borderLeftColor: '#28A745' }]} onPress={() => onDurumSec('Tamamlandı')}>
                  <View style={[styles.modalSecenekIcon, { backgroundColor: '#F0FDF4' }]}><Ionicons name="checkmark-circle-outline" size={20} color="#28A745" /></View>
                  <Text style={styles.modalSecenekYazi}>Teslim Edildi (Tamamlandı)</Text>
                </TouchableOpacity>
              )}

              {/* İptal seçeneği her zaman aktif kalabilir veya tamamlanmadıysa aktif olur */}
              {(mevcutDurum === 'Hazırlanıyor' || mevcutDurum === 'Kargoya Verildi') && (
                <TouchableOpacity style={[styles.modalSecenek, { borderLeftColor: '#EF233C' }]} onPress={() => onDurumSec('İptal')}>
                  <View style={[styles.modalSecenekIcon, { backgroundColor: '#FFEBEA' }]}><Ionicons name="close-circle-outline" size={20} color="#EF233C" /></View>
                  <Text style={styles.modalSecenekYazi}>Siparişi İptal Et</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.modalVazgecBtn} onPress={onClose}>
                <Text style={styles.modalVazgecYazi}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 25, paddingBottom: 35, paddingTop: 15 },
  modalTutacak: { width: 40, height: 5, backgroundColor: '#E5E5EA', borderRadius: 5, alignSelf: 'center', marginBottom: 20 },
  modalBaslik: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  modalAltBaslik: { fontSize: 14, color: '#8E8E93', marginBottom: 20 },
  modalSecenek: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4 },
  modalSecenekIcon: { padding: 8, borderRadius: 8, marginRight: 15 },
  modalSecenekYazi: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  modalVazgecBtn: { marginTop: 15, paddingVertical: 15, backgroundColor: '#F2F2F7', borderRadius: 12, alignItems: 'center' },
  modalVazgecYazi: { color: '#1C1C1E', fontSize: 16, fontWeight: 'bold' }
});