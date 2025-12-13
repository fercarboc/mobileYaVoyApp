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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MyAdsStackParamList } from '@/navigation/MainNavigator';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

type NavigationProp = NativeStackNavigationProp<MyAdsStackParamList, 'MyAdsList'>;

interface JobAd {
  id: string;
  title: string;
  description: string;
  category: string;
  location_district: string;
  location_neighborhood: string;
  price: number;
  status: 'OPEN' | 'CANCELLED' | 'COMPLETED' | 'ASSIGNED' | 'IN_PROGRESS';
  urgency: 'low' | 'medium' | 'high';
  created_at: string;
  application_count?: number;
}

export default function MyAdsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [jobs, setJobs] = useState<JobAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'COMPLETED' | 'CANCELLED'>('all');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('VoyJobs')
        .select('*')
        .eq('creator_user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', 'No se pudieron cargar los anuncios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'OPEN' ? 'CANCELLED' : 'OPEN';
      
      const { error } = await supabase
        .from('VoyJobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus as any } : job
      ));

      Alert.alert(
        'Estado actualizado',
        newStatus === 'OPEN' ? 'Anuncio activado' : 'Anuncio pausado'
      );
    } catch (error) {
      console.error('Error updating job:', error);
      Alert.alert('Error', 'No se pudo actualizar el anuncio');
    }
  };

  const deleteJob = async (jobId: string) => {
    Alert.alert(
      'Eliminar anuncio',
      '¿Estás seguro de que quieres eliminar este anuncio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('VoyJobs')
                .delete()
                .eq('id', jobId);

              if (error) throw error;

              setJobs(jobs.filter(job => job.id !== jobId));
              Alert.alert('Éxito', 'Anuncio eliminado');
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Error', 'No se pudo eliminar el anuncio');
            }
          }
        }
      ]
    );
  };

  const completeJob = async (jobId: string) => {
    Alert.alert(
      'Trabajo Completado',
      '¿Confirmas que el trabajo ha sido completado? Esto iniciará el proceso de pago al trabajador.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('VoyJobs')
                .update({ status: 'COMPLETED' })
                .eq('id', jobId);

              if (error) throw error;

              setJobs(jobs.map(job => 
                job.id === jobId ? { ...job, status: 'COMPLETED' as any } : job
              ));

              Alert.alert(
                'Trabajo Completado',
                'El trabajo ha sido marcado como completado. En breve se procesará el pago al trabajador.'
              );
            } catch (error) {
              console.error('Error completing job:', error);
              Alert.alert('Error', 'No se pudo completar el trabajo');
            }
          }
        }
      ]
    );
  };

  const renderJobCard = ({ item }: { item: JobAd }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <View style={[
            styles.statusBadge,
            item.status === 'OPEN' && styles.statusActive,
            item.status === 'COMPLETED' && styles.statusCompleted,
            item.status === 'CANCELLED' && styles.statusCancelled,
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'OPEN' ? 'Activo' : 
               item.status === 'COMPLETED' ? 'Completado' :
               item.status === 'CANCELLED' ? 'Cancelado' : 
               item.status === 'IN_PROGRESS' ? 'En Curso' :
               item.status === 'ASSIGNED' ? 'Asignado' : 'Pendiente'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>
            {item.location_district}, {item.location_neighborhood}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{item.price}€</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>
            {item.application_count || 0} candidatos
          </Text>
        </View>
      </View>

      <View style={styles.jobActions}>
        {item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS' ? (
          // Botón de Terminado cuando el trabajo está asignado
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSuccess, { flex: 1 }]}
            onPress={() => completeJob(item.id)}
          >
            <Ionicons name="checkmark-done" size={16} color={COLORS.white} />
            <Text style={styles.actionButtonTextPrimary}>
              Marcar como Terminado
            </Text>
          </TouchableOpacity>
        ) : (
          // Botones normales cuando NO está asignado
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => toggleJobStatus(item.id, item.status)}
              disabled={item.status === 'COMPLETED'}
            >
              <Ionicons 
                name={item.status === 'OPEN' ? 'pause' : 'play'} 
                size={16} 
                color={COLORS.white} 
              />
              <Text style={styles.actionButtonTextPrimary}>
                {item.status === 'OPEN' ? 'Pausar' : 'Activar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteJob(item.id)}
              disabled={item.status === 'COMPLETED'}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Mis Anuncios</Text>
          <Text style={styles.headerTitle}>{jobs.length} publicaciones</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateJob')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todos ({jobs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'OPEN' && styles.filterButtonActive]}
          onPress={() => setFilter('OPEN')}
        >
          <Text style={[styles.filterText, filter === 'OPEN' && styles.filterTextActive]}>
            Activos ({jobs.filter(j => j.status === 'OPEN').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'COMPLETED' && styles.filterButtonActive]}
          onPress={() => setFilter('COMPLETED')}
        >
          <Text style={[styles.filterText, filter === 'COMPLETED' && styles.filterTextActive]}>
            Completados ({jobs.filter(j => j.status === 'COMPLETED').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Jobs List or Empty State */}
      {filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone-outline" size={64} color={COLORS.gray} />
          <Text style={styles.emptyText}>
            {jobs.length === 0 
              ? 'No tienes anuncios publicados'
              : 'No hay anuncios en esta categoría'}
          </Text>
          <Text style={styles.emptySubtext}>
            {jobs.length === 0 
              ? 'Crea tu primer anuncio para encontrar trabajadores'
              : 'Prueba con otro filtro'}
          </Text>
          {jobs.length === 0 && (
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateJob')}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.createButtonText}>Publicar Anuncio</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderJobCard}
          keyExtractor={item => item.id}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  jobHeader: {
    marginBottom: 12,
  },
  jobTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusCompleted: {
    backgroundColor: '#dbeafe',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
  },
  jobDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    gap: 6,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
