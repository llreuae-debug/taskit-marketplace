import React from 'react';
import Svg, { Path, Circle, Rect, G, Polygon } from 'react-native-svg';
import { COLORS } from '../../theme/tokens';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
  accent?: string;
}

/**
 * 1. Megaphone & Soundwaves Hero Illustration (Reference Style)
 */
export const MegaphoneIllustration: React.FC<IllustrationProps> = ({
  width = 160,
  height = 140,
  color = COLORS.ink.DEFAULT,
  accent = COLORS.lime.DEFAULT,
}) => (
  <Svg width={width} height={height} viewBox="0 0 160 140" fill="none">
    {/* Floating Orbit Rings */}
    <Circle cx="80" cy="70" r="55" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
    <Circle cx="80" cy="70" r="42" stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />

    {/* Sparkle Stars ✦ */}
    <Path d="M25 25 L28 15 L31 25 L41 28 L31 31 L28 41 L25 31 L15 28 Z" fill={accent} stroke={color} strokeWidth="1.2" />
    <Path d="M135 95 L137 88 L139 95 L146 97 L139 99 L137 106 L135 99 L128 97 Z" fill={accent} stroke={color} strokeWidth="1.2" />
    <Circle cx="125" cy="30" r="5" fill={color} />
    <Circle cx="35" cy="115" r="4" fill={accent} stroke={color} strokeWidth="1" />

    {/* Megaphone Cone */}
    <G transform="rotate(-15 75 70)">
      {/* Speaker Horn Lime Fill */}
      <Path
        d="M50 50 L95 28 L100 90 L50 72 Z"
        fill={accent}
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Front Speaker Opening Ring */}
      <Path
        d="M95 28 C102 28, 108 42, 108 59 C108 76, 102 90, 95 90 C88 90, 82 76, 82 59 C82 42, 88 28, 95 28 Z"
        fill="#FFFFFF"
        stroke={color}
        strokeWidth="2.5"
      />
      {/* Handle */}
      <Path
        d="M62 70 L65 98 L52 94 L50 68"
        fill="#FFFFFF"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Back Audio Cap */}
      <Rect x="40" y="53" width="12" height="17" rx="3" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />
    </G>

    {/* Sound Wave Pulses */}
    <Path d="M120 40 C130 50, 130 75, 120 85" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M132 30 C146 45, 146 85, 132 100" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

/**
 * 2. Playful Round Face Character with Floating Starbursts (CTA Band Style)
 */
export const FriendlyFaceIllustration: React.FC<IllustrationProps> = ({
  width = 120,
  height = 120,
  color = COLORS.ink.DEFAULT,
  accent = COLORS.lime.DEFAULT,
}) => (
  <Svg width={width} height={height} viewBox="0 0 120 120" fill="none">
    {/* Floating Starburst */}
    <Path d="M15 25 L19 12 L23 25 L36 29 L23 33 L19 46 L15 33 L2 29 Z" fill={accent} stroke={color} strokeWidth="1.2" />
    <Path d="M95 90 L98 80 L101 90 L111 93 L101 96 L98 106 L95 96 L85 93 Z" fill={accent} stroke={color} strokeWidth="1.2" />
    <Circle cx="100" cy="25" r="4" fill={color} />

    {/* Orbit lines */}
    <Path d="M30 60 C30 45, 90 45, 90 60 C90 75, 30 75, 30 60 Z" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />

    {/* Black Character Face */}
    <Circle cx="60" cy="60" r="34" fill={color} stroke={color} strokeWidth="2" />

    {/* Cute White Eyes */}
    <Circle cx="50" cy="56" r="5.5" fill="#FFFFFF" />
    <Circle cx="70" cy="56" r="5.5" fill="#FFFFFF" />
    <Circle cx="52" cy="54" r="2" fill={color} />
    <Circle cx="72" cy="54" r="2" fill={color} />

    {/* Playful Smiley Cheek Accents */}
    <Circle cx="44" cy="65" r="3" fill={accent} opacity="0.9" />
    <Circle cx="76" cy="65" r="3" fill={accent} opacity="0.9" />
  </Svg>
);

/**
 * 3. Delivery Scooter & Package
 */
export const DeliveryScooterIllustration: React.FC<IllustrationProps> = ({
  width = 150,
  height = 120,
  color = COLORS.ink.DEFAULT,
  accent = COLORS.lime.DEFAULT,
}) => (
  <Svg width={width} height={height} viewBox="0 0 150 120" fill="none">
    {/* Wheels */}
    <Circle cx="35" cy="90" r="18" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />
    <Circle cx="35" cy="90" r="8" fill={accent} stroke={color} strokeWidth="2" />
    <Circle cx="115" cy="90" r="18" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />
    <Circle cx="115" cy="90" r="8" fill={accent} stroke={color} strokeWidth="2" />

    {/* Chassis & Body */}
    <Path d="M35 90 L60 90 L85 75 L115 90" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <Path d="M60 90 L55 55 L75 55 L85 75" fill={accent} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />

    {/* Steering & Handle */}
    <Path d="M100 50 L112 85" stroke={color} strokeWidth="2.5" />
    <Path d="M92 48 L108 52" stroke={color} strokeWidth="3" strokeLinecap="round" />

    {/* Package Carrier Box */}
    <Rect x="25" y="42" width="28" height="26" rx="4" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />
    <Path d="M39 42 L39 68" stroke={accent} strokeWidth="2" />
    <Path d="M25 55 L53 55" stroke={accent} strokeWidth="2" />

    {/* Motion Dash Lines */}
    <Path d="M5 90 L12 90" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M8 82 L18 82" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 98 L20 98" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/**
 * 4. Car Parts Finder Illustration
 */
export const CarPartsIllustration: React.FC<IllustrationProps> = ({
  width = 140,
  height = 120,
  color = COLORS.ink.DEFAULT,
  accent = COLORS.lime.DEFAULT,
}) => (
  <Svg width={width} height={height} viewBox="0 0 140 120" fill="none">
    {/* Background Gear */}
    <G transform="translate(65, 55)">
      <Circle cx="0" cy="0" r="26" fill={accent} stroke={color} strokeWidth="2.5" />
      <Circle cx="0" cy="0" r="10" fill="#FFFFFF" stroke={color} strokeWidth="2" />
      {/* Gear Teeth */}
      {[-45, 0, 45, 90, 135, 180, 225, 270].map((deg) => (
        <Rect
          key={deg}
          x="-5"
          y="-32"
          width="10"
          height="8"
          rx="2"
          fill={color}
          transform={`rotate(${deg})`}
        />
      ))}
    </G>

    {/* Wrench Tool */}
    <G transform="rotate(35 60 60)">
      <Rect x="20" y="55" width="60" height="10" rx="3" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />
      <Circle cx="20" cy="60" r="12" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />
      <Rect x="10" y="56" width="12" height="8" rx="1" fill={accent} />
    </G>

    {/* Sparkle Accent */}
    <Path d="M110 20 L113 12 L116 20 L124 23 L116 26 L113 34 L110 26 L102 23 Z" fill={accent} stroke={color} strokeWidth="1" />
  </Svg>
);

/**
 * 5. Floating Sparkle Icon (Re-usable inline)
 */
export const SparkleIcon: React.FC<{ size?: number; color?: string; stroke?: string }> = ({
  size = 20,
  color = COLORS.lime.DEFAULT,
  stroke = COLORS.ink.DEFAULT,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
      fill={color}
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </Svg>
);
