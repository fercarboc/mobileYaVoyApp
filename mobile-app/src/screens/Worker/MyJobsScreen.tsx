import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { JobService } from '@/services/api';
import { JobApplication } from '@/types';
import { COLORS } from '@/constants';

export default function MyJobsScreen() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const fetchedApplications = await JobService.getMyApplications();
      setApplications(fetchedApplications);
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

  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      default:
        return { bg: COLORS.lightGray, text: COLORS.gray, border: '#e5e7eb' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Aceptada';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  const renderApplication = ({ item }: { item: JobApplication }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.card}>
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor.bg, borderColor: statusColor.border },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>

        {/* Job Title */}
        {item.job && (
          <>
            <Text style={styles.jobTitle}>{item.job.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={COLORS.gray} />
              <Text style={styles.location}>
                {item.job.neighborhood}, {item.job.district}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{item.job.price}€</Text>
              {item.proposed_price && item.proposed_price !== item.job.price && (
                <Text style={styles.proposedPrice}>
                  (propusiste {item.proposed_price}€)
                </Text>
              )}
            </View>
          </>
        )}

        {/* Message */}
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Tu mensaje:</Text>
            <Text style={styles.messageText}>"{item.message}"</Text>
          </View>
        )}

        {/* Date */}
        <Text style={styles.date}>
          Aplicado el {new Date(item.created_at).toLocaleDateString('es-ES')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Mis Candidaturas</Text>
          <Text style={styles.headerTitle}>{applications.length} trabajos</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.filterText, filter === 'all' && styles.filterTextActive]}
          >
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}
          >
            Pendientes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'accepted' && styles.filterButtonActive]}
          onPress={() => setFilter('accepted')}
        >
          <Text
            style={[styles.filterText, filter === 'accepted' && styles.filterTextActive]}
          >
            Aceptadas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'rejected' && styles.filterButtonActive]}
          onPress={() => setFilter('rejected')}
        >
          <Text
            style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}
          >
            Rechazadas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Applications List */}
      <FlatList
        data={filteredApplications}
        renderItem={renderApplication}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              {loading ? 'Cargando...' : 'No tienes candidaturas'}
            </Text>
            <Text style={styles.emptySubtext}>
              Aplica a trabajos desde la pestaña "Trabajos"
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
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  proposedPrice: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
  },
  messageContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    color: COLORS.dark,
    fontStyle: 'italic',
  },
  date: {
    fontSize: 12,
    color: COLORS.gray,
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
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
});
