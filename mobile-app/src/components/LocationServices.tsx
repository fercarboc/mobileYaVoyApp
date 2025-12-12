import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '@/constants';

interface LocationServicesProps {
  onLocationGranted: (coords: { latitude: number; longitude: number }) => void;
}

export default function LocationServices({ onLocationGranted }: LocationServicesProps) {
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      getCurrentLocation();
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        await getCurrentLocation();
      } else {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos tu ubicación para mostrarte trabajos cercanos. Puedes activarlo en ajustes.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'No se pudo solicitar el permiso de ubicación');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onLocationGranted({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    } finally {
      setLoading(false);
    }
  };

  if (permissionStatus === 'granted') {
    return null; // No mostrar nada si ya tiene permiso
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={64} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Activa tu ubicación</Text>
        <Text style={styles.description}>
          Para mostrarte los trabajos más cercanos, necesitamos acceder a tu ubicación
        </Text>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={requestPermission}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.buttonText}>Activar ubicación</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={() => onLocationGranted({ latitude: 40.4168, longitude: -3.7038 })}>
          <Text style={styles.skipText}>Continuar sin ubicación</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});
