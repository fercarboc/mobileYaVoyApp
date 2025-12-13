import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '@/navigation/MainNavigator';
import { COLORS, JOB_CATEGORIES } from '@/constants';
import { supabase } from '@/services/supabase';

type JobDetailScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'JobDetail'>;
type JobDetailScreenRouteProp = RouteProp<HomeStackParamList, 'JobDetail'>;

interface JobDetailScreenProps {
  route: JobDetailScreenRouteProp;
  navigation: JobDetailScreenNavigationProp;
}

export default function JobDetailScreen({ route, navigation }: JobDetailScreenProps) {
  const { jobId } = route.params;
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedHourlyRate, setProposedHourlyRate] = useState('');
  const [message, setMessage] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profileId) {
      loadJobDetails();
    }
  }, [jobId, profileId]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profile) {
        setProfileId(profile.id);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('VoyJobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      if (data) {
        setJob(data);
        // Pre-rellenar precio según tipo
        if (data.price_fixed) {
          setProposedPrice(data.price_fixed.toString());
        }
        if (data.price_hourly) {
          setProposedHourlyRate(data.price_hourly.toString());
        }
      }
    } catch (error) {
      console.error('Error loading job:', error);
      Alert.alert('Error', 'No se pudo cargar el trabajo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!message.trim()) {
      Alert.alert('Mensaje requerido', 'Debes escribir un mensaje de presentación');
      return;
    }

    if (!profileId) {
      Alert.alert('Error', 'No se pudo identificar tu perfil');
      return;
    }

    try {
      setApplying(true);
      
      const applicationData: any = {
        job_id: jobId,
        helper_user_id: profileId,
        message: message.trim(),
        status: 'PENDING',
      };

      // Agregar precio propuesto si existe
      if (proposedPrice && job.job_type === 'ONE_OFF') {
        const price = parseFloat(proposedPrice);
        if (!isNaN(price) && price > 0) {
          applicationData.proposed_price = price;
        }
      }

      if (proposedHourlyRate && job.job_type === 'HOURLY') {
        const rate = parseFloat(proposedHourlyRate);
        if (!isNaN(rate) && rate > 0) {
          applicationData.proposed_hourly_rate = rate;
        }
      }

      const { error } = await supabase
        .from('VoyJobApplications')
        .insert(applicationData);

      if (error) throw error;

      setShowApplyModal(false);
      Alert.alert(
        '✅ ¡Candidatura enviada!',
        'Tu solicitud ha sido enviada. El empleador te contactará si está interesado.',
        [
          {
            text: 'Ver mis candidaturas',
            onPress: () => {
              // @ts-ignore - Navigate to MyJobs tab
              navigation.getParent()?.navigate('MyJobs');
            },
          },
          { 
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error applying:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar la candidatura');
    } finally {
      setApplying(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = JOB_CATEGORIES.find((cat) => cat.id === categoryId);
    return category?.label || categoryId;
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = JOB_CATEGORIES.find((cat) => cat.id === categoryId);
    return category?.icon || 'briefcase-outline';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No se encontró el trabajo</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          {/* Title */}
          <Text style={styles.title}>{job.title}</Text>

          {/* Category */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name={getCategoryIcon(job.category) as any}
                size={16}
                color={COLORS.gray}
              />
              <Text style={styles.metaText}>{getCategoryName(job.category)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name={job.job_type === 'ONE_OFF' ? 'flash-outline' : 'time-outline'}
                size={16}
                color={COLORS.gray}
              />
              <Text style={styles.metaText}>
                {job.job_type === 'ONE_OFF' ? 'Trabajo puntual' : 'Por horas'}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.gray} />
            <Text style={styles.locationText}>
              {job.neighborhood && `${job.neighborhood}, `}
              {job.district}
              {job.city && `, ${job.city}`}
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Precio</Text>
            {job.price_negotiable ? (
              <Text style={styles.priceValue}>A convenir 💬</Text>
            ) : (
              <>
                {job.job_type === 'ONE_OFF' && job.price_fixed && (
                  <Text style={styles.priceValue}>{job.price_fixed.toFixed(2)} €</Text>
                )}
                {job.job_type === 'HOURLY' && job.price_hourly && (
                  <Text style={styles.priceValue}>
                    {job.price_hourly.toFixed(2)} €<Text style={styles.priceUnit}>/hora</Text>
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Job Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles</Text>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={20} color={COLORS.gray} />
            <Text style={styles.detailText}>Categoría: {getCategoryName(job.category)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={20} color={COLORS.gray} />
            <Text style={styles.detailText}>
              Tipo: {job.job_type === 'ONE_OFF' ? 'Trabajo puntual' : 'Por horas'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.gray} />
            <Text style={styles.detailText}>
              Publicado: {new Date(job.created_at).toLocaleDateString('es-ES')}
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => setShowApplyModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.applyButtonText}>Presentar candidatura</Text>
        </TouchableOpacity>
      </View>

      {/* Apply Modal */}
      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Presentar candidatura</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalJobTitle}>{job.title}</Text>

              {/* Proposed Price */}
              {job.job_type === 'ONE_OFF' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Tu precio propuesto
                    {job.price_fixed && !job.price_negotiable && ` (Precio: ${job.price_fixed} €)`}
                    {job.price_negotiable && ' (Precio a convenir)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ejemplo: 25.00"
                    keyboardType="decimal-pad"
                    value={proposedPrice}
                    onChangeText={setProposedPrice}
                  />
                </View>
              )}

              {/* Hourly Rate */}
              {job.job_type === 'HOURLY' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Tu tarifa por hora
                    {job.price_hourly && !job.price_negotiable && ` (Tarifa: ${job.price_hourly} €/h)`}
                    {job.price_negotiable && ' (Precio a convenir)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ejemplo: 15.00"
                    keyboardType="decimal-pad"
                    value={proposedHourlyRate}
                    onChangeText={setProposedHourlyRate}
                  />
                </View>
              )}

              {/* Message */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mensaje de presentación *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Cuéntale al empleador por qué eres la persona ideal para este trabajo..."
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={message}
                  onChangeText={setMessage}
                />
              </View>

              {/* Tips */}
              <View style={styles.tipsCard}>
                <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
                <Text style={styles.tipsText}>
                  Consejo: Menciona tu experiencia relevante y disponibilidad
                </Text>
              </View>

              {/* Apply Button */}
              <TouchableOpacity
                style={[styles.modalApplyButton, applying && styles.disabledButton]}
                onPress={handleApply}
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.modalApplyButtonText}>Enviar candidatura</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowApplyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 40,
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  priceCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 16,
    color: COLORS.gray,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.dark,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: COLORS.dark,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalJobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.dark,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray,
  },
  modalApplyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  modalApplyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: '500',
  },
});
