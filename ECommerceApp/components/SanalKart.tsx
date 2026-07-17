import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

interface SanalKartProps {
  kartNo: string;
  kartSahibi: string;
  skt: string;
  cvv: string;
  isFlipped: boolean;
}

export default function SanalKart({ kartNo, kartSahibi, skt, cvv, isFlipped }: SanalKartProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(spinValue, {
      toValue: isFlipped ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const frontInterpolate = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  
  const frontOpacity = spinValue.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = spinValue.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

  const frontAnimatedStyle = { opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }] };
  const backAnimatedStyle = { opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backInterpolate }] };

  return (
    <View style={styles.sanalKartContainer}>
      <View style={styles.kartWrapper}>
        <Animated.View style={[styles.sanalKart, styles.kartOnYuz, frontAnimatedStyle]}>
          <View style={styles.kartUstBolum}>
            <Ionicons name="hardware-chip" size={40} color="#FFD700" />
            <Text style={styles.bankaIsmi}>MyBank</Text>
          </View>
          <Text style={styles.kartNoYazi}>{kartNo || '•••• •••• •••• ••••'}</Text>
          <View style={styles.kartAltBolum}>
            <View>
              <Text style={styles.kartEtiket}>KART SAHİBİ</Text>
              <Text style={styles.kartDetay}>{kartSahibi.toUpperCase() || 'AD SOYAD'}</Text>
            </View>
            <View>
              <Text style={styles.kartEtiket}>SKT</Text>
              <Text style={styles.kartDetay}>{skt || 'AA/YY'}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.sanalKart, styles.kartArkaYuz, backAnimatedStyle]}>
          <View style={styles.manyetikSerit} />
          <View style={styles.cvvBolumu}>
            <View style={styles.cvvBeyazAlan}><Text style={styles.cvvMetin}>{cvv || '•••'}</Text></View>
            <Text style={styles.cvvEtiket}>CVV</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sanalKartContainer: { alignItems: 'center', marginVertical: 10, height: 200, justifyContent: 'center' },
  kartWrapper: { width: 330, height: 200 },
  sanalKart: { width: 330, height: 200, borderRadius: 16, padding: 20, justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, backfaceVisibility: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  kartOnYuz: { backgroundColor: '#FF7597' },
  kartArkaYuz: { backgroundColor: '#FF7597' },
  kartUstBolum: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bankaIsmi: { color: '#FFF', fontSize: 18, fontStyle: 'italic', fontWeight: 'bold' },
  kartNoYazi: { color: '#FFF', fontSize: 22, letterSpacing: 2, textAlign: 'center', marginVertical: 15, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  kartAltBolum: { flexDirection: 'row', justifyContent: 'space-between' },
  kartEtiket: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, marginBottom: 2 },
  kartDetay: { color: '#FFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  manyetikSerit: { backgroundColor: '#000', height: 40, width: '120%', position: 'absolute', top: 30, left: -10 },
  cvvBolumu: { marginTop: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10 },
  cvvBeyazAlan: { backgroundColor: '#FFF', width: 60, height: 35, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  cvvMetin: { fontSize: 16, fontStyle: 'italic', fontWeight: 'bold' },
  cvvEtiket: { color: '#FFF', fontSize: 12, marginLeft: 10 },
});