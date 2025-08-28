"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Message, PerformanceMetrics } from "@/types";

export default function PollingDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [interval, setInterval] = useState(3000); // 3秒
  const [isBackendDataActive, setIsBackendDataActive] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    requestCount: 0,
    dataReceived: 0,
    averageLatency: 0,
    connectionTime: 0,
    bandwidthUsage: 0,
  });

  // 使用 ref 來存儲最新的 timestamp
  const lastTimestampRef = useRef<number>(0);

  // 啟動後端間隔插入資料
  const startBackendDataGeneration = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/triggerInsertTestData",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.text();
        console.log("Backend response:", result);
        setIsBackendDataActive(true);
        // 設定初始時間戳為當前時間
        const currentTime = Date.now();
        lastTimestampRef.current = currentTime;
      }
    } catch (error) {
      console.error("Error starting backend data generation:", error);
      setMessages((prev) =>
        [
          ...prev,
          {
            id: Date.now().toString(),
            content: `後端連線錯誤: ${error}`,
            timestamp: Date.now(),
            type: "system" as const,
          },
        ].slice(-20)
      );
    }
  }, []);

  // 停止後端測試資料插入
  const stopBackendDataGeneration = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/stopInsertTestData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.text();
        console.log("Backend stop response:", result);
        setIsBackendDataActive(false);
      }
    } catch (error) {
      console.error("Error stopping backend data generation:", error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    const startTime = Date.now();

    try {
      // 使用 ref 中的最新 timestamp
      const currentTimestamp = lastTimestampRef.current;
      console.log("Using timestamp:", currentTimestamp);

      // 使用後端 notificationsAfter API
      const response = await fetch(
        `http://localhost:8080/notificationsAfter?timestamp=${currentTimestamp}`,
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
      setMessages((prev) =>
        [
          ...prev,
          {
            id: Date.now().toString(),
            content: `連線錯誤: 無法連接到後端 API (${error})`,
            timestamp: Date.now(),
            type: "system" as const,
          },
        ].slice(-20)
      );
    }
  }, []); // 移除 lastTimestamp 依賴

  useEffect(() => {
    let intervalId: number | null = null;

    const startPolling = async () => {
      if (isActive) {
        // 如果後端資料產生還沒啟動，先啟動它
        if (!isBackendDataActive) {
          await startBackendDataGeneration();
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
    setIsBackendDataActive(false);
    setIsActive(false);
  };

  const togglePolling = async () => {
    if (isActive) {
      // 停止輪詢時也停止後端資料產生
      await stopBackendDataGeneration();
    }
    setIsActive(!isActive);
  };

  const formatBytes = (bytes: number) => {
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          輪詢 (Polling) 示範
        </h2>
        <div className="flex items-center space-x-3">
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
          <button
            onClick={togglePolling}
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
                點擊開始按鈕開始接收訊息
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
            <div className="flex justify-between">
              <span className="text-gray-600">後端狀態:</span>
              <span
                className={`font-medium ${isBackendDataActive ? "text-green-600" : "text-gray-500"}`}
              >
                {isBackendDataActive ? "資料產生中" : "已停止"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">輪詢狀態:</span>
              <span
                className={`font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}
              >
                {isActive ? "執行中" : "已停止"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 說明 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">技術說明</h4>
        <p className="text-blue-800 text-sm">
          輪詢是最簡單的即時資料獲取方式，客戶端定期向伺服器發送請求檢查是否有新資料。
          優點是實作簡單，缺點是可能產生大量不必要的請求，增加伺服器負載和頻寬使用。
        </p>
      </div>

      {/* 說明 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">後端整合說明</h4>
        <p className="text-blue-800 text-sm">
          <br />• 開始時會自動呼叫 triggerInsertTestData 啟動資料產生
          <br />• 使用 notificationsAfter 輪詢新資料，只獲取指定時間後的通知
          <br />• 停止/重置時會呼叫 stopInsertTestData 停止資料產生
          <br />• 確保後端 Docker 容器在 localhost:8080 上運行
        </p>
      </div>
    </div>
  );
}
