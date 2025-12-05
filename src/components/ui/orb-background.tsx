import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/theme/index';

const createAnimation = () => {
    const pulse = new Animated.Value(0);
    const float = new Animated.Value(0);

    const pulseLoop = Animated.loop(
        Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 4200, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0, duration: 4200, useNativeDriver: true }),
        ])
    );

    const floatLoop = Animated.loop(
        Animated.sequence([
            Animated.timing(float, { toValue: 1, duration: 5200, useNativeDriver: true }),
            Animated.timing(float, { toValue: 0, duration: 5200, useNativeDriver: true }),
        ])
    );

    return { pulse, float, pulseLoop, floatLoop };
};

export const OrbBackground: React.FC = React.memo(() => {
    const { colors, isDark } = useTheme();
    const { height, width } = useWindowDimensions();
    const isCompact = height < 720 || width < 400;

    const animationRef = useRef(createAnimation());

    useEffect(() => {
        const { pulseLoop, floatLoop } = animationRef.current;
        pulseLoop.start();
        floatLoop.start();

        return () => {
            pulseLoop.stop();
            floatLoop.stop();
        };
    }, []);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    ...StyleSheet.absoluteFillObject,
                },
                gradient: {
                    ...StyleSheet.absoluteFillObject,
                },
                orb: {
                    position: 'absolute',
                    borderRadius: 999,
                    opacity: isDark ? 0.35 : 0.25,
                },
                orbPrimary: {
                    width: isCompact ? 220 : 260,
                    height: isCompact ? 220 : 260,
                    top: -60,
                    right: -100,
                    backgroundColor: colors.primary,
                },
                orbSecondary: {
                    width: isCompact ? 200 : 240,
                    height: isCompact ? 200 : 240,
                    bottom: -60,
                    left: -120,
                    backgroundColor: colors.secondary,
                },
            }),
        [colors.primary, colors.secondary, isCompact, isDark]
    );

    const { pulse, float } = animationRef.current;

    const primaryTransforms = useMemo(
        () => [
            {
                scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
            },
            {
                translateY: float.interpolate({ inputRange: [0, 1], outputRange: [-12, 14] }),
            },
        ],
        [pulse, float]
    );

    const secondaryTransforms = useMemo(
        () => [
            {
                scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }),
            },
            {
                translateY: float.interpolate({ inputRange: [0, 1], outputRange: [16, -10] }),
            },
        ],
        [pulse, float]
    );

    return (
        <View pointerEvents="none" style={styles.container}>
            <LinearGradient
                colors={isDark ? ['#060b18', '#101d36', '#060b18'] : ['#f3f7ff', '#e7eeff', '#f5f8ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            />
            <BlurView intensity={isDark ? 24 : 16} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <Animated.View style={[styles.orb, styles.orbPrimary, { transform: primaryTransforms }]} />
            <Animated.View style={[styles.orb, styles.orbSecondary, { transform: secondaryTransforms }]} />
        </View>
    );
});

OrbBackground.displayName = 'OrbBackground';
