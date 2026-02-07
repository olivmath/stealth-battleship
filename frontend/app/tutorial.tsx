import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import { MiniGrid, MiniCell } from '../src/components/Tutorial/MiniGrid';
import { ShipShape } from '../src/components/Tutorial/ShipShape';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { getShipDefinitions } from '../src/constants/game';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialSlide {
  id: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
}

function buildSlides(gridSize: 6 | 10): TutorialSlide[] {
  const shipDefs = getShipDefinitions(gridSize);
  const totalCells = shipDefs.reduce((sum, s) => sum + s.size, 0);
  const shipCount = shipDefs.length;

  return [
    {
      id: '1',
      title: 'How to Play\nBattleship',
      description: `Sink all enemy ships before they sink yours. Each player has a hidden fleet on a ${gridSize}x${gridSize} grid.`,
      illustration: (
        <View style={{ alignItems: 'center', gap: 16 }}>
          <MiniGrid cells={[
            ['water','water','water','water','water','water'],
            ['water','ship','ship','water','water','water'],
            ['water','water','water','water','water','water'],
            ['water','water','water','ship','ship','ship'],
            ['water','water','water','water','water','water'],
            ['water','ship','ship','water','water','water'],
          ]} />
          <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>
            Hidden fleet on your grid
          </Text>
        </View>
      ),
    },
    {
      id: '2',
      title: 'Your Fleet',
      description: `You command ${shipCount} ships. Place them horizontally or vertically on your grid before battle begins.`,
      illustration: (
        <View style={{ alignItems: 'center', gap: 14 }}>
          {shipDefs.map((ship, i) => (
            <ShipShape key={`${ship.id}-${i}`} length={ship.size} label={ship.name} />
          ))}
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: FONTS.body, fontSize: 22, color: COLORS.text.accent }}>{totalCells}</Text>
            <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 13, color: COLORS.text.secondary }}>total cells to find</Text>
          </View>
        </View>
      ),
    },
    {
      id: '3',
      title: 'Take Your Shot',
      description: 'Tap a cell on the enemy grid to fire. You will see a hit (fire) or a miss (blue dot). Then the enemy fires back.',
      illustration: (
        <View style={{ alignItems: 'center', gap: 12 }}>
          <MiniGrid cells={[
            ['empty','empty','miss','empty','empty','empty'],
            ['empty','empty','empty','empty','hit','empty'],
            ['miss','empty','empty','empty','hit','empty'],
            ['empty','empty','miss','empty','empty','empty'],
            ['empty','empty','empty','empty','empty','miss'],
            ['empty','miss','empty','empty','empty','empty'],
          ]} />
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MiniCell type="hit" size={16} />
              <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>Hit</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MiniCell type="miss" size={16} />
              <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>Miss</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: '4',
      title: 'Sink the Ship',
      description: `When every cell of a ship is hit, it sinks! The ship turns dark red. Sink all ${shipCount} ships to win.`,
      illustration: (
        <View style={{ alignItems: 'center', gap: 12 }}>
          <MiniGrid cells={[
            ['empty','miss','empty','empty','miss','empty'],
            ['empty','empty','empty','empty','sunk','empty'],
            ['miss','empty','hit','empty','sunk','empty'],
            ['empty','empty','hit','empty','sunk','empty'],
            ['empty','empty','empty','empty','empty','miss'],
            ['empty','miss','empty','empty','empty','empty'],
          ]} />
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MiniCell type="hit" size={16} />
              <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>Damaged</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MiniCell type="sunk" size={16} />
              <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>Sunk</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: '5',
      title: 'Ready,\nCommander?',
      description: 'Place your fleet strategically. Spread your ships to make them harder to find. Good luck!',
      illustration: (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 64 }}>{'??????'}</Text>
          <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.accent, letterSpacing: 2 }}>
            DEPLOY YOUR FLEET
          </Text>
        </View>
      ),
    },
  ];
}

export default function TutorialScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const { state } = useGame();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = useMemo(() => buildSlides(state.settings.gridSize), [state.settings.gridSize]);

  const isFirst = activeIndex === 0;
  const isLast = activeIndex === slides.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToPlacement = useCallback(() => {
    haptics.light();
    router.replace('/placement');
  }, [haptics, router]);

  const handleBack = useCallback(() => {
    if (isFirst) return;
    haptics.light();
    flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
  }, [isFirst, activeIndex, haptics]);

  const handleNext = useCallback(() => {
    haptics.light();
    if (isLast) {
      router.replace('/placement');
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  }, [isLast, activeIndex, haptics, router]);

  const renderSlide = ({ item }: { item: TutorialSlide }) => (
    <View style={styles.slide}>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <View style={styles.illustrationContainer}>
        {item.illustration}
      </View>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );

  return (
    <GradientContainer>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        <View style={styles.footer}>
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.navButton}
              disabled={isFirst}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Previous slide"
              accessibilityState={{ disabled: isFirst }}
            >
              <Text style={[styles.navText, isFirst && styles.navTextHidden]}>BACK</Text>
            </TouchableOpacity>

            <View style={styles.pagination}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleNext}
              style={styles.navButton}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Start battle' : 'Next slide'}
            >
              <Text style={[styles.navText, styles.navTextPrimary]}>
                {isLast ? 'START' : 'NEXT'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={goToPlacement}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip tutorial"
          >
            <Text style={styles.skipText}>SKIP TUTORIAL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    alignItems: 'center',
  },
  slideTitle: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 34,
  },
  illustrationContainer: {
    marginVertical: SPACING.xl,
    minHeight: 180,
    justifyContent: 'center',
  },
  slideDescription: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    marginTop: 'auto',
    gap: SPACING.md,
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navButton: {
    width: 64,
    alignItems: 'center',
  },
  navText: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  navTextPrimary: {
    color: COLORS.accent.gold,
  },
  navTextHidden: {
    opacity: 0,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: COLORS.accent.gold,
  },
  dotInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  skipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
});
