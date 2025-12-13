import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MyJobsStackParamList } from '@/navigation/MainNavigator';
import { COLORS, JOB_CATEGORIES } from '@/constants';
import { supabase } from '@/services/supabase';

type NavigationProp = NativeStackNavigationProp<MyJobsStackParamList>;

interface JobApplication {
  id: string;
  job_id: string;
  message: string;
  proposed_price: number | null;
  proposed_hourly_rate: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  job: {
    title: string;
    category: string;
    job_type: 'ONE_OFF' | 'HOURLY';
    city: string;
    district: string;
    status: string;
    creator_user_id: string;
    creator?: {
      id: string;
      full_name: string;
    };
  };
}

export default function MyJobsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('all');
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profileId) {
      loadApplications();
    }
  }, [profileId]);

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

  const loadApplications = async () => {
    try {
      if (!profileId) return;

      const { data, error } = await supabase
        .from('VoyJobApplications')
        .select(`
          id,
          job_id,
          message,
          proposed_price,
          proposed_hourly_rate,
          status,
          created_at,
          job:VoyJobs(
            title,
            category,
            job_type,
            city,
            district,
            status,
            creator_user_id,
            creator:VoyUsers!creator_user_id(
              id,
              full_name
            )
          )
        `)
        .eq('helper_user_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        console.log('Applications loaded:', data.length);
        console.log('Applications data:', JSON.stringify(data, null, 2));
        setApplications(data as any);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const markJobAsFinished = async (jobId: string, applicationId: string) => {
    Alert.alert(
      'Trabajo Finalizado',
      '¿Has completado el trabajo? Esto notificará a la empresa para que confirme y proceda al pago.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              // Actualizar estado del job a IN_PROGRESS
              const { error: jobError } = await supabase
                .from('VoyJobs')
                .update({ status: 'IN_PROGRESS' })
                .eq('id', jobId);

              if (jobError) throw jobError;

              // Actualizar estado de la aplicación localmente
              setApplications(prev => prev.map(app => 
                app.id === applicationId 
                  ? { ...app, job: app.job ? { ...app.job, status: 'IN_PROGRESS' } : null }
                  : app
              ));

              Alert.alert(
                'Trabajo Finalizado',
                'Se ha notificado a la empresa. Esperando confirmación para procesar el pago.'
              );
            } catch (error) {
              console.error('Error marking job as finished:', error);
              Alert.alert('Error', 'No se pudo marcar el trabajo como finalizado');
            }
          }
        }
      ]
    );
  };

  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return { bg: '#d1fae5', text: '#065f46', border: '#10b981', icon: 'checkmark-circle' };
      case 'PENDING':
        return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', icon: 'time' };
      case 'REJECTED':
        return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444', icon: 'close-circle' };
      default:
        return { bg: COLORS.lightGray, text: COLORS.gray, border: '#e5e7eb', icon: 'help-circle' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'Aceptada';
      case 'PENDING':
        return 'Pendiente';
      case 'REJECTED':
        return 'Rechazada';
      default:
        return status;
    }
  };

  const getApplicationStatusLabel = (item: JobApplication) => {
    // Si el trabajo está completado, mostrar "Completada"
    if (item.job?.status === 'COMPLETED') {
      return 'Completada';
    }
    // Si el trabajo está en progreso (finalizado por el worker), mostrar "Finalizada"
    if (item.status === 'ACCEPTED' && item.job?.status === 'IN_PROGRESS') {
      return 'Finalizada';
    }
    // Sino, mostrar el status normal
    return getStatusLabel(item.status);
  };

  const getCategoryName = (categoryId: string) => {
    const category = JOB_CATEGORIES.find((cat) => cat.id === categoryId);
    return category?.label || categoryId;
  };

  const renderFilterButton = (
    label: string,
    value: 'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED',
    count: number
  ) => {
    const isActive = filter === value;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setFilter(value)}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderApplication = ({ item }: { item: JobApplication }) => {
    const statusColor = getStatusColor(item.status);
    const statusLabel = getApplicationStatusLabel(item);
    
    // Si no hay información del trabajo, mostrar versión simplificada
    if (!item.job) {
      return (
        <View style={styles.card}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor.bg, borderColor: statusColor.border },
            ]}
          >
            <Ionicons 
              name={statusColor.icon as any} 
              size={16} 
              color={statusColor.text} 
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {statusLabel}
            </Text>
          </View>
          <Text style={styles.jobTitle}>Trabajo</Text>
          <Text style={styles.metaText}>Detalles del trabajo no disponibles</Text>
          
          {/* Proposed Price */}
          {(item.proposed_price || item.proposed_hourly_rate) && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tu propuesta:</Text>
              <Text style={styles.priceValue}>
                {item.proposed_price 
                  ? `${item.proposed_price.toFixed(2)} €`
                  : `${item.proposed_hourly_rate?.toFixed(2)} €/h`
                }
              </Text>
            </View>
          )}
          
          {/* Application Date */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.gray} />
            <Text style={styles.dateText}>
              Aplicado el {new Date(item.created_at).toLocaleDateString('es-ES')}
            </Text>
          </View>

          {/* Message */}
          {item.message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Tu mensaje:</Text>
              <Text style={styles.messageText} numberOfLines={3}>
                {item.message}
              </Text>
            </View>
          )}

          {/* Botón de Finalizado para trabajos aceptados que no estén ya finalizados */}
          {item.status === 'ACCEPTED' && (
            <TouchableOpacity
              style={[styles.chatButton, styles.finishButton]}
              onPress={() => markJobAsFinished(item.job_id, item.id)}
            >
              <Ionicons name="checkmark-done" size={20} color={COLORS.white} />
              <Text style={[styles.chatButtonText, styles.finishButtonText]}>
                Marcar como Finalizado
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    const isJobClosed = item.job.status === 'CLOSED' || item.job.status === 'COMPLETED' || item.job.status === 'CANCELLED';

    return (
      <View style={styles.card}>
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor.bg, borderColor: statusColor.border },
          ]}
        >
          <Ionicons 
            name={statusColor.icon as any} 
            size={16} 
            color={statusColor.text} 
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {statusLabel}
          </Text>
        </View>

        {/* Job Title */}
        <Text style={styles.jobTitle}>{item.job.title}</Text>

        {/* Category & Type */}
        <View style={styles.jobMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="briefcase-outline" size={16} color={COLORS.gray} />
            <Text style={styles.metaText}>{getCategoryName(item.job.category)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={16} color={COLORS.gray} />
            <Text style={styles.metaText}>{item.job.district}</Text>
          </View>
        </View>

        {/* Proposed Price */}
        {(item.proposed_price || item.proposed_hourly_rate) && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tu propuesta:</Text>
            <Text style={styles.priceValue}>
              {item.job.job_type === 'ONE_OFF' 
                ? `${item.proposed_price?.toFixed(2)} €`
                : `${item.proposed_hourly_rate?.toFixed(2)} €/h`
              }
            </Text>
          </View>
        )}

        {/* Application Date */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.gray} />
          <Text style={styles.dateText}>
            Aplicado el {new Date(item.created_at).toLocaleDateString('es-ES')}
          </Text>
        </View>

        {/* Job Status Warning */}
        {isJobClosed && (
          <View style={styles.warningBadge}>
            <Ionicons name="alert-circle-outline" size={16} color="#d97706" />
            <Text style={styles.warningText}>Este trabajo ya está cerrado</Text>
          </View>
        )}

        {/* Message */}
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Tu mensaje:</Text>
            <Text style={styles.messageText} numberOfLines={3}>
              {item.message}
            </Text>
          </View>
        )}

        {/* Botón de Finalizado para trabajos aceptados que no estén ya finalizados */}
        {item.status === 'ACCEPTED' && item.job.status !== 'IN_PROGRESS' && item.job.status !== 'COMPLETED' && (
          <TouchableOpacity
            style={[styles.chatButton, styles.finishButton]}
            onPress={() => markJobAsFinished(item.job_id, item.id)}
          >
            <Ionicons name="checkmark-done" size={20} color={COLORS.white} />
            <Text style={[styles.chatButtonText, styles.finishButtonText]}>
              Marcar como Finalizado
            </Text>
          </TouchableOpacity>
        )}

        {/* Mensaje de trabajo finalizado pendiente de pago */}
        {item.status === 'ACCEPTED' && item.job.status === 'IN_PROGRESS' && (
          <View style={[styles.warningBadge, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="time-outline" size={16} color="#d97706" />
            <Text style={styles.warningText}>Trabajo finalizado - Esperando confirmación de pago</Text>
          </View>
        )}

        {/* Mensaje de trabajo completado y pagado */}
        {item.status === 'ACCEPTED' && item.job.status === 'COMPLETED' && (
          <View style={[styles.warningBadge, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#065f46" />
            <Text style={[styles.warningText, { color: '#065f46' }]}>Trabajo completado y pagado</Text>
          </View>
        )}

        {/* Chat Button */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() =>
            navigation.navigate('Chat', {
              jobId: item.job_id,
              otherUserId: item.job.creator_user_id,
              otherUserName: item.job.creator?.full_name || 'Empresa',
            })
          }
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
          <Text style={styles.chatButtonText}>Chatear con la empresa</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const pendingCount = applications.filter((app) => app.status === 'PENDING').length;
  const acceptedCount = applications.filter((app) => app.status === 'ACCEPTED').length;
  const rejectedCount = applications.filter((app) => app.status === 'REJECTED').length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Candidaturas</Text>
        <Text style={styles.headerSubtitle}>
          {applications.length} {applications.length === 1 ? 'candidatura' : 'candidaturas'}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('Todas', 'all', applications.length)}
        {renderFilterButton('Pendientes', 'PENDING', pendingCount)}
        {renderFilterButton('Aceptadas', 'ACCEPTED', acceptedCount)}
        {renderFilterButton('Rechazadas', 'REJECTED', rejectedCount)}
      </View>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>
            {filter === 'all' 
              ? 'No has presentado candidaturas' 
              : `No tienes candidaturas ${getStatusLabel(filter).toLowerCase()}`
            }
          </Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? 'Explora trabajos disponibles y presenta tu candidatura' 
              : 'Cambia el filtro para ver otras candidaturas'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          renderItem={renderApplication}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#d97706',
    fontWeight: '500',
  },
  messageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  messageLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  finishButton: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  finishButtonText: {
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
});
