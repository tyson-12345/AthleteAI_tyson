import colors from "@/constants/colors";
import { useTheme } from "@/lib/themeContext";

export function useColors() {
  const { theme } = useTheme();
  return { ...(theme === "dark" ? colors.dark : colors.light), radius: colors.radius };
}
