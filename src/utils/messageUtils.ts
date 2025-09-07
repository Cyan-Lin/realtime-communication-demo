import { Message } from "@/types";

export function createErrorMessage(content: string): Message {
  return {
    id: Date.now().toString(),
    content,
    timestamp: Date.now(),
    type: "system" as const,
  };
}

export function addMessageWithLimit(
  prevMessages: Message[],
  newMessage: Message | Message[],
  limit: number = 20
): Message[] {
  const messages = Array.isArray(newMessage) ? newMessage : [newMessage];
  return [...prevMessages, ...messages].slice(-limit);
}
