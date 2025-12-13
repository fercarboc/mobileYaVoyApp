import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, JOB_CATEGORIES } from '@/constants';
import JobCard from '@/components/JobCard';
import { HomeStackParamList } from '@/navigation/MainNavigator';
import { supabase } from '@/services/supabase';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Stats reales
  const [stats, setStats] = useState({
    totalEarnings: 0,
    acceptedJobs: 0,
    pendingApplications: 0,
    rejectedApplications: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (profileId) {
        loadJobs();
        loadAppliedJobs();
        loadStats();
      }
    }, [profileId])
  );

  useEffect(() => {
    applyFilters();
  }, [jobs, selectedCategory, searchQuery, appliedJobIds]);

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

  const loadJobs = async () => {
    try {
      setLoading(true);
      // Cargar trabajos con status OPEN (disponibles)
      const { data, error } = await supabase
        .from('VoyJobs')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', 'No se pudieron cargar los trabajos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAppliedJobs = async () => {
    if (!profileId) return;

    try {
      const { data } = await supabase
        .from('VoyJobApplications')
        .select('job_id')
        .eq('helper_user_id', profileId);

      setAppliedJobIds(data?.map(app => app.job_id) || []);
    } catch (error) {
      console.error('Error loading applied jobs:', error);
    }
  };

  const loadStats = async () => {
    if (!profileId) return;

    try {
      const { data: applications } = await supabase
        .from('VoyJobApplications')
        .select('status')
        .eq('helper_user_id', profileId);

      const accepted = applications?.filter(app => app.status === 'ACCEPTED').length || 0;
      const pending = applications?.filter(app => app.status === 'PENDING').length || 0;
      const rejected = applications?.filter(app => app.status === 'REJECTED').length || 0;

      setStats({
        totalEarnings: 0, // TODO: Calcular desde trabajos completados
        acceptedJobs: accepted,
        pendingApplications: pending,
        rejectedApplications: rejected,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
    loadAppliedJobs();
    loadStats();
  };

  const applyFilters = () => {
    let filtered = jobs;

    // Ocultar trabajos ya aplicados
    filtered = filtered.filter(job => !appliedJobIds.includes(job.id));

    if (selectedCategory) {
      filtered = filtered.filter((job) => job.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          job.neighborhood.toLowerCase().includes(query)
      );
    }

    setFilteredJobs(filtered);
  };

  const renderCategoryPill = (category: typeof JOB_CATEGORIES[0]) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryPill,
        selectedCategory === category.id && styles.categoryPillActive,
      ]}
      onPress={() =>
        setSelectedCategory(selectedCategory === category.id ? null : category.id)
      }
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text
        style={[
          styles.categoryText,
          selectedCategory === category.id && styles.categoryTextActive,
        ]}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Hola 👋</Text>
          <Text style={styles.headerTitle}>Encuentra trabajo</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => Alert.alert('Notificaciones', 'Función de notificaciones en desarrollo')}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.dark} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Card - Resumen de candidaturas */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Mis Candidaturas</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.success} />
              <Text style={styles.statValue}>{stats.acceptedJobs}</Text>
              <Text style={styles.statLabel}>Aceptadas</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={24} color={COLORS.warning} />
              <Text style={styles.statValue}>{stats.pendingApplications}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="close-circle-outline" size={24} color={COLORS.gray} />
              <Text style={styles.statValue}>{stats.rejectedApplications}</Text>
              <Text style={styles.statLabel}>Rechazadas</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="briefcase-outline" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{filteredJobs.length}</Text>
              <Text style={styles.statLabel}>Disponibles</Text>
            </View>
          </View>
        </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por sector, barrio..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.gray}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFilters}>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="location-outline" size={18} color={COLORS.primary} />
          <Text style={styles.filterButtonText}>Cerca de mí</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="time-outline" size={18} color={COLORS.primary} />
          <Text style={styles.filterButtonText}>Urgente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="trending-up-outline" size={18} color={COLORS.primary} />
          <Text style={styles.filterButtonText}>Mejor pago</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sectores</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryPill,
            !selectedCategory && styles.categoryPillActive,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryText,
              !selectedCategory && styles.categoryTextActive,
            ]}
          >
            ✨ Todos
          </Text>
        </TouchableOpacity>
        {JOB_CATEGORIES.filter((c) => c.isPrimary).map(renderCategoryPill)}
      </ScrollView>

      {/* Jobs List Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory ? 'Resultados' : 'Trabajos disponibles'} ({filteredJobs.length})
        </Text>
        {selectedCategory && (
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={styles.clearFilter}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color={COLORS.gray} />
          <Text style={styles.emptyText}>
            {loading ? 'Cargando trabajos...' : 'No hay trabajos disponibles'}
          </Text>
          {selectedCategory && (
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Text style={styles.emptyLink}>Ver todos los trabajos</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        filteredJobs.map((item) => (
          <JobCard 
            key={item.id}
            job={item} 
            onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
          />
        ))
      )}

      {/* Spacer for bottom navigation */}
      <View style={{ height: 20 }} />
      </ScrollView>
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
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 44,
  },
  categoryPillActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  categoryTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  emptyLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  clearFilter: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
