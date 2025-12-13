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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '@/services/api';
import { User } from '@/types';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

export default function CompanyProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editSector, setEditSector] = useState('');
  const [verificationType, setVerificationType] = useState<'company' | 'autonomous'>('company');
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);

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
        setEditCity(profileData.city || '');
        setEditSector(profileData.company_sector || '');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
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

      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cambiar la contraseña');
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      const { error } = await supabase
        .from('VoyUsers')
        .update({
          full_name: editName.trim(),
          city: editCity.trim() || null,
          company_sector: editSector.trim() || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setShowEditModal(false);
      loadUser();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
    }
  };

  const handleRequestVerification = async () => {
    if (!documentName.trim()) {
      Alert.alert('Error', 'Por favor indica el nombre del documento que vas a enviar');
      return;
    }

    try {
      setUploading(true);
      
      // Actualizar estado de verificación en VoyUsers
      const { error } = await supabase
        .from('VoyUsers')
        .update({
          verification_status: 'pending',
          verification_type: verificationType,
          verification_document: documentName,
          verification_requested_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      Alert.alert(
        '✅ Solicitud Enviada',
        `Tu solicitud de verificación ha sido enviada.\n\nTipo: ${verificationType === 'company' ? 'Empresa (CIF/IAE)' : 'Autónomo (DNI)'}\n\nRecibiremos tu documentación por email y te notificaremos cuando esté verificada.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowVerifyModal(false);
              setDocumentName('');
              loadUser();
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la solicitud');
    } finally {
      setUploading(false);
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
          <Text style={styles.headerTitle}>Perfil Empresa</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="business" size={40} color={COLORS.white} />
            </View>
          </View>

          <Text style={styles.name}>{profile?.full_name || user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.roleBadge}>
            <Ionicons name="business" size={14} color={COLORS.primary} />
            <Text style={styles.roleBadgeText}>
              {user?.role === 'COMPANY' ? 'Empresa' : 'Particular'}
            </Text>
          </View>

          {profile?.city && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.gray} />
              <Text style={styles.infoText}>{profile.city}</Text>
            </View>
          )}

          {profile?.company_sector && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={16} color={COLORS.gray} />
              <Text style={styles.infoText}>{profile.company_sector}</Text>
            </View>
          )}
        </View>

        {/* Company Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Empresa</Text>
          
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="business-outline" size={20} color={COLORS.dark} />
            <Text style={styles.optionText}>Editar Datos de la Empresa</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => setShowVerifyModal(true)}
          >
            <Ionicons 
              name="checkmark-circle-outline" 
              size={20} 
              color={profile?.verification_status === 'verified' ? COLORS.success : COLORS.dark} 
            />
            <Text style={styles.optionText}>
              {profile?.verification_status === 'verified' ? 'Empresa Verificada ✓' :
               profile?.verification_status === 'pending' ? 'Verificación Pendiente...' :
               'Verificar Empresa'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Account Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Cuenta</Text>
          
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons name="key-outline" size={20} color={COLORS.dark} />
            <Text style={styles.optionText}>Cambiar Contraseña</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => Alert.alert('Notificaciones', 'Función en desarrollo')}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.dark} />
            <Text style={styles.optionText}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => Alert.alert('Ayuda', 'Contacta con soporte@yavoy.com')}
          >
            <Ionicons name="help-circle-outline" size={20} color={COLORS.dark} />
            <Text style={styles.optionText}>Ayuda y Soporte</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Versión 1.0.0</Text>
      </ScrollView>

      {/* Verification Modal */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verificar Empresa</Text>
              <TouchableOpacity onPress={() => setShowVerifyModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            {profile?.verification_status === 'verified' ? (
              <View style={styles.verifiedContainer}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
                <Text style={styles.verifiedTitle}>¡Empresa Verificada!</Text>
                <Text style={styles.verifiedText}>
                  Tu empresa ha sido verificada correctamente
                </Text>
              </View>
            ) : profile?.verification_status === 'pending' ? (
              <View style={styles.verifiedContainer}>
                <Ionicons name="time" size={64} color={COLORS.warning} />
                <Text style={styles.verifiedTitle}>Verificación Pendiente</Text>
                <Text style={styles.verifiedText}>
                  Estamos revisando tu documentación. Te notificaremos cuando esté verificada.
                </Text>
                <Text style={styles.documentInfo}>
                  Tipo: {profile.verification_type === 'company' ? 'Empresa' : 'Autónomo'}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.verifyDescription}>
                  Para verificar tu empresa, necesitamos que nos envíes la documentación correspondiente por email a: <Text style={styles.emailText}>verificacion@yavoy.com</Text>
                </Text>

                <Text style={styles.inputLabel}>Tipo de Verificación</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setVerificationType('company')}
                  >
                    <Ionicons
                      name={verificationType === 'company' ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={COLORS.primary}
                    />
                    <View style={styles.radioContent}>
                      <Text style={styles.radioTitle}>Empresa</Text>
                      <Text style={styles.radioSubtitle}>CIF + IAE o Escritura</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setVerificationType('autonomous')}
                  >
                    <Ionicons
                      name={verificationType === 'autonomous' ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={COLORS.primary}
                    />
                    <View style={styles.radioContent}>
                      <Text style={styles.radioTitle}>Autónomo</Text>
                      <Text style={styles.radioSubtitle}>DNI + Alta en Hacienda</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>
                  Documentos que enviarás *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={verificationType === 'company' ? 'Ej: CIF y IAE' : 'Ej: DNI y Alta'}
                  value={documentName}
                  onChangeText={setDocumentName}
                  placeholderTextColor={COLORS.gray}
                />

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={COLORS.info} />
                  <Text style={styles.infoText}>
                    Envía los documentos escaneados a verificacion@yavoy.com indicando tu email registrado.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.modalButton, uploading && styles.modalButtonDisabled]}
                  onPress={handleRequestVerification}
                  disabled={uploading}
                >
                  <Text style={styles.modalButtonText}>
                    {uploading ? 'Enviando...' : 'Solicitar Verificación'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nombre de la Empresa *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.inputLabel}>Ciudad</Text>
            <TextInput
              style={styles.input}
              placeholder="Madrid, Barcelona, etc."
              value={editCity}
              onChangeText={setEditCity}
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.inputLabel}>Sector</Text>
            <TextInput
              style={styles.input}
              placeholder="Hostelería, Tecnología, etc."
              value={editSector}
              onChangeText={setEditSector}
              placeholderTextColor={COLORS.gray}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.modalButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor={COLORS.gray}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor={COLORS.gray}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.modalButtonText}>Cambiar Contraseña</Text>
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
    backgroundColor: COLORS.lightGray,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginBottom: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  section: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.danger,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 24,
    marginBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 16,
  },
  emailText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 8,
  },
  radioContent: {
    marginLeft: 12,
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  radioSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.info}15`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    lineHeight: 18,
  },
  verifiedContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  verifiedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  documentInfo: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 12,
    fontStyle: 'italic',
  },
});
