"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { Message, PerformanceMetrics } from "@/types";

export default function LongPollingDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries, setMaxRetries] = useState(3);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    requestCount: 0,
    dataReceived: 0,
    averageLatency: 0,
    connectionTime: 0,
    bandwidthUsage: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetriesRef = useRef(3);

  // 使用 ref 來追蹤最新值，避免閉包問題
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    retryCountRef.current = retryCount;
  }, [retryCount]);

  useEffect(() => {
    maxRetriesRef.current = maxRetries;
  }, [maxRetries]);

  const longPoll = async () => {
    if (!isActiveRef.current) return;

    const startTime = Date.now();

    // 創建新的 AbortController
    abortControllerRef.current = new AbortController();

    try {
      setConnectionStatus("connecting");

      const response = await fetch("/api/long-polling", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
      });

      // 檢查請求完成後是否仍然活躍
      if (!isActiveRef.current) {
        console.log("Long poll completed but component is inactive");
        return;
      }

      const endTime = Date.now();
      const latency = endTime - startTime;

      if (response.ok) {
        setConnectionStatus("connected");
        setRetryCount(0); // 重置重試計數

        const data = await response.json();

        if (data.message) {
          const newMessage: Message = {
            id: Date.now().toString(),
            content: data.message,
            timestamp: Date.now(),
            type: "system",
          };

          setMessages((prev) => [...prev, newMessage].slice(-10));

          // 計算資料大小
          const messageSize = new TextEncoder().encode(data.message).length;
          const responseSize = JSON.stringify(data).length;

          // 更新指標
          setMetrics((prev) => ({
            requestCount: prev.requestCount + 1,
            dataReceived: prev.dataReceived + messageSize,
            averageLatency:
              (prev.averageLatency * prev.requestCount + latency) /
              (prev.requestCount + 1),
            connectionTime: prev.connectionTime,
            bandwidthUsage: prev.bandwidthUsage + responseSize,
          }));
        } else {
          // 沒有新資料，但連線成功
          const responseSize = JSON.stringify(data).length;
          setMetrics((prev) => ({
            ...prev,
            requestCount: prev.requestCount + 1,
            averageLatency:
              (prev.averageLatency * prev.requestCount + latency) /
              (prev.requestCount + 1),
            bandwidthUsage: prev.bandwidthUsage + responseSize,
          }));
        }

        // 使用 setTimeout 避免同步遞迴，並再次檢查狀態
        setTimeout(() => {
          if (isActiveRef.current) {
            console.log("Starting next long poll cycle");
            longPoll();
          } else {
            console.log("Stopping long poll - component inactive");
          }
        }, 100);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Long poll aborted by user");
        setConnectionStatus("disconnected");
        return;
      }

      console.error("Long polling error:", error);

      // 檢查是否仍然活躍才處理錯誤
      if (!isActiveRef.current) {
        console.log("Error occurred but component is inactive");
        return;
      }

      setConnectionStatus("error");

      // 根據錯誤類型提供更詳細的錯誤訊息
      let errorMsg = "連線錯誤";
      if (error.message.includes("Failed to fetch")) {
        errorMsg = "網路連線失敗";
      } else if (error.message.includes("HTTP 408")) {
        errorMsg = "請求超時 (伺服器)";
      } else if (error.message.includes("HTTP 500")) {
        errorMsg = "伺服器內部錯誤";
      } else {
        errorMsg = `連線錯誤: ${error.message}`;
      }

      const errorMessage: Message = {
        id: Date.now().toString(),
        content: errorMsg,
        timestamp: Date.now(),
        type: "system",
      };

      setMessages((prev) => [...prev, errorMessage].slice(-10));

      // 重試邏輯
      if (
        retryCountRef.current < maxRetriesRef.current &&
        isActiveRef.current
      ) {
        setRetryCount((prev) => prev + 1);
        setConnectionStatus("connecting");

        // 延遲重連 (指數退避)
        const delay = Math.min(
          1000 * Math.pow(2, retryCountRef.current),
          10000
        );
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (isActiveRef.current) {
            console.log("Retrying long poll after delay");
            longPoll();
          } else {
            console.log("Retry cancelled - component inactive");
          }
        }, delay);
      } else {
        setConnectionStatus("error");
        setIsActive(false);
      }
    }
  };

  useEffect(() => {
    if (isActive) {
      setMetrics((prev) => ({ ...prev, connectionTime: Date.now() }));
      setRetryCount(0);
      longPoll();
    } else {
      // 停止連線
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setConnectionStatus("disconnected");
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isActive]); // 只依賴 isActive

  const reset = () => {
    // 首先停止所有活動
    setIsActive(false);

    // 取消進行中的請求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 清除重連超時
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // 重置所有狀態
    setMessages([]);
    setRetryCount(0);
    setConnectionStatus("disconnected");
    setMetrics({
      requestCount: 0,
      dataReceived: 0,
      averageLatency: 0,
      connectionTime: 0,
      bandwidthUsage: 0,
    });

    console.log("Long polling reset completed");
  };

  const formatBytes = (bytes: number) => {
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
        return retryCount > 0
          ? `重連中 (${retryCount}/${maxRetries})`
          : "連線中";
      case "error":
        return "連線失敗";
      default:
        return "已停止";
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
      case "connecting":
        return <Wifi size={16} className={getStatusColor()} />;
      default:
        return <WifiOff size={16} className={getStatusColor()} />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          長輪詢 (Long Polling) 示範
        </h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">最大重試:</label>
            <select
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              disabled={isActive}
            >
              <option value={1}>1次</option>
              <option value={3}>3次</option>
              <option value={5}>5次</option>
              <option value={10}>10次</option>
            </select>
          </div>
          <button
            onClick={() => {
              const newActiveState = !isActive;
              setIsActive(newActiveState);

              if (!newActiveState) {
                // 立即取消進行中的請求
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
                console.log("Long polling stopped by user");
              }
            }}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 訊息顯示 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">即時訊息</h3>
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                點擊開始按鈕建立長輪詢連線
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-white p-3 rounded-lg shadow-sm animate-slide-up"
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
              <span className="text-gray-600">請求次數:</span>
              <span className="font-medium">{metrics.requestCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">訊息資料:</span>
              <span className="font-medium">
                {formatBytes(metrics.dataReceived)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">平均延遲:</span>
              <span className="font-medium">
                {metrics.averageLatency.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">總頻寬:</span>
              <span className="font-medium">
                {formatBytes(metrics.bandwidthUsage)}
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
        </div>
      </div>

      {/* 說明 */}
      <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">技術說明</h4>
        <p className="text-purple-800 text-sm">
          長輪詢是輪詢的改進版本，客戶端發送請求後，伺服器會保持連線開啟直到有新資料或超時。
          相比普通輪詢，減少了無效請求，但伺服器需要維護更多連線。支援自動重連和錯誤處理。
        </p>
      </div>
    </div>
  );
}
