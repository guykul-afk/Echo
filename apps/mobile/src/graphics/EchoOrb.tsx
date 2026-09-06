import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';

interface EchoOrbProps {
  isRecording?: boolean;
  isProcessing?: boolean;
  size?: number;
  audioLevel?: number; // 0.0 to 1.0
}

export const EchoOrb: React.FC<EchoOrbProps> = ({
  isRecording = false,
  isProcessing = false,
  size = 220,
  audioLevel = 0
}) => {
  const canvasRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const smoothedAudioRef = useRef<number>(0);
  const animTimeRef = useRef<number>(0);
  const yawRotRef = useRef<number>(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    // Mathematical constants from Specification Section 4
    const N_SLICES = 32;          // 32 latitude slices
    const M_POINTS = 140;         // points per ring
    const BASE_R = (size / 2) * 0.72; // virtual sphere radius R
    const TILT_ANGLE = 0.38;      // 22 degrees perspective pitch
    const ROT_SPEED = 0.018;      // ~0.018 rad/frame
    const LERP_ALPHA = 0.12;      // smoothing factor alpha = 0.12
    const STROKE_WIDTH = 1.2;     // 1.2px stroke
    const GOLD_RGB = '212, 175, 55'; // pure monochrome #D4AF37

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      animTimeRef.current += 0.024;
      yawRotRef.current += ROT_SPEED;

      // Determine target audio level
      let targetAudio = isRecording ? (audioLevel > 0 ? audioLevel : 0.45 + 0.3 * Math.sin(animTimeRef.current * 7)) : 0;
      smoothedAudioRef.current += (targetAudio - smoothedAudioRef.current) * LERP_ALPHA;

      const animTime = animTimeRef.current;
      const smoothed = smoothedAudioRef.current;
      const yaw = yawRotRef.current;
      const cosTilt = Math.cos(TILT_ANGLE);
      const sinTilt = Math.sin(TILT_ANGLE);

      for (let i = 0; i < N_SLICES; i++) {
        const yi = BASE_R * ((2 * i) / (N_SLICES - 1) - 1);
        const rBase = Math.sqrt(Math.max(0, BASE_R * BASE_R - yi * yi));
        if (rBase < 0.8) continue;

        const SEGMENTS = 14;
        const ptsPerSeg = Math.floor(M_POINTS / SEGMENTS);

        for (let s = 0; s < SEGMENTS; s++) {
          const segPoints: { x: number; y: number; z: number }[] = [];
          let sumZ = 0;

          for (let p = 0; p <= ptsPerSeg; p++) {
            const ptIdx = (s * ptsPerSeg + p) % M_POINTS;
            const theta = (ptIdx / M_POINTS) * Math.PI * 2;

            // Idle equation
            const D_idle = 0.04 * Math.sin(3 * theta + 0.8 * animTime) * Math.cos((2 * yi) / BASE_R + 0.5 * animTime);

            // Voice-reactive equation
            let D_voice = 0;
            if (smoothed > 0.002) {
              const m = 4;
              let harmonicSum = 0;
              for (let k = 1; k <= 3; k++) {
                const phi_k = k * 1.35 * animTime;
                harmonicSum += (1.0 / k) * Math.sin(k * m * theta + phi_k) * Math.cos((k * Math.PI * yi) / BASE_R);
              }
              D_voice = (smoothed * 0.38) * harmonicSum;
            }

            const rEff = rBase * (1 + D_idle + D_voice);
            const thetaRot = theta + yaw;
            const x1 = rEff * Math.cos(thetaRot);
            const y1 = yi;
            const z1 = rEff * Math.sin(thetaRot);

            const x2 = x1;
            const y2 = y1 * cosTilt - z1 * sinTilt;
            const z2 = y1 * sinTilt + z1 * cosTilt;

            segPoints.push({ x: cx + x2, y: cy + y2, z: z2 });
            sumZ += z2;
          }

          const avgZ = sumZ / segPoints.length;
          const normZ = Math.max(0, Math.min(1, (avgZ + BASE_R) / (2 * BASE_R)));
          const alpha = 0.28 + 0.72 * normZ;

          ctx.beginPath();
          ctx.moveTo(segPoints[0].x, segPoints[0].y);
          for (let k = 1; k < segPoints.length; k++) {
            ctx.lineTo(segPoints[k].x, segPoints[k].y);
          }
          ctx.strokeStyle = `rgba(${GOLD_RGB}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = STROKE_WIDTH;
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isRecording, audioLevel, size]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{ pointerEvents: 'none' } as any}
        />
      </View>
    );
  }

  // Native fallback
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.outerAura,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'rgba(212, 175, 55, 0.08)'
          }
        ]}
      />
      <View
        style={[
          styles.coreOrb,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
            borderColor: LuxuryTheme.accent.gold,
            borderWidth: 1.2
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  outerAura: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.08)'
  },
  coreOrb: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.2
  }
});
