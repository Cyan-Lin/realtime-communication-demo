"use client";

import { useState } from "react";
import PollingDemo from "@/components/PollingDemo";
import LongPollingDemo from "@/components/LongPollingDemo";
import SSEDemo from "@/components/SSEDemo";
import WebSocketDemo from "@/components/WebSocketDemo";
// import ComparisonChart from "@/components/ComparisonChart";

type DemoType = "polling" | "longPolling" | "sse" | "websocket" | "comparison";

export default function Home() {
  const [activeDemo, setActiveDemo] = useState<DemoType>("polling");

  const demos = [
    {
      id: "polling",
      name: "輪詢 (Polling)",
      description: "定期向伺服器請求資料",
    },
    {
      id: "longPolling",
      name: "長輪詢 (Long Polling)",
      description: "保持連線直到有新資料",
    },
    {
      id: "sse",
      name: "Server-Sent Events",
      description: "伺服器主動推送資料",
    },
    { id: "websocket", name: "WebSocket", description: "雙向即時通訊" },
    { id: "comparison", name: "效能比較", description: "各技術的效能分析" },
  ];

  const renderDemo = () => {
    switch (activeDemo) {
      case "polling":
        return <PollingDemo />;
      case "longPolling":
        return <LongPollingDemo />;
      case "sse":
        return <SSEDemo />;
      case "websocket":
        return <WebSocketDemo />;
      // case "comparison":
      //   return <ComparisonChart />;
      default:
        return <PollingDemo />;
    }
  };

  return (
    <div className="space-y-8">
      {/* 導航選單 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          選擇要體驗的技術
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id as DemoType)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                activeDemo === demo.id
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="font-semibold text-sm">{demo.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {demo.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 示範內容 */}
      <div className="bg-white rounded-lg shadow-sm">{renderDemo()}</div>

      {/* 說明文字 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">技術說明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">輪詢 (Polling)</h4>
            <p>
              客戶端定期向伺服器發送請求檢查是否有新資料。簡單但可能浪費資源。
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              長輪詢 (Long Polling)
            </h4>
            <p>
              客戶端發送請求後，伺服器保持連線直到有新資料才回應，減少不必要的請求。
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Server-Sent Events
            </h4>
            <p>建立單向連線，伺服器可以主動推送資料到客戶端，適合即時通知。</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">WebSocket</h4>
            <p>
              建立雙向連線，客戶端和伺服器都可以隨時發送資料，適合即時聊天等應用。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
