import React, { useRef, useState } from 'react';
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
import NavalButton from '../src/components/UI/NavalButton';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialSlide {
  id: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
}

// --- Mini grid illustrations rendered with Views ---

function MiniCell({ type, size = 18 }: { type: 'empty' | 'ship' | 'hit' | 'miss' | 'sunk' | 'water'; size?: number }) {
  const colors: Record<string, string> = {
    empty: 'rgba(30, 58, 95, 0.3)',
    ship: COLORS.grid.ship,
    hit: COLORS.accent.fire,
    miss: COLORS.cell.miss,
    sunk: COLORS.cell.sunk,
    water: 'rgba(30, 58, 95, 0.15)',
  };
  const borderColors: Record<string, string> = {
    empty: COLORS.grid.border,
    ship: COLORS.grid.shipLight,
    hit: COLORS.accent.fireDark,
    miss: '#3d4758',
    sunk: COLORS.accent.fireDark,
    water: 'rgba(30, 58, 95, 0.3)',
  };
  return (
    <View style={{
      width: size,
      height: size,
      backgroundColor: colors[type],
      borderWidth: 1,
      borderColor: borderColors[type],
      borderRadius: type === 'hit' || type === 'miss' ? 2 : 0,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {type === 'hit' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff6b6b' }} />}
      {type === 'miss' && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#64748b', opacity: 0.7 }} />}
      {type === 'sunk' && <View style={{ width: 10, height: 10, backgroundColor: '#991b1b', transform: [{ rotate: '45deg' }] }} />}
    </View>
  );
}

function MiniGrid({ cells }: { cells: ('empty' | 'ship' | 'hit' | 'miss' | 'sunk' | 'water')[][] }) {
  return (
    <View style={gridStyles.container}>
      {cells.map((row, ri) => (
        <View key={ri} style={gridStyles.row}>
          {row.map((cell, ci) => (
            <MiniCell key={`${ri}-${ci}`} type={cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});

// --- Ship shape illustration ---

function ShipShape({ length, label }: { length: number; label: string }) {
  return (
    <View style={shipStyles.row}>
      <View style={shipStyles.cells}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={[
            shipStyles.cell,
            i === 0 && shipStyles.cellFirst,
            i === length - 1 && shipStyles.cellLast,
          ]} />
        ))}
      </View>
      <Text style={shipStyles.label}>{label}</Text>
    </View>
  );
}

const shipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cells: {
    flexDirection: 'row',
    gap: 2,
  },
  cell: {
    width: 22,
    height: 22,
    backgroundColor: COLORS.grid.ship,
    borderWidth: 1,
    borderColor: COLORS.grid.shipLight,
  },
  cellFirst: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  cellLast: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.secondary,
  },
});

// --- Slide data ---

const SLIDES: TutorialSlide[] = [
  {
    id: '1',
    title: 'How to Play\nBattleship',
    description: 'Sink all enemy ships before they sink yours. Each player has a hidden fleet on a 6x6 grid.',
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
    description: 'You command 3 ships. Place them horizontally or vertically on your grid before battle begins.',
    illustration: (
      <View style={{ alignItems: 'center', gap: 14 }}>
        <ShipShape length={2} label="Patrol Boat" />
        <ShipShape length={2} label="Patrol Boat" />
        <ShipShape length={3} label="Destroyer" />
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: FONTS.body, fontSize: 22, color: COLORS.text.accent }}>7</Text>
          <Text style={{ fontFamily: FONTS.bodyLight, fontSize: 13, color: COLORS.text.secondary }}>total cells to find</Text>
        </View>
      </View>
    ),
  },
  {
    id: '3',
    title: 'Take Your Shot',
    description: 'Tap a cell on the enemy grid to fire. You will see a hit (fire) or a miss (gray dot). Then the enemy fires back.',
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
    description: 'When every cell of a ship is hit, it sinks! The ship turns dark red. Sink all 3 ships to win.',
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

export default function TutorialScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLast = activeIndex === SLIDES.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    haptics.light();
    if (isLast) {
      router.replace('/placement');
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const handleSkip = () => {
    haptics.light();
    router.replace('/placement');
  };

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { haptics.light(); router.replace('/menu'); }} hitSlop={16}>
            <Text style={styles.backText}>{'< MENU'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} hitSlop={16}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Carousel */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
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

        {/* Pagination + Button */}
        <View style={styles.footer}>
          <View style={styles.pagination}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
          <NavalButton
            title={isLast ? 'START BATTLE' : 'NEXT'}
            onPress={handleNext}
          />
        </View>
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 58, 95, 0.4)',
  },
  backText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.accent.gold,
  },
  skipText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.accent.gold,
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
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
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
});
