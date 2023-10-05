import { AssistantMessage, Message, SystemMessage, UserMessage } from "./types";

export function isUserMessage(message: Message): message is UserMessage {
  return message.role === "user";
}

export function isSystemMessage(message: Message): message is SystemMessage {
  return message.role === "system";
}

export function isAssistantMessage(
  message: Message
): message is AssistantMessage {
  return message.role === "assistant";
}

export function isUserOrAssistantMessage(
  message: Message
): message is UserMessage | AssistantMessage {
  return isUserMessage(message) || isAssistantMessage(message);
};
