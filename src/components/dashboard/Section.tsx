import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme/index';

interface SectionProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
    style?: ViewStyle;
    contentStyle?: ViewStyle;
}

export const Section: React.FC<SectionProps> = ({
    title,
    subtitle,
    action,
    children,
    style,
    contentStyle,
}) => {
    const { colors, spacing } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    backgroundColor: colors.surface,
                    borderRadius: 24,
                    padding: spacing.xl,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    gap: spacing.lg,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.08,
                    shadowRadius: 18,
                    elevation: 3,
                },
                header: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: spacing.md,
                },
                title: {
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.text,
                },
                subtitle: {
                    marginTop: spacing.xs / 2,
                    fontSize: 14,
                    color: colors.textSecondary,
                },
                content: {
                    gap: spacing.md,
                },
            }),
        [colors, spacing]
    );

    return (
        <View style={[styles.container, style]}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{title}</Text>
                    {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                {action}
            </View>
            <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
    );
};

