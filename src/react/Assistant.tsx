import React, { useCallback, useEffect, useMemo } from "react";
import { useBeakContext } from "./Beak";
import { Message } from "@beakjs/core";
import { ColorScheme, Icons, Theme } from "./Theme";
import {
  ButtonProps,
  HeaderProps,
  WindowProps,
  MessagesProps,
  InputProps,
} from "./props";
import { Window as DefaultWindow } from "./Window";
import { Button as DefaultButton } from "./Button";
import { Header as DefaultHeader } from "./Header";
import { Messages as DefaultMessages } from "./Messages";
import { Input as DefaultInput } from "./Input";
import "../css/Assistant.css";

interface AssistantWindowProps {
  defaultOpen?: boolean;
  clickOutsideToClose?: boolean;
  hitEscapeToClose?: boolean;
  hotkey?: string;
  icons?: Required<Icons>;
  colorScheme?: ColorScheme;
  Window?: React.ComponentType<WindowProps>;
  Button?: React.ComponentType<ButtonProps>;
  Header?: React.ComponentType<HeaderProps>;
  Messages?: React.ComponentType<MessagesProps>;
  Input?: React.ComponentType<InputProps>;
}

export const AssistantWindow: React.FC<AssistantWindowProps> = ({
  defaultOpen = false,
  clickOutsideToClose = true,
  hitEscapeToClose = true,
  hotkey = "K",
  icons,
  colorScheme,
  Window = DefaultWindow,
  Button = DefaultButton,
  Header = DefaultHeader,
  Messages = DefaultMessages,
  Input = DefaultInput,
}) => {
  const context = useBeakContext();
  const beak = context.beak;

  const [open, setOpen] = React.useState(defaultOpen);
  const [messages, setMessages] = React.useState<Message[]>(
    initialMessages(context.labels.initial)
  );

  const inProgress = messages.some((message) => message.status === "pending");

  const onChange = useCallback(() => {
    setMessages([...initialMessages(context.labels.initial), ...beak.messages]);
  }, [beak]);

  useEffect(() => {
    beak.on("change", onChange);
    return () => {
      beak.off("change", onChange);
    };
  }, [onChange]);

  const sendMessage = async (message: string) => {
    await beak.runChatCompletion(message);
  };

  return (
    <Theme colorScheme={colorScheme} icons={icons || {}}>
      <div className="beakAssistantWindow">
        <Button open={open} setOpen={setOpen}></Button>
        <Window
          open={open}
          setOpen={setOpen}
          clickOutsideToClose={clickOutsideToClose}
          hotkey={hotkey}
          hitEscapeToClose={hitEscapeToClose}
        >
          <Header open={open} setOpen={setOpen} />
          <Messages messages={messages} />
          <Input inProgress={inProgress} onSend={sendMessage} />
        </Window>
      </div>
    </Theme>
  );
};

function initialMessages(initial?: string | string[]): Message[] {
  let initialArray: string[] = [];
  if (initial) {
    if (Array.isArray(initial)) {
      initialArray.push(...initial);
    } else {
      initialArray.push(initial);
    }
  }

  return initialArray.map(
    (message) =>
      new Message({
        role: "assistant",
        content: message,
        status: "success",
      })
  );
}
