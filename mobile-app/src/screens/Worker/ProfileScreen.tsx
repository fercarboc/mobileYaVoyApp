import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  document_type: 'NIF' | 'NIE';
  document_number: string;
  address: string;
  city: string;
  postal_code: string;
  province: string;
  country: string;
  document_photo_url: string;
  selfie_photo_url: string;
  role: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Edit form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [documentType, setDocumentType] = useState<'NIF' | 'NIE'>('NIF');
  const [documentNumber, setDocumentNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('España');
  
  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesita acceso a la galería para subir fotos');
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('VoyUsers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setDocumentType(data.document_type || 'NIF');
        setDocumentNumber(data.document_number || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setPostalCode(data.postal_code || '');
        setProvince(data.province || '');
        setCountry(data.country || 'España');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'document' | 'selfie') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'document' ? [3, 2] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri, type);
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
        await uploadImage(result.assets[0].uri, type);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const uploadImage = async (uri: string, type: 'document' | 'selfie') => {
    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Comprimir imagen antes de subir
      let compressedUri = uri;
      let quality = 0.8;
      const maxFileSize = 3 * 1024 * 1024; // 3MB en bytes
      
      // Comprimir imagen iterativamente hasta que sea menor a 3MB
      let fileSize = maxFileSize + 1;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (fileSize > maxFileSize && attempts < maxAttempts) {
        const manipResult = await ImageManipulator.manipulateAsync(
          compressedUri,
          [
            { resize: { width: type === 'document' ? 1500 : 1000 } }
          ],
          { 
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG 
          }
        );
        
        compressedUri = manipResult.uri;
        
        // Verificar tamaño del archivo
        const fileInfo = await FileSystem.getInfoAsync(compressedUri);
        fileSize = fileInfo.size || 0;
        
        // Reducir calidad para siguiente iteración si es necesario
        quality = Math.max(0.3, quality - 0.15);
        attempts++;
      }
      
      // Si después de comprimir sigue siendo muy grande, mostrar error
      if (fileSize > maxFileSize) {
        Alert.alert(
          'Archivo muy grande',
          'La imagen es demasiado grande incluso después de comprimir. Por favor, elige una imagen más pequeña.'
        );
        return;
      }

      // Crear nombre de archivo con carpeta del usuario
      const filename = `${user.id}/${type}_${Date.now()}.jpg`;
      
      // Leer el archivo como ArrayBuffer para React Native
      const response = await fetch(compressedUri);
      const arrayBuffer = await response.arrayBuffer();
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filename, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filename);

      // Update profile
      const updateField = type === 'document' ? 'document_photo_url' : 'selfie_photo_url';
      const { error: updateError } = await supabase
        .from('VoyUsers')
        .update({ [updateField]: publicUrl })
        .eq('auth_user_id', user.id);

      if (updateError) throw updateError;

      // Actualizar el estado local para mostrar la imagen inmediatamente
      setProfile(prev => prev ? {
        ...prev,
        [updateField]: publicUrl
      } : null);

      Alert.alert('✅ Éxito', `${type === 'document' ? 'Documento' : 'Selfie'} subido correctamente`);
      loadProfile();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.message || 'No se pudo subir la imagen');
    } finally {
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

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'El teléfono es requerido');
      return;
    }

    if (!documentNumber.trim()) {
      Alert.alert('Error', 'El número de documento es requerido');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('VoyUsers')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          document_type: documentType,
          document_number: documentNumber.trim(),
          address: address.trim(),
          city: city.trim(),
          postal_code: postalCode.trim(),
          province: province.trim(),
          country: country.trim(),
        })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      Alert.alert('✅ Éxito', 'Perfil actualizado correctamente');
      setShowEditModal(false);
      loadProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert('✅ Éxito', 'Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cambiar la contraseña');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <TouchableOpacity onPress={() => setShowEditModal(true)}>
            <Ionicons name="create-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nombre Completo</Text>
              <Text style={styles.infoValue}>{profile?.full_name || 'No especificado'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{profile?.phone || 'No especificado'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="card" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Documento</Text>
              <Text style={styles.infoValue}>
                {profile?.document_type || 'NIF'} - {profile?.document_number || 'No especificado'}
              </Text>
            </View>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Domicilio</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="home" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>{profile?.address || 'No especificado'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Localidad</Text>
              <Text style={styles.infoValue}>{profile?.city || 'No especificado'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-open" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Código Postal</Text>
              <Text style={styles.infoValue}>{profile?.postal_code || 'No especificado'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="map" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Provincia</Text>
              <Text style={styles.infoValue}>{profile?.province || 'No especificado'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="globe" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>País</Text>
              <Text style={styles.infoValue}>{profile?.country || 'No especificado'}</Text>
            </View>
          </View>
        </View>

        {/* Notifications and Emergency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones y Emergencia</Text>
          
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => (navigation as any).navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.dark} />
            <Text style={styles.optionText}>Notificaciones y Alarma</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Document Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verificación de Identidad</Text>
          
          {/* Document Photo */}
          <TouchableOpacity 
            style={styles.photoCard}
            onPress={() => showImageOptions('document')}
            disabled={uploading}
          >
            <View style={styles.photoHeader}>
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
              <Text style={styles.photoTitle}>Foto del Documento</Text>
            </View>
            {profile?.document_photo_url ? (
              <Image 
                source={{ uri: profile.document_photo_url }} 
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
              <Text style={styles.photoTitle}>Selfie</Text>
            </View>
            {profile?.selfie_photo_url ? (
              <Image 
                source={{ uri: profile.selfie_photo_url }} 
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

          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.uploadingText}>Subiendo imagen...</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Cambiar Contraseña</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color={COLORS.error} />
            <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
              Cerrar Sesión
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.modalSaveText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Personal Info */}
            <Text style={styles.modalSectionTitle}>Información Personal</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre Completo *</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ej: Juan Pérez García"
              />
            </View>

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

            {/* Document Info */}
            <Text style={styles.modalSectionTitle}>Documento de Identidad</Text>
            
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

            {/* Address */}
            <Text style={styles.modalSectionTitle}>Domicilio</Text>
            
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

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            <TouchableOpacity onPress={handleChangePassword}>
              <Text style={styles.modalSaveText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite la contraseña"
                secureTextEntry
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
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
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
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
});
