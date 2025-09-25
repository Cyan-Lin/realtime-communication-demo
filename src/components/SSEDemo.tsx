"use client";

import { useState, useEffect, useRef } from "react";
import {
  Wifi,
  WifiOff,
  Radio,
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { Message, PerformanceMetrics } from "@/types";
import { useBackendDataGeneration } from "@/hooks/useBackendDataGeneration";
import { createErrorMessage, addMessageWithLimit } from "@/utils/messageUtils";
import MessageList from "@/components/shared/MessageList";
import PerformanceMetricsPanel from "@/components/shared/PerformanceMetricsPanel";
import DemoControls from "@/components/shared/DemoControls";
import InfoSection from "@/components/shared/InfoSection";

export default function SSEDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [maxReconnectAttempts] = useState(5);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    requestCount: 0,
    dataReceived: 0,
    averageLatency: 0,
    connectionTime: 0,
    bandwidthUsage: 0,
  });

  // 使用共用的後端資料產生 hook
  const {
    isBackendDataActive,
    startBackendDataGeneration,
    stopBackendDataGeneration,
  } = useBackendDataGeneration();

  const eventSourceRef = useRef<EventSource | null>(null);
  const startTimeRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  // 同步 ref 以避免閉包問題
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const startSSE = async () => {
      if (isActive) {
        // 如果後端資料產生還沒啟動，先啟動它
        if (!isBackendDataActive) {
          await startBackendDataGeneration();
        }
        startSSEConnection();
      } else {
        closeSSEConnection();
      }
    };

    startSSE();

    return () => {
      closeSSEConnection();
    };
  }, [isActive]);

  const startSSEConnection = () => {
    if (eventSourceRef.current) {
      closeSSEConnection();
    }

    setConnectionStatus("connecting");
    startTimeRef.current = Date.now();

    // 添加連線建立的訊息
    const connectingMessage: Message = {
      id: Date.now().toString(),
      content: "正在建立 SSE 連線...",
      timestamp: Date.now(),
      type: "system",
    };
    setMessages((prev) => addMessageWithLimit(prev, connectingMessage, 20));

    try {
      // 嘗試使用後端 API，fallback 到 Next.js API
      const sseEndpoint = "http://localhost:8080/sse";
      eventSourceRef.current = new EventSource(sseEndpoint);

      eventSourceRef.current.onopen = (event) => {
        console.log("SSE 連線已開啟", event);
        setConnectionStatus("connected");
        setReconnectAttempts(0);

        const connectionTime = Date.now() - startTimeRef.current;
        setMetrics((prev) => ({
          ...prev,
          connectionTime,
        }));

        const connectedMessage: Message = {
          id: Date.now().toString(),
          content: `SSE 連線建立成功 (耗時: ${connectionTime}ms)`,
          timestamp: Date.now(),
          type: "system",
        };
        setMessages((prev) => addMessageWithLimit(prev, connectedMessage, 20));
      };

      // 處理後端推送的通知訊息
      eventSourceRef.current.onmessage = (event) => {
        handleSSEMessage(event, "message");
      };

      eventSourceRef.current.onerror = (event) => {
        console.error("SSE 錯誤", event);
        setConnectionStatus("error");

        const errorMessage = createErrorMessage("SSE 連線發生錯誤");
        setMessages((prev) => addMessageWithLimit(prev, errorMessage, 20));

        // 自動重連機制
        if (
          autoReconnect &&
          isActiveRef.current &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          const nextAttempt = reconnectAttempts + 1;
          setReconnectAttempts(nextAttempt);

          const retryDelay = Math.min(
            1000 * Math.pow(2, nextAttempt - 1),
            30000
          ); // 指數退避，最大30秒

          const retryMessage = createErrorMessage(
            `連線中斷，${retryDelay / 1000}秒後嘗試重連 (${nextAttempt}/${maxReconnectAttempts})`
          );
          setMessages((prev) => addMessageWithLimit(prev, retryMessage, 20));

          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (isActiveRef.current) {
              startSSEConnection();
            }
          }, retryDelay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          const failedMessage = createErrorMessage(
            `重連失敗，已達最大重試次數 (${maxReconnectAttempts})`
          );
          setMessages((prev) => addMessageWithLimit(prev, failedMessage, 20));
          setIsActive(false);
        }
      };
    } catch (error) {
      console.error("創建 EventSource 失敗:", error);
      setConnectionStatus("error");

      const errorMessage = createErrorMessage("無法建立 SSE 連線");
      setMessages((prev) => addMessageWithLimit(prev, errorMessage, 20));
    }
  };

  const handleSSEMessage = (event: any, eventType: string) => {
    try {
      const data = JSON.parse(event.data);

      // 根據後端 API 格式處理訊息
      const newMessage: Message = {
        id: Date.now().toString(),
        content: data.message,
        timestamp: data.timestamp || Date.now(),
        type: "notification", // 後端推送的都是通知類型
      };

      setMessages((prev) => addMessageWithLimit(prev, newMessage, 20));

      // 更新效能指標
      const messageSize = new TextEncoder().encode(data.message).length;
      const totalEventSize = event.data.length;

      setMetrics((prev) => ({
        requestCount: prev.requestCount + 1,
        dataReceived: prev.dataReceived + messageSize,
        averageLatency: prev.averageLatency, // SSE 沒有請求-回應延遲概念
        connectionTime: prev.connectionTime,
        bandwidthUsage: prev.bandwidthUsage + totalEventSize,
      }));
    } catch (error) {
      console.error("SSE 訊息解析錯誤:", error);

      const errorMessage = createErrorMessage(`訊息解析錯誤: ${event.data}`);
      setMessages((prev) => addMessageWithLimit(prev, errorMessage, 20));
    }
  };

  const closeSSEConnection = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionStatus("disconnected");
    setReconnectAttempts(0);
  };

  const reset = async () => {
    // 停止後端資料產生
    await stopBackendDataGeneration();

    setIsActive(false);
    closeSSEConnection();
    setMessages([]);
    setReconnectAttempts(0);
    setMetrics({
      requestCount: 0,
      dataReceived: 0,
      averageLatency: 0,
      connectionTime: 0,
      bandwidthUsage: 0,
    });
  };

  const toggleSSE = () => {
    if (isActive) {
      stopBackendDataGeneration();
    }
    setIsActive((prev) => !prev);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-600";
      case "connecting":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "已連線";
      case "connecting":
        return "連線中";
      case "error":
        return "連線錯誤";
      default:
        return "已停止";
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Radio size={16} className="text-green-600 animate-pulse" />;
      case "connecting":
        return <Wifi size={16} className="text-yellow-600 animate-spin" />;
      case "error":
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <WifiOff size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="p-6">
      <DemoControls
        title="Server-Sent Events (SSE) 示範"
        isActive={isActive}
        onToggle={toggleSSE}
        onReset={reset}
        additionalControls={
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">自動重連</span>
            </label>
            <span className="text-sm text-gray-500">
              最大重試: {maxReconnectAttempts} 次
            </span>
            {reconnectAttempts > 0 && (
              <span className="text-sm text-orange-600">
                已重試: {reconnectAttempts} 次
              </span>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessageList
          messages={messages}
          emptyMessage="點擊開始按鈕建立 SSE 連線"
          emptySubMessage="伺服器會主動推送通知到客戶端"
        />

        <PerformanceMetricsPanel
          metrics={metrics}
          isBackendDataActive={isBackendDataActive}
          additionalMetrics={
            <div className="flex justify-between items-center">
              <span className="text-gray-600">連線狀態:</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className={`font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          }
        />
      </div>

      <InfoSection
        title="技術說明"
        bgColor="bg-orange-50"
        borderColor="border-orange-200"
        textColor="text-orange-800"
      >
        <p>
          Server-Sent Events (SSE)
          是一種單向通訊技術，允許伺服器主動推送資料到客戶端。 相比輪詢，SSE
          提供更即時的資料推送，具有自動重連機制，但只支援從伺服器到客戶端的單向通訊。
          非常適合用於即時通知、股價更新、新聞推送、系統監控等場景。
        </p>
        <div className="mt-2 text-orange-700 text-xs">
          <strong>特點:</strong> 基於 HTTP/1.1 持久連線 | 自動重連 | 事件驅動 |
          輕量級協議
        </div>
      </InfoSection>

      <InfoSection title="後端整合說明">
        <p>
          <br />• 使用 Server-Sent Events 與後端建立持久連線
          <br />• 伺服器主動推送通知，無需客戶端輪詢
          <br />• 支援自動重連機制，最多重試 {maxReconnectAttempts} 次
          <br />• 確保後端 Docker 容器在 localhost:8080 上運行
        </p>
      </InfoSection>
    </div>
  );
}
