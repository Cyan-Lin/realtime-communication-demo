"use client";

import { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Message, PerformanceMetrics } from "@/types";
import { useBackendDataGeneration } from "@/hooks/useBackendDataGeneration";
import { createErrorMessage, addMessageWithLimit } from "@/utils/messageUtils";
import MessageList from "@/components/shared/MessageList";
import PerformanceMetricsPanel from "@/components/shared/PerformanceMetricsPanel";
import DemoControls from "@/components/shared/DemoControls";
import InfoSection from "@/components/shared/InfoSection";

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

  // 使用共用的後端資料產生 hook
  const {
    isBackendDataActive,
    startBackendDataGeneration,
    stopBackendDataGeneration,
  } = useBackendDataGeneration();

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

      const response = await fetch("http://localhost:8080/longPolling", {
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

        const data: { message: string; timestamp: number } =
          await response.json();

        if (data && data.message) {
          const newMessage: Message = {
            id: `${Date.now()}-${Math.random()}`,
            content: data.message,
            timestamp: data.timestamp,
            type: "system",
          };

          setMessages((prev) => addMessageWithLimit(prev, newMessage, 10));

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
      } else if (response.status === 503) {
        // 503 表示超時，這是正常情況，繼續下一次輪詢
        setConnectionStatus("connected");
        setRetryCount(0);

        setMetrics((prev) => ({
          ...prev,
          requestCount: prev.requestCount + 1,
          averageLatency:
            (prev.averageLatency * prev.requestCount + latency) /
            (prev.requestCount + 1),
        }));

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

      const errorMessage: Message = createErrorMessage(errorMsg);
      setMessages((prev) => addMessageWithLimit(prev, errorMessage, 10));

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
    const startLongPolling = async () => {
      if (isActive) {
        // 如果後端資料產生還沒啟動，先啟動它
        if (!isBackendDataActive) {
          await startBackendDataGeneration();
        }

        setMetrics((prev) => ({ ...prev, connectionTime: Date.now() }));
        setRetryCount(0);
        longPoll();
      } else {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        setConnectionStatus("disconnected");
      }
    };

    startLongPolling();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isActive]); // 只依賴 isActive

  const reset = async () => {
    // 停止後端資料產生
    await stopBackendDataGeneration();

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
  };

  const togglePolling = () => {
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
      <DemoControls
        title="長輪詢 (Long Polling) 示範"
        isActive={isActive}
        onToggle={togglePolling}
        onReset={reset}
        additionalControls={
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
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessageList
          messages={messages}
          emptyMessage="點擊開始按鈕建立長輪詢連線"
          emptySubMessage="請確認後端服務已在 http://localhost:8080 啟動"
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
        bgColor="bg-purple-50"
        borderColor="border-purple-200"
        textColor="text-purple-800"
      >
        <p>
          長輪詢連接到後端 Spring Boot 服務
          (http://localhost:8080/longPolling)。
          伺服器會保持連線開啟直到有新通知或30秒超時(503狀態碼)。
          支援自動重連和錯誤處理。請確認後端服務已啟動並可使用測試資料API產生通知。
        </p>
      </InfoSection>

      <InfoSection title="後端整合說明">
        <p>
          <br />• 開始時會自動呼叫 triggerInsertTestData 啟動資料產生
          <br />• 使用 longPolling 持續監聽新資料，伺服器會保持連線直到有新通知
          <br />• 停止/重置時會呼叫 stopInsertTestData 停止資料產生
          <br />• 確保後端 Docker 容器在 localhost:8080 上運行
        </p>
      </InfoSection>
    </div>
  );
}
