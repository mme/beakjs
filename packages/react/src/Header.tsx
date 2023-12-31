import React from "react";
import { HeaderProps } from "./props";
import "../../css/Header.css";
import { useBeakContext } from "./Beak";

export const Header: React.FC<HeaderProps> = ({ setOpen }) => {
  const context = useBeakContext();

  return (
    <div className="beakHeader">
      <div>{context.labels.title}</div>
      <button onClick={() => setOpen(false)} aria-label="Close">
        {context.icons.headerCloseIcon}
      </button>
    </div>
  );
};
