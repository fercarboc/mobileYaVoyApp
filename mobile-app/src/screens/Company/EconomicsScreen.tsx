import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

const { width } = Dimensions.get('window');

export default function EconomicsScreen() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const stats = {
    totalSpent: 245,
    activeJobs: 3,
    completedJobs: 12,
    averageCost: 20.42,
  };

  const monthlyData = [
    { month: 'Ene', amount: 45 },
    { month: 'Feb', amount: 80 },
    { month: 'Mar', amount: 120 },
    { month: 'Abr', amount: 0 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Datos Económicos</Text>
          <Text style={styles.headerSubtitle}>Análisis de gastos y estadísticas</Text>
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
              <Ionicons name="cash" size={24} color={COLORS.primary} />
              <Text style={styles.mainStatLabel}>Gasto Total</Text>
            </View>
            <Text style={styles.mainStatValue}>{stats.totalSpent}€</Text>
            <Text style={styles.mainStatChange}>+12% vs mes anterior</Text>
          </View>

          <View style={styles.mainStatCard}>
            <View style={styles.mainStatHeader}>
              <Ionicons name="trending-down" size={24} color={COLORS.success} />
              <Text style={styles.mainStatLabel}>Coste Promedio</Text>
            </View>
            <Text style={styles.mainStatValue}>{stats.averageCost}€</Text>
            <Text style={[styles.mainStatChange, { color: COLORS.success }]}>
              -5% vs mes anterior
            </Text>
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evolución de Gastos</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {monthlyData.map((item, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(item.amount / 120) * 100}%`,
                          backgroundColor: item.amount > 0 ? COLORS.primary : '#e5e7eb',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.month}</Text>
                  <Text style={styles.barValue}>{item.amount}€</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statGridCard}>
              <Ionicons name="briefcase" size={32} color={COLORS.primary} />
              <Text style={styles.statGridValue}>{stats.activeJobs}</Text>
              <Text style={styles.statGridLabel}>Trabajos Activos</Text>
            </View>
            <View style={styles.statGridCard}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
              <Text style={styles.statGridValue}>{stats.completedJobs}</Text>
              <Text style={styles.statGridLabel}>Completados</Text>
            </View>
            <View style={styles.statGridCard}>
              <Ionicons name="people" size={32} color={COLORS.info} />
              <Text style={styles.statGridValue}>28</Text>
              <Text style={styles.statGridLabel}>Total Candidatos</Text>
            </View>
            <View style={styles.statGridCard}>
              <Ionicons name="star" size={32} color={COLORS.warning} />
              <Text style={styles.statGridValue}>4.8</Text>
              <Text style={styles.statGridLabel}>Valoración</Text>
            </View>
          </View>
        </View>

        {/* Comparison Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparativa por Sector</Text>
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Hostelería</Text>
              <View style={styles.comparisonBarContainer}>
                <View style={[styles.comparisonBar, { width: '80%' }]} />
              </View>
              <Text style={styles.comparisonValue}>180€</Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Hogar</Text>
              <View style={styles.comparisonBarContainer}>
                <View style={[styles.comparisonBar, { width: '30%' }]} />
              </View>
              <Text style={styles.comparisonValue}>65€</Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Otros</Text>
              <View style={styles.comparisonBarContainer}>
                <View style={[styles.comparisonBar, { width: '10%' }]} />
              </View>
              <Text style={styles.comparisonValue}>0€</Text>
            </View>
          </View>
        </View>
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
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  periodButtonActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  periodTextActive: {
    color: COLORS.primary,
  },
  mainStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    color: COLORS.gray,
    marginLeft: 8,
    fontWeight: '600',
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  mainStatChange: {
    fontSize: 12,
    color: COLORS.primary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
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
    width: 40,
    height: 150,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 11,
    color: COLORS.gray,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statGridCard: {
    width: (width - 44) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statGridValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 12,
    marginBottom: 4,
  },
  statGridLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  comparisonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  comparisonItem: {
    marginBottom: 16,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  comparisonBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 4,
  },
  comparisonBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  comparisonValue: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
  },
});
