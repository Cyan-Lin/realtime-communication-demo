import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "即時通訊技術比較 - Polling vs Long Polling vs Reactive Long Polling vs SSE vs WebSocket",
  description:
    "實作並比較輪詢、長輪詢、響應式長輪詢、Server-Sent Events 和 WebSocket 等即時通訊技術",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    即時通訊技術比較
                  </h1>
                </div>
                <div className="text-sm text-gray-500">
                  Polling • Long Polling • Reactive • SSE • WebSocket
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
