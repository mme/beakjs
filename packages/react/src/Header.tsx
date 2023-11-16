import React from "react";
import { HeaderProps } from "./props";
import "../../css/Header.css";
import { useBeakThemeContext } from "./Theme";
import { useBeakContext } from "./Beak";

export const Header: React.FC<HeaderProps> = ({ setOpen }) => {
  const context = useBeakContext();
  const themeContext = useBeakThemeContext();

  return (
    <div className="beakHeader">
      <div>{context.labels.title}</div>
      <button onClick={() => setOpen(false)} aria-label="Close">
        {themeContext.icons.headerCloseIcon}
      </button>
    </div>
  );
};
