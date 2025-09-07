import { ReactNode } from "react";
import { PerformanceMetrics } from "@/types";
import { formatBytes } from "@/utils/formatBytes";

interface PerformanceMetricsPanelProps {
  metrics: PerformanceMetrics;
  isBackendDataActive: boolean;
  additionalMetrics?: ReactNode;
}

export default function PerformanceMetricsPanel({
  metrics,
  isBackendDataActive,
  additionalMetrics,
}: PerformanceMetricsPanelProps) {
  return (
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
        
        {/* 插入額外的指標 */}
        {additionalMetrics}
        
        <div className="flex justify-between">
          <span className="text-gray-600">後端狀態:</span>
          <span
            className={`font-medium ${
              isBackendDataActive ? "text-green-600" : "text-gray-500"
            }`}
          >
            {isBackendDataActive ? "資料產生中" : "已停止"}
          </span>
        </div>
      </div>
    </div>
  );
}
