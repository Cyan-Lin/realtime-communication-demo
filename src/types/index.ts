// 通用類型定義
export interface Message {
  id: string;
  content: string;
  timestamp: number;
  type: "user" | "system" | "notification";
}

export interface ConnectionStatus {
  isConnected: boolean;
  connectionType: "polling" | "longPolling" | "sse" | "websocket";
  lastActivity?: number;
  error?: string;
}

export interface PerformanceMetrics {
  requestCount: number;
  dataReceived: number;
  averageLatency: number;
  connectionTime: number;
  bandwidthUsage: number;
}

export interface DemoState {
  messages: Message[];
  status: ConnectionStatus;
  metrics: PerformanceMetrics;
  isActive: boolean;
}
