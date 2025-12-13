import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'revenue' | 'sectors'>('overview');

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Datos simulados
  const stats = {
    totalUsers: 1247,
    companies: 89,
    workers: 1034,
    particulars: 124,
    activeJobs: 342,
    completedJobs: 1893,
    totalRevenue: 12450,
    monthlyRevenue: 2340,
    activeSubscriptions: 67,
  };

  const userGrowth = [
    { month: 'Ene', users: 150 },
    { month: 'Feb', users: 280 },
    { month: 'Mar', users: 450 },
    { month: 'Abr', users: 620 },
    { month: 'May', users: 850 },
    { month: 'Jun', users: 1247 },
  ];

  const sectorStats = [
    { name: 'Mayores', jobs: 450, percentage: 35 },
    { name: 'Hogar', jobs: 320, percentage: 25 },
    { name: 'Hostelería', jobs: 280, percentage: 22 },
    { name: 'Tecnología', jobs: 150, percentage: 12 },
    { name: 'Otros', jobs: 80, percentage: 6 },
  ];

  const subscriptionPlans = [
    { name: '5 Anuncios', count: 23, revenue: 575 },
    { name: '10 Anuncios', count: 32, revenue: 1440 },
    { name: '20 Anuncios', count: 12, revenue: 960 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Panel de Administración</Text>
          <Text style={styles.headerTitle}>YaVoy Dashboard</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Ionicons 
            name="grid" 
            size={18} 
            color={selectedTab === 'overview' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
            Resumen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'users' && styles.tabActive]}
          onPress={() => setSelectedTab('users')}
        >
          <Ionicons 
            name="people" 
            size={18} 
            color={selectedTab === 'users' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[styles.tabText, selectedTab === 'users' && styles.tabTextActive]}>
            Usuarios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'revenue' && styles.tabActive]}
          onPress={() => setSelectedTab('revenue')}
        >
          <Ionicons 
            name="cash" 
            size={18} 
            color={selectedTab === 'revenue' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[styles.tabText, selectedTab === 'revenue' && styles.tabTextActive]}>
            Ingresos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'sectors' && styles.tabActive]}
          onPress={() => setSelectedTab('sectors')}
        >
          <Ionicons 
            name="bar-chart" 
            size={18} 
            color={selectedTab === 'sectors' ? COLORS.primary : COLORS.gray} 
          />
          <Text style={[styles.tabText, selectedTab === 'sectors' && styles.tabTextActive]}>
            Sectores
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {selectedTab === 'overview' && (
          <>
            {/* Main Stats */}
            <View style={styles.mainStatsContainer}>
              <View style={styles.mainStatCard}>
                <Ionicons name="people" size={28} color={COLORS.primary} />
                <Text style={styles.mainStatValue}>{stats.totalUsers.toLocaleString()}</Text>
                <Text style={styles.mainStatLabel}>Usuarios Totales</Text>
                <Text style={styles.mainStatChange}>+124 este mes</Text>
              </View>
              <View style={styles.mainStatCard}>
                <Ionicons name="briefcase" size={28} color={COLORS.success} />
                <Text style={styles.mainStatValue}>{stats.activeJobs}</Text>
                <Text style={styles.mainStatLabel}>Trabajos Activos</Text>
                <Text style={styles.mainStatChange}>+23 esta semana</Text>
              </View>
            </View>

            <View style={styles.mainStatsContainer}>
              <View style={styles.mainStatCard}>
                <Ionicons name="cash" size={28} color={COLORS.warning} />
                <Text style={styles.mainStatValue}>{stats.totalRevenue}€</Text>
                <Text style={styles.mainStatLabel}>Ingresos Totales</Text>
                <Text style={styles.mainStatChange}>+18% vs mes anterior</Text>
              </View>
              <View style={styles.mainStatCard}>
                <Ionicons name="checkmark-circle" size={28} color={COLORS.info} />
                <Text style={styles.mainStatValue}>{stats.completedJobs}</Text>
                <Text style={styles.mainStatLabel}>Trabajos Completados</Text>
                <Text style={styles.mainStatChange}>Total histórico</Text>
              </View>
            </View>

            {/* Growth Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Crecimiento de Usuarios</Text>
              <View style={styles.chartCard}>
                <View style={styles.chartContainer}>
                  {userGrowth.map((item, index) => (
                    <View key={index} style={styles.barContainer}>
                      <View style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${(item.users / 1247) * 100}%`,
                              backgroundColor: COLORS.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{item.month}</Text>
                      <Text style={styles.barValue}>{item.users}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
              <TouchableOpacity style={styles.actionCard}>
                <Ionicons name="settings" size={24} color={COLORS.primary} />
                <Text style={styles.actionText}>Configuración de Plataforma</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Ionicons name="alert-circle" size={24} color={COLORS.danger} />
                <Text style={styles.actionText}>Reportes y Moderación</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Ionicons name="download" size={24} color={COLORS.success} />
                <Text style={styles.actionText}>Exportar Datos</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {selectedTab === 'users' && (
          <>
            {/* User Distribution */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distribución de Usuarios</Text>
              <View style={styles.userStatsCard}>
                <View style={styles.userStatRow}>
                  <View style={styles.userStatLeft}>
                    <Ionicons name="hammer" size={24} color={COLORS.primary} />
                    <Text style={styles.userStatLabel}>Trabajadores</Text>
                  </View>
                  <Text style={styles.userStatValue}>{stats.workers}</Text>
                  <Text style={styles.userStatPercent}>
                    {((stats.workers / stats.totalUsers) * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(stats.workers / stats.totalUsers) * 100}%` }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.userStatsCard}>
                <View style={styles.userStatRow}>
                  <View style={styles.userStatLeft}>
                    <Ionicons name="business" size={24} color={COLORS.success} />
                    <Text style={styles.userStatLabel}>Empresas</Text>
                  </View>
                  <Text style={styles.userStatValue}>{stats.companies}</Text>
                  <Text style={styles.userStatPercent}>
                    {((stats.companies / stats.totalUsers) * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${(stats.companies / stats.totalUsers) * 100}%`,
                        backgroundColor: COLORS.success,
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.userStatsCard}>
                <View style={styles.userStatRow}>
                  <View style={styles.userStatLeft}>
                    <Ionicons name="person" size={24} color={COLORS.info} />
                    <Text style={styles.userStatLabel}>Particulares</Text>
                  </View>
                  <Text style={styles.userStatValue}>{stats.particulars}</Text>
                  <Text style={styles.userStatPercent}>
                    {((stats.particulars / stats.totalUsers) * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${(stats.particulars / stats.totalUsers) * 100}%`,
                        backgroundColor: COLORS.info,
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>

            {/* Activity Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Métricas de Actividad</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>67%</Text>
                  <Text style={styles.metricLabel}>Tasa de Actividad</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>4.2</Text>
                  <Text style={styles.metricLabel}>Trabajos/Usuario</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>89%</Text>
                  <Text style={styles.metricLabel}>Tasa de Éxito</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>2.3d</Text>
                  <Text style={styles.metricLabel}>Tiempo Promedio</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {selectedTab === 'revenue' && (
          <>
            {/* Revenue Stats */}
            <View style={styles.revenueCard}>
              <Text style={styles.revenueCardTitle}>Ingresos Totales</Text>
              <Text style={styles.revenueCardValue}>{stats.totalRevenue.toLocaleString()}€</Text>
              <Text style={styles.revenueCardSubtext}>Este mes: {stats.monthlyRevenue}€</Text>
            </View>

            {/* Subscription Plans Revenue */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingresos por Bono</Text>
              {subscriptionPlans.map((plan, index) => (
                <View key={index} style={styles.planRevenueCard}>
                  <View style={styles.planRevenueLeft}>
                    <Text style={styles.planRevenueName}>{plan.name}</Text>
                    <Text style={styles.planRevenueCount}>{plan.count} activos</Text>
                  </View>
                  <Text style={styles.planRevenueValue}>{plan.revenue}€</Text>
                </View>
              ))}
            </View>

            {/* Commission Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comisiones</Text>
              <View style={styles.commissionCard}>
                <View style={styles.commissionRow}>
                  <Text style={styles.commissionLabel}>Trabajos Completados</Text>
                  <Text style={styles.commissionValue}>1,893</Text>
                </View>
                <View style={styles.commissionRow}>
                  <Text style={styles.commissionLabel}>Comisión Promedio</Text>
                  <Text style={styles.commissionValue}>2.5€</Text>
                </View>
                <View style={styles.commissionRow}>
                  <Text style={styles.commissionLabel}>Total Comisiones</Text>
                  <Text style={styles.commissionValue}>4,732€</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {selectedTab === 'sectors' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sectores Más Demandados</Text>
              {sectorStats.map((sector, index) => (
                <View key={index} style={styles.sectorCard}>
                  <View style={styles.sectorHeader}>
                    <Text style={styles.sectorName}>{sector.name}</Text>
                    <View style={styles.sectorStats}>
                      <Text style={styles.sectorJobs}>{sector.jobs} trabajos</Text>
                      <Text style={styles.sectorPercent}>{sector.percentage}%</Text>
                    </View>
                  </View>
                  <View style={styles.sectorProgressBar}>
                    <View 
                      style={[
                        styles.sectorProgressFill, 
                        { width: `${sector.percentage * 2}%` }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Sector Insights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Insights</Text>
              <View style={styles.insightCard}>
                <Ionicons name="trending-up" size={24} color={COLORS.success} />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Sector en Crecimiento</Text>
                  <Text style={styles.insightText}>
                    "Mayores y Dependencia" ha crecido un 45% este mes
                  </Text>
                </View>
              </View>
              <View style={styles.insightCard}>
                <Ionicons name="star" size={24} color={COLORS.warning} />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Mayor Satisfacción</Text>
                  <Text style={styles.insightText}>
                    "Tecnología Digital" tiene la mayor puntuación (4.9/5)
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
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
  adminBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  mainStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 8,
  },
  mainStatLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  mainStatChange: {
    fontSize: 11,
    color: COLORS.success,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    width: 32,
    height: 150,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    color: COLORS.gray,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 16,
  },
  userStatsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userStatLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 12,
  },
  userStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginRight: 12,
  },
  userStatPercent: {
    fontSize: 14,
    color: COLORS.gray,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 44) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
  revenueCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  revenueCardTitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  revenueCardValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  revenueCardSubtext: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 8,
  },
  planRevenueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planRevenueLeft: {
    flex: 1,
  },
  planRevenueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  planRevenueCount: {
    fontSize: 13,
    color: COLORS.gray,
  },
  planRevenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  commissionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  commissionLabel: {
    fontSize: 15,
    color: COLORS.dark,
  },
  commissionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sectorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  sectorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectorJobs: {
    fontSize: 14,
    color: COLORS.gray,
  },
  sectorPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sectorProgressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  sectorProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightContent: {
    marginLeft: 16,
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: COLORS.gray,
  },
});
