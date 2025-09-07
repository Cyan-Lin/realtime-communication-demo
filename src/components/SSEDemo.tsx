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

  const eventSourceRef = useRef<EventSource | null>(null);
  const startTimeRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  // 同步 ref 以避免閉包問題
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      startSSEConnection();
    } else {
      closeSSEConnection();
    }

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
    setMessages((prev) => [...prev, connectingMessage].slice(-20));

    try {
      eventSourceRef.current = new EventSource("/api/sse");

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
        setMessages((prev) => [...prev, connectedMessage].slice(-20));
      };

      // 處理一般訊息
      eventSourceRef.current.onmessage = (event) => {
        handleSSEMessage(event, "message");
      };

      // 處理特定事件類型
      eventSourceRef.current.addEventListener("connection", (event) => {
        handleSSEMessage(event, "connection");
      });

      eventSourceRef.current.addEventListener("system", (event) => {
        handleSSEMessage(event, "system");
      });

      eventSourceRef.current.addEventListener("heartbeat", (event) => {
        // 心跳不顯示訊息，只更新指標
        setMetrics((prev) => ({
          ...prev,
          requestCount: prev.requestCount + 1,
        }));
      });

      eventSourceRef.current.addEventListener("disconnect", (event) => {
        handleSSEMessage(event, "disconnect");
      });

      eventSourceRef.current.onerror = (event) => {
        console.error("SSE 錯誤", event);
        setConnectionStatus("error");

        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "SSE 連線發生錯誤",
          timestamp: Date.now(),
          type: "system",
        };
        setMessages((prev) => [...prev, errorMessage].slice(-20));

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

          const retryMessage: Message = {
            id: Date.now().toString(),
            content: `連線中斷，${retryDelay / 1000}秒後嘗試重連 (${nextAttempt}/${maxReconnectAttempts})`,
            timestamp: Date.now(),
            type: "system",
          };
          setMessages((prev) => [...prev, retryMessage].slice(-20));

          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (isActiveRef.current) {
              startSSEConnection();
            }
          }, retryDelay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          const failedMessage: Message = {
            id: Date.now().toString(),
            content: `重連失敗，已達最大重試次數 (${maxReconnectAttempts})`,
            timestamp: Date.now(),
            type: "system",
          };
          setMessages((prev) => [...prev, failedMessage].slice(-20));
          setIsActive(false);
        }
      };
    } catch (error) {
      console.error("創建 EventSource 失敗:", error);
      setConnectionStatus("error");

      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "無法建立 SSE 連線",
        timestamp: Date.now(),
        type: "system",
      };
      setMessages((prev) => [...prev, errorMessage].slice(-20));
    }
  };

  const handleSSEMessage = (event: any, eventType: string) => {
    try {
      const data = JSON.parse(event.data);

      // 跳過心跳訊息的顯示
      if (data.type === "heartbeat") return;

      const newMessage: Message = {
        id: Date.now().toString(),
        content: data.message,
        timestamp: data.timestamp || Date.now(),
        type: data.type === "system" ? "system" : "notification",
      };

      setMessages((prev) => [...prev, newMessage].slice(-20));

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

      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `訊息解析錯誤: ${event.data}`,
        timestamp: Date.now(),
        type: "system",
      };
      setMessages((prev) => [...prev, errorMessage].slice(-20));
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

  const reset = () => {
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Server-Sent Events (SSE) 示範
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-white font-medium ${
              isActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
            <span>{isActive ? "停止" : "開始"}</span>
          </button>
          <button
            onClick={reset}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium"
          >
            <RotateCcw size={16} />
            <span>重置</span>
          </button>
        </div>
      </div>

      {/* 設定選項 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">連線設定</h3>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 訊息顯示 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">即時訊息流</h3>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                點擊開始按鈕建立 SSE 連線
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg shadow-sm animate-slide-up ${
                      message.type === "system"
                        ? "bg-blue-50 border-l-4 border-blue-400"
                        : "bg-white"
                    }`}
                  >
                    <div className="text-sm text-gray-900">
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

        {/* 效能指標 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">效能指標</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">接收訊息:</span>
              <span className="font-medium">{metrics.requestCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">訊息資料:</span>
              <span className="font-medium">
                {formatBytes(metrics.dataReceived)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">總頻寬:</span>
              <span className="font-medium">
                {formatBytes(metrics.bandwidthUsage)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">連線時間:</span>
              <span className="font-medium">
                {metrics.connectionTime > 0
                  ? `${metrics.connectionTime}ms`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">連線狀態:</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className={`font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>

          {/* 連線資訊 */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="font-medium text-indigo-900 mb-2">連線資訊</h4>
            <div className="text-sm text-indigo-800 space-y-1">
              <div>端點: /api/sse</div>
              <div>協議: Server-Sent Events</div>
              <div>編碼: UTF-8</div>
              <div>重連機制: {autoReconnect ? "啟用" : "停用"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 技術說明 */}
      <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-medium text-orange-900 mb-2">技術說明</h4>
        <p className="text-orange-800 text-sm">
          Server-Sent Events (SSE)
          是一種單向通訊技術，允許伺服器主動推送資料到客戶端。 相比輪詢，SSE
          提供更即時的資料推送，具有自動重連機制，但只支援從伺服器到客戶端的單向通訊。
          非常適合用於即時通知、股價更新、新聞推送、系統監控等場景。
        </p>
        <div className="mt-2 text-orange-700 text-xs">
          <strong>特點:</strong> 基於 HTTP/1.1 持久連線 | 自動重連 | 事件驅動 |
          輕量級協議
        </div>
      </div>
    </div>
  );
}
