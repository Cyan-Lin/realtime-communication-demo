"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Message, PerformanceMetrics } from "@/types";
import { useBackendDataGeneration } from "@/hooks/useBackendDataGeneration";
import { createErrorMessage, addMessageWithLimit } from "@/utils/messageUtils";
import MessageList from "@/components/shared/MessageList";
import PerformanceMetricsPanel from "@/components/shared/PerformanceMetricsPanel";
import DemoControls from "@/components/shared/DemoControls";
import InfoSection from "@/components/shared/InfoSection";
import { Wifi, Play, User, Send } from "lucide-react";

type WebSocketStatus = "connecting" | "open" | "closed" | "error";

interface ChatMessage extends Message {
  username?: string;
  messageType?: "chat" | "system" | "notification";
}

export default function WebSocketDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<WebSocketStatus>("closed");
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    requestCount: 0,
    dataReceived: 0,
    averageLatency: 0,
    connectionTime: 0,
    bandwidthUsage: 0,
  });

  // 聊天相關狀態
  const [username, setUsername] = useState(
    `User${Math.floor(Math.random() * 1000)}`
  );
  const [inputMessage, setInputMessage] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  // WebSocket 和計時器 refs
  const wsRef = useRef<WebSocket | null>(null);
  const connectTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 使用共用的後端資料產生 hook
  const {
    isBackendDataActive,
    startBackendDataGeneration,
    stopBackendDataGeneration,
  } = useBackendDataGeneration();

  // 假資料產生器 - 模擬其他用戶的訊息
  const generateFakeMessage = useCallback((): ChatMessage => {
    const fakeUsers = ["Alice", "Bob", "Charlie", "Diana", "Eve"];
    const fakeMessages = [
      "Hello everyone! 👋",
      "How is everyone doing today?",
      "This WebSocket demo is working great!",
      "Anyone else testing the real-time features?",
      "Great to see this chat in action! 🚀",
      "The connection seems stable",
      "Real-time communication is amazing",
      "Testing message delivery...",
    ];

    return {
      id: crypto.randomUUID(),
      content: fakeMessages[Math.floor(Math.random() * fakeMessages.length)],
      timestamp: Date.now(),
      type: "user",
      username: fakeUsers[Math.floor(Math.random() * fakeUsers.length)],
      messageType: "chat",
    };
  }, []);

  // 建立 WebSocket 連線
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    connectTimeRef.current = Date.now();

    try {
      // 嘗試連接真實後端，如果失敗則使用假資料
      const wsUrl = "ws://localhost:8080/webSocket";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("open");
        const connectionTime = Date.now() - connectTimeRef.current;

        setMetrics((prev) => ({
          ...prev,
          connectionTime,
        }));

        // 發送連線通知
        const systemMessage: ChatMessage = {
          id: crypto.randomUUID(),
          content: `${username} 已加入聊天室`,
          timestamp: Date.now(),
          type: "system",
          messageType: "system",
        };
        setMessages((prev) => addMessageWithLimit(prev, systemMessage, 20));
      };

      ws.onmessage = (event) => {
        try {
          let data;
          try {
            data = JSON.parse(event.data);
          } catch {
            // 非 JSON 格式，直接當作 content 處理
            data = { content: event.data };
          }

          const receivedMessage: ChatMessage = {
            id: data.id || crypto.randomUUID(),
            content: data.content || data.message,
            timestamp: data.timestamp || Date.now(),
            type: "user",
            username: data.username || data.user,
            messageType: "chat",
          };

          setMessages((prev) => addMessageWithLimit(prev, receivedMessage, 20));

          // 更新效能指標
          setMetrics((prev) => ({
            ...prev,
            requestCount: prev.requestCount + 1,
            dataReceived: prev.dataReceived + event.data.length,
          }));
        } catch (error) {
          console.warn("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        setStatus("closed");
        if (isActive) {
          // 如果是意外斷線，加入錯誤訊息
          const errorMessage = createErrorMessage("WebSocket 連線已中斷");
          setMessages((prev) => addMessageWithLimit(prev, errorMessage, 20));
        }
      };

      ws.onerror = () => {
        setStatus("error");
        const errorMessage = createErrorMessage(
          "WebSocket 連線發生錯誤，將使用假資料模式"
        );
        setMessages((prev) => addMessageWithLimit(prev, errorMessage, 20));

        // 切換到假資料模式
        startFakeDataMode();
      };
    } catch (error) {
      setStatus("error");
      const errorMessage = createErrorMessage(
        "無法建立 WebSocket 連線，使用假資料模式"
      );
      setMessages((prev) => addMessageWithLimit(prev, errorMessage, 20));
      startFakeDataMode();
    }
  }, [username, isActive]);

  // 假資料模式
  const startFakeDataMode = useCallback(() => {
    setStatus("open");

    // 模擬系統訊息
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: "已進入假資料演示模式 - 模擬多人聊天",
      timestamp: Date.now(),
      type: "system",
      messageType: "system",
    };
    setMessages((prev) => addMessageWithLimit(prev, systemMessage, 20));

    // 定期產生假訊息
    const interval = setInterval(
      () => {
        if (Math.random() < 0.3) {
          // 30% 機率產生新訊息
          const fakeMessage = generateFakeMessage();
          setMessages((prev) => addMessageWithLimit(prev, fakeMessage, 20));

          setMetrics((prev) => ({
            ...prev,
            requestCount: prev.requestCount + 1,
            dataReceived:
              prev.dataReceived + JSON.stringify(fakeMessage).length,
          }));
        }
      },
      2000 + Math.random() * 3000
    ); // 2-5秒隨機間隔

    // 將 interval ID 存儲以便清理
    abortControllerRef.current = {
      abort: () => clearInterval(interval),
    } as AbortController;
  }, [generateFakeMessage]);

  // 發送訊息
  const sendMessage = useCallback(() => {
    if (!inputMessage.trim()) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      content: inputMessage,
      timestamp: Date.now(),
      type: "user",
      username: username,
      messageType: "chat",
    };

    // 添加到本地訊息列表
    setMessages((prev) => addMessageWithLimit(prev, message, 20));

    // 嘗試通過 WebSocket 發送
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }

    setInputMessage("");

    // 更新效能指標
    setMetrics((prev) => ({
      ...prev,
      requestCount: prev.requestCount + 1,
      dataReceived: prev.dataReceived + JSON.stringify(message).length,
    }));
  }, [inputMessage, username]);

  // 處理 Enter 鍵發送
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // 開始連線
  const handleStart = useCallback(async () => {
    setIsActive(true);
    connectWebSocket();
    await startBackendDataGeneration();
  }, [connectWebSocket, startBackendDataGeneration]);

  // 停止連線
  const handleStop = useCallback(() => {
    setIsActive(false);
    setStatus("closed");

    // 關閉 WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // 清理假資料模式
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    stopBackendDataGeneration();
  }, [stopBackendDataGeneration]);

  // 重置狀態
  const handleReset = useCallback(() => {
    handleStop();
    setMessages([]);
    setMetrics({
      requestCount: 0,
      dataReceived: 0,
      averageLatency: 0,
      connectionTime: 0,
      bandwidthUsage: 0,
    });
  }, [handleStop]);

  // 清理副作用
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 狀態指示器
  const getStatusIcon = () => {
    switch (status) {
      case "connecting":
        return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case "open":
        return <Wifi className="w-4 h-4 text-green-500" />;
      case "error":
        return <Wifi className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connecting":
        return "連線中";
      case "open":
        return "已連線";
      case "error":
        return "連線錯誤";
      default:
        return "已停止";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "connecting":
        return "text-yellow-600";
      case "open":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // 用戶名編輯控制
  const additionalControls = (
    <div className="flex items-center space-x-3">
      {/* 用戶名顯示/編輯 */}
      <div className="flex items-center space-x-2">
        <User className="w-4 h-4 text-gray-500" />
        {isEditingName ? (
          <div className="flex items-center space-x-1">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
              className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
              autoFocus
              maxLength={12}
            />
          </div>
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {username}
          </button>
        )}
      </div>

      {/* 連線狀態 */}
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <DemoControls
        title="WebSocket 即時通訊"
        isActive={isActive}
        onToggle={isActive ? handleStop : handleStart}
        onReset={handleReset}
        additionalControls={additionalControls}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* 自定義聊天訊息列表 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">聊天訊息</h3>
            <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  點擊開始按鈕開始聊天
                  <br />
                  <small className="text-xs">WebSocket 即時通訊演示</small>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg shadow-sm animate-slide-up ${
                        message.type === "system"
                          ? "bg-yellow-50 border border-yellow-200"
                          : message.type === "notification"
                            ? "bg-red-50 border border-red-200"
                            : message.username === username
                              ? "bg-blue-50 border border-blue-200 ml-8"
                              : "bg-white mr-8"
                      }`}
                    >
                      {message.username && message.type !== "system" && (
                        <div
                          className={`text-xs font-medium mb-1 ${
                            message.username === username
                              ? "text-blue-600"
                              : "text-purple-600"
                          }`}
                        >
                          {message.username}
                        </div>
                      )}
                      <div
                        className={`text-sm ${
                          message.type === "system"
                            ? "text-yellow-800"
                            : message.type === "notification"
                              ? "text-red-800"
                              : "text-gray-900"
                        }`}
                      >
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 訊息輸入區域 */}
          {isActive && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="輸入訊息..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={200}
                  disabled={status !== "open"}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || status !== "open"}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <Send className="w-4 h-4" />
                  <span>發送</span>
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                按 Enter 發送訊息 • 最多 200 字元 • {inputMessage.length}/200
              </div>
            </div>
          )}
        </div>

        <PerformanceMetricsPanel
          metrics={metrics}
          isBackendDataActive={isBackendDataActive}
          additionalMetrics={
            <div className="space-y-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">連線狀態:</span>
                <span className="font-medium">{getStatusText()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">當前用戶:</span>
                <span className="font-medium">{username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">訊息總數:</span>
                <span className="font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">後端服務:</span>
                <span className="font-medium">
                  {isBackendDataActive ? "已啟用" : "假資料演示"}
                </span>
              </div>
            </div>
          }
        />
      </div>

      <InfoSection title="WebSocket 技術特點">
        <ul className="space-y-1">
          <li>• 雙向實時通訊 - 客戶端和服務器都可以主動發送數據</li>
          <li>• 低延遲 - 建立連接後無需重複握手</li>
          <li>• 高效率 - 協議開銷小，適合頻繁通訊</li>
          <li>• 持久連接 - 保持長時間連接狀態</li>
          <li>• 事件驅動 - 基於事件的異步通訊模式</li>
        </ul>
      </InfoSection>
    </div>
  );
}
