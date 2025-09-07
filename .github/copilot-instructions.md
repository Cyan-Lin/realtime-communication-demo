# Copilot Instructions for Real-time Communication Demo

## 專案架構與核心概念

- **雙模式架構**: Next.js 14 + React 18 + TypeScript 前端，支援兩種後端模式：
  - 內建 Next.js API 路由 (`src/app/api/*/route.ts`) - 用於獨立演示
  - 外部後端服務 (localhost:8080) - 真實資料來源，需 Docker 容器運行
- **每種通訊技術的標準結構**:
  - Demo 元件: `src/components/*Demo.tsx` (Polling/LongPolling/SSE)
  - API 路由: `src/app/api/*/route.ts` (模擬資料)
  - 共用 UI: `src/components/shared/` (DemoControls, MessageList, PerformanceMetricsPanel)
- **資源管理模式**: 每個 Demo 元件都實作 AbortController、指數退避重連、記憶體管理

## 關鍵檔案與目錄

- **Demo 元件**: `src/components/{Polling,LongPolling,SSE}Demo.tsx` - 各自實作完整的狀態管理、效能監控與錯誤處理
- **共用元件**: `src/components/shared/` - 可重用的 UI 元件 (控制面板、訊息列表、效能指標)
- **API 路由**: `src/app/api/{polling,long-polling,sse}/route.ts` - 模擬各種通訊方式，含隨機延遲與錯誤
- **型別定義**: `src/types/index.ts` - 統一的 Message, PerformanceMetrics, ConnectionStatus 介面
- **後端整合**: `src/hooks/useBackendDataGeneration.ts` - 管理外部後端 (localhost:8080) 的資料產生

## 主要開發模式與指令

- **前端開發**: `npm run dev` (localhost:3000) - 支援熱重載，API 路由自動可用
- **後端開發**: 需要 Docker 容器在 localhost:8080 提供真實資料 API
- **依賴安裝**: `npm install` - 主要依賴: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React
- **建置部署**: `npm run build && npm start` - 生產環境建置與啟動
- **代碼檢查**: `npm run lint` - ESLint 配置，但無測試框架

## 專案慣例與設計模式

- **元件架構**: 每個 Demo 元件遵循相同模式:
  ```tsx
  // 1. 狀態管理 (messages, isActive, metrics)
  // 2. useBackendDataGeneration hook 整合
  // 3. AbortController + cleanup (useEffect return)
  // 4. 指數退避重連 (setTimeout 避免遞迴)
  // 5. addMessageWithLimit() 限制訊息數量
  ```
- **記憶體管理**: 所有元件限制訊息 20 條 (`addMessageWithLimit`), 正確清理 timers/listeners
- **連線狀態**: 四種狀態 (連線中/已連線/錯誤/已停止) + 視覺指示器 (WiFi/播放圖示 + 顏色)
- **效能追蹤**: 各技術有不同指標計算方式 (requestCount, dataReceived, averageLatency, bandwidthUsage)
- **錯誤處理**: 統一使用 `createErrorMessage()`, 網路錯誤自動重連, 5% API 隨機錯誤模擬
- **TypeScript**: 嚴格模式，所有 props/state 明確型別，使用 `src/types/index.ts` 統一介面

## 進階注意事項

- **雙後端模式**: 元件優先使用 localhost:8080 (外部後端), fallback 到 Next.js API 路由
- **AbortController 模式**: 每個 fetch 都需要配對的 abort signal 與 cleanup
- **重連邏輯**: 使用 setTimeout 而非同步遞迴，避免堆疊溢出
- **SSE 特殊處理**: heartbeat 事件不顯示於 UI，30 秒間隔保持連線
- **Polling 時間戳**: 使用 `lastTimestampRef.current` 避免重複資料
- **競爭條件**: Long Polling/SSE 需防止多重連線啟動

## 參考

- 詳細技術說明與設計細節請參閱 `README.md`。
- 關鍵型別定義見 `src/types/index.ts`。

## 純後端執行方式

- **建立映像檔** (當後端程式更新時, 關閉並刪除既有容器, 執行新的映像檔):

  ```bash
  docker build -t my-app .
  ```

- **僅執行後端**:

  ```bash
  docker run -d -p 8080:8080 --name my-app-container my-app
  ```

- **暫停後端**:

  ```bash
  docker stop my-app-container
  ```

- **恢復後端**:

  ```bash
  docker start my-app-container
  ```

- **關閉並刪除後端**:
  ```bash
  docker rm my-app-container
  ```

---

如需補充或發現不明確處，請回報或直接於本檔案補充。
