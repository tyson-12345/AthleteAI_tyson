// Design system: Volt (#C6FF3A) on Ink (#07090B) — Nike Run Club / Apple Fitness aesthetic
const VOLT = "#C6FF3A";
const INK  = "#07090B";

const shared = {
  volt: VOLT,
  ink:  INK,
  primary:           VOLT,
  primaryForeground: INK,
  tint:              VOLT,
  accent:            VOLT,
  accentForeground:  INK,
  radius: 14,
};

const colors = {
  // Dark mode (default brand identity — Volt on Ink)
  dark: {
    ...shared,
    text:            "#F5F5F5",
    background:      INK,
    foreground:      "#F5F5F5",
    card:            "#111316",
    cardForeground:  "#F5F5F5",
    surface1:        INK,
    surface2:        "#111316",
    surface3:        "#1A1D21",
    surface4:        "#22262D",
    muted:           "#1A1D21",
    secondary:           "#1A1D21",
    secondaryForeground: "#F5F5F5",
    mutedForeground:     "#6B7280",
    border:              "#FFFFFF0D",
    borderStrong:        "#FFFFFF18",
    input:               "#1A1D21",
    success:     "#22C55E",
    warning:     "#F59E0B",
    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",
    energy:      "#FF6B35",
    textPrimary:   "#F5F5F5",
    textSecondary: "#9CA3AF",
    textTertiary:  "#6B7280",
  },

  // Light mode — clean white with Volt accents
  light: {
    ...shared,
    text:            INK,
    background:      "#F7F8FA",
    foreground:      INK,
    card:            "#FFFFFF",
    cardForeground:  INK,
    surface1:        "#F7F8FA",
    surface2:        "#EDEEF3",
    surface3:        "#E2E3E9",
    surface4:        "#D6D7DE",
    muted:           "#E2E3E9",
    secondary:           "#EDEEF3",
    secondaryForeground: INK,
    mutedForeground:     "#5C6470",
    border:              "rgba(7,9,11,0.1)",
    borderStrong:        "rgba(7,9,11,0.18)",
    input:               "#EDEEF3",
    success:     "#16A34A",
    warning:     "#D97706",
    destructive: "#DC2626",
    destructiveForeground: "#FFFFFF",
    energy:      "#EA580C",
    textPrimary:   INK,
    textSecondary: "#5C6470",
    textTertiary:  "#9CA3AF",
  },

  radius: 14,
};

export type ColorScheme = typeof colors.dark;
export default colors;
