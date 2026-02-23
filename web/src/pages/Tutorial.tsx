import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/UI/PageShell';
import { MiniGrid, MiniCell } from '../components/Tutorial/MiniGrid';
// MiniCell is now exported from MiniGrid
import { ShipShape } from '../components/Tutorial/ShipShape';
import { useGame } from '../game/translator';
import { useHaptics } from '../hooks/useHaptics';
import { getShipDefinitionsForRank, RANK_PROGRESSION } from '../shared/constants';
import { getLevelInfo } from '../stats/interactor';
import { setTutorialSeen } from '../settings/interactor';
import { ShipDefinition } from '../shared/entities';
import { COLORS, FONTS, SPACING } from '../shared/theme';

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <MiniGrid cells={[
            ['water','water','water','water','water','water'],
            ['water','ship','ship','water','water','water'],
            ['water','water','water','water','water','water'],
            ['water','water','water','ship','ship','ship'],
            ['water','water','water','water','water','water'],
            ['water','ship','ship','water','water','water'],
          ]} />
          <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>
            {t('tutorial.fleet')}
          </span>
        </div>
      ),
    },
    {
      id: '2',
      title: t('tutorial.yourFleet'),
      description: t('tutorial.fleetDesc', { shipCount }),
      illustration: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {shipDefs.map((ship, i) => (
            <ShipShape key={`${ship.id}-${i}`} length={ship.size} label={ship.name} />
          ))}
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: FONTS.bodyLight, fontSize: 13, color: COLORS.text.secondary }}>{t('tutorial.totalCells', { totalCells })}</span>
          </div>
        </div>
      ),
    },
    {
      id: '3',
      title: t('tutorial.shot'),
      description: t('tutorial.shotDesc'),
      illustration: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <MiniGrid cells={[
            ['empty','empty','miss','empty','empty','empty'],
            ['empty','empty','empty','empty','hit','empty'],
            ['miss','empty','empty','empty','hit','empty'],
            ['empty','empty','miss','empty','empty','empty'],
            ['empty','empty','empty','empty','empty','miss'],
            ['empty','miss','empty','empty','empty','empty'],
          ]} />
          <div style={{ display: 'flex', flexDirection: 'row', gap: 20, marginTop: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MiniCell type="hit" size={16} />
              <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.hit')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MiniCell type="miss" size={16} />
              <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.miss')}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: '4',
      title: t('tutorial.sink'),
      description: t('tutorial.sinkDesc', { shipCount }),
      illustration: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <MiniGrid cells={[
            ['empty','miss','empty','empty','miss','empty'],
            ['empty','empty','empty','empty','sunk','empty'],
            ['miss','empty','hit','empty','sunk','empty'],
            ['empty','empty','hit','empty','sunk','empty'],
            ['empty','empty','empty','empty','empty','miss'],
            ['empty','miss','empty','empty','empty','empty'],
          ]} />
          <div style={{ display: 'flex', flexDirection: 'row', gap: 20, marginTop: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MiniCell type="hit" size={16} />
              <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.damaged')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MiniCell type="sunk" size={16} />
              <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.sunk')}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: '5',
      title: t('tutorial.placement'),
      description: t('tutorial.placementDesc'),
      illustration: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <MiniGrid cells={[
            ['empty','empty','empty','empty','empty','empty'],
            ['empty','ship','ship','ship','empty','empty'],
            ['empty','empty','empty','empty','empty','empty'],
            ['empty','empty','empty','empty','ship','empty'],
            ['empty','empty','empty','empty','ship','empty'],
            ['empty','empty','empty','empty','empty','empty'],
          ]} />
          <div style={{ display: 'flex', flexDirection: 'row', gap: 24, marginTop: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.secondary }}>{'<->'}</span>
              <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.placementH')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.secondary }}>{'|'}</span>
              <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>{t('tutorial.placementV')}</span>
            </div>
          </div>
          <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.accent, letterSpacing: 1 }}>
            {t('tutorial.placementAuto')}
          </span>
        </div>
      ),
    },
    {
      id: '6',
      title: t('tutorial.scoring'),
      description: t('tutorial.scoringDesc'),
      illustration: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', paddingLeft: 16, paddingRight: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent.fire, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#fff' }}>{'+'}</span>
              </div>
              <span style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.primary }}>{t('tutorial.accuracyBonus')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent.gold, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#fff' }}>{'*'}</span>
              </div>
              <span style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.primary }}>{t('tutorial.speedBonus')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent.victory, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#fff' }}>{'*'}</span>
              </div>
              <span style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.primary }}>{t('tutorial.perfectKill')}</span>
            </div>
          </div>
          <span style={{ fontFamily: FONTS.bodyLight, fontSize: 11, color: COLORS.text.secondary, textAlign: 'center', marginTop: 4 }}>
            {t('tutorial.diffMultiplier')}
          </span>
        </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            {keyRanks.map((rc, i) => (
              <div key={rc.rank} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {i > 0 && (
                  <div style={{ width: 2, height: 16, backgroundColor: COLORS.accent.gold, opacity: 0.4 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingBottom: 6, paddingLeft: 16, paddingRight: 16, borderRadius: 8, backgroundColor: i === 2 ? COLORS.overlay.goldGlow : 'transparent' }}>
                  <span style={{ fontFamily: FONTS.heading, fontSize: 12, color: i === 2 ? COLORS.accent.gold : COLORS.text.primary, width: 100 }}>
                    {t(`ranks.${rc.rank}`)}
                  </span>
                  <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>
                    {t('tutorial.rankGrid', { gridSize: rc.gridSize })}
                  </span>
                  <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>
                    {'|'}
                  </span>
                  <span style={{ fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary }}>
                    {rc.ships.length} {rc.ships.length === 1 ? 'ship' : t('rankList.ships', { count: rc.ships.length }).replace(/^\d+\s*/, '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      })(),
    },
    {
      id: '8',
      title: t('tutorial.ready'),
      description: t('tutorial.readyDesc'),
      illustration: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 64 }}>{'??????'}</span>
          <span style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.accent, letterSpacing: 2 }}>
            {t('tutorial.deploy')}
          </span>
        </div>
      ),
    },
  ];
}

export default function Tutorial() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const { state } = useGame();
  const [activeIndex, setActiveIndex] = useState(0);

  const level = getLevelInfo(state.stats.totalXP);
  const shipDefs = getShipDefinitionsForRank(level.rank);
  const slides = useMemo(() => buildSlides(state.settings.gridSize, shipDefs, t), [state.settings.gridSize, level.rank, t]);

  const isFirst = activeIndex === 0;
  const isLast = activeIndex === slides.length - 1;

  const goToPlacement = useCallback(() => {
    haptics.light();
    setTutorialSeen(true);
    navigate('/placement', { replace: true });
  }, [haptics, navigate]);

  const handleBack = useCallback(() => {
    if (isFirst) return;
    haptics.light();
    setActiveIndex(i => i - 1);
  }, [isFirst, haptics]);

  const handleNext = useCallback(() => {
    haptics.light();
    if (isLast) {
      setTutorialSeen(true);
      navigate('/placement', { replace: true });
    } else {
      setActiveIndex(i => i + 1);
    }
  }, [isLast, haptics, navigate]);

  const currentSlide = slides[activeIndex];

  return (
    <PageShell hideHeader contentStyle={{ padding: 0 }}>
      <div style={styles.slide}>
        <span style={styles.slideTitle}>{currentSlide.title}</span>
        <div style={styles.illustrationContainer}>
          {currentSlide.illustration}
        </div>
        <span style={styles.slideDescription}>{currentSlide.description}</span>
      </div>

      <div style={styles.footer}>
        <div style={styles.navRow}>
          <button
            onClick={handleBack}
            style={styles.navButton}
            disabled={isFirst}
            aria-label="Previous slide"
          >
            <span style={{ ...styles.navText, ...(isFirst ? styles.navTextHidden : {}) }}>{t('tutorial.back')}</span>
          </button>

          <div style={styles.pagination}>
            {slides.map((_, i) => (
              <div
                key={i}
                style={{ ...styles.dot, ...(i === activeIndex ? styles.dotActive : styles.dotInactive) }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            style={styles.navButton}
            aria-label={isLast ? 'Start battle' : 'Next slide'}
          >
            <span style={{ ...styles.navText, ...styles.navTextPrimary }}>
              {isLast ? t('tutorial.start') : t('tutorial.next')}
            </span>
          </button>
        </div>

        <button
          onClick={goToPlacement}
          style={styles.skipButton}
          aria-label="Skip tutorial"
        >
          <span style={styles.skipText}>{t('tutorial.skip')}</span>
        </button>
      </div>
    </PageShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  slide: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.lg,
    paddingTop: SPACING.xxl,
    alignItems: 'center',
    flex: 1,
  },
  slideTitle: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: '34px',
  },
  illustrationContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    minHeight: 180,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideDescription: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: '24px',
    paddingLeft: SPACING.md,
    paddingRight: SPACING.md,
  },
  footer: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.lg,
    paddingBottom: SPACING.lg,
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.md,
    alignItems: 'center',
  },
  navRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navButton: {
    width: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 8,
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
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotActive: {
    backgroundColor: COLORS.accent.gold,
  },
  dotInactive: {
    backgroundColor: COLORS.overlay.secondaryFade,
  },
  skipButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  skipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    opacity: 0.6,
  },
};
