import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  amount: number;
  description: string;
  payment_method: string;
  created_at: string;
  job_id: string;
}

interface CompletedJob {
  id: string;
  title: string;
  amount: number;
  completed_at: string;
  payment_method: string;
}

export default function EconomicsScreen() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [stats, setStats] = useState({
    totalEarned: 0,
    completedJobs: 0,
    averageEarning: 0,
    currentMonthEarnings: 0,
    lastMonthEarnings: 0,
    percentageChange: 0,
  });

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Load income transactions
      const { data: transactionsData, error: transError } = await supabase
        .from('VoyEconomicTransactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'INCOME')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (transError) throw transError;

      // Load completed jobs with applications
      const { data: jobsData, error: jobsError } = await supabase
        .from('VoyJobApplications')
        .select(`
          id,
          job_id,
          proposed_price,
          proposed_hourly_rate,
          job:VoyJobs!job_id (
            id,
            title,
            status,
            job_type,
            updated_at
          )
        `)
        .eq('helper_user_id', user.id)
        .eq('status', 'ACCEPTED');

      if (jobsError) throw jobsError;

      // Filter completed jobs
      const completed = jobsData
        ?.filter((app: any) => app.job?.status === 'COMPLETED')
        .map((app: any) => {
          const amount = app.job.job_type === 'ONE_OFF' 
            ? app.proposed_price 
            : app.proposed_hourly_rate;
          
          // Find corresponding transaction
          const transaction = transactionsData?.find(t => t.job_id === app.job_id);
          
          return {
            id: app.job_id,
            title: app.job.title,
            amount: amount || 0,
            completed_at: app.job.updated_at,
            payment_method: transaction?.payment_method || 'NO_ESPECIFICADO',
          };
        }) || [];

      setTransactions(transactionsData || []);
      setCompletedJobs(completed);

      // Calculate stats
      const totalEarned = transactionsData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const completedCount = completed.length;
      const averageEarning = completedCount > 0 ? totalEarned / completedCount : 0;

      // Current month earnings
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEarnings = transactionsData
        ?.filter(t => new Date(t.created_at) >= currentMonthStart)
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      // Last month earnings
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthEarnings = transactionsData
        ?.filter(t => {
          const date = new Date(t.created_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const percentageChange = lastMonthEarnings > 0
        ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
        : 0;

      setStats({
        totalEarned,
        completedJobs: completedCount,
        averageEarning,
        currentMonthEarnings,
        lastMonthEarnings,
        percentageChange,
      });

    } catch (error) {
      console.error('Error loading economics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      'TRANSFERENCIA': 'Transferencia',
      'EFECTIVO': 'Efectivo',
      'BIZUM': 'Bizum',
      'NO_ESPECIFICADO': 'No especificado',
    };
    return labels[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: { [key: string]: any } = {
      'TRANSFERENCIA': 'card',
      'EFECTIVO': 'cash',
      'BIZUM': 'phone-portrait',
      'NO_ESPECIFICADO': 'help-circle',
    };
    return icons[method] || 'wallet';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando datos económicos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Datos Económicos</Text>
          <Text style={styles.headerSubtitle}>Análisis de ingresos y pagos</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>
              Semana
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>
              Mes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'year' && styles.periodButtonActive]}
            onPress={() => setPeriod('year')}
          >
            <Text style={[styles.periodText, period === 'year' && styles.periodTextActive]}>
              Año
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Stats */}
        <View style={styles.mainStatsContainer}>
          <View style={styles.mainStatCard}>
            <View style={styles.mainStatHeader}>
              <Ionicons name="cash" size={24} color={COLORS.success} />
              <Text style={styles.mainStatLabel}>Ingresos Totales</Text>
            </View>
            <Text style={styles.mainStatValue}>{stats.totalEarned.toFixed(2)}€</Text>
            <Text style={styles.mainStatChange}>
              {stats.completedJobs} trabajos completados
            </Text>
          </View>

          <View style={styles.mainStatCard}>
            <View style={styles.mainStatHeader}>
              <Ionicons name="trending-up" size={24} color={COLORS.primary} />
              <Text style={styles.mainStatLabel}>Ingreso Promedio</Text>
            </View>
            <Text style={styles.mainStatValue}>{stats.averageEarning.toFixed(2)}€</Text>
            <Text style={[styles.mainStatChange, { color: COLORS.primary }]}>
              por trabajo
            </Text>
          </View>
        </View>

        {/* Current Month Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes Actual vs Anterior</Text>
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Mes Actual</Text>
                <Text style={styles.comparisonValue}>
                  {stats.currentMonthEarnings.toFixed(2)}€
                </Text>
              </View>
              <View style={styles.comparisonDivider} />
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Mes Anterior</Text>
                <Text style={styles.comparisonValue}>
                  {stats.lastMonthEarnings.toFixed(2)}€
                </Text>
              </View>
            </View>
            <View style={styles.percentageContainer}>
              <Ionicons 
                name={stats.percentageChange >= 0 ? 'trending-up' : 'trending-down'} 
                size={20} 
                color={stats.percentageChange >= 0 ? COLORS.success : COLORS.error} 
              />
              <Text 
                style={[
                  styles.percentageText,
                  { color: stats.percentageChange >= 0 ? COLORS.success : COLORS.error }
                ]}
              >
                {stats.percentageChange >= 0 ? '+' : ''}{stats.percentageChange.toFixed(1)}%
              </Text>
              <Text style={styles.percentageLabel}>de cambio</Text>
            </View>
          </View>
        </View>

        {/* Completed Jobs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trabajos Completados</Text>
          {completedJobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="briefcase-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>
                No tienes trabajos completados en este período
              </Text>
            </View>
          ) : (
            completedJobs.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.jobTitleContainer}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    <Text style={styles.jobTitle}>{job.title}</Text>
                  </View>
                  <Text style={styles.jobAmount}>{job.amount.toFixed(2)}€</Text>
                </View>
                <View style={styles.jobDetails}>
                  <View style={styles.jobDetail}>
                    <Ionicons 
                      name="calendar" 
                      size={14} 
                      color={COLORS.textSecondary} 
                    />
                    <Text style={styles.jobDetailText}>
                      {formatDate(job.completed_at)}
                    </Text>
                  </View>
                  <View style={styles.jobDetail}>
                    <Ionicons 
                      name={getPaymentMethodIcon(job.payment_method)} 
                      size={14} 
                      color={COLORS.textSecondary} 
                    />
                    <Text style={styles.jobDetailText}>
                      {getPaymentMethodLabel(job.payment_method)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Pagos Recibidos</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>
                No tienes pagos recibidos en este período
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View 
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: COLORS.success + '20' }
                    ]}
                  >
                    <Ionicons 
                      name="arrow-down" 
                      size={20} 
                      color={COLORS.success} 
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <View style={styles.transactionMeta}>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.created_at)}
                      </Text>
                      <Text style={styles.transactionDivider}>•</Text>
                      <Ionicons 
                        name={getPaymentMethodIcon(transaction.payment_method)} 
                        size={12} 
                        color={COLORS.textSecondary} 
                      />
                      <Text style={styles.transactionMethod}>
                        {getPaymentMethodLabel(transaction.payment_method)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.transactionAmount}>
                  +{transaction.amount.toFixed(2)}€
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  periodContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: '#fff',
  },
  mainStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  mainStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  mainStatChange: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  comparisonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  comparisonLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  percentageText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    marginRight: 8,
  },
  percentageLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  jobAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  jobDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobDetailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  transactionDivider: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  transactionMethod: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
});
