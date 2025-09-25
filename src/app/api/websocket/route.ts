import { NextRequest, NextResponse } from "next/server";

// WebSocket API 路由 - 主要用於說明和備用
// 實際的 WebSocket 連線通常不會通過 HTTP API，而是直接連接到 WebSocket 伺服器

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "WebSocket API 端點",
    info: {
      websocketUrl: "ws://localhost:8080/ws/chat",
      protocol: "WebSocket",
      description:
        "此端點僅用於說明，實際 WebSocket 連線請直接連接到 WebSocket 伺服器",
      features: ["雙向即時通訊", "低延遲連線", "事件驅動架構", "持久連線"],
    },
    fallbackMode: {
      enabled: true,
      description: "當 WebSocket 伺服器不可用時，會啟用假資料演示模式",
    },
  });
}

// POST 端點 - 可用於接收來自 WebSocket 客戶端的訊息（備用方案）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 模擬處理聊天訊息
    const response = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      status: "received",
      message: body,
      echo: {
        id: crypto.randomUUID(),
        content: `Echo: ${body.content}`,
        timestamp: Date.now(),
        username: "System",
        type: "system",
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
