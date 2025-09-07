# 即時通訊技術比較專案 - TODO 清單

## 🎯 專案概覽

這是一個比較五種即時通訊技術（Polling、Long Polling、SSE、WebSocket、Reactive Long Polling）的教學示範專案，使用 Next.js 前端搭配 Spring Boot 後端。

## 📋 前端 (Next.js) TODO

### 🔧 核心元件開發

- [x] **PollingDemo 元件** ([`src/components/PollingDemo.tsx`](src/components/PollingDemo.tsx))
  - [x] 實作定期輪詢邏輯 (setInterval)
  - [x] 顯示請求次數和回應時間
  - [x] 可調整輪詢間隔設定 (1s, 3s, 5s, 10s)
  - [x] 開始/停止控制按鈕
  - [x] 效能指標追蹤 (請求次數、資料大小、頻寬、延遲)
  - [x] 訊息列表顯示 (最新 20 條)
  - [x] 模擬 API 端點 (`/api/polling`)

- [x] **LongPollingDemo 元件** ([`src/components/LongPollingDemo.tsx`](src/components/LongPollingDemo.tsx))
  - [x] 實作長輪詢機制 (5-30秒超時)
  - [x] 處理連線超時重連
  - [x] 顯示連線狀態 (連線中/已連線/錯誤/已停止)
  - [x] 錯誤處理和重試邏輯 (指數退避算法)
  - [x] 可調整最大重試次數 (1, 3, 5, 10次)
  - [x] AbortController 請求取消管理
  - [x] 模擬 API 端點 (`/api/long-polling`)

- [ ] **LongPollingMonoDemo 元件** ([`src/components/LongPollingMonoDemo.tsx`](src/components/LongPollingMonoDemo.tsx))
  - [ ] 實作響應式長輪詢機制（對應 `/longPolling/mono` API）
  - [ ] 處理連線超時與重連
  - [ ] 顯示連線狀態 (連線中/已連線/錯誤/已停止)
  - [ ] 錯誤處理和重試邏輯 (指數退避)
  - [ ] AbortController 請求取消管理
  - [ ] 效能指標追蹤
  - [ ] 訊息列表顯示 (最新 20 條)
  - [ ] 新增專屬 tab 於 UI

- [x] **SSEDemo 元件** ([`src/components/SSEDemo.tsx`](src/components/SSEDemo.tsx))
  - [x] 使用 EventSource API
  - [x] 處理連線狀態 (connecting, open, closed)
  - [x] 顯示即時訊息流
  - [x] 連線重建機制 (自動重連開關)
  - [x] 多事件類型處理 (message, system, heartbeat, connection, disconnect)
  - [x] 心跳機制 (30秒間隔)
  - [x] 智能訊息過濾 (心跳不顯示)
  - [x] 效能監控 (接收計數、資料大小、頻寬)
  - [x] 模擬 API 端點 (`/api/sse`)

- [ ] **WebSocketDemo 元件** ([`src/components/WebSocketDemo.tsx`](src/components/WebSocketDemo.tsx))
  - [ ] WebSocket 連線建立和管理
  - [ ] 雙向訊息收發
  - [ ] 聊天室功能實作
  - [ ] 連線狀態指示器
  - [ ] 使用者名稱設定
  - [ ] 訊息歷史記錄
  - [ ] 模擬 API 端點 (`/api/websocket` 或後端 WebSocket 伺服器)

- [ ] **ComparisonChart 元件** ([`src/components/ComparisonChart.tsx`](src/components/ComparisonChart.tsx))
  - [ ] 效能數據收集和顯示
  - [ ] 即時圖表更新 (使用 Chart.js 或 Recharts)
  - [ ] 延遲、頻寬使用量比較
  - [ ] 匯出比較結果功能
  - [ ] 資料視覺化圖表
  - [ ] 技術比較摘要表格

### 📊 資料管理

- [x] **自定義 Hooks** (已整合在各元件中)
  - [x] `usePolling` - 輪詢邏輯封裝 (已整合在 PollingDemo 元件中)
  - [x] `useLongPolling` - 長輪詢邏輯 (已整合在 LongPollingDemo 元件中)
  - [ ] `useLongPollingMono` - 響應式長輪詢邏輯 (需新增)
  - [x] `useSSE` - SSE 連線管理 (已整合在 SSEDemo 元件中)
  - [ ] `useWebSocket` - WebSocket 連線管理
  - [x] `usePerformanceMetrics` - 效能數據追蹤 (已整合在各元件中)

- [x] **API 端點開發**
  - [x] `/api/polling` - 基本輪詢端點 (70% 機率返回新訊息)
  - [x] `/api/long-polling` - 長輪詢端點 (5-30秒超時，30% 機率提前返回)
  - [ ] `/api/long-polling-mono` - 響應式長輪詢端點（對應 `/longPolling/mono`，需新增）
  - [x] `/api/sse` - SSE 串流端點 (多事件類型，心跳機制)
  - [ ] `/api/websocket` - WebSocket 端點 (或後端 WebSocket 伺服器)

### 🎨 UI/UX 改善

- [x] **響應式設計優化**
  - [x] 手機版面配置調整 (已使用 Tailwind CSS 響應式類別)
  - [x] 平板電腦適配 (grid 自適應布局)
  - [x] 桌面版雙欄布局 (訊息 | 效能指標)
  - [ ] 深色模式支援
  - [x] 卡片式佈局設計

- [x] **互動體驗**
  - [x] 載入動畫效果 (旋轉、脈衝動畫)
  - [x] 錯誤狀態提示 (紅色指示器)
  - [x] 成功/失敗視覺回饋
  - [x] 即時狀態指示燈 (WiFi 圖示、顏色變化)
  - [x] 滑入動畫效果 (slide-up)
  - [x] 導航選單設計 (技術選擇按鈕，需新增 LongPollingMono 專屬 tab)

- [x] **視覺設計改善**
  - [x] 統一配色方案 (藍色系 vs 紫色系)
  - [x] 圖示化界面 (Lucide React 圖示)
  - [x] 漸變背景效果
  - [x] 陰影和圓角設計
  - [x] 字體大小和間距優化

### 🔧 工具功能

- [x] **控制面板功能**
  - [x] 輪詢間隔調整 (1s, 3s, 5s, 10s)
  - [x] 重連次數設定 (1, 3, 5, 10次)
  - [x] 自動重連開關 (SSE)
  - [x] 開始/停止控制按鈕
  - [ ] 伺服器端點配置 (目前寫死在程式碼中)
  - [ ] 偵錯模式開關

- [x] **效能監控工具**
  - [x] 即時效能指標顯示
  - [x] 請求次數統計
  - [x] 資料大小計算 (實際內容 vs 總頻寬)
  - [x] 平均延遲測量
  - [x] 連線狀態追蹤
  - [x] 記憶體管理 (訊息列表限制)

- [x] **使用者體驗工具**
  - [x] 視覺化狀態指示器
  - [x] 即時資料更新
  - [x] 錯誤提示和重試進度
  - [x] 響應式界面設計

## 🚀 部署和優化 TODO

### 📦 建置配置

- [ ] **前端建置**
  - [ ] 生產環境建置優化
  - [ ] 靜態資源快取策略
  - [ ] 環境變數配置

- [ ] **後端建置**
  - [ ] Docker 容器化
  - [ ] JAR 封裝配置
  - [ ] 環境特定配置檔

### 🌐 部署準備

- [ ] **容器化**
  - [ ] Frontend Dockerfile
  - [ ] Backend Dockerfile
  - [ ] Docker Compose 配置

- [ ] **雲端部署** (選用)
  - [ ] Vercel/Netlify 前端部署
  - [ ] Heroku/Railway 後端部署
  - [ ] 環境變數設定

## 📚 文件和測試 TODO

### 📖 文件撰寫

- [ ] **README.md**
  - [ ] 專案介紹和特色
  - [ ] 安裝和執行說明
  - [ ] API 文件連結
  - [ ] 技術架構圖

- [ ] **技術文件**
  - [ ] 各技術實作細節說明
  - [ ] 效能比較分析報告
  - [ ] 最佳實踐建議

### 🧪 測試開發

- [ ] **前端測試**
  - [ ] 元件單元測試
  - [ ] Hook 測試
  - [ ] E2E 測試 (Cypress)

- [ ] **後端測試**
  - [ ] API 單元測試（含 /long-polling/mono）
  - [ ] 整合測試
  - [ ] WebSocket 連線測試

## 🎁 進階功能 TODO

### 🔥 實用功能

- [ ] **多語言支援**
  - [ ] 繁體中文/英文切換
  - [ ] i18n 配置

- [ ] **資料持久化**
  - [ ] 聊天紀錄儲存
  - [ ] 使用者偏好設定

- [ ] **進階分析**
  - [ ] 網路延遲測試
  - [ ] 頻寬使用量分析
  - [ ] 電池消耗比較 (PWA)

### 📱 PWA 功能

- [ ] **漸進式網頁應用**
  - [ ] Service Worker 配置
  - [ ] 離線功能支援
  - [ ] 推播通知

## 📅 優先順序建議

### 📅 優先順序建議

### Phase 1 (核心功能) - ✅ 75% 完成

1. ✅ 基本元件實作 (PollingDemo, LongPollingDemo, SSEDemo)
2. ✅ 後端 API 端點開發
3. ✅ 基本的效能比較功能
4. ⏳ WebSocketDemo 元件開發 (進行中)
5. ⏳ LongPollingMonoDemo 元件與 API 開發（新增）

### Phase 2 (完善功能) - 🚧 進行中

1. ⏳ ComparisonChart 實作 (需要圖表庫)
2. ✅ 自定義 Hooks 開發 (已整合在元件中)
3. ✅ 錯誤處理和使用者體驗優化
4. ⏳ 深色模式支援

### Phase 3 (部署和優化) - 📋 待開始

1. ⏳ 容器化和部署設定
2. ⏳ 效能優化和監控
3. ⏳ 文件完善和測試撰寫
4. ⏳ 生產環境建置優化

### Phase 4 (進階功能) - 📋 未來計劃

1. ⏳ 安全性加強
2. ⏳ PWA 功能
3. ⏳ 多語言和進階分析功能

---

**預估完成時間**: 4-6 週 (視個人開發時間而定)
**建議先完成**: Phase 1 → Phase 2 → Phase 3 → Phase 4
**目前進度**: Phase 1 已完成 75%，正在進行 WebSocketDemo 與 LongPollingMonoDemo 開發
**最後更新**: 2025年9月7日
