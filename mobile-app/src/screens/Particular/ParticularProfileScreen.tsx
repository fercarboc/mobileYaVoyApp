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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { AuthService } from '@/services/api';
import { User } from '@/types';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

export default function ParticularProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Campos de edición
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [editCountry, setEditCountry] = useState('España');
  const [editDocumentType, setEditDocumentType] = useState<'NIF' | 'NIE'>('NIF');
  const [editDocumentNumber, setEditDocumentNumber] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      loadProfile();
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profileData } = await supabase
        .from('VoyUsers')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditName(profileData.full_name || '');
        setEditPhone(profileData.phone || '');
        setEditAddress(profileData.address || '');
        setEditCity(profileData.city || '');
        setEditPostalCode(profileData.postal_code || '');
        setEditProvince(profileData.province || '');
        setEditCountry(profileData.country || 'España');
        setEditDocumentType(profileData.document_type || 'NIF');
        setEditDocumentNumber(profileData.document_number || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
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
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Error al cambiar la contraseña');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { error } = await supabase
        .from('VoyUsers')
        .update({
          full_name: editName,
          phone: editPhone,
          address: editAddress,
          city: editCity,
          postal_code: editPostalCode,
          province: editProvince,
          country: editCountry,
          document_type: editDocumentType,
          document_number: editDocumentNumber,
        })
        .eq('auth_user_id', authUser.id);

      if (error) throw error;

      Alert.alert('✅ Éxito', 'Perfil actualizado correctamente');
      setShowEditModal(false);
      loadProfile();
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Error al actualizar el perfil');
    }
  };

  const compressImage = async (uri: string): Promise<string> => {
    const fileInfo = await FileSystem.getInfoAsync(uri) as any;
    const fileSizeInMB = fileInfo.size / (1024 * 1024);
    
    let quality = 0.8;
    let compressedUri = uri;
    let attempts = 0;
    const maxAttempts = 5;

    while (fileSizeInMB > 3 && attempts < maxAttempts) {
      const result = await ImageManipulator.manipulateAsync(
        compressedUri,
        [{ resize: { width: 1500 } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      compressedUri = result.uri;
      quality -= 0.1;
      attempts++;
      
      const newFileInfo = await FileSystem.getInfoAsync(compressedUri) as any;
      const newSizeInMB = newFileInfo.size / (1024 * 1024);
      
      if (newSizeInMB < 3) break;
    }

    const finalFileInfo = await FileSystem.getInfoAsync(compressedUri) as any;
    const finalSizeInMB = finalFileInfo.size / (1024 * 1024);
    
    if (finalSizeInMB > 3) {
      throw new Error('No se pudo comprimir la imagen por debajo de 3MB');
    }

    return compressedUri;
  };

  const uploadImage = async (uri: string, type: 'document' | 'selfie') => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No autenticado');

      const compressedUri = await compressImage(uri);
      
      const filename = `${authUser.id}/${type}_${Date.now()}.jpg`;
      
      const response = await fetch(compressedUri);
      const arrayBuffer = await response.arrayBuffer();

      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(filename, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filename);

      const publicUrl = publicUrlData.publicUrl;
      
      const updateField = type === 'document' ? 'document_photo_url' : 'selfie_photo_url';
      const { error: updateError } = await supabase
        .from('VoyUsers')
        .update({ [updateField]: publicUrl })
        .eq('auth_user_id', authUser.id);

      if (updateError) throw updateError;

      setProfile((prev: any) => prev ? {
        ...prev,
        [updateField]: publicUrl
      } : null);

      Alert.alert('✅ Éxito', `${type === 'document' ? 'Documento' : 'Selfie'} subido correctamente`);
      loadProfile();
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Error al subir la imagen');
    }
  };

  const pickImage = async (type: 'document' | 'selfie') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tus fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'document' ? [3, 2] : [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri, type);
    }
  };

  const takePhoto = async (type: 'document' | 'selfie') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos permiso para usar la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'document' ? [3, 2] : [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri, type);
    }
  };

  const showImageOptions = (type: 'document' | 'selfie') => {
    Alert.alert(
      `Subir ${type === 'document' ? 'Documento' : 'Selfie'}`,
      'Elige una opción',
      [
        { text: 'Cámara', onPress: () => takePhoto(type) },
        { text: 'Galería', onPress: () => pickImage(type) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
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
            await AuthService.signOut();
          },
        },
      ]
    );
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.gray }}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={COLORS.white} />
            </View>
          </View>

          <Text style={styles.name}>{profile?.full_name || user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.roleBadge}>
            <Ionicons name="person" size={14} color={COLORS.primary} />
            <Text style={styles.roleBadgeText}>Particular</Text>
          </View>

          {profile?.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={COLORS.gray} />
              <Text style={styles.infoText}>{profile.phone}</Text>
            </View>
          )}

          {profile?.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.gray} />
              <Text style={styles.infoText}>{profile.address}, {profile.city}</Text>
            </View>
          )}
        </View>

        {/* Personal Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Personales</Text>
          
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.dark} />
            <Text style={styles.optionText}>Editar Datos Personales</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => showImageOptions('document')}
          >
            <Ionicons name="card-outline" size={20} color={COLORS.dark} />
            <Text style={styles.optionText}>
              {profile?.document_photo_url ? 'Actualizar Documento' : 'Subir Documento'}
            </Text>
            {profile?.document_photo_url && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            )}
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => showImageOptions('selfie')}
          >
            <Ionicons name="camera-outline" size={20} color={COLORS.dark} />
            <Text style={styles.optionText}>
              {profile?.selfie_photo_url ? 'Actualizar Selfie' : 'Subir Selfie'}
            </Text>
            {profile?.selfie_photo_url && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            )}
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
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

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.dark} />
            <Text style={styles.optionText}>Cambiar Contraseña</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Datos Personales</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nombre completo"
              />

              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+34 600 000 000"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Tipo de Documento</Text>
              <View style={styles.documentTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.documentTypeButton,
                    editDocumentType === 'NIF' && styles.documentTypeButtonActive,
                  ]}
                  onPress={() => setEditDocumentType('NIF')}
                >
                  <Text
                    style={[
                      styles.documentTypeText,
                      editDocumentType === 'NIF' && styles.documentTypeTextActive,
                    ]}
                  >
                    NIF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.documentTypeButton,
                    editDocumentType === 'NIE' && styles.documentTypeButtonActive,
                  ]}
                  onPress={() => setEditDocumentType('NIE')}
                >
                  <Text
                    style={[
                      styles.documentTypeText,
                      editDocumentType === 'NIE' && styles.documentTypeTextActive,
                    ]}
                  >
                    NIE
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Número de Documento</Text>
              <TextInput
                style={styles.input}
                value={editDocumentNumber}
                onChangeText={setEditDocumentNumber}
                placeholder="12345678A"
              />

              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Calle, número, piso..."
              />

              <Text style={styles.label}>Ciudad</Text>
              <TextInput
                style={styles.input}
                value={editCity}
                onChangeText={setEditCity}
                placeholder="Madrid"
              />

              <Text style={styles.label}>Código Postal</Text>
              <TextInput
                style={styles.input}
                value={editPostalCode}
                onChangeText={setEditPostalCode}
                placeholder="28001"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Provincia</Text>
              <TextInput
                style={styles.input}
                value={editProvince}
                onChangeText={setEditProvince}
                placeholder="Madrid"
              />

              <Text style={styles.label}>País</Text>
              <TextInput
                style={styles.input}
                value={editCountry}
                onChangeText={setEditCountry}
                placeholder="España"
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
              />

              <Text style={styles.label}>Confirmar Contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite la contraseña"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
              <Text style={styles.saveButtonText}>Cambiar Contraseña</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    margin: 20,
    marginTop: -30,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
    gap: 5,
  },
  roleBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.danger,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: COLORS.background,
  },
  documentTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  documentTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  documentTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  documentTypeText: {
    fontSize: 15,
    color: COLORS.gray,
  },
  documentTypeTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
