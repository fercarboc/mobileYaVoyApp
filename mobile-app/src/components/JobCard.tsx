import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';
import { COLORS, URGENCY_COLORS, CATEGORIES } from '@/constants';

interface JobCardProps {
  job: Job;
  onPress?: () => void;
}

export default function JobCard({ job, onPress }: JobCardProps) {
  const urgencyColor = URGENCY_COLORS[job.urgency] || URGENCY_COLORS.MEDIUM;
  const urgencyLabel = job.urgency === 'LOW' ? 'Sin prisa' : job.urgency === 'MEDIUM' ? 'Hoy' : '¡Urgente!';
  const category = CATEGORIES.find((c) => c.id === job.category);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.urgencyBadge,
            { 
              backgroundColor: `rgba(${urgencyColor.r}, ${urgencyColor.g}, ${urgencyColor.b}, 0.15)`,
              borderColor: `rgb(${urgencyColor.r}, ${urgencyColor.g}, ${urgencyColor.b})`,
            },
          ]}
        >
          <Text style={[styles.urgencyText, { color: `rgb(${urgencyColor.r}, ${urgencyColor.g}, ${urgencyColor.b})` }]}>
            {urgencyLabel}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{job.price}€</Text>
          {job.is_contract && <Text style={styles.priceUnit}>/mes</Text>}
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {job.title}
      </Text>

      {/* Description */}
      {job.description && (
        <Text style={styles.description} numberOfLines={2}>
          {job.description}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color={COLORS.gray} />
          <Text style={styles.location}>
            {job.neighborhood}, {job.district}
          </Text>
          {job.distance && (
            <Text style={styles.distance}>· {job.distance.toFixed(1)} km</Text>
          )}
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryIcon}>{category?.icon || '📦'}</Text>
        </View>
      </View>

      {/* Contract Badge */}
      {job.is_contract && (
        <View style={styles.contractBadge}>
          <Ionicons name="document-text" size={12} color={COLORS.white} />
          <Text style={styles.contractText}>CONTRATO</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  urgencyBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  location: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 4,
  },
  distance: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 4,
  },
  categoryBadge: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 16,
  },
  contractBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.dark,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contractText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
