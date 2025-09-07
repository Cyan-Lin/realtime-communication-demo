"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Message, PerformanceMetrics } from "@/types";
import { useBackendDataGeneration } from "@/hooks/useBackendDataGeneration";
import { createErrorMessage, addMessageWithLimit } from "@/utils/messageUtils";
import MessageList from "@/components/shared/MessageList";
import PerformanceMetricsPanel from "@/components/shared/PerformanceMetricsPanel";
import DemoControls from "@/components/shared/DemoControls";
import InfoSection from "@/components/shared/InfoSection";

export default function PollingDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [interval, setInterval] = useState(3000); // 3秒
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
    setIsBackendDataActive,
  } = useBackendDataGeneration();

  // 使用 ref 來存儲最新的 timestamp
  const lastTimestampRef = useRef<number>(0);

  const fetchData = useCallback(async () => {
    const startTime = Date.now();

    try {
      // 使用 ref 中的最新 timestamp
      const currentTimestamp = lastTimestampRef.current;
      console.log("Using timestamp:", currentTimestamp);

      // 使用後端 polling API
      const response = await fetch(
        `http://localhost:8080/polling?timestamp=${currentTimestamp}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const endTime = Date.now();
      const latency = endTime - startTime;

      if (response.ok) {
        const data = await response.json();

        // 計算回應大小
        const responseSize = JSON.stringify(data).length;
        let messageDataSize = 0;

        // 處理後端回傳的通知陣列
        if (Array.isArray(data) && data.length > 0) {
          const newMessages: Message[] = data.map((notification: any) => {
            const messageContent = `[後端] ${notification.message}`;
            messageDataSize += new TextEncoder().encode(messageContent).length;

            return {
              id: `${notification.timestamp}-${Math.random()}`,
              content: messageContent,
              timestamp: notification.timestamp,
              type: "system" as const,
            };
          });

          setMessages((prev) => [...prev, ...newMessages].slice(-20)); // 保留最新20條

          // 更新最後的時間戳
          const latestTimestamp = Math.max(
            ...data.map((n: any) => n.timestamp)
          );
          // 更新 ref
          lastTimestampRef.current = latestTimestamp;
        }

        // 更新指標
        setMetrics((prev) => ({
          requestCount: prev.requestCount + 1,
          dataReceived: prev.dataReceived + messageDataSize,
          averageLatency:
            (prev.averageLatency * prev.requestCount + latency) /
            (prev.requestCount + 1),
          connectionTime: prev.connectionTime,
          bandwidthUsage: prev.bandwidthUsage + responseSize,
        }));
      }
    } catch (error) {
      console.error("Polling error:", error);
      const errorMessage = createErrorMessage(
        `連線錯誤: 無法連接到後端 API (${error})`
      );
      setMessages((prev) => addMessageWithLimit(prev, errorMessage, 20));
    }
  }, []); // 移除 lastTimestamp 依賴

  useEffect(() => {
    let intervalId: number | null = null;

    const startPolling = async () => {
      if (isActive) {
        // 如果後端資料產生還沒啟動，先啟動它
        if (!isBackendDataActive) {
          try {
            startBackendDataGeneration();
            // 設定初始時間戳為當前時間
            const currentTime = Date.now();
            lastTimestampRef.current = currentTime;
          } catch (error) {
            const errorMessage = createErrorMessage(`後端連線錯誤: ${error}`);
            setMessages((prev) => addMessageWithLimit(prev, errorMessage, 20));
          }
        }

        // 立即執行一次
        fetchData();

        // 設定定期執行
        intervalId = window.setInterval(fetchData, interval);

        // 記錄開始時間
        setMetrics((prev) => ({ ...prev, connectionTime: Date.now() }));
      }
    };

    startPolling();

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isActive]);

  const reset = async () => {
    // 停止後端資料產生
    await stopBackendDataGeneration();

    setMessages([]);
    setMetrics({
      requestCount: 0,
      dataReceived: 0,
      averageLatency: 0,
      connectionTime: 0,
      bandwidthUsage: 0,
    });
    const currentTime = Date.now();
    lastTimestampRef.current = currentTime;
    setIsActive(false);
  };

  const togglePolling = async () => {
    if (isActive) {
      // 停止輪詢時也停止後端資料產生
      await stopBackendDataGeneration();
    }
    setIsActive(!isActive);
  };

  return (
    <div className="p-6">
      <DemoControls
        title="輪詢 (Polling) 示範"
        isActive={isActive}
        onToggle={togglePolling}
        onReset={reset}
        additionalControls={
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">間隔時間:</label>
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              disabled={isActive}
            >
              <option value={1000}>1秒</option>
              <option value={3000}>3秒</option>
              <option value={5000}>5秒</option>
              <option value={10000}>10秒</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessageList messages={messages} />

        <PerformanceMetricsPanel
          metrics={metrics}
          isBackendDataActive={isBackendDataActive}
          additionalMetrics={
            <div className="flex justify-between">
              <span className="text-gray-600">輪詢狀態:</span>
              <span
                className={`font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}
              >
                {isActive ? "執行中" : "已停止"}
              </span>
            </div>
          }
        />
      </div>

      <InfoSection title="技術說明">
        <p>
          輪詢是最簡單的即時資料獲取方式，客戶端定期向伺服器發送請求檢查是否有新資料。
          優點是實作簡單，缺點是可能產生大量不必要的請求，增加伺服器負載和頻寬使用。
        </p>
      </InfoSection>

      <InfoSection title="後端整合說明">
        <p>
          <br />• 開始時會自動呼叫 triggerInsertTestData 啟動資料產生
          <br />• 使用 polling 輪詢新資料，只獲取指定時間後的通知
          <br />• 停止/重置時會呼叫 stopInsertTestData 停止資料產生
          <br />• 確保後端 Docker 容器在 localhost:8080 上運行
        </p>
      </InfoSection>
    </div>
  );
}
