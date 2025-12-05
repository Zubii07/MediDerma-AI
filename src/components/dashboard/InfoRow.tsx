import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme/index';

interface InfoRowProps {
    label: string;
    value: string;
    style?: ViewStyle;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, style }) => {
    const { colors, spacing } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    gap: spacing.xs / 2,
                },
                label: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                },
                value: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                    textTransform: 'uppercase',
                },
            }),
        [colors, spacing]
    );

    const formattedValue = value ? value.toUpperCase() : '—';

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{formattedValue}</Text>
        </View>
    );
};

