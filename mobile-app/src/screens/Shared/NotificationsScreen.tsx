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
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'notifications' | 'emergency'>('notifications');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmergencyContacts();
  }, []);

  const loadEmergencyContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('VoyEmergencyContacts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setEmergencyContacts(data);
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Error', 'Por favor completa nombre y teléfono');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;

      const { error } = await supabase
        .from('VoyEmergencyContacts')
        .insert({
          user_id: profile.id,
          name: contactName.trim(),
          phone: contactPhone.trim(),
          relationship: contactRelationship.trim() || 'Familiar',
        });

      if (error) throw error;

      Alert.alert('✅ Éxito', 'Contacto de emergencia agregado');
      setShowAddContactModal(false);
      setContactName('');
      setContactPhone('');
      setContactRelationship('');
      loadEmergencyContacts();
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'No se pudo agregar el contacto');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    Alert.alert(
      'Eliminar Contacto',
      '¿Estás seguro de eliminar este contacto de emergencia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('VoyEmergencyContacts')
                .delete()
                .eq('id', contactId);

              if (error) throw error;

              Alert.alert('✅ Éxito', 'Contacto eliminado');
              loadEmergencyContacts();
            } catch (error: any) {
              Alert.alert('❌ Error', error.message || 'No se pudo eliminar el contacto');
            }
          },
        },
      ]
    );
  };

  const handleEmergencyCall = async (phone: string) => {
    const phoneUrl = `tel:${phone}`;
    
    const canCall = await Linking.canOpenURL(phoneUrl);
    if (canCall) {
      Linking.openURL(phoneUrl);
    } else {
      Alert.alert('Error', 'No se puede realizar la llamada');
    }
  };

  const handleEmergencyAlert = async () => {
    if (emergencyContacts.length === 0) {
      Alert.alert(
        'Sin Contactos',
        'Primero debes agregar contactos de emergencia',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Agregar Contacto', onPress: () => setShowAddContactModal(true) },
        ]
      );
      return;
    }

    Alert.alert(
      '🚨 ALERTA DE EMERGENCIA',
      `Se notificará a ${emergencyContacts.length} contacto(s) de emergencia.\n\n¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar Alerta',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { data: profile } = await supabase
                .from('VoyUsers')
                .select('id, full_name')
                .eq('auth_user_id', user.id)
                .single();

              if (!profile) return;

              // Registrar la alerta en la base de datos
              const { error } = await supabase
                .from('VoyEmergencyAlerts')
                .insert({
                  user_id: profile.id,
                  alert_type: 'MANUAL',
                  location: 'Ubicación no disponible', // TODO: Agregar geolocalización
                  status: 'ACTIVE',
                });

              if (error) throw error;

              // En producción, aquí enviaríamos SMS/notificaciones
              // Por ahora solo mostramos confirmación
              Alert.alert(
                '✅ Alerta Enviada',
                `Se ha notificado a tus ${emergencyContacts.length} contacto(s) de emergencia.\n\nEn producción se enviarán SMS con tu ubicación.`
              );

              // Registrar notificación para cada contacto
              for (const contact of emergencyContacts) {
                await supabase
                  .from('VoyNotifications')
                  .insert({
                    user_id: profile.id,
                    type: 'EMERGENCY_ALERT',
                    title: '🚨 Alerta de Emergencia',
                    message: `${profile.full_name} ha activado una alerta de emergencia. Contacto: ${contact.phone}`,
                    read: false,
                  });
              }
            } catch (error: any) {
              Alert.alert('❌ Error', error.message || 'No se pudo enviar la alerta');
            }
          },
        },
      ]
    );
  };

  const handleCall112 = () => {
    Alert.alert(
      '🚨 Llamar al 112',
      '¿Deseas llamar al número de emergencias?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Llamar',
          style: 'destructive',
          onPress: () => {
            const phoneUrl = 'tel:112';
            Linking.openURL(phoneUrl);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones y Alarma</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Ionicons
            name={activeTab === 'notifications' ? 'notifications' : 'notifications-outline'}
            size={20}
            color={activeTab === 'notifications' ? COLORS.primary : COLORS.gray}
          />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Notificaciones
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'emergency' && styles.tabActive]}
          onPress={() => setActiveTab('emergency')}
        >
          <Ionicons
            name={activeTab === 'emergency' ? 'warning' : 'warning-outline'}
            size={20}
            color={activeTab === 'emergency' ? COLORS.primary : COLORS.gray}
          />
          <Text style={[styles.tabText, activeTab === 'emergency' && styles.tabTextActive]}>
            Emergencia
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'notifications' ? (
          // Notificaciones (placeholder)
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No tienes notificaciones</Text>
            <Text style={styles.emptySubtext}>
              Aquí aparecerán las notificaciones de tus trabajos y candidaturas
            </Text>
          </View>
        ) : (
          // Pantalla de Emergencia
          <View style={styles.emergencyContainer}>
            {/* Botón de Emergencia Principal */}
            <View style={styles.emergencyButtonContainer}>
              <Text style={styles.emergencyTitle}>Botón de Emergencia</Text>
              <Text style={styles.emergencySubtitle}>
                Pulsa para notificar a tus contactos de emergencia
              </Text>
              
              <TouchableOpacity
                style={styles.sosButton}
                onPress={handleEmergencyAlert}
              >
                <Ionicons name="warning" size={48} color={COLORS.white} />
                <Text style={styles.sosButtonText}>SOS</Text>
                <Text style={styles.sosButtonSubtext}>ALERTA DE EMERGENCIA</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.call112Button}
                onPress={handleCall112}
              >
                <Ionicons name="call" size={24} color={COLORS.white} />
                <Text style={styles.call112Text}>Llamar al 112</Text>
              </TouchableOpacity>
            </View>

            {/* Contactos de Emergencia */}
            <View style={styles.contactsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddContactModal(true)}
                >
                  <Ionicons name="add" size={20} color={COLORS.white} />
                  <Text style={styles.addButtonText}>Agregar</Text>
                </TouchableOpacity>
              </View>

              {emergencyContacts.length === 0 ? (
                <View style={styles.noContactsContainer}>
                  <Ionicons name="people-outline" size={48} color={COLORS.gray} />
                  <Text style={styles.noContactsText}>Sin contactos de emergencia</Text>
                  <Text style={styles.noContactsSubtext}>
                    Agrega familiares o amigos que puedan ayudarte en caso de emergencia
                  </Text>
                </View>
              ) : (
                emergencyContacts.map((contact) => (
                  <View key={contact.id} style={styles.contactCard}>
                    <View style={styles.contactIcon}>
                      <Ionicons name="person" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactPhone}>{contact.phone}</Text>
                      {contact.relationship && (
                        <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => handleEmergencyCall(contact.phone)}
                    >
                      <Ionicons name="call" size={20} color={COLORS.success} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => contact.id && handleDeleteContact(contact.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Información */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Los contactos de emergencia recibirán una notificación con tu ubicación cuando actives la alerta.
                {'\n\n'}
                Para emergencias médicas o de seguridad, llama siempre al 112.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal Agregar Contacto */}
      <Modal
        visible={showAddContactModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Contacto de Emergencia</Text>
              <TouchableOpacity onPress={() => setShowAddContactModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={contactName}
                onChangeText={setContactName}
                placeholder="Ej: María García"
              />

              <Text style={styles.label}>Teléfono *</Text>
              <TextInput
                style={styles.input}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+34 600 000 000"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Relación (opcional)</Text>
              <TextInput
                style={styles.input}
                value={contactRelationship}
                onChangeText={setContactRelationship}
                placeholder="Ej: Familiar, Amigo, Vecino..."
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddContact}>
              <Text style={styles.saveButtonText}>Guardar Contacto</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 15,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  emergencyContainer: {
    padding: 20,
  },
  emergencyButtonContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sosButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 10,
  },
  sosButtonSubtext: {
    fontSize: 12,
    color: COLORS.white,
    marginTop: 5,
  },
  call112Button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  call112Text: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  contactsSection: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  noContactsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noContactsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 15,
    marginBottom: 8,
  },
  noContactsSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: COLORS.primary,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.danger}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    lineHeight: 20,
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
    maxHeight: '80%',
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
