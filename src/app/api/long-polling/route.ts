import { NextResponse } from "next/server";

// 強制動態渲染
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 模擬訊息資料
const dummyMessages = [
  "長輪詢訊息：系統啟動完成",
  "長輪詢訊息：用戶登入成功",
  "長輪詢訊息：資料同步中...",
  "長輪詢訊息：新通知到達",
  "長輪詢訊息：任務執行完成",
  "長輪詢訊息：系統狀態正常",
  "長輪詢訊息：備份作業完成",
  "長輪詢訊息：更新可用",
  "長輪詢訊息：監控警報解除",
  "長輪詢訊息：連線已建立",
];

let requestCounter = 0;

export async function GET() {
  try {
    requestCounter++;
    const startTime = Date.now();

    // 5% 機率模擬伺服器錯誤（用來觸發 retry 邏輯）
    if (Math.random() < 0.05) {
      return NextResponse.json(
        {
          success: false,
          error: "模擬伺服器錯誤",
          timestamp: Date.now(),
        },
        { status: 500 }
      );
    }

    // 3% 機率模擬網路超時（用來觸發 retry 邏輯）
    // 這裡模擬一個會導致客戶端超時的長時間延遲
    if (Math.random() < 0.03) {
      await new Promise((resolve) => setTimeout(resolve, 35000)); // 超過一般超時時間
      return NextResponse.json(
        {
          success: false,
          error: "請求超時",
          timestamp: Date.now(),
        },
        { status: 408 }
      );
    }

    // 模擬長輪詢：隨機等待時間，最多30秒
    const waitTime = Math.random() * 25000 + 5000; // 5-30秒之間

    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, waitTime);

      // 30% 機率提前返回（有新資料）
      if (Math.random() < 0.3) {
        const earlyTimeout = setTimeout(
          () => {
            clearTimeout(timeout);
            resolve(void 0);
          },
          Math.random() * 5000 + 1000
        ); // 1-6秒內提前返回
      }
    });

    // 60% 機率有新訊息
    const hasNewMessage = Math.random() > 0.4;

    if (hasNewMessage) {
      const messageIndex = Math.floor(Math.random() * dummyMessages.length);
      const message = dummyMessages[messageIndex];

      return NextResponse.json({
        success: true,
        message: `[${requestCounter}] ${message}`,
        timestamp: Date.now(),
        hasData: true,
        waitTime: Date.now() - startTime,
      });
    } else {
      // 超時，沒有新訊息
      return NextResponse.json({
        success: true,
        message: null,
        timestamp: Date.now(),
        hasData: false,
        waitTime: Date.now() - startTime,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "長輪詢伺服器錯誤",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
