import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme/index';

interface EmptyStateProps {
    icon?: keyof typeof FontAwesome.glyphMap;
    title?: string;
    message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'info-circle',
    title,
    message,
}) => {
    const { colors, spacing } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.lg,
                    gap: spacing.sm,
                },
                title: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                },
                message: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: 'center',
                },
            }),
        [colors, spacing]
    );

    return (
        <View style={styles.container}>
            <FontAwesome name={icon} size={20} color={colors.textSecondary} />
            {!!title && <Text style={styles.title}>{title}</Text>}
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

