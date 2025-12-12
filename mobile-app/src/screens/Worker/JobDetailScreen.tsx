import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { JobService } from '@/services/api';
import { Job, JobUrgency, JobType } from '@/types';
import { COLORS, URGENCY_COLORS, JOB_CATEGORIES } from '@/constants';

interface JobDetailScreenProps {
  route: {
    params: {
      jobId: string;
    };
  };
  navigation: any;
}

export default function JobDetailScreen({ route, navigation }: JobDetailScreenProps) {
  const { jobId } = route.params;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const jobData = await JobService.getJobById(jobId);
      if (jobData) {
        setJob(jobData);
        // Pre-fill proposed price with job's price
        setProposedPrice(jobData.price.toString());
      }
    } catch (error) {
      console.error('Error loading job:', error);
      Alert.alert('Error', 'No se pudo cargar el trabajo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCallPhone = () => {
    if (!job?.creator_phone) {
      Alert.alert('Sin teléfono', 'Este trabajo no tiene teléfono de contacto');
      return;
    }
    Linking.openURL(`tel:${job.creator_phone}`);
  };

  const handleApply = async () => {
    if (!message.trim()) {
      Alert.alert('Mensaje requerido', 'Debes escribir un mensaje de presentación');
      return;
    }

    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Precio inválido', 'Debes proponer un precio válido');
      return;
    }

    try {
      setApplying(true);
      await JobService.applyToJob(jobId, message, price);
      setShowApplyModal(false);
      Alert.alert(
        '¡Candidatura enviada!',
        'Tu solicitud ha sido enviada. El empleador te contactará si está interesado.',
        [
          {
            text: 'Ver mis candidaturas',
            onPress: () => navigation.navigate('MyJobs'),
          },
          { text: 'OK' },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la candidatura');
    } finally {
      setApplying(false);
    }
  };

  const getUrgencyColor = (urgency: JobUrgency) => {
    const colors: Record<JobUrgency, { r: number; g: number; b: number }> = {
      LOW: URGENCY_COLORS.LOW,
      MEDIUM: URGENCY_COLORS.MEDIUM,
      HIGH: URGENCY_COLORS.HIGH,
    };
    return colors[urgency] || URGENCY_COLORS.MEDIUM;
  };

  const getUrgencyLabel = (urgency: JobUrgency) => {
    const labels: Record<JobUrgency, string> = {
      LOW: 'Sin prisa',
      MEDIUM: 'Hoy',
      HIGH: '¡Urgente!',
    };
    return labels[urgency] || urgency;
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

  const urgencyColor = getUrgencyColor(job.urgency);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          {/* Urgency Badge */}
          <View
            style={[
              styles.urgencyBadge,
              { backgroundColor: `rgba(${urgencyColor.r}, ${urgencyColor.g}, ${urgencyColor.b}, 0.15)` },
            ]}
          >
            <Text
              style={[
                styles.urgencyText,
                { color: `rgb(${urgencyColor.r}, ${urgencyColor.g}, ${urgencyColor.b})` },
              ]}
            >
              {getUrgencyLabel(job.urgency)}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{job.title}</Text>

          {/* Category & Type */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name={getCategoryIcon(job.category) as any}
                size={16}
                color={COLORS.gray}
              />
              <Text style={styles.metaText}>{getCategoryName(job.category)}</Text>
            </View>
            {job.job_type === 'CONTRACT' && (
              <View style={[styles.metaItem, styles.contractBadge]}>
                <Ionicons name="document-text" size={16} color={COLORS.primary} />
                <Text style={styles.contractText}>CONTRATO</Text>
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.gray} />
            <Text style={styles.locationText}>
              {job.neighborhood}, {job.district}
            </Text>
            {job.distance && (
              <>
                <Text style={styles.distanceSeparator}>•</Text>
                <Text style={styles.distanceText}>{job.distance.toFixed(1)} km</Text>
              </>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Precio</Text>
            <Text style={styles.priceValue}>
              {job.price.toFixed(2)} €
              {job.job_type === 'CONTRACT' && <Text style={styles.priceUnit}>/mes</Text>}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Schedule (if CONTRACT or RECURRING) */}
        {(job.job_type === 'CONTRACT' || job.job_type === 'RECURRING') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {job.job_type === 'CONTRACT' ? 'Detalles del Contrato' : 'Horario'}
            </Text>
            {job.schedule && (
              <>
                <View style={styles.scheduleRow}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.gray} />
                  <Text style={styles.scheduleText}>
                    Días: {job.schedule.days_of_week.join(', ')}
                  </Text>
                </View>
                <View style={styles.scheduleRow}>
                  <Ionicons name="time-outline" size={20} color={COLORS.gray} />
                  <Text style={styles.scheduleText}>
                    Horario: {job.schedule.start_time} - {job.schedule.end_time}
                  </Text>
                </View>
                {job.schedule.start_date && (
                  <View style={styles.scheduleRow}>
                    <Ionicons name="today-outline" size={20} color={COLORS.gray} />
                    <Text style={styles.scheduleText}>
                      Inicio: {new Date(job.schedule.start_date).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                )}
                {job.schedule.end_date && (
                  <View style={styles.scheduleRow}>
                    <Ionicons name="flag-outline" size={20} color={COLORS.gray} />
                    <Text style={styles.scheduleText}>
                      Fin: {new Date(job.schedule.end_date).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Contract Details */}
        {job.job_type === 'CONTRACT' && job.contract && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Contrato</Text>
            <View style={styles.contractDetail}>
              <Text style={styles.contractDetailLabel}>Tipo de contrato:</Text>
              <Text style={styles.contractDetailValue}>{job.contract.contract_type}</Text>
            </View>
            <View style={styles.contractDetail}>
              <Text style={styles.contractDetailLabel}>Salario mensual:</Text>
              <Text style={styles.contractDetailValue}>{job.contract.monthly_salary} €</Text>
            </View>
            <View style={styles.contractDetail}>
              <Text style={styles.contractDetailLabel}>Horas semanales:</Text>
              <Text style={styles.contractDetailValue}>{job.contract.weekly_hours} h</Text>
            </View>
            {job.contract.benefits && (
              <View style={styles.contractDetail}>
                <Text style={styles.contractDetailLabel}>Beneficios:</Text>
                <Text style={styles.contractDetailValue}>{job.contract.benefits}</Text>
              </View>
            )}
          </View>
        )}

        {/* Contact Info */}
        {job.creator_phone && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <TouchableOpacity style={styles.phoneButton} onPress={handleCallPhone}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <Text style={styles.phoneText}>{job.creator_phone}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => setShowApplyModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.applyButtonText}>Aplicar a este trabajo</Text>
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
              <Text style={styles.modalTitle}>Aplicar al trabajo</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalJobTitle}>{job.title}</Text>

              {/* Proposed Price */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Tu precio propuesto (Precio sugerido: {job.price} €)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ejemplo: 25.00"
                  keyboardType="decimal-pad"
                  value={proposedPrice}
                  onChangeText={setProposedPrice}
                />
              </View>

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
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
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
    gap: 12,
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
  contractBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contractText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  distanceSeparator: {
    fontSize: 14,
    color: COLORS.gray,
    marginHorizontal: 4,
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  priceCard: {
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: 'normal',
    color: COLORS.gray,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.dark,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  scheduleText: {
    fontSize: 15,
    color: COLORS.dark,
  },
  contractDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  contractDetailLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  contractDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${COLORS.primary}15`,
    padding: 16,
    borderRadius: 12,
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
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
    color: COLORS.gray,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.dark,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: `${COLORS.primary}10`,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    lineHeight: 18,
  },
  modalApplyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalApplyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.gray,
  },
});
