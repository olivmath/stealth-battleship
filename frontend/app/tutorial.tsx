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
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import { MiniGrid, MiniCell } from '../src/components/Tutorial/MiniGrid';
import { ShipShape } from '../src/components/Tutorial/ShipShape';
import { useGame } from '../src/game/translator';
import { useHaptics } from '../src/hooks/useHaptics';
import { getShipDefinitionsForRank, RANK_PROGRESSION } from '../src/shared/constants';
import { getLevelInfo } from '../src/stats/interactor';
import { setTutorialSeen } from '../src/settings/interactor';
import { ShipDefinition } from '../src/shared/entities';
import { COLORS, FONTS, SPACING } from '../src/shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialSlide {
  id: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
}

function buildSlides(gridSize: number, shipDefs: ShipDefinition[], t: (key: string, opts?: any) => string): TutorialSlide[] {
  const totalCells = shipDefs.reduce((sum, s) => sum + s.size, 0);
  const shipCount = shipDefs.length;

  return [
    {
      id: '1',
      title: t('tutorial.title'),
      description: t('tutorial.intro', { gridSize }),
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
            {t('tutorial.fleet')}
          </Text>
        </View>
      ),
    },
    {
      id: '2',
      title: t('tutorial.yourFleet'),
      description: t('tutorial.fleetDesc', { shipCount }),
      illustration: (
        <View style={{ alignItems: 'center', gap: 14 }}>
          {shipDefs.map((ship, i) => (
            <ShipShape key={`${ship.id}-${i}`} length={ship.size} label={ship.name} />
          ))}
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 13, color: COLORS.text.secondary }}>{t('tutorial.totalCells', { totalCells })}</Text>
          </View>
        </View>
      ),
    },
    {
      id: '3',
      title: t('tutorial.shot'),
      description: t('tutorial.shotDesc'),
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
              <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.hit')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MiniCell type="miss" size={16} />
              <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.miss')}</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: '4',
      title: t('tutorial.sink'),
      description: t('tutorial.sinkDesc', { shipCount }),
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
              <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.damaged')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MiniCell type="sunk" size={16} />
              <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.sunk')}</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: '5',
      title: t('tutorial.placement'),
      description: t('tutorial.placementDesc'),
      illustration: (
        <View style={{ alignItems: 'center', gap: 12 }}>
          <MiniGrid cells={[
            ['empty','empty','empty','empty','empty','empty'],
            ['empty','ship','ship','ship','empty','empty'],
            ['empty','empty','empty','empty','empty','empty'],
            ['empty','empty','empty','empty','ship','empty'],
            ['empty','empty','empty','empty','ship','empty'],
            ['empty','empty','empty','empty','empty','empty'],
          ]} />
          <View style={{ flexDirection: 'row', gap: 24, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.secondary }}>{'↔'}</Text>
              <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.placementH')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.secondary }}>{'↕'}</Text>
              <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.placementV')}</Text>
            </View>
          </View>
          <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.accent, letterSpacing: 1 }}>
            {t('tutorial.placementAuto')}
          </Text>
        </View>
      ),
    },
    {
      id: '6',
      title: t('tutorial.scoring'),
      description: t('tutorial.scoringDesc'),
      illustration: (
        <View style={{ alignItems: 'center', gap: 14 }}>
          <View style={{ gap: 12, width: '100%', paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent.fire, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#fff' }}>{'+'}</Text>
              </View>
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.primary }}>{t('tutorial.accuracyBonus')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent.gold, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#fff' }}>{'⚡'}</Text>
              </View>
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.primary }}>{t('tutorial.speedBonus')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent.victory, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#fff' }}>{'★'}</Text>
              </View>
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.primary }}>{t('tutorial.perfectKill')}</Text>
            </View>
          </View>
          <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 11, color: COLORS.text.secondary, textAlign: 'center', marginTop: 4 }}>
            {t('tutorial.diffMultiplier')}
          </Text>
        </View>
      ),
    },
    {
      id: '7',
      title: t('tutorial.ranks'),
      description: t('tutorial.ranksDesc'),
      illustration: (() => {
        const keyRanks = [
          RANK_PROGRESSION[0],
          RANK_PROGRESSION[2],
          RANK_PROGRESSION[5],
        ];
        return (
          <View style={{ alignItems: 'center', gap: 0 }}>
            {keyRanks.map((rc, i) => (
              <View key={rc.rank} style={{ alignItems: 'center' }}>
                {i > 0 && (
                  <View style={{ width: 2, height: 16, backgroundColor: COLORS.accent.gold, opacity: 0.4 }} />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: i === 2 ? COLORS.overlay.goldGlow : 'transparent' }}>
                  <Text style={{ fontFamily: FONTS.heading, fontSize: 12, color: i === 2 ? COLORS.accent.gold : COLORS.text.primary, width: 100 }}>
                    {t(`ranks.${rc.rank}`)}
                  </Text>
                  <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>
                    {t('tutorial.rankGrid', { gridSize: rc.gridSize })}
                  </Text>
                  <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>
                    {'|'}
                  </Text>
                  <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>
                    {rc.ships.length} {rc.ships.length === 1 ? 'ship' : t('rankList.ships', { count: rc.ships.length }).replace(/^\d+\s*/, '')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        );
      })(),
    },
    {
      id: '8',
      title: t('tutorial.ready'),
      description: t('tutorial.readyDesc'),
      illustration: (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 64 }}>{'??????'}</Text>
          <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.accent, letterSpacing: 2 }}>
            {t('tutorial.deploy')}
          </Text>
        </View>
      ),
    },
  ];
}

export default function TutorialScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const { state } = useGame();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const level = getLevelInfo(state.stats.totalXP);
  const shipDefs = getShipDefinitionsForRank(level.rank);
  const slides = useMemo(() => buildSlides(state.settings.gridSize, shipDefs, t), [state.settings.gridSize, level.rank, t]);

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
    setTutorialSeen(true);
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
      setTutorialSeen(true);
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
              <Text style={[styles.navText, isFirst && styles.navTextHidden]}>{t('tutorial.back')}</Text>
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
                {isLast ? t('tutorial.start') : t('tutorial.next')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={goToPlacement}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip tutorial"
          >
            <Text style={styles.skipText}>{t('tutorial.skip')}</Text>
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotActive: {
    backgroundColor: COLORS.accent.gold,
  },
  dotInactive: {
    backgroundColor: COLORS.overlay.secondaryFade,
  },
  skipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
});
