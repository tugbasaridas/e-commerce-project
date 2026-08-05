import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

interface GrafikProps {
  aylar?: string[];
  cirolar?: number[];
}

export default function SaticiGrafikler({ 
  aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz"], 
  cirolar = [0, 0, 0, 0, 0, 0] 
}: GrafikProps) {
  
  // Eğer ciro dizisi tamamen sıfırsa grafik kütüphanesinin çökmemesi için ufak bir koruma
  const guvenliCirolar = cirolar.every(c => c === 0) ? [0, 0, 0, 0, 0, 0.1] : cirolar;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={20} color="#FF9F00" />
        <Text style={styles.baslik}>Son 6 Aylık Ciro Grafiği</Text>
      </View>
      
      <LineChart
        data={{
          labels: aylar,
          datasets: [
            {
              data: guvenliCirolar,
              color: (opacity = 1) => `rgba(255, 159, 0, ${opacity})`, // Trendyol Turuncusu
              strokeWidth: 3, 
            }
          ]
        }}
        width={screenWidth - 40} // Ekran genişliğine göre tam oturur
        height={220}
        yAxisLabel="₺"
        yAxisSuffix=""
        yAxisInterval={1} 
        fromZero={true}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 159, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: "#FF9F00"
          }
        }}
        bezier // Çizgileri yumuşatır (Dalga efekti)
        style={styles.grafik}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFF4E5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  baslik: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  grafik: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
    marginLeft: -10 // Mobilde grafiğin sola tam oturması için
  }
});