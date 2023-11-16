import React from "react";
import * as DefaultIcons from "./Icons";
import "../../css/Theme.css";

export type ColorScheme = "auto" | "light" | "dark";

export interface Icons {
  openIcon?: React.ReactNode;
  closeIcon?: React.ReactNode;
  headerCloseIcon?: React.ReactNode;
  sendIcon?: React.ReactNode;
  activityIcon?: React.ReactNode;
  spinnerIcon?: React.ReactNode;
}

interface ThemeContext {
  colorScheme: ColorScheme;
  icons: Required<Icons>;
}

export const ThemeContext = React.createContext<ThemeContext | undefined>(
  undefined
);

export function useBeakThemeContext(): ThemeContext {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      "Theme not found. Did you forget to wrap your app in a <Theme> component?"
    );
  }
  return context;
}

interface ThemeProps {
  colorScheme?: ColorScheme;
  icons?: Icons;
  children?: React.ReactNode;
}

export function Theme({
  colorScheme = "auto",
  icons,
  children,
}: ThemeProps): JSX.Element {
  const theme = React.useMemo(() => {
    return {
      colorScheme: colorScheme,
      icons: {
        ...{
          openIcon: DefaultIcons.OpenIcon,
          closeIcon: DefaultIcons.CloseIcon,
          headerCloseIcon: DefaultIcons.HeaderCloseIcon,
          sendIcon: DefaultIcons.SendIcon,
          activityIcon: DefaultIcons.ActivityIcon,
          spinnerIcon: DefaultIcons.SpinnerIcon,
        },
        ...icons,
      },
    };
  }, [colorScheme, icons]);

  return (
    <div
      className={`beakTheme beakColorScheme${
        colorScheme[0].toUpperCase() + colorScheme.slice(1)
      }`}
    >
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </div>
  );
}
