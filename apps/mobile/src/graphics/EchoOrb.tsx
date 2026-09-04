import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';

interface EchoOrbProps {
  isRecording?: boolean;
  isProcessing?: boolean;
  size?: number;
}

export const EchoOrb: React.FC<EchoOrbProps> = ({
  isRecording = false,
  isProcessing = false,
  size = 180
}) => {
  const [pulse, setPulse] = useState(1);

  useEffect(() => {
    let interval: any;
    if (isRecording || isProcessing) {
      interval = setInterval(() => {
        setPulse(p => (p === 1 ? 1.04 : 1));
      }, 2400); // Much slower, majestic pulsation
    } else {
      setPulse(1);
    }
    return () => clearInterval(interval);
  }, [isRecording, isProcessing]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Subtle Ripple Aura */}
      <View
        style={[
          styles.outerAura,
          {
            width: size * pulse,
            height: size * pulse,
            borderRadius: (size * pulse) / 2,
            backgroundColor: 'rgba(212, 175, 55, 0.08)'
          }
        ]}
      />
      {/* Pure Geometric Core Orb - Zero Text, Pure Form & Subtle Border */}
      <View
        style={[
          styles.coreOrb,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
            borderColor: LuxuryTheme.accent.gold,
            backgroundColor: 'rgba(212, 175, 55, 0.12)'
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  outerAura: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  coreOrb: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LuxuryTheme.background.surfaceElevated,
    borderWidth: 2,
    shadowColor: LuxuryTheme.accent.auraGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10
  },
  echoIcon: {
    color: LuxuryTheme.text.primary,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 2
  }
});
