import { NextResponse } from "next/server";

// 模擬訊息資料
const dummyMessages = [
  "新產品上線了！",
  "系統維護完成",
  "用戶數突破10萬！",
  "新功能發布預告",
  "伺服器狀態正常",
  "資料庫備份完成",
  "系統升級通知",
  "安全性更新",
  "效能優化完成",
  "新版本釋出",
  "促銷活動開始",
  "客服系統更新",
  "API 服務穩定",
  "監控警報解除",
  "備份系統檢查完成",
];

let lastMessageIndex = 0;
let requestCounter = 0;

export async function GET() {
  try {
    requestCounter++;

    // 模擬網路延遲
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 500 + 100)
    );

    // 70% 機率有新訊息
    const hasNewMessage = Math.random() > 0.3;

    if (hasNewMessage) {
      const messageIndex = Math.floor(Math.random() * dummyMessages.length);
      const message = dummyMessages[messageIndex];

      return NextResponse.json({
        success: true,
        message: `[${requestCounter}] ${message}`,
        timestamp: Date.now(),
        hasData: true,
      });
    } else {
      // 沒有新訊息
      return NextResponse.json({
        success: true,
        message: null,
        timestamp: Date.now(),
        hasData: false,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
