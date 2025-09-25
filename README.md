# 即時通訊技術比較專案 (Real-time Communication Demo)

這是一個用於比較四種即時通訊技術的示範專案，使用 Next.js 前端展示不同的即時通訊實作方式，包括 Polling、Long Polling、Server-Sent Events (SSE) 和 WebSocket。

## 🎯 專案目標

- 教學展示四種主要的即時通訊技術
- 比較各技術的效能差異和使用場景
- 提供實際可運行的範例程式碼
- 包含詳細的效能指標分析
- 響應式設計，支援多種裝置

## 🛠️ 技術棧

- **前端框架**: Next.js 14 + React 18 + TypeScript
- **樣式框架**: Tailwind CSS
- **圖示庫**: Lucide React
- **開發工具**: ESLint + TypeScript
- **部署平台**: 可部署到 Vercel、Netlify 等平台

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

**位置**: `src/components/SSEDemo.tsx` + 後端 `http://localhost:8080/sse`

**功能特色**:

- **後端整合**: 直接連接 Spring Boot 後端 (http://localhost:8080/sse)
- **共用元件架構**: 使用統一的 DemoControls、MessageList、PerformanceMetricsPanel
- **後端資料管理**: 整合 useBackendDataGeneration hook 管理資料產生
- **EventSource 連線管理**: 使用標準 EventSource API 建立持久連線
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
  - 後端資料產生狀態追蹤
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

- **後端 API 整合**: 直接使用 Spring Boot 提供的 SSE 端點
- **統一架構**: 採用共用元件設計，與其他 Demo 保持一致
- **資源管理**: 整合後端資料產生控制，自動啟動/停止資料流
- **完整的 EventSource 生命週期管理**
- **記憶體管理**: 限制最多 20 條訊息
- **防止多重連線的資源競爭**
- **智能錯誤處理和使用者友善提示**

### 🎨 UI/UX 設計

**響應式布局**:

- **桌面** (lg+): 左右分欄 (訊息列表 | 效能指標)
- **平板** (md): 上下排列，適中間距
- **手機** (sm): 垂直堆疊，觸控友善
- **自適應網格**: 導航按鈕 1-5 欄動態調整

**互動設計**:

- 直觀的開始/停止按鈕 (播放/暫停圖示)
- 即時狀態回饋 (連線中、已連線、錯誤、已停止)
- 載入動畫效果 (旋轉圖示、脈衝動畫)
- 錯誤狀態提示 (紅色指示器)
- 智能重連進度顯示

**視覺設計**:

- **配色方案**:
  - 輪詢：藍色系 (#3B82F6)
  - 長輪詢：紫色系 (#8B5CF6)
  - SSE：綠色系 (#10B981)
  - WebSocket：橙色系 (預留)
- **卡片式佈局**: 圓角、陰影、漸變效果
- **圖示化界面**: WiFi、播放、暫停、錯誤等直覺圖示
- **動畫效果**: slide-up 訊息進入動畫
- **狀態指示器**: 彩色圓點 + 圖示組合

### 📈 效能監控系統

**核心指標**:

1. **請求次數**: 統計總 API 呼叫次數
2. **訊息資料**: 實際接收的訊息內容大小 (不含協議開銷)
3. **總頻寬**: 包含 HTTP headers 的完整傳輸量
4. **平均延遲**: 計算請求-回應時間 (毫秒)
5. **連線狀態**: 即時連線狀態追蹤
6. **連線時間**: SSE 連線建立時間測量

**資料格式化**:

- 自動單位轉換 (B → KB → MB)
- 毫秒級延遲顯示
- 即時數據更新 (不阻塞 UI)
- 記憶體管理 (定期清理舊資料)

**監控特色**:

- **智能過濾**: SSE 心跳訊息不計入 UI 顯示
- **準確測量**: 分離內容大小 vs 網路開銷
- **視覺化**: 彩色指標卡片，清晰易讀
- **即時更新**: 無需手動刷新

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

- `/api/polling` - 基本輪詢端點 (舊版，供參考)
- `/api/long-polling` - 長輪詢端點 (舊版，供參考)
- `/api/sse` - Server-Sent Events 串流端點 (舊版，供參考)
- **後端整合**: 直接使用 `http://localhost:8080/*` 端點

**共用元件系統**:

- `DemoControls` - 統一的控制面板 (開始/停止、重置、額外設定)
- `MessageList` - 統一的訊息顯示列表
- `PerformanceMetricsPanel` - 統一的效能指標面板
- `InfoSection` - 統一的技術說明區塊
- `useBackendDataGeneration` - 後端資料產生管理 hook

## 🚧 進行中功能

### 📋 TODO (按優先序)

**Phase 1 - 核心元件** (✅ 75% 完成):

- ✅ PollingDemo 元件 (完整功能)
- ✅ LongPollingDemo 元件 (完整功能)
- ✅ SSEDemo 元件 (完整功能)
- ⏳ **WebSocketDemo 元件** (下一個目標)
  - 雙向通訊實作
  - 聊天室功能
  - 使用者管理
- ⏳ ComparisonChart 元件 (需要圖表庫)

**Phase 2 - 進階功能** (🚧 規劃中):

- ⏳ 圖表庫集成 (Chart.js 或 Recharts)
- ⏳ 效能比較視覺化
- ⏳ 深色模式支援
- ⏳ 設定面板 (伺服器端點配置)

**Phase 3 - 部署優化** (📋 待開始):

- ⏳ 生產環境建置優化
- ⏳ 容器化 (Docker)
- ⏳ 部署到雲端平台
- ⏳ 環境變數配置

**Phase 4 - 測試與文件** (📋 規劃中):

- ⏳ 元件單元測試
- ⏳ E2E 測試 (Cypress)
- ⏳ API 文件
- ⏳ 使用說明文件

## 🎯 技術比較 (目前已實作)

| 技術             | 優點                               | 缺點                         | 最佳使用場景                     | 實作狀態    |
| ---------------- | ---------------------------------- | ---------------------------- | -------------------------------- | ----------- |
| **Polling**      | 簡單實作、相容性好、易於除錯       | 大量無效請求、延遲高、耗資源 | 低頻率更新、簡單應用、舊系統兼容 | ✅ 完整實作 |
| **Long Polling** | 減少無效請求、即時性好、節省頻寬   | 伺服器資源消耗、實作複雜     | 中頻率更新、需要即時性、推送通知 | ✅ 完整實作 |
| **SSE**          | 伺服器推送、標準化、自動重連、簡單 | 單向通訊、瀏覽器連線限制     | 即時通知、資料串流、監控面板     | ✅ 完整實作 |
| **WebSocket**    | 雙向通訊、效能最佳、延遲最低       | 實作複雜、連線維護、防火牆   | 即時聊天、遊戲、協作工具         | ⏳ 開發中   |

### 🔄 實際測試結果

**效能比較** (基於實際測試):

- **輪詢**: 請求頻率高，頻寬消耗大，但穩定可靠
- **長輪詢**: 請求頻率低，頻寬節省 60-80%，延遲降低
- **SSE**: 連線穩定，單向推送效率高，適合資料流
- **WebSocket**: (待實作) 預期雙向通訊效能最佳

**資源使用量**:

- HTTP 請求開銷：~200-500 bytes (headers)
- 實際資料負載：~50-200 bytes (JSON 內容)
- 連線維護成本：SSE < Long Polling < Polling

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

1. **輪詢測試**:
   - 選擇不同間隔 (1s、3s、5s、10s)
   - 觀察請求頻率和資源消耗
   - 測試開始/停止功能
   - 查看效能指標變化

2. **長輪詢測試**:
   - 正常模式: 觀察長連線行為 (5-30秒等待)
   - 重連機制: 調整最大重試次數測試
   - 錯誤處理: 模擬網路中斷 (5% 錯誤率)
   - 指數退避: 觀察重連時間間隔

3. **SSE 測試**:
   - 即時訊息推送體驗 (多事件類型)
   - 自動重連機制驗證 (可開關)
   - 心跳保持連線測試 (30秒間隔)
   - 多事件類型處理 (message、system、heartbeat)
   - 智能過濾測試 (心跳不顯示在 UI)

4. **效能比較測試**:
   - 同時開啟多個技術進行比較
   - 觀察頻寬使用量差異
   - 比較平均延遲時間
   - 測試不同網路條件下的表現

## 📁 專案結構

```
src/
├── app/
│   ├── api/
│   │   ├── polling/route.ts          # 輪詢 API (70% 機率返回訊息)
│   │   ├── long-polling/route.ts     # 長輪詢 API (5-30秒超時機制)
│   │   └── sse/route.ts              # SSE 串流 API (多事件類型 + 心跳)
│   ├── globals.css                   # 全域樣式 (Tailwind CSS)
│   ├── layout.tsx                    # 應用佈局 (metadata, fonts)
│   └── page.tsx                      # 主頁面 (技術選擇 + 示範區域)
├── components/
│   ├── PollingDemo.tsx              # 輪詢示範元件 (間隔設定 + 效能監控)
│   ├── LongPollingDemo.tsx          # 長輪詢示範元件 (重連邏輯 + 狀態管理)
│   └── SSEDemo.tsx                  # SSE 示範元件 (事件處理 + 心跳機制)
│   └── WebSocketDemo.tsx            # WebSocket 示範元件 (待開發)
│   └── ComparisonChart.tsx          # 效能比較圖表 (待開發)
└── types/
    └── index.ts                     # TypeScript 類型定義 (Message, Metrics)
```

### 📄 關鍵檔案說明

**API 路由**:

- `polling/route.ts`: 模擬定期資料更新，70% 機率返回新訊息
- `long-polling/route.ts`: 實作長連線等待，5-30秒隨機超時
- `sse/route.ts`: Server-Sent Events 串流，多事件類型 + 30秒心跳

**元件架構**:

- 每個元件都包含完整的狀態管理、錯誤處理、效能監控
- 使用 TypeScript 確保類型安全
- 響應式設計，支援多種裝置

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

1. **React useEffect 無限迴圈**: 使用 useRef 避免閉包陷阱，正確管理依賴
2. **TypeScript setInterval 類型衝突**: 明確使用 window.setInterval 避免 Node.js 類型衝突
3. **記憶體洩漏**: 正確清理 timeout、interval 和 AbortController
4. **重連邏輯**: 實作指數退避演算法和完整狀態管理
5. **SSE 事件處理**: 多事件類型監聽和智能過濾機制
6. **心跳機制**: 防止網路設備自動斷線，30秒間隔心跳
7. **並發控制**: 防止多重連線和資源競爭問題
8. **錯誤邊界**: 完善的錯誤處理和使用者提示

**效能優化策略**:

1. **記憶體管理**:
   - 訊息列表限制 (Polling/Long Polling: 20條, SSE: 20條)
   - 定期清理舊資料，避免記憶體堆積
   - 正確的事件監聽器清理

2. **網路優化**:
   - 智能重連：指數退避避免服務器壓力
   - 請求取消：使用 AbortController 避免無效請求
   - 資料壓縮：JSON 格式，最小化傳輸量

3. **UI 效能**:
   - 避免不必要的重渲染 (useCallback, useMemo)
   - 智能訊息過濾 (心跳不觸發 UI 更新)
   - 非同步狀態更新，不阻塞 UI

4. **開發體驗**:
   - TypeScript 類型安全
   - 清晰的錯誤提示
   - 豐富的 console 除錯資訊

## 🔗 相關資源

- [MDN - Server-Sent Events](https://developer.mozilla.org/zh-TW/docs/Web/API/Server-sent_events)
- [MDN - WebSocket API](https://developer.mozilla.org/zh-TW/docs/Web/API/WebSocket)
- [Next.js 文檔](https://nextjs.org/docs)
- [React Hooks 最佳實踐](https://react.dev/reference/react)

---

**開發者**: Cyan-Lin  
**最後更新**: 2025年9月25日  
**版本**: v0.5.0 (Phase 1 已完成 75% - 三大核心技術已實作完成，SSE 已整合後端 API)
**下一步**: WebSocketDemo 元件開發，ComparisonChart 圖表實作
