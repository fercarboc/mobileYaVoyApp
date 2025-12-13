import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Mensual',
    price: 15,
    duration: '30 días',
    duration_days: 30,
    popular: true,
  },
  {
    id: 'semester',
    name: 'Semestral',
    price: 75,
    duration: '180 días',
    duration_days: 180,
    popular: false,
  },
];

export default function SubscriptionsScreen() {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    loadCurrentSubscription();
  }, []);

  const loadCurrentSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('VoyCompanySubscriptions')
        .select('*')
        .eq('company_user_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handlePurchase = async () => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
    
    Alert.alert(
      'Confirmar Compra',
      `¿Deseas comprar la suscripción ${plan?.name} por ${plan?.price}€?\n\nPodrás publicar anuncios ilimitados durante ${plan?.duration}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Comprar', 
          onPress: () => processPurchase(plan!)
        },
      ]
    );
  };

  const processPurchase = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    setPaymentAmount(plan.price);
    setCardNumber('');
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard === '4242424242424242') {
      setShowPaymentModal(false);
      const plan = SUBSCRIPTION_PLANS.find(p => p.price === paymentAmount);
      if (plan) {
        await completePurchase(plan);
      }
    } else {
      Alert.alert('❌ Pago Rechazado', 'Tarjeta inválida. Usa la tarjeta de prueba: 4242 4242 4242 4242');
    }
  };

  const completePurchase = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión');
        return;
      }

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days);

      const { data, error } = await supabase
        .from('VoyCompanySubscriptions')
        .insert({
          company_user_id: profile.id,
          subscription_type: plan.id,
          amount: plan.price,
          currency: 'EUR',
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          metadata: {
            plan_name: plan.name,
            duration_days: plan.duration_days
          }
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        '✅ Compra Exitosa',
        `Pago procesado: ${plan.price}€\n\nSuscripción ${plan.name} activa por ${plan.duration}.\n\n¡Ya puedes publicar anuncios ilimitados!`,
        [
          {
            text: 'OK',
            onPress: () => loadCurrentSubscription()
          }
        ]
      );
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      Alert.alert('Error', 'No se pudo completar la compra. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Suscripciones</Text>
          <Text style={styles.headerSubtitle}>
            Publica anuncios ilimitados con una suscripción activa
          </Text>
        </View>

        {/* Current Subscription */}
        {currentSubscription ? (
          <View style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <Ionicons name="star" size={24} color={COLORS.warning} />
              <Text style={styles.currentTitle}>Suscripción Actual</Text>
            </View>
            <Text style={styles.currentPlan}>
              {SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.subscription_type)?.name || 'Suscripción Activa'}
            </Text>
            <View style={styles.currentStats}>
              <View style={styles.currentStat}>
                <Text style={styles.currentValue}>∞</Text>
                <Text style={styles.currentLabel}>Anuncios</Text>
              </View>
              <View style={styles.currentDivider} />
              <View style={styles.currentStat}>
                <Text style={styles.currentValue}>
                  {Math.max(0, Math.ceil((new Date(currentSubscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                </Text>
                <Text style={styles.currentLabel}>Días restantes</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <Ionicons name="alert-circle-outline" size={24} color={COLORS.gray} />
              <Text style={styles.currentTitle}>Sin Suscripción Activa</Text>
            </View>
            <Text style={styles.emptyText}>
              Compra una suscripción para publicar anuncios ilimitados
            </Text>
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Planes Disponibles</Text>
          
          {SUBSCRIPTION_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MÁS POPULAR</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planAds}>Anuncios ilimitados</Text>
                </View>
                <View style={styles.planPriceContainer}>
                  <Text style={styles.planPrice}>{plan.price}€</Text>
                  <Text style={styles.planDuration}>{plan.duration}</Text>
                </View>
              </View>
              <View style={styles.planFeatures}>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.featureText}>
                    Publicaciones ilimitadas
                  </Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.featureText}>Válido por {plan.duration}</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.featureText}>Candidatos ilimitados</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.featureText}>
                    Sin límite de anuncios activos
                  </Text>
                </View>
              </View>
              {selectedPlan === plan.id && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Beneficios de las Suscripciones</Text>
          <View style={styles.benefitCard}>
            <Ionicons name="flash" size={24} color={COLORS.primary} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Publicación Inmediata</Text>
              <Text style={styles.benefitText}>
                Tus anuncios se publican al instante
              </Text>
            </View>
          </View>
          <View style={styles.benefitCard}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Candidatos Ilimitados</Text>
              <Text style={styles.benefitText}>
                Recibe todas las candidaturas que necesites
              </Text>
            </View>
          </View>
          <View style={styles.benefitCard}>
            <Ionicons name="trending-up" size={24} color={COLORS.primary} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Mayor Visibilidad</Text>
              <Text style={styles.benefitText}>
                Tus anuncios llegan a más trabajadores
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Purchase Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]} 
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Comprar Suscripción - {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price}€
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.paymentModalOverlay}>
          <View style={styles.paymentModalContent}>
            <Text style={styles.paymentModalTitle}>
              💳 Pago con Tarjeta
            </Text>
            <Text style={styles.paymentModalSubtitle}>
              Modo de prueba Stripe
            </Text>

            <TextInput
              style={styles.paymentInput}
              placeholder="Número de tarjeta"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
              maxLength={19}
              autoFocus={true}
            />
            <Text style={styles.paymentHint}>
              💡 Tarjeta de prueba: 4242 4242 4242 4242
            </Text>

            <View style={styles.paymentButtons}>
              <TouchableOpacity
                style={styles.paymentCancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.paymentCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.paymentConfirmButton}
                onPress={handlePayment}
              >
                <Text style={styles.paymentConfirmText}>
                  Pagar {paymentAmount}€
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  currentCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginLeft: 12,
  },
  currentPlan: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  currentStats: {
    flexDirection: 'row',
  },
  currentStat: {
    flex: 1,
    alignItems: 'center',
  },
  currentDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  currentValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  currentLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  plansContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.warning,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  planAds: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  planDuration: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  planFeatures: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textDark,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  benefitsSection: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  benefitContent: {
    marginLeft: 16,
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  purchaseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  paymentModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  paymentHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentConfirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
