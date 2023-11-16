import React, { useCallback, useEffect } from "react";
import { WindowProps } from "./props";
import "../../css/Window.css";

export const Window = ({
  open,
  setOpen,
  children,
  clickOutsideToClose,
  hotkey,
  hitEscapeToClose,
}: WindowProps) => {
  const windowRef = React.useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!clickOutsideToClose) {
        return;
      }

      const parentElement = windowRef.current?.parentElement;

      if (
        open &&
        parentElement &&
        !parentElement.contains(event.target as any)
      ) {
        setOpen(false);
      }
    },
    [clickOutsideToClose, open, setOpen]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      const isDescendantOfWrapper = windowRef.current?.contains(target);

      if (
        open &&
        event.key === "Escape" &&
        (!isInput || isDescendantOfWrapper) &&
        hitEscapeToClose
      ) {
        setOpen(false);
      } else if (
        event.key === hotkey &&
        ((isMacOS() && event.metaKey) || (!isMacOS() && event.ctrlKey)) &&
        (!isInput || isDescendantOfWrapper)
      ) {
        setOpen(!open);
      }
    },
    [hitEscapeToClose, hotkey, open, setOpen]
  );

  const adjustForMobile = useCallback(() => {
    const beakWindow = windowRef.current;
    const vv = window.visualViewport;
    if (!beakWindow || !vv) {
      return;
    }

    if (window.innerWidth < 640 && open) {
      beakWindow.style.height = `${vv.height}px`;
      beakWindow.style.left = `${vv.offsetLeft}px`;
      beakWindow.style.top = `${vv.offsetTop}px`;

      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = `${window.innerHeight}px`;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      // Prevent scrolling on iOS
      document.body.addEventListener("touchmove", preventScroll, {
        passive: false,
      });
    } else {
      beakWindow.style.height = "";
      beakWindow.style.left = "";
      beakWindow.style.top = "";
      document.body.style.position = "";
      document.body.style.height = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.body.style.top = "";
      document.body.style.touchAction = "";

      document.body.removeEventListener("touchmove", preventScroll);
    }
  }, [open]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", adjustForMobile);
      adjustForMobile();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", adjustForMobile);
      }
    };
  }, [adjustForMobile, handleClickOutside, handleKeyDown]);

  return (
    <div className={`beakWindow${open ? " open" : ""}`} ref={windowRef}>
      {open && children}
    </div>
  );
};

const preventScroll = (event: TouchEvent): void => {
  let targetElement = event.target as Element;

  // Function to check if the target has the parent with a given class
  const hasParentWithClass = (element: Element, className: string): boolean => {
    while (element && element !== document.body) {
      if (element.classList.contains(className)) {
        return true;
      }
      element = element.parentElement!;
    }
    return false;
  };

  // Check if the target of the touch event is inside an element with the 'beakMessages' class
  if (!hasParentWithClass(targetElement, "beakMessages")) {
    event.preventDefault();
  }
};

function isMacOS() {
  return /Mac|iMac|Macintosh/i.test(navigator.userAgent);
}
