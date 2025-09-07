import { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  emptyMessage?: string;
  emptySubMessage?: string;
}

export default function MessageList({
  messages,
  emptyMessage = "點擊開始按鈕開始接收訊息",
  emptySubMessage,
}: MessageListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">即時訊息</h3>
      <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {emptyMessage}
            {emptySubMessage && (
              <>
                <br />
                <small className="text-xs">{emptySubMessage}</small>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className="bg-white p-3 rounded-lg shadow-sm animate-slide-up"
              >
                <div className="text-sm text-gray-900">{message.content}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
