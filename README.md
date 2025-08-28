# 即時通訊技術比較專案 (Real-time Communication Demo)

這是一個用於比較四種即時通訊技術的示範專案，使用 Next.js 前端展示不同的即時通訊實作方式，包括 Polling、Long Polling、Server-Sent Events (SSE) 和 WebSocket。

## 🎯 專案目標

- 教學展示四種主要的即時通訊技術
- 比較各技術的效能差異和使用場景
- 提供實際可運行的範例程式碼
- 包含詳細的效能指標分析

## 🛠️ 技術棧

- **前端框架**: Next.js 14 + React 18
- **樣式**: Tailwind CSS
- **語言**: TypeScript
- **圖示**: Lucide React
- **部署**: 可部署到 Vercel、Netlify 等平台

## 📊 已實作功能

### ✅ 1. 輪詢 (Polling) 示範

**位置**: `src/components/PollingDemo.tsx` + `src/app/api/polling/route.ts`

**功能特色**:

- **定期輪詢機制**: 使用 `setInterval` 定期向伺服器發送請求
- **可調整間隔**: 支援 1秒、3秒、5秒、10秒 四種輪詢間隔
- **開始/停止控制**: 即時控制輪詢狀態
- **效能指標追蹤**:
  - 請求次數統計
  - 訊息資料大小 (只計算實際內容)
  - 總頻寬使用量 (包含 HTTP 協議開銷)
  - 平均延遲時間
  - 連線狀態顯示
- **資料顯示**: 最新 10 條訊息，附帶時間戳記
- **模擬 API**: 70% 機率返回新訊息，包含隨機延遲

**技術亮點**:

- TypeScript 類型安全
- 記憶體管理 (定期清理舊訊息)
- 正確的 setInterval 清理機制

### ✅ 2. 長輪詢 (Long Polling) 示範

**位置**: `src/components/LongPollingDemo.tsx` + `src/app/api/long-polling/route.ts`

**功能特色**:

- **長連線機制**: 伺服器保持連線 5-30秒，直到有新資料或達到超時限制
- **智能重連系統**:
  - 可設定最大重試次數 (1、3、5、10次)
  - 指數退避算法 (1s → 2s → 4s → 8s → 10s)
  - 自動重連失敗處理
- **連線狀態管理**:
  - 連線中 (黃色) / 已連線 (綠色) / 錯誤 (紅色) / 已停止 (灰色)
  - 視覺化狀態指示器 (WiFi 圖示)
  - 重連進度顯示
- **資源管理**:
  - AbortController 正確取消請求
  - 避免記憶體洩漏
  - 防止無限迴圈
- **錯誤處理**:
  - 網路離線偵測
  - 伺服器錯誤處理 (5% 機率模擬錯誤)
  - 超時處理機制

**技術亮點**:

- 使用 useRef 避免閉包陷阱
- setTimeout 避免同步遞迴
- 完整的清理機制

**長輪詢超時機制詳解**:

- **伺服器端超時**: 5-30秒隨機等待時間，模擬真實等待新資料的情況
- **早期返回**: 30% 機率在 1-6秒內提前返回 (模擬有新資料)
- **超時返回**: 如無新資料，等待完整超時時間後返回空回應
- **客戶端處理**: 收到回應後立即發起下一次長輪詢請求

### ✅ 3. Server-Sent Events (SSE) 示範

**位置**: `src/components/SSEDemo.tsx` + `src/app/api/sse/route.ts`

**功能特色**:

- **EventSource 連線管理**: 使用標準 EventSource API 建立持久連線
- **多事件類型處理**:
  - `connection` 事件: 連線建立通知
  - `message` 事件: 一般訊息推送 (70% 機率，2-3秒間隔)
  - `system` 事件: 系統資訊推送 (20% 機率，5秒間隔)
  - `heartbeat` 事件: 心跳保持連線 (30秒間隔)
  - `disconnect` 事件: 連線關閉通知
- **智能重連系統**:
  - 自動重連開關 (可關閉)
  - 最大重試次數限制 (5次)
  - 指數退避算法 (1s → 2s → 4s → 8s → 16s → 30s)
  - 重連進度顯示
- **連線狀態管理**:
  - 連線中 (黃色, 旋轉動畫) / 已連線 (綠色, 脈衝動畫)
  - 錯誤 (紅色) / 已停止 (灰色)
  - 豐富的視覺狀態指示器
- **效能監控**:
  - 接收訊息計數
  - 訊息資料大小統計
  - 總頻寬使用量
  - 連線建立時間測量
- **心跳機制**: 30秒間隔心跳保持連線，防止網路設備自動斷線

**技術亮點**:

- 完整的 EventSource 生命週期管理
- 智能的訊息過濾 (心跳不顯示在 UI)
- 記憶體管理 (限制最多 20 條訊息)
- 防止多重連線的資源競爭

### 🎨 UI/UX 設計

**響應式布局**:

- 桌面: 左右分欄 (訊息 | 效能指標)
- 手機: 上下排列
- 平板: 自適應調整

**互動設計**:

- 直觀的開始/停止按鈕
- 即時狀態回饋
- 載入動畫效果
- 錯誤狀態提示

**視覺設計**:

- 清新的配色方案 (藍色系 vs 紫色系)
- 卡片式佈局
- 圖示化狀態顯示
- 動畫效果 (slide-up)

### 📈 效能監控系統

**核心指標**:

1. **請求次數**: 統計總 API 呼叫次數
2. **訊息資料**: 實際接收的訊息內容大小
3. **總頻寬**: 包含 HTTP headers 的完整傳輸量
4. **平均延遲**: 計算請求-回應時間
5. **連線狀態**: 即時連線狀態追蹤

**資料格式化**:

- 自動單位轉換 (B → KB)
- 毫秒級延遲顯示
- 即時數據更新

### 🔧 開發工具

**TypeScript 類型定義**:

```typescript
// src/types/index.ts
interface Message {
  id: string;
  content: string;
  timestamp: number;
  type: "user" | "system" | "notification";
}

interface PerformanceMetrics {
  requestCount: number;
  dataReceived: number;
  averageLatency: number;
  connectionTime: number;
  bandwidthUsage: number;
}
```

**API 路由結構**:

- `/api/polling` - 基本輪詢端點
- `/api/long-polling` - 長輪詢端點
- `/api/sse` - Server-Sent Events 串流端點

## 🚧 進行中功能

### 📋 TODO (按優先序)

**Phase 1 - 核心元件** (進行中):

- ✅ PollingDemo 元件
- ✅ LongPollingDemo 元件
- ✅ SSEDemo 元件 (新完成!)
- ⏳ WebSocketDemo 元件 (下一個目標)
- ⏳ ComparisonChart 元件

**Phase 2 - 進階功能**:

- ⏳ 自定義 Hooks (`usePolling`, `useLongPolling`, `useSSE`, `useWebSocket`)
- ⏳ 效能比較圖表
- ⏳ 深色模式支援

**Phase 3 - 部署優化**:

- ⏳ 生產環境建置
- ⏳ 容器化 (Docker)
- ⏳ 部署到雲端平台

## 🎯 技術比較 (目前已實作)

| 技術             | 優點                         | 缺點                     | 最佳使用場景                 | 實作狀態  |
| ---------------- | ---------------------------- | ------------------------ | ---------------------------- | --------- |
| **Polling**      | 簡單實作、相容性好           | 大量無效請求、延遲高     | 低頻率更新、簡單應用         | ✅ 完成   |
| **Long Polling** | 減少無效請求、即時性好       | 伺服器資源消耗、複雜度高 | 中頻率更新、需要即時性       | ✅ 完成   |
| **SSE**          | 伺服器推送、標準化、自動重連 | 單向通訊、瀏覽器連線限制 | 即時通知、資料串流、監控面板 | ✅ 完成   |
| **WebSocket**    | 雙向通訊、效能最佳           | 複雜實作、連線維護       | 即時聊天、遊戲、協作         | ⏳ 開發中 |

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

### 瀏覽應用

打開瀏覽器訪問 `http://localhost:3000`

### 測試功能

1. **輪詢測試**: 選擇不同間隔，觀察請求頻率
2. **長輪詢測試**:
   - 正常模式: 觀察長連線行為
   - 離線模式: 測試重連機制
   - 調整重試次數
3. **SSE 測試**:
   - 即時訊息推送體驗
   - 自動重連機制驗證
   - 心跳保持連線測試
   - 多事件類型處理

## 📁 專案結構

```
src/
├── app/
│   ├── api/
│   │   ├── polling/route.ts          # 輪詢 API
│   │   ├── long-polling/route.ts     # 長輪詢 API
│   │   └── sse/route.ts              # SSE 串流 API
│   ├── globals.css                   # 全域樣式
│   ├── layout.tsx                    # 應用佈局
│   └── page.tsx                      # 主頁面
├── components/
│   ├── PollingDemo.tsx              # 輪詢示範元件
│   ├── LongPollingDemo.tsx          # 長輪詢示範元件
│   └── SSEDemo.tsx                  # SSE 示範元件
└── types/
    └── index.ts                     # TypeScript 類型定義
```

## 🛡️ 錯誤處理

**前端錯誤處理**:

- 網路連線失敗
- API 請求超時
- 伺服器錯誤回應
- 使用者操作衝突

**後端錯誤模擬**:

- 隨機伺服器錯誤 (5% 機率)
- 網路延遲模擬
- 超時情境測試

## 📝 開發筆記

**已解決的技術問題**:

1. **React useEffect 無限迴圈**: 使用 useRef 避免閉包陷阱
2. **TypeScript setInterval 類型衝突**: 明確使用 window.setInterval
3. **記憶體洩漏**: 正確清理 timeout 和 AbortController
4. **重連邏輯**: 實作指數退避和狀態管理
5. **SSE 事件處理**: 多事件類型監聽和智能過濾
6. **心跳機制**: 防止網路設備自動斷線

**效能優化**:

1. 訊息列表限制 (Polling/Long Polling: 10條, SSE: 20條)
2. 資源正確清理 (EventSource, AbortController, Timeouts)
3. 避免不必要的重渲染
4. 智能訊息過濾 (心跳不顯示)

## 🔗 相關資源

- [MDN - Server-Sent Events](https://developer.mozilla.org/zh-TW/docs/Web/API/Server-sent_events)
- [MDN - WebSocket API](https://developer.mozilla.org/zh-TW/docs/Web/API/WebSocket)
- [Next.js 文檔](https://nextjs.org/docs)
- [React Hooks 最佳實踐](https://react.dev/reference/react)

---

**開發者**: Cyan-Lin  
**最後更新**: 2025年8月27日  
**版本**: v0.3.0 (Phase 1 75% 完成 - SSE 已實作)
