import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, JOB_CATEGORIES, DISTRICTS } from '@/constants';
import { supabase } from '@/services/supabase';

export default function CreateJobScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [availableAds, setAvailableAds] = useState(0);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [price, setPrice] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showNeighborhoodModal, setShowNeighborhoodModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(5);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setCheckingSubscription(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;

      // Verificar bonos activos
      const { data: subscriptions } = await supabase
        .from('VoySubscriptions')
        .select('*')
        .eq('company_user_id', profile.id)
        .eq('is_active', true)
        .gt('remaining_ads', 0);

      if (subscriptions && subscriptions.length > 0) {
        setHasActiveSubscription(true);
        const totalAds = subscriptions.reduce((sum, sub) => sum + sub.remaining_ads, 0);
        setAvailableAds(totalAds);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handlePublish = async () => {
    // Validaciones
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Selecciona una categoría');
      return;
    }
    if (!district.trim()) {
      Alert.alert('Error', 'El distrito es obligatorio');
      return;
    }
    if (!neighborhood.trim()) {
      Alert.alert('Error', 'El barrio es obligatorio');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    // Si no tiene bono, mostrar opción de pago
    if (!hasActiveSubscription) {
      Alert.alert(
        'Sin bono activo',
        'Para publicar este anuncio:\n\n• Precio por anuncio suelto: 5€\n• O compra un bono de anuncios',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Comprar Bono', onPress: () => navigation.navigate('Subscriptions') },
          { text: 'Pagar 5€', onPress: () => publishWithSinglePayment() }
        ]
      );
      return;
    }

    // Publicar con bono
    await publishJob();
  };

  const publishJob = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id, full_name')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;

      // Crear el trabajo
      const { data: job, error } = await supabase
        .from('VoyJobs')
        .insert({
          creator_user_id: profile.id,
          title: title.trim(),
          description: description.trim(),
          category: category,
          job_type: 'ONE_OFF',
          price_fixed: parseFloat(price),
          price_hourly: 0,
          price_negotiable: false,
          city: 'Madrid',
          district: district.trim(),
          neighborhood: neighborhood.trim(),
          status: 'OPEN',
        })
        .select()
        .single();

      if (error) throw error;

      // Descontar del bono si tiene
      if (hasActiveSubscription) {
        const { data: activeSub } = await supabase
          .from('VoySubscriptions')
          .select('*')
          .eq('company_user_id', profile.id)
          .eq('is_active', true)
          .gt('remaining_ads', 0)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (activeSub) {
          await supabase
            .from('VoySubscriptions')
            .update({ remaining_ads: activeSub.remaining_ads - 1 })
            .eq('id', activeSub.id);
        }
      }

      Alert.alert('¡Éxito!', 'Anuncio publicado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

      // Limpiar formulario
      setTitle('');
      setDescription('');
      setCategory('');
      setDistrict('');
      setNeighborhood('');
      setPrice('');
      setUrgency('medium');
    } catch (error) {
      console.error('Error publishing job:', error);
      Alert.alert('Error', 'No se pudo publicar el anuncio');
    } finally {
      setLoading(false);
    }
  };

  const publishWithSinglePayment = async () => {
    setPaymentAmount(5);
    setCardNumber('');
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard === '4242424242424242') {
      setShowPaymentModal(false);
      Alert.alert('✅ Pago Exitoso', `Se ha procesado el pago de ${paymentAmount}€ correctamente. Tu anuncio será publicado.`);
      await publishJob();
    } else {
      Alert.alert('❌ Pago Rechazado', 'Tarjeta inválida. Por favor usa la tarjeta de prueba: 4242 4242 4242 4242');
    }
  };

  const urgencyOptions = [
    { value: 'low', label: 'Baja', color: COLORS.gray },
    { value: 'medium', label: 'Media', color: COLORS.warning },
    { value: 'high', label: 'Alta', color: COLORS.danger },
  ];

  if (checkingSubscription) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Anuncio</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Subscription Status */}
      <View style={[styles.statusCard, hasActiveSubscription ? styles.statusActive : styles.statusInactive]}>
        <Ionicons 
          name={hasActiveSubscription ? "checkmark-circle" : "alert-circle"} 
          size={20} 
          color={hasActiveSubscription ? COLORS.success : COLORS.warning} 
        />
        <Text style={styles.statusText}>
          {hasActiveSubscription 
            ? `Bono activo: ${availableAds} anuncios disponibles`
            : 'Sin bono - 5€ por anuncio suelto'
          }
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título del trabajo *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Fontanero para reparación urgente"
            placeholderTextColor={COLORS.gray}
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe el trabajo en detalle. Incluye la calle si lo deseas..."
            placeholderTextColor={COLORS.gray}
            multiline
            numberOfLines={6}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
          <Text style={styles.hint}>
            💡 Tip: Puedes incluir la dirección específica (calle y número) en la descripción
          </Text>
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoría *</Text>
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={category ? styles.selectButtonText : styles.selectButtonPlaceholder}>
              {category ? JOB_CATEGORIES.find(c => c.id === category)?.label : 'Seleccionar categoría'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Distrito *</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowDistrictModal(true)}
            >
              <Text style={district ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                {district || 'Seleccionar'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Barrio *</Text>
            <TouchableOpacity 
              style={[styles.selectButton, !district && styles.selectButtonDisabled]}
              onPress={() => district && setShowNeighborhoodModal(true)}
              disabled={!district}
            >
              <Text style={neighborhood ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                {neighborhood || 'Seleccionar'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Precio fijo (€) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor={COLORS.gray}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Urgency */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Urgencia</Text>
          <View style={styles.urgencyContainer}>
            {urgencyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.urgencyButton,
                  urgency === option.value && { 
                    backgroundColor: `${option.color}20`, 
                    borderColor: option.color 
                  }
                ]}
                onPress={() => setUrgency(option.value as any)}
              >
                <Text style={[
                  styles.urgencyText,
                  urgency === option.value && { color: option.color, fontWeight: 'bold' }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Publish Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.publishButton, loading && styles.publishButtonDisabled]}
          onPress={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="megaphone" size={20} color={COLORS.white} />
              <Text style={styles.publishButtonText}>Publicar Anuncio</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {JOB_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryItem}
                  onPress={() => {
                    setCategory(cat.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                    <Text style={styles.categoryItemText}>{cat.label}</Text>
                  </View>
                  {category === cat.id && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* District Modal */}
      <Modal
        visible={showDistrictModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Distrito</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {Object.keys(DISTRICTS).map((districtName) => (
                <TouchableOpacity
                  key={districtName}
                  style={styles.categoryItem}
                  onPress={() => {
                    setDistrict(districtName);
                    setNeighborhood(''); // Reset neighborhood when district changes
                    setShowDistrictModal(false);
                  }}
                >
                  <Text style={styles.categoryItemText}>{districtName}</Text>
                  {district === districtName && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Neighborhood Modal */}
      <Modal
        visible={showNeighborhoodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNeighborhoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Barrio</Text>
              <TouchableOpacity onPress={() => setShowNeighborhoodModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {district && DISTRICTS[district]?.map((hood) => (
                <TouchableOpacity
                  key={hood}
                  style={styles.categoryItem}
                  onPress={() => {
                    setNeighborhood(hood);
                    setShowNeighborhoodModal(false);
                  }}
                >
                  <Text style={styles.categoryItemText}>{hood}</Text>
                  {neighborhood === hood && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                onPress={processPayment}
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
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: `${COLORS.success}15`,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  statusInactive: {
    backgroundColor: `${COLORS.warning}15`,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.dark,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 6,
    fontStyle: 'italic',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#f9fafb',
  },
  selectButtonText: {
    fontSize: 15,
    color: COLORS.dark,
  },
  selectButtonPlaceholder: {
    fontSize: 15,
    color: COLORS.gray,
  },
  row: {
    flexDirection: 'row',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryItemText: {
    fontSize: 15,
    color: COLORS.dark,
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
