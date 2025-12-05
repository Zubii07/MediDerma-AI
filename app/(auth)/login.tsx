import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Screen, Text } from '@/components/ui';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { features } from '@/constants/landing-page';

type LoginFormData = {
    email: string;
    password: string;
};

export default function LoginScreen() {
    const { colors, spacing } = useTheme();
    const { signInWithEmail, sendPasswordReset } = useAuth();
    const router = useRouter();
    const { height } = useWindowDimensions();
    const isCompact = height < 700;
    const featureHighlights = features.slice(0, 3);

    // Form setup with react-hook-form
    const { control, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
    });

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Form submission handler
    // In your login screen component
    const onSubmit = async (formData: LoginFormData) => {
        try {
            await signInWithEmail(formData.email, formData.password);
            router.replace('/(tabs)/');
        } catch (error: any) {
            console.error('Login error:', error);
            const message =
                error?.code === 'auth/invalid-credential'
                    ? 'Invalid email or password'
                    : error?.message || 'Unable to sign in right now. Please try again.';
            Alert.alert('Login Failed', message, [{ text: 'OK' }]);
        }
    };

    const styles = StyleSheet.create({
        content: {
            flex: 1,
            paddingHorizontal: isCompact ? spacing.lg : spacing.xl,
            paddingVertical: isCompact ? spacing.lg : spacing.xl,
            justifyContent: 'center',
        },
        formCard: {
            backgroundColor: colors.surface,
            borderRadius: 28,
            padding: spacing.xl,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.22,
            shadowRadius: 28,
            elevation: 6,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            width: '100%',
            maxWidth: 440,
            alignSelf: 'center',
            gap: spacing.lg,
        },
        cardHeader: {
            alignItems: 'center',
            gap: spacing.xs,
        },
        title: {
            fontSize: 26,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        formFields: {
            gap: spacing.md,
        },
        auxiliaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        linkButton: {
            color: colors.primary,
            fontWeight: '600',
            fontSize: 12,
        },
        divider: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: spacing.sm,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: colors.border,
        },
        dividerText: {
            fontSize: 12,
            color: colors.textSecondary,
            paddingHorizontal: spacing.sm,
            fontWeight: '600',
        },
        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xs,
        },
        footerText: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        footerLink: {
            fontSize: 12,
            color: colors.primary,
            fontWeight: '600',
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
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <View style={styles.formCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Access your dermatology intelligence dashboard</Text>
                    </View>

                    <View style={styles.formFields}>
                        <Controller
                            control={control}
                            name="email"
                            rules={{
                                required: 'Email is required',
                                pattern: {
                                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                    message: 'Invalid email address',
                                },
                            }}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    label="Email"
                                    value={value}
                                    onChangeText={onChange}
                                    error={errors.email?.message}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="password"
                            rules={{
                                required: 'Password is required',
                                minLength: { value: 6, message: 'Password must be at least 6 characters' },
                            }}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    label="Password"
                                    value={value}
                                    onChangeText={onChange}
                                    error={errors.password?.message}
                                    secureTextEntry
                                />
                            )}
                        />

                        <View style={styles.auxiliaryRow}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Trouble signing in?</Text>
                            <TouchableOpacity
                                onPress={async () => {
                                    const email = getValues('email');
                                    if (!email) {
                                        Alert.alert('Reset Password', 'Enter your email address above to reset your password.');
                                        return;
                                    }
                                    try {
                                        await sendPasswordReset(email);
                                        Alert.alert('Reset Email Sent', 'Check your inbox for password reset instructions.');
                                    } catch (error: any) {
                                        const message =
                                            error?.code === 'auth/user-not-found'
                                                ? 'No account found with that email.'
                                                : 'Unable to send reset email right now. Please try again.';
                                        Alert.alert('Reset Failed', message);
                                    }
                                }}
                            >
                                <Text style={styles.linkButton}>Forgot password?</Text>
                            </TouchableOpacity>
                        </View>

                        <Button
                            title={isSubmitting ? 'Signing In...' : 'Sign In'}
                            onPress={handleSubmit(onSubmit)}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            variant="primary"
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don&apos;t have an account?</Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                            <Text style={styles.footerLink}>Create one</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </Screen>
    );
}