import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageProvider';
import * as Linking from 'expo-linking';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const REPDB_URL = 'https://repdb.co';

// Profil képernyő lábléce (verziószám és RepDB megjelölés)
export const ProfileFooter: React.FC = () => {
  const { t } = useLanguage();

  const handleOpenRepDb = () => {
    Linking.openURL(REPDB_URL).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brandTitle}>FitBase</Text>
      <Text style={styles.versionText}>
        {t('profile.footer.version', { version: '1.0.0' })}
      </Text>

      {/* RepDB forrásmegjelölés link */}
      <TouchableOpacity
        onPress={handleOpenRepDb}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
      >
        <Text style={styles.attributionText}>
          {t('profile.footer.exerciseDataBy')}{' '}
          <Text style={styles.linkText}>RepDB (repdb.co)</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 4,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1.2,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  versionText: {
    fontSize: 11,
    color: Colors.text.ghost,
    marginBottom: 8,
  },
  attributionText: {
    fontSize: 11,
    color: Colors.text.dim,
  },
  linkText: {
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
