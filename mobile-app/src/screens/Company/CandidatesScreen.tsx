import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CandidatesStackParamList } from '@/navigation/MainNavigator';
import { JobApplication } from '@/types';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

type NavigationProp = NativeStackNavigationProp<CandidatesStackParamList>;

export default function CandidatesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      // Obtener candidaturas para los trabajos de esta empresa
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userProfile) return;

      // Obtener candidaturas de los trabajos de esta empresa
      const { data, error } = await supabase
        .from('VoyJobApplications')
        .select(`
          *,
          job:VoyJobs!job_id (
            id,
            title,
            description,
            price_fixed,
            price_hourly,
            status,
            creator_user_id
          ),
          helper:VoyUsers!helper_user_id (
            id,
            full_name,
            email
          )
        `)
        .eq('job.creator_user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAccept = async (applicationId: string, jobId: string) => {
    Alert.alert(
      'Aceptar Candidatura',
      '¿Quieres aceptar esta candidatura? El trabajo se desactivará automáticamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            try {
              // Actualizar estado de la candidatura a aceptada
              const { error: appError } = await supabase
                .from('VoyJobApplications')
                .update({ status: 'ACCEPTED' })
                .eq('id', applicationId);

              if (appError) throw appError;

              // Desactivar el trabajo
              const { error: jobError } = await supabase
                .from('VoyJobs')
                .update({ status: 'ASSIGNED' })
                .eq('id', jobId);

              if (jobError) throw jobError;

              // Rechazar todas las demás candidaturas
              const { error: rejectError } = await supabase
                .from('VoyJobApplications')
                .update({ status: 'REJECTED' })
                .eq('job_id', jobId)
                .neq('id', applicationId)
                .eq('status', 'PENDING');

              if (rejectError) throw rejectError;

              Alert.alert('✅ Éxito', 'Candidatura aceptada. El trabajo ha sido asignado.');
              loadApplications();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo aceptar la candidatura');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (applicationId: string) => {
    Alert.alert(
      'Rechazar Candidatura',
      '¿Estás seguro de que quieres rechazar esta candidatura?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('VoyJobApplications')
                .update({ status: 'REJECTED' })
                .eq('id', applicationId);

              if (error) throw error;

              Alert.alert('❌ Rechazada', 'La candidatura ha sido rechazada');
              loadApplications();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo rechazar la candidatura');
            }
          },
        },
      ]
    );
  };

  const renderApplication = ({ item }: { item: any }) => {
    const status = item.status as 'PENDING' | 'ACCEPTED' | 'REJECTED';
    
    const statusColors = {
      PENDING: COLORS.warning,
      ACCEPTED: COLORS.success,
      REJECTED: COLORS.danger,
    };

    const statusLabels = {
      PENDING: 'Pendiente',
      ACCEPTED: 'Aceptada',
      REJECTED: 'Rechazada',
    };

    return (
      <View style={styles.applicationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.helper?.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.candidateName}>{item.helper?.full_name || 'Candidato'}</Text>
            <Text style={styles.jobTitle}>{item.job?.title || 'Trabajo'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColors[status]}20` }]}>
            <Text style={[styles.statusText, { color: statusColors[status] }]}>
              {statusLabels[status]}
            </Text>
          </View>
        </View>

        <View style={styles.proposalSection}>
          <View style={styles.proposalRow}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
            <Text style={styles.proposalLabel}>Precio propuesto:</Text>
            <Text style={styles.proposalValue}>€{item.proposed_price?.toFixed(2) || '0.00'}</Text>
          </View>
          {item.message && (
            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>Mensaje:</Text>
              <Text style={styles.messageText}>{item.message}</Text>
            </View>
          )}
        </View>

        {item.helper?.phone && (
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={16} color={COLORS.gray} />
            <Text style={styles.contactText}>{item.helper.phone}</Text>
          </View>
        )}

        {item.status === 'PENDING' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAccept(item.id, item.job_id)}
            >
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item.id)}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.danger} />
              <Text style={styles.rejectButtonText}>Rechazar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mensaje cuando trabajo está finalizado */}
        {item.status === 'ACCEPTED' && item.job?.status === 'IN_PROGRESS' && (
          <View style={[styles.statusInfo, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="time-outline" size={20} color="#d97706" />
            <Text style={[styles.statusInfoText, { color: '#d97706' }]}>
              Trabajo finalizado por el trabajador - Pendiente de confirmar pago
            </Text>
          </View>
        )}

        {/* Mensaje cuando trabajo está completado */}
        {item.status === 'ACCEPTED' && item.job?.status === 'COMPLETED' && (
          <View style={[styles.statusInfo, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={[styles.statusInfoText, { color: COLORS.success }]}>
              Trabajo completado y pagado
            </Text>
          </View>
        )}

        {/* Chat disponible solo si no está completado */}
        {item.job?.status !== 'COMPLETED' && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat', {
              jobId: item.job_id,
              otherUserId: item.helper_user_id,
              otherUserName: item.helper?.full_name || 'Candidato'
            })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
            <Text style={styles.chatButtonText}>
              {item.status === 'PENDING' ? 'Consultar candidato' : 'Abrir chat'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Candidatos</Text>
        <Text style={styles.headerSubtitle}>{applications.length} candidaturas</Text>
      </View>

      <FlatList
        data={applications}
        renderItem={renderApplication}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadApplications} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              {loading ? 'Cargando candidaturas...' : 'No hay candidaturas'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  listContent: {
    padding: 16,
  },
  applicationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  jobTitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  proposalSection: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  proposalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proposalLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  proposalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 'auto',
  },
  messageBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  rejectButtonText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusInfoText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  chatButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 16,
  },
});
