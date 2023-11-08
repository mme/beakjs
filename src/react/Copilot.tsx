import React, { ReactElement } from "react";
import { Button } from "./Button";
import { Header } from "./Header";
import { Input } from "./Input";
import { Messages } from "./Messages";

import "../css/Copilot.css";

import { Beak, OpenAIModel, Message } from "@beakjs/core";
import { DebugLogger } from "@beakjs/core";
import * as Icons from "./Icons";

const DEFAULT_CONTEXT = {
  beak: null,
  messages: {
    initial: "",
    title: "Copilot Chat",
    placeholder: "Type a message...",
    thinking: "Thinking...",
    done: "✅ Done",
    error: "❌ An error occurred. Please try again.",
  },
  icons: {
    openIcon: Icons.OpenIcon,
    closeIcon: Icons.CloseIcon,
    headerCloseIcon: Icons.HeaderCloseIcon,
    sendIcon: Icons.SendIcon,
    activityIcon: Icons.ActivityIcon,
    spinnerIcon: Icons.SpinnerIcon,
  },
  debugLogger: new DebugLogger([]),
};

interface CopilotMessages {
  initial?: string | string[];
  title?: string;
  placeholder?: string;
  thinking?: string;
  done?: string;
  error?: string;
}

interface CopilotIcons {
  openIcon?: React.ReactNode;
  closeIcon?: React.ReactNode;
  headerCloseIcon?: React.ReactNode;
  sendIcon?: React.ReactNode;
  activityIcon?: React.ReactNode;
  spinnerIcon?: React.ReactNode;
}

interface CopilotContext {
  beak: Beak | null;
  messages: Required<CopilotMessages>;
  icons: Required<CopilotIcons>;
  debugLogger: DebugLogger;
}

export const CopilotContext =
  React.createContext<CopilotContext>(DEFAULT_CONTEXT);

type Theme = "auto" | "light" | "dark";

interface CopilotProps {
  openAIApiKey: string;
  openAIModel?: OpenAIModel;
  maxFeedback?: number;
  messages?: CopilotMessages;
  icons?: CopilotIcons;
  defaultOpen?: boolean;
  clickOutsideToClose?: boolean;
  hitEscapeToClose?: boolean;
  hotkey?: string;
  instructions?: string;
  temperature?: number;
  debugLogger?: DebugLogger;
  theme?: Theme;
  children?: React.ReactNode;
}

interface CopilotState {
  open: boolean;
  inProgress: boolean; // needed?
  messages: Message[];
}

export class Copilot extends React.Component<CopilotProps, CopilotState> {
  get ButtonComponent(): ReactElement {
    // Default button component
    return <Button open={this.state.open} onClick={this.onOpenButtonClick} />;
  }

  get HeaderComponent(): ReactElement {
    // Default header component
    return <Header setOpen={(open: boolean) => this.setState({ open })} />;
  }

  get MessagesComponent(): ReactElement {
    // Default messages component
    return (
      <Messages
        messages={this.state.messages}
        inProgress={this.state.inProgress}
      />
    );
  }

  get InputComponent(): ReactElement {
    // Default input component
    return (
      <Input
        inProgress={this.state.inProgress}
        onSend={(message) => this.onSend(message)}
      />
    );
  }

  get WindowComponent(): ReactElement {
    const className = this.state.open ? "beakWindow active" : "beakWindow";

    return (
      <div className={className} ref={this.beakWindowRef}>
        {this.state.open && (
          <>
            {this.HeaderComponent}
            {this.MessagesComponent}
            {this.InputComponent}
          </>
        )}
      </div>
    );
  }

  private beak: Beak;
  private initialMessages: Message[];
  private copilotContext: CopilotContext;
  private beakWindowRef = React.createRef<HTMLDivElement>();

  constructor(props: CopilotProps) {
    super(props);

    this.beak = new Beak({
      openAIApiKey: props.openAIApiKey,
      openAIModel: props.openAIModel,
      maxFeedback: props.maxFeedback,
      instructions: props.instructions,
      temperature: props.temperature,
      debugLogger: props.debugLogger,
    });

    this.initialMessages = [];

    if (props.messages?.initial) {
      const messages = Array.isArray(props.messages.initial)
        ? props.messages.initial
        : [props.messages.initial];
      this.initialMessages = messages.map(
        (message) =>
          new Message({
            role: "assistant",
            content: message,
          })
      );
    }

    this.state = {
      open: props.defaultOpen!,
      inProgress: false,
      messages: [...this.initialMessages, ...this.beak.messages],
    };

    this.copilotContext = {
      beak: this.beak,
      messages: {
        ...DEFAULT_CONTEXT.messages,
        ...props.messages,
      },
      icons: {
        ...DEFAULT_CONTEXT.icons,
        ...props.icons,
      },
      debugLogger: props.debugLogger || DEFAULT_CONTEXT.debugLogger,
    };

    this.beak.on("change", this.onChange);
  }

  render(): React.ReactNode {
    let className = "beakCopilot";
    if (this.props.theme === "dark") {
      className += " beak-dark-theme";
    } else if (this.props.theme === "auto") {
      className += " beak-theme-auto";
    }
    return (
      <CopilotContext.Provider value={this.copilotContext}>
        <div className={className} ref={this.wrapperRef}>
          {this.ButtonComponent}
          {this.WindowComponent}
        </div>
        {this.props.children && this.props.children}
      </CopilotContext.Provider>
    );
  }

  private adjustForMobile = () => {
    const beakWindow = this.beakWindowRef.current;
    const vv = window.visualViewport;
    if (!beakWindow || !vv) {
      return;
    }

    if (window.innerWidth < 640 && this.state.open) {
      beakWindow.style.height = `${vv.height}px`;
      beakWindow.style.left = `${vv.offsetLeft}px`;
      beakWindow.style.top = `${vv.offsetTop}px`;

      // const scrollY = window.scrollY;

      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = `${window.innerHeight}px`; // Set to the innerHeight which is updated upon keyboard appearance
      document.body.style.overflow = "hidden";
      // document.body.style.top = `-${scrollY}px`; // Offset the top by the negative of the scroll position
      document.body.style.touchAction = "none"; // Prevent scrolling on touch devices

      // Prevent scrolling on iOS
      document.body.addEventListener("touchmove", this.preventScroll, {
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

      document.body.removeEventListener("touchmove", this.preventScroll);
    }
  };

  private preventScroll = (event: TouchEvent): void => {
    let targetElement = event.target as Element;

    // Function to check if the target has the parent with a given class
    const hasParentWithClass = (
      element: Element,
      className: string
    ): boolean => {
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

  private onChange = () => {
    this.setState({
      messages: [...this.initialMessages, ...this.beak.messages],
    });
  };

  onSend = async (message: string) => {
    this.setState({ inProgress: true });

    await this.beak.runChatCompletion(message);

    this.setState(() => ({
      inProgress: false,
    }));
  };

  onOpenButtonClick = () => {
    this.setState((state) => ({ open: !state.open }));
  };

  private wrapperRef = React.createRef<HTMLDivElement>();

  handleClickOutside = (event: MouseEvent) => {
    if (!this.props.clickOutsideToClose) {
      return;
    }
    if (
      this.state.open &&
      this.wrapperRef.current &&
      !this.wrapperRef.current.contains(event.target as any)
    ) {
      this.setState({ open: false });
    }
  };

  handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;

    const isDescendantOfWrapper = this.wrapperRef.current?.contains(target);

    if (
      this.state.open &&
      event.key === "Escape" &&
      (!isInput || isDescendantOfWrapper) &&
      this.props.hitEscapeToClose
    ) {
      this.setState({ open: false });
    } else if (
      event.key === this.props.hotkey &&
      ((navigator.platform.includes("Mac") && event.metaKey) ||
        (!navigator.platform.includes("Mac") && event.ctrlKey)) &&
      (!isInput || isDescendantOfWrapper)
    ) {
      this.setState((state) => ({
        open: !state.open,
      }));
    }
  };

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
    document.addEventListener("keydown", this.handleKeyDown);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.adjustForMobile);
      this.adjustForMobile();
    }
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
    document.removeEventListener("keydown", this.handleKeyDown);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", this.adjustForMobile);
    }
  }

  componentDidUpdate(
    _prevProps: Readonly<CopilotProps>,
    _prevState: Readonly<CopilotState>,
    _snapshot?: any
  ): void {
    this.adjustForMobile();
  }

  static defaultProps = {
    defaultOpen: true,
    clickOutsideToClose: true,
    hitEscapeToClose: true,
    hotkey: "k",
  };
}
