"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Message, PerformanceMetrics } from "@/types";

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

  const fetchData = useCallback(async () => {
    const startTime = Date.now();

    try {
      // 模擬 API 呼叫
      const response = await fetch("/api/polling", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      if (response.ok) {
        const data = await response.json();

        if (data.message) {
          const newMessage: Message = {
            id: Date.now().toString(),
            content: data.message,
            timestamp: Date.now(),
            type: "system",
          };

          setMessages((prev) => [...prev, newMessage].slice(-10)); // 只保留最新10條

          // 計算實際資料大小（只計算訊息內容）
          const messageSize = new TextEncoder().encode(data.message).length;
          // 計算完整回應大小（包含所有 JSON 資料）
          const responseSize = JSON.stringify(data).length;

          // 更新指標
          setMetrics((prev) => ({
            requestCount: prev.requestCount + 1,
            dataReceived: prev.dataReceived + messageSize, // 只計算訊息內容
            averageLatency:
              (prev.averageLatency * prev.requestCount + latency) /
              (prev.requestCount + 1),
            connectionTime: prev.connectionTime,
            bandwidthUsage: prev.bandwidthUsage + responseSize, // 計算完整回應
          }));
        } else {
          // 即使沒有新訊息，也要計算頻寬使用（空回應也消耗頻寬）
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
      }
    } catch (error) {
      console.error("Polling error:", error);
      setMessages((prev) =>
        [
          ...prev,
          {
            id: Date.now().toString(),
            content: `錯誤: ${error}`,
            timestamp: Date.now(),
            type: "system" as const,
          },
        ].slice(-10)
      );
    }
  }, []);

  useEffect(() => {
    let intervalId: number | null = null;

    if (isActive) {
      // 立即執行一次
      fetchData();

      // 設定定期執行
      intervalId = window.setInterval(fetchData, interval);

      // 記錄開始時間
      setMetrics((prev) => ({ ...prev, connectionTime: Date.now() }));
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isActive, interval, fetchData]);

  const reset = () => {
    setMessages([]);
    setMetrics({
      requestCount: 0,
      dataReceived: 0,
      averageLatency: 0,
      connectionTime: 0,
      bandwidthUsage: 0,
    });
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
              <span className="text-gray-600">連線狀態:</span>
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
    </div>
  );
}
