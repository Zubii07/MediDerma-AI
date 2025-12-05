import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, useWindowDimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';

import { Screen, Text, Button, Input } from '@/components/ui';
import { useTheme } from '@/theme/index';
import { useAuth } from '@/hooks/useAuth';
import { features, APP_NAME } from '@/constants/landing-page';

type RegisterFormData = {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export default function SignupScreen() {
    const { colors, spacing } = useTheme();
    const { signUpWithEmail } = useAuth();
    const router = useRouter();
    const { height } = useWindowDimensions();
    const isCompact = height < 700;

    // Form setup with react-hook-form
    const { control, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<RegisterFormData>({
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    // Watch password for confirmPassword validation
    const password = watch('password');

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
    const onSubmit = async (data: RegisterFormData) => {
        try {
            await signUpWithEmail({
                email: data.email,
                password: data.password,
                displayName: data.username,
            });
            router.replace('/(tabs)/');
        } catch (error: any) {
            console.error('Registration error:', error);
            const message =
                error?.code === 'auth/email-already-in-use'
                    ? 'This email is already registered.'
                    : error?.message || 'Unable to create your account right now. Please try again.';
            Alert.alert('Sign Up Failed', message);
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
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.22,
            shadowRadius: 28,
            elevation: 6,
            width: '100%',
            maxWidth: 480,
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
        passwordHint: {
            fontSize: 12,
            color: colors.textSecondary,
            textAlign: 'left',
        },
        termsText: {
            fontSize: 12,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        termsLink: {
            color: colors.primary,
            fontSize: 12,
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
                        <Text style={styles.title}>Create Your Account</Text>
                        <Text style={styles.subtitle}>Join {APP_NAME} and unlock precision dermatology workflows</Text>
                    </View>

                    <View style={styles.formFields}>
                        <Controller
                            control={control}
                            name="username"
                            rules={{
                                required: 'Username is required',
                            }}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    label="Full Name"
                                    value={value}
                                    onChangeText={onChange}
                                    error={errors.username?.message}
                                    autoCapitalize="words"
                                />
                            )}
                        />
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
                                    label="Work Email"
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
                        <Text style={styles.passwordHint}>Minimum 6 characters with letters and numbers.</Text>

                        <Controller
                            control={control}
                            name="confirmPassword"
                            rules={{
                                required: 'Confirm Password is required',
                                validate: (value) =>
                                    value === password || 'Passwords do not match',
                            }}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    label="Confirm Password"
                                    value={value}
                                    onChangeText={onChange}
                                    error={errors.confirmPassword?.message}
                                    secureTextEntry
                                />
                            )}
                        />

                        <Button
                            title={isSubmitting ? 'Creating Account...' : 'Create Account'}
                            onPress={handleSubmit(onSubmit)}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            variant="primary"
                        />

                        <Text style={styles.termsText}>
                            By continuing you agree to our{' '}
                            <Text style={styles.termsLink}>Terms</Text> and{' '}
                            <Text style={styles.termsLink}>Privacy Policy</Text>.
                        </Text>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.footerLink}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </Screen>
    );
}