import { Colors } from '@/constants/Colors';
import { ProfileMenuItem } from '@/models/ProfileMenuItem';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProfileMenuRow } from './ProfileMenuRow';

interface ProfileMenuSectionProps {
  title?: string;
  items: ProfileMenuItem[];
}

// Menüszekció keret a profil oldalon
export const ProfileMenuSection: React.FC<ProfileMenuSectionProps> = ({ title, items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {Boolean(title) && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.card}>
        {items.map((item, index) => (
          <ProfileMenuRow
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
});

