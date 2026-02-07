import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useMatchHistory } from '../src/hooks/useStorage';
import { useHaptics } from '../src/hooks/useHaptics';
import { MatchRecord } from '../src/types/game';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

function MatchHistoryItem({ match, onPress }: { match: MatchRecord; onPress: () => void }) {
  const isVictory = match.result === 'victory';
  const dateStr = new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity
      style={itemStyles.item}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${isVictory ? 'Victory' : 'Defeat'}, ${dateStr}, ${match.gridSize}x${match.gridSize}, score ${match.score}`}
    >
      <View style={itemStyles.left}>
        <Text style={[itemStyles.result, isVictory ? itemStyles.win : itemStyles.loss]}>
          {isVictory ? 'W' : 'L'}
        </Text>
        <View>
          <Text style={itemStyles.date}>{dateStr}</Text>
          <Text style={itemStyles.grid}>{match.gridSize}x{match.gridSize}</Text>
        </View>
      </View>
      <Text style={[itemStyles.score, isVictory ? itemStyles.win : itemStyles.loss]}>
        {match.score}
      </Text>
    </TouchableOpacity>
  );
}

const itemStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 58, 95, 0.3)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  result: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  win: {
    color: COLORS.accent.gold,
  },
  loss: {
    color: COLORS.accent.fire,
  },
  date: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.primary,
  },
  grid: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  score: {
    fontFamily: FONTS.heading,
    fontSize: 18,
  },
});

export default function MatchHistoryScreen() {
  const router = useRouter();
  const { history } = useMatchHistory();
  const haptics = useHaptics();

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>MATCH HISTORY</Text>
          <View style={styles.divider} />
        </View>

        {history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>NO MATCHES YET</Text>
            <Text style={styles.emptySubtext}>Complete a battle to see your history</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={item => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <MatchHistoryItem
                match={item}
                onPress={() => {
                  haptics.light();
                  router.replace({ pathname: '/match-detail', params: { id: item.id } });
                }}
              />
            )}
          />
        )}

        <NavalButton
          title="BACK TO BASE"
          onPress={() => {
            haptics.light();
            router.replace('/menu');
          }}
          variant="secondary"
          style={{ marginTop: 'auto' }}
        />
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.text.accent,
    letterSpacing: 4,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  list: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  emptySubtext: {
    fontFamily: FONTS.bodyLight,
    fontSize: 13,
    color: COLORS.text.secondary,
    opacity: 0.6,
  },
});
