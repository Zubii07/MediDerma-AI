import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/theme/index';
import { LoadingSpinner, Screen, Text } from '@/components/ui';
import { TouchableOpacity } from 'react-native';
import { APP_DESCRIPTION, APP_NAME, APP_TITLE, features } from '@/constants/landing-page';
import { useAuth } from '@/hooks/useAuth';

export default function LandingScreen() {
    const { colors, spacing } = useTheme();
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const translateYAnim = useRef(new Animated.Value(24)).current;
    const { height } = useWindowDimensions();
    const isCompact = height < 700;
    const focusFeatures = features.slice(0, 3);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 40,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, scaleAnim, translateYAnim]);

    if (isLoading) {
        return (
            <Screen>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <LoadingSpinner size="large" />
                </View>
            </Screen>
        );
    }

    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    const styles = StyleSheet.create({
        content: {
            flex: 1,
            paddingHorizontal: isCompact ? spacing.lg : spacing.xl,
            paddingVertical: isCompact ? spacing.lg : spacing.xl,
            justifyContent: 'space-between',
            alignItems: 'stretch',
            gap: spacing.lg,
        },
        heroCard: {
            backgroundColor: colors.surface,
            borderRadius: 28,
            padding: spacing.xl,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.lg,
            minHeight: isCompact ? 420 : 520,
            width: '100%',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.26,
            shadowRadius: 36,
            elevation: 8,
        },
        brandName: {
            fontSize: isCompact ? 22 : 24,
            fontWeight: '700',
            color: colors.primary,
            textAlign: 'center',
        },
        heroTitle: {
            fontSize: isCompact ? 26 : 32,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            paddingTop: spacing.md,
        },
        heroSubtitle: {
            fontSize: isCompact ? 14 : 16,
            lineHeight: isCompact ? 20 : 24,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        ctaRow: {
            width: '100%',
            gap: spacing.md,
        },
        primaryButton: {
            width: '100%',
            backgroundColor: colors.primary,
            borderRadius: 18,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignItems: 'center',
        },
        secondaryButton: {
            width: '100%',
            borderRadius: 18,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            borderWidth: 1,
            borderColor: colors.primary,
            alignItems: 'center',
            backgroundColor: colors.primary + '10',
        },
        buttonText: {
            color: '#fff',
            fontWeight: '600',
            fontSize: 16,
        },
        secondaryText: {
            color: colors.primary,
            fontWeight: '600',
            fontSize: 16,
        },
        featureCard: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
        },
        featureIcon: {
            width: 52,
            height: 52,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary + '15',
        },
        featureText: {
            flex: 1,
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
        },
    });

    return (
        <Screen>
            <Animated.View
                style={[
                    styles.content,
                    {
                        flex: 1,
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
                    },
                ]}
            >
                <View style={styles.heroCard}>
                    <Text style={styles.brandName}>{APP_NAME}</Text>
                    <Text style={styles.heroTitle}>{APP_TITLE}</Text>
                    <Text style={styles.heroSubtitle}>{APP_DESCRIPTION}</Text>

                    <View style={styles.ctaRow}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push('/(auth)/signup')}
                        >
                            <Text style={styles.buttonText}>Create Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.push('/(auth)/login')}
                        >
                            <Text style={styles.secondaryText}>I already have an account</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Animated.View
                    style={{
                        gap: spacing.lg,
                        transform: [
                            {
                                translateY: translateYAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 16],
                                }),
                            },
                        ],
                    }}
                >
                    {focusFeatures.map((feature, index) => (
                        <View key={feature.text} style={styles.featureCard}>
                            <View style={styles.featureIcon}>
                                <FontAwesome name={feature.icon as any} size={20} color={colors.primary} />
                            </View>
                            <Text style={styles.featureText}>{feature.text}</Text>
                        </View>
                    ))}
                </Animated.View>
            </Animated.View>
        </Screen>
    );
}