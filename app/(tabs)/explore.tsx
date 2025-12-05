import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { Screen } from '@/components/ui';
import { useTheme } from '@/theme/index';
import { Section } from '@/components/dashboard/Section';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function ExploreTabScreen() {
    const { colors, spacing } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.xl,
                    gap: spacing.lg,
                },
            }),
        [colors, spacing]
    );

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            <Section
                title="Learning Hub"
                subtitle="Understand symptoms, triggers, and recommended care routines."
            >
                <EmptyState
                    icon="book"
                    message="Educational modules curated by our dermatology partners will appear here soon."
                />
            </Section>

            <Section
                title="Upcoming Features"
                subtitle="Preview the roadmap for AI-powered skin health."
            >
                <EmptyState
                    icon="rocket"
                    message="AI-guided treatment plans and dermatologist teleconsults are coming soon."
                />
            </Section>
        </Screen>
    );
}


