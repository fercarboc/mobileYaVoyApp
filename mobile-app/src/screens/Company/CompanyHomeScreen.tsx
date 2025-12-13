import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthService, JobService } from '@/services/api';
import { User, Job } from '@/types';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

export default function CompanyHomeScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    finishedJobs: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [finishedJobs, setFinishedJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!profile) return;

      // Cargar suscripción activa
      const { data: activeSub } = await supabase
        .from('VoyCompanySubscriptions')
        .select('*')
        .eq('company_user_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setSubscription(activeSub || null);

      // Cargar anuncios activos
      const { data: jobs } = await supabase
        .from('VoyJobs')
        .select('id, status')
        .eq('creator_user_id', profile.id)
        .eq('status', 'OPEN');

      // Cargar trabajos finalizados pendientes de confirmación
      const { data: finishedJobsData } = await supabase
        .from('VoyJobs')
        .select(`
          id,
          title,
          price_fixed,
          price_hourly,
          status,
          VoyJobApplications!inner(
            id,
            status,
            helper_user_id,
            proposed_price,
            proposed_hourly_rate,
            VoyUsers!helper_user_id(
              id,
              full_name
            )
          )
        `)
        .eq('creator_user_id', profile.id)
        .eq('status', 'IN_PROGRESS')
        .eq('VoyJobApplications.status', 'ACCEPTED');

      setFinishedJobs(finishedJobsData || []);

      // Cargar candidaturas
      const { data: applications } = await supabase
        .from('VoyJobApplications')
        .select('id, status, job_id')
        .in('job_id', jobs?.map(j => j.id) || []);

      const pendingApps = applications?.filter(app => app.status === 'PENDING') || [];
      
      // Cargar actividad reciente (últimas 5 candidaturas)
      const { data: recentApps } = await supabase
        .from('VoyJobApplications')
        .select(`
          id,
          message,
          status,
          created_at,
          helper_user_id,
          job_id,
          VoyJobs!inner(title)
        `)
        .in('job_id', jobs?.map(j => j.id) || [])
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentApps) {
        // Obtener info de los helpers
        const helperIds = recentApps.map(app => app.helper_user_id);
        const { data: helpers } = await supabase
          .from('VoyUsers')
          .select('id, full_name')
          .in('id', helperIds);

        const activityWithHelpers = recentApps.map(app => ({
          ...app,
          helperName: helpers?.find(h => h.id === app.helper_user_id)?.full_name || 'Usuario',
        }));

        setRecentActivity(activityWithHelpers);
      }
      
      setStats({
        activeJobs: jobs?.length || 0,
        totalApplications: applications?.length || 0,
        pendingApplications: pendingApps.length || 0,
        finishedJobs: finishedJobsData?.length || 0,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateJob = () => {
    navigation.navigate('MyAds' as never, { screen: 'CreateJob' } as never);
  };

  const handleBuySubscription = () => {
    navigation.navigate('Subscriptions' as never);
  };

  const confirmJobCompletion = async (job: any) => {
    const application = job.VoyJobApplications?.[0];
    if (!application) return;

    const amount = application.proposed_price || application.proposed_hourly_rate || job.price_fixed || job.price_hourly || 0;

    // Primero pedir forma de pago
    Alert.alert(
      'Seleccionar Forma de Pago',
      `Confirma el pago de ${amount.toFixed(2)}€ al trabajador ${application.VoyUsers?.full_name || 'Desconocido'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Transferencia',
          onPress: () => processPayment(job, application, amount, 'TRANSFERENCIA'),
        },
        {
          text: 'Efectivo',
          onPress: () => processPayment(job, application, amount, 'EFECTIVO'),
        },
        {
          text: 'Bizum',
          onPress: () => processPayment(job, application, amount, 'BIZUM'),
        },
      ]
    );
  };

  const processPayment = async (job: any, application: any, amount: number, paymentMethod: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!profile) return;

      // Actualizar estado del trabajo a COMPLETED
      const { error: jobError } = await supabase
        .from('VoyJobs')
        .update({ status: 'COMPLETED' })
        .eq('id', job.id);

      if (jobError) throw jobError;

      // Registrar transacción económica para la empresa (gasto)
      const { error: companyTransError } = await supabase
        .from('VoyEconomicTransactions')
        .insert({
          user_id: profile.id,
          type: 'PAYMENT',
          amount: -amount,
          description: `Pago por trabajo: ${job.title}`,
          job_id: job.id,
          payment_method: paymentMethod,
        });

      if (companyTransError) throw companyTransError;

      // Registrar transacción económica para el trabajador (ingreso)
      const { error: workerTransError } = await supabase
        .from('VoyEconomicTransactions')
        .insert({
          user_id: application.VoyUsers.id,
          type: 'INCOME',
          amount: amount,
          description: `Pago recibido por trabajo: ${job.title}`,
          job_id: job.id,
          payment_method: paymentMethod,
        });

      if (workerTransError) throw workerTransError;

      // Recargar datos
      await loadData();

      Alert.alert(
        'Pago Procesado',
        `El pago de ${amount.toFixed(2)}€ mediante ${paymentMethod} ha sido registrado exitosamente.`
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'No se pudo procesar el pago');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Bienvenido</Text>
            <Text style={styles.headerTitle}>{user?.full_name}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => Alert.alert('Notificaciones', 'Función en desarrollo')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.dark} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Subscription Card */}
        <View style={styles.subscriptionCard}>
          {subscription ? (
            <>
              <View style={styles.subscriptionHeader}>
                <Ionicons name="star" size={24} color={COLORS.warning} />
                <Text style={styles.subscriptionTitle}>
                  Suscripción {subscription.subscription_type === 'monthly' ? 'Mensual' : 'Semestral'}
                </Text>
              </View>
              <View style={styles.subscriptionContent}>
                <View style={styles.subscriptionStat}>
                  <Text style={styles.subscriptionValue}>∞</Text>
                  <Text style={styles.subscriptionLabel}>Anuncios ilimitados</Text>
                </View>
                <View style={styles.subscriptionDivider} />
                <View style={styles.subscriptionStat}>
                  <Text style={styles.subscriptionValue}>
                    {Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                  </Text>
                  <Text style={styles.subscriptionLabel}>Días restantes</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.renewButton} onPress={handleBuySubscription}>
                <Text style={styles.renewButtonText}>Renovar o cambiar plan</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.subscriptionHeader}>
                <Ionicons name="alert-circle" size={24} color={COLORS.gray} />
                <Text style={styles.subscriptionTitle}>Sin Suscripción Activa</Text>
              </View>
              <Text style={styles.noSubscriptionText}>No tienes una suscripción activa. Suscríbete para publicar anuncios ilimitados.</Text>
              <TouchableOpacity style={styles.renewButton} onPress={handleBuySubscription}>
                <Text style={styles.renewButtonText}>Ver Planes</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="megaphone" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.activeJobs}</Text>
            <Text style={styles.statLabel}>Anuncios activos</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{stats.totalApplications}</Text>
            <Text style={styles.statLabel}>Candidatos totales</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{stats.pendingApplications}</Text>
            <Text style={styles.statLabel}>Por revisar</Text>
          </View>
        </View>

        {/* Trabajos Finalizados - Pendientes de Confirmación */}
        {finishedJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Trabajos Finalizados</Text>
            <Text style={styles.sectionSubtitle}>
              Los siguientes trabajos han sido marcados como finalizados por el trabajador. Confirma para procesar el pago.
            </Text>
            {finishedJobs.map((job) => {
              const application = job.VoyJobApplications?.[0];
              const amount = application?.proposed_price || application?.proposed_hourly_rate || job.price_fixed || job.price_hourly || 0;
              
              return (
                <View key={job.id} style={styles.finishedJobCard}>
                  <View style={styles.finishedJobHeader}>
                    <Ionicons name="checkmark-done-circle" size={24} color={COLORS.success} />
                    <View style={styles.finishedJobInfo}>
                      <Text style={styles.finishedJobTitle}>{job.title}</Text>
                      <Text style={styles.finishedJobWorker}>
                        Trabajador: {application?.VoyUsers?.full_name || 'Desconocido'}
                      </Text>
                      <Text style={styles.finishedJobAmount}>
                        Monto a pagar: {amount.toFixed(2)}€
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => confirmJobCompletion(job)}
                  >
                    <Ionicons name="card" size={20} color={COLORS.white} />
                    <Text style={styles.confirmButtonText}>Confirmar y Pagar</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleCreateJob}>
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="add-circle" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Publicar Nuevo Anuncio</Text>
              <Text style={styles.actionSubtitle}>Encuentra trabajadores para tu proyecto</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyAds' as never)}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.success}15` }]}>
              <Ionicons name="briefcase" size={28} color={COLORS.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mis Anuncios</Text>
              <Text style={styles.actionSubtitle}>Gestiona tus publicaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Candidates' as never)}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.info}15` }]}>
              <Ionicons name="people" size={28} color={COLORS.info} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ver Candidatos</Text>
              <Text style={styles.actionSubtitle}>Revisa las candidaturas recibidas</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Economics' as never)}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.warning}15` }]}>
              <Ionicons name="analytics" size={28} color={COLORS.warning} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Datos Económicos</Text>
              <Text style={styles.actionSubtitle}>Gastos y comparativas</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={[
                  styles.activityIcon,
                  activity.status === 'ACCEPTED' && { backgroundColor: `${COLORS.success}15` },
                  activity.status === 'PENDING' && { backgroundColor: `${COLORS.warning}15` },
                  activity.status === 'REJECTED' && { backgroundColor: `${COLORS.gray}15` },
                ]}>
                  <Ionicons 
                    name={
                      activity.status === 'ACCEPTED' ? 'checkmark-circle' :
                      activity.status === 'PENDING' ? 'time' :
                      'close-circle'
                    }
                    size={20} 
                    color={
                      activity.status === 'ACCEPTED' ? COLORS.success :
                      activity.status === 'PENDING' ? COLORS.warning :
                      COLORS.gray
                    }
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {activity.helperName}
                  </Text>
                  <Text style={styles.activitySubtitle}>
                    {activity.status === 'ACCEPTED' ? 'Aceptado para' :
                     activity.status === 'PENDING' ? 'Se postuló a' :
                     'Rechazado para'} "{activity.VoyJobs.title}"
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No hay actividad reciente</Text>
            </View>
          )}
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
  noSubscriptionText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  subscriptionCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginLeft: 12,
  },
  subscriptionContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  subscriptionStat: {
    flex: 1,
    alignItems: 'center',
  },
  subscriptionDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  subscriptionValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subscriptionLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  renewButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  renewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center',
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
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 12,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: COLORS.gray,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
  },
  finishedJobCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  finishedJobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  finishedJobInfo: {
    flex: 1,
    marginLeft: 12,
  },
  finishedJobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  finishedJobWorker: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  finishedJobAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});
