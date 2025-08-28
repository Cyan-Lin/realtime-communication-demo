import { NextRequest } from "next/server";

// 強制動態渲染，避免建置時預渲染
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 模擬 SSE 訊息資料
const sseMessages = [
  "SSE 訊息：系統啟動完成",
  "SSE 訊息：用戶活動檢測",
  "SSE 訊息：資料同步中...",
  "SSE 訊息：新通知到達",
  "SSE 訊息：背景任務完成",
  "SSE 訊息：系統狀態更新",
  "SSE 訊息：即時數據推送",
  "SSE 訊息：監控警報解除",
  "SSE 訊息：服務運行正常",
  "SSE 訊息：連線品質良好",
  "SSE 訊息：效能指標正常",
  "SSE 訊息：安全檢查通過",
];

let connectionCount = 0;

export async function GET(request: NextRequest) {
  connectionCount++;
  const currentConnectionId = connectionCount;

  console.log(`SSE 連線 #${currentConnectionId} 已建立`);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 發送初始連線訊息
      const sendEvent = (data: any, event?: string) => {
        try {
          let sseData = "";
          if (event) {
            sseData += `event: ${event}\n`;
          }
          sseData += `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch (error) {
          console.error("Error sending SSE event:", error);
        }
      };

      // 發送連線成功訊息
      sendEvent(
        {
          type: "connection",
          message: `SSE 連線 #${currentConnectionId} 已建立`,
          timestamp: Date.now(),
          connectionId: currentConnectionId,
        },
        "connection"
      );

      // 定期發送訊息
      const messageInterval = setInterval(
        () => {
          // 70% 機率發送新訊息
          if (Math.random() > 0.3) {
            const randomMessage =
              sseMessages[Math.floor(Math.random() * sseMessages.length)];
            sendEvent(
              {
                type: "message",
                message: `${randomMessage} (${new Date().toLocaleTimeString()})`,
                timestamp: Date.now(),
                connectionId: currentConnectionId,
              },
              "message"
            );
          }
        },
        2000 + Math.random() * 1000
      ); // 2-3秒隨機間隔

      // 定期發送心跳
      const heartbeatInterval = setInterval(() => {
        sendEvent(
          {
            type: "heartbeat",
            message: "heartbeat",
            timestamp: Date.now(),
            connectionId: currentConnectionId,
          },
          "heartbeat"
        );
      }, 30000); // 每30秒發送心跳

      // 模擬偶爾的系統事件
      const systemEventInterval = setInterval(() => {
        if (Math.random() > 0.8) {
          // 20% 機率
          const systemEvents = [
            "系統記憶體使用率: 45%",
            "活躍用戶數: 1,234",
            "CPU 使用率: 23%",
            "資料庫連線數: 89",
            "網路延遲: 12ms",
          ];
          const randomEvent =
            systemEvents[Math.floor(Math.random() * systemEvents.length)];

          sendEvent(
            {
              type: "system",
              message: `系統資訊：${randomEvent}`,
              timestamp: Date.now(),
              connectionId: currentConnectionId,
            },
            "system"
          );
        }
      }, 5000); // 每5秒檢查一次

      // 清理函數
      const cleanup = () => {
        console.log(`SSE 連線 #${currentConnectionId} 已關閉`);
        clearInterval(messageInterval);
        clearInterval(heartbeatInterval);
        clearInterval(systemEventInterval);

        // 發送斷線訊息
        try {
          sendEvent(
            {
              type: "disconnect",
              message: `連線 #${currentConnectionId} 即將關閉`,
              timestamp: Date.now(),
              connectionId: currentConnectionId,
            },
            "disconnect"
          );
        } catch (error) {
          // 忽略錯誤，因為連線可能已經關閉
        }

        controller.close();
      };

      // 監聽客戶端斷線
      request.signal.addEventListener("abort", cleanup);

      // 模擬連線可能的異常中斷 (5% 機率)
      if (Math.random() < 0.05) {
        setTimeout(
          () => {
            console.log(`模擬連線 #${currentConnectionId} 異常中斷`);
            cleanup();
          },
          10000 + Math.random() * 20000
        ); // 10-30秒後異常中斷
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
