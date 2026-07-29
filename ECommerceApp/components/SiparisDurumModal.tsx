import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface SiparisDurumModalProps {
  visible: boolean;
  siparis: any;
  seciliUrun: any; 
  onClose: () => void;
  onDurumSec: (durum: string, kargoFirma?: string, kargoTakipNo?: string) => void;
  isAdmin?: boolean; 
}

export default function SiparisDurumModal({ visible, siparis, seciliUrun, onClose, onDurumSec, isAdmin = false }: SiparisDurumModalProps) {
  const [kargoGirisiAcik, setKargoGirisiAcik] = useState(false);
  const [kargoFirma, setKargoFirma] = useState('');
  const [kargoTakipNo, setKargoTakipNo] = useState('');

  const handleClose = () => {
    setKargoGirisiAcik(false);
    setKargoFirma('');
    setKargoTakipNo('');
    onClose();
  };

  if (!siparis || !seciliUrun) return null;
  const mevcutDurum = seciliUrun.durum || 'Hazırlanıyor';

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalTutacak} />
              
              <Text style={styles.modalBaslik}>{isAdmin ? "Admin Müdahale Paneli" : "Ürün Durumunu Güncelle"}</Text>
              <Text style={styles.modalAltBaslik}>
                #{siparis.id || siparis.siparisId} nolu siparişteki <Text style={{fontWeight: 'bold', color: '#1C1C1E'}}>{seciliUrun.ad}</Text> ürünü şu an {mevcutDurum} aşamasında.
              </Text>
              
              {!kargoGirisiAcik && (
                <>
                  {!isAdmin && mevcutDurum === 'Hazırlanıyor' && (
                    <TouchableOpacity style={[styles.modalSecenek, { borderLeftColor: '#4EA8DE' }]} onPress={() => setKargoGirisiAcik(true)}>
                      <View style={[styles.modalSecenekIcon, { backgroundColor: '#E1F5FE' }]}><Ionicons name="cube-outline" size={20} color="#4EA8DE" /></View>
                      <Text style={styles.modalSecenekYazi}>Kargoya Verildi (Takip No Gir)</Text>
                    </TouchableOpacity>
                  )}

                  {!isAdmin && mevcutDurum === 'Kargoya Verildi' && (
                    <TouchableOpacity style={[styles.modalSecenek, { borderLeftColor: '#28A745' }]} onPress={() => onDurumSec('Tamamlandı')}>
                      <View style={[styles.modalSecenekIcon, { backgroundColor: '#F0FDF4' }]}><Ionicons name="checkmark-circle-outline" size={20} color="#28A745" /></View>
                      <Text style={styles.modalSecenekYazi}>Teslim Edildi (Tamamlandı)</Text>
                    </TouchableOpacity>
                  )}

                  {/* İŞTE BURAYI DÜZELTTİK: Admin de olsa Satıcı da olsa SADECE "İptal" statüsü gönderilecek */}
                  {(mevcutDurum === 'Hazırlanıyor' || mevcutDurum === 'Kargoya Verildi') && (
                    <TouchableOpacity style={[styles.modalSecenek, { borderLeftColor: '#EF233C' }]} onPress={() => onDurumSec('İptal')}>
                      <View style={[styles.modalSecenekIcon, { backgroundColor: '#FFEBEA' }]}><Ionicons name="close-circle-outline" size={20} color="#EF233C" /></View>
                      <Text style={styles.modalSecenekYazi}>{isAdmin ? "Admin Olarak Ürünü İptal Et" : "Siparişi İptal Et"}</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {kargoGirisiAcik && !isAdmin && (
                <View style={styles.kargoGirisAlan}>
                  <Text style={styles.kargoBaslik}>Kargo Bilgileri</Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Aras Kargo, Yurtiçi Kargo"
                    value={kargoFirma}
                    onChangeText={setKargoFirma}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Kargo Takip Numarası"
                    value={kargoTakipNo}
                    onChangeText={setKargoTakipNo}
                  />

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity style={[styles.modalVazgecBtn, { flex: 1 }]} onPress={() => setKargoGirisiAcik(false)}>
                      <Text style={styles.modalVazgecYazi}>Geri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalVazgecBtn, { flex: 1, backgroundColor: '#4EA8DE' }]} 
                      onPress={() => onDurumSec('Kargoya Verildi', kargoFirma, kargoTakipNo)}
                    >
                      <Text style={[styles.modalVazgecYazi, { color: '#FFF' }]}>Kaydet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!kargoGirisiAcik && (
                <TouchableOpacity style={styles.modalVazgecBtn} onPress={handleClose}>
                  <Text style={styles.modalVazgecYazi}>Vazgeç</Text>
                </TouchableOpacity>
              )}
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
  modalVazgecYazi: { color: '#1C1C1E', fontSize: 16, fontWeight: 'bold' },
  kargoGirisAlan: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  kargoBaslik: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginBottom: 10 },
  input: { backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 10, fontSize: 14, color: '#1C1C1E' }
});