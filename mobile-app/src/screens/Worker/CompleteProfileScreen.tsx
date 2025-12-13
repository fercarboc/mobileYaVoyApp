import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

export default function CompleteProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form fields
  const [phone, setPhone] = useState('');
  const [documentType, setDocumentType] = useState<'NIF' | 'NIE'>('NIF');
  const [documentNumber, setDocumentNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('España');
  const [documentPhotoUri, setDocumentPhotoUri] = useState<string | null>(null);
  const [selfiePhotoUri, setSelfiePhotoUri] = useState<string | null>(null);

  const pickImage = async (type: 'document' | 'selfie') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'document' ? [3, 2] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'document') {
          setDocumentPhotoUri(result.assets[0].uri);
        } else {
          setSelfiePhotoUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async (type: 'document' | 'selfie') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesita acceso a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: type === 'document' ? [3, 2] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'document') {
          setDocumentPhotoUri(result.assets[0].uri);
        } else {
          setSelfiePhotoUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const compressImage = async (uri: string, type: 'document' | 'selfie'): Promise<string> => {
    let compressedUri = uri;
    let quality = 0.8;
    const maxFileSize = 3 * 1024 * 1024; // 3MB
    
    let fileSize = maxFileSize + 1;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (fileSize > maxFileSize && attempts < maxAttempts) {
      const manipResult = await ImageManipulator.manipulateAsync(
        compressedUri,
        [{ resize: { width: type === 'document' ? 1500 : 1000 } }],
        { 
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      
      compressedUri = manipResult.uri;
      const fileInfo = await FileSystem.getInfoAsync(compressedUri);
      fileSize = (fileInfo as any).size || 0;
      quality = Math.max(0.3, quality - 0.15);
      attempts++;
    }
    
    if (fileSize > maxFileSize) {
      throw new Error('La imagen es demasiado grande incluso después de comprimir');
    }
    
    return compressedUri;
  };

  const uploadImage = async (uri: string, type: 'document' | 'selfie'): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const compressedUri = await compressImage(uri, type);
    
    // Crear nombre de archivo con carpeta del usuario
    const filename = `${user.id}/${type}_${Date.now()}.jpg`;
    
    // Leer el archivo como ArrayBuffer para React Native
    const response = await fetch(compressedUri);
    const arrayBuffer = await response.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(filename, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('user-documents')
      .getPublicUrl(filename);

    return publicUrl;
  };

  const handleComplete = async () => {
    // Validaciones
    if (!phone.trim()) {
      Alert.alert('Error', 'El teléfono es obligatorio');
      return;
    }
    if (!documentNumber.trim()) {
      Alert.alert('Error', 'El número de documento es obligatorio');
      return;
    }
    if (!documentPhotoUri) {
      Alert.alert('Error', 'La foto del documento es obligatoria');
      return;
    }
    if (!selfiePhotoUri) {
      Alert.alert('Error', 'La selfie es obligatoria');
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Subir imágenes
      const documentUrl = await uploadImage(documentPhotoUri, 'document');
      const selfieUrl = await uploadImage(selfiePhotoUri, 'selfie');

      // Actualizar perfil
      const { error } = await supabase
        .from('VoyUsers')
        .update({
          phone: phone.trim(),
          document_type: documentType,
          document_number: documentNumber.trim(),
          address: address.trim(),
          city: city.trim(),
          postal_code: postalCode.trim(),
          province: province.trim(),
          country: country.trim(),
          document_photo_url: documentUrl,
          selfie_photo_url: selfieUrl,
        })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      Alert.alert(
        '✅ Perfil Completado',
        '¡Tu perfil ha sido completado exitosamente! Ya puedes empezar a trabajar.',
        [
          {
            text: 'OK',
            onPress: () => {
              // La navegación se manejará automáticamente
              // ya que el usuario está autenticado
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error completing profile:', error);
      Alert.alert('Error', error.message || 'No se pudo completar el perfil');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const showImageOptions = (type: 'document' | 'selfie') => {
    Alert.alert(
      type === 'document' ? 'Foto del Documento' : 'Selfie',
      'Selecciona una opción',
      [
        { text: 'Tomar Foto', onPress: () => takePhoto(type) },
        { text: 'Elegir de Galería', onPress: () => pickImage(type) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Completa tu Perfil</Text>
          <Text style={styles.headerSubtitle}>
            Para empezar a trabajar, necesitamos algunos datos adicionales
          </Text>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Personales</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej: 612345678"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Document Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documento de Identidad</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo de Documento *</Text>
            <View style={styles.documentTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.documentTypeButton,
                  documentType === 'NIF' && styles.documentTypeButtonActive,
                ]}
                onPress={() => setDocumentType('NIF')}
              >
                <Text
                  style={[
                    styles.documentTypeText,
                    documentType === 'NIF' && styles.documentTypeTextActive,
                  ]}
                >
                  NIF
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.documentTypeButton,
                  documentType === 'NIE' && styles.documentTypeButtonActive,
                ]}
                onPress={() => setDocumentType('NIE')}
              >
                <Text
                  style={[
                    styles.documentTypeText,
                    documentType === 'NIE' && styles.documentTypeTextActive,
                  ]}
                >
                  NIE
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de Documento *</Text>
            <TextInput
              style={styles.input}
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder="Ej: 12345678A"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Domicilio (Opcional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Calle, número, piso, puerta"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Localidad</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Ej: Madrid"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Código Postal</Text>
            <TextInput
              style={styles.input}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="Ej: 28001"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Provincia</Text>
            <TextInput
              style={styles.input}
              value={province}
              onChangeText={setProvince}
              placeholder="Ej: Madrid"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>País</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder="Ej: España"
            />
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verificación de Identidad *</Text>
          
          {/* Document Photo */}
          <TouchableOpacity 
            style={styles.photoCard}
            onPress={() => showImageOptions('document')}
            disabled={uploading}
          >
            <View style={styles.photoHeader}>
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
              <Text style={styles.photoTitle}>Foto del Documento *</Text>
            </View>
            {documentPhotoUri ? (
              <Image 
                source={{ uri: documentPhotoUri }} 
                style={styles.photoPreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={48} color={COLORS.textSecondary} />
                <Text style={styles.photoPlaceholderText}>
                  Toca para subir foto del documento
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Selfie Photo */}
          <TouchableOpacity 
            style={styles.photoCard}
            onPress={() => showImageOptions('selfie')}
            disabled={uploading}
          >
            <View style={styles.photoHeader}>
              <Ionicons name="person-circle" size={24} color={COLORS.primary} />
              <Text style={styles.photoTitle}>Selfie *</Text>
            </View>
            {selfiePhotoUri ? (
              <Image 
                source={{ uri: selfiePhotoUri }} 
                style={styles.photoPreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={48} color={COLORS.textSecondary} />
                <Text style={styles.photoPlaceholderText}>
                  Toca para subir tu selfie
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, (loading || uploading) && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading || uploading}
          >
            {uploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Subiendo imágenes...</Text>
              </>
            ) : (
              <Text style={styles.buttonText}>
                {loading ? 'Guardando...' : 'Completar Perfil'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helperText}>
            * Campos obligatorios
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  documentTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  documentTypeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  documentTypeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  documentTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  documentTypeTextActive: {
    color: COLORS.primary,
  },
  photoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});
