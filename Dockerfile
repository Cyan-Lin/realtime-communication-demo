# 使用輕量級 Node 映像
FROM node:lts-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 與 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製所有原始碼
COPY . .

# 建置 Next.js 專案
RUN npm run build

# 開放 3000 port
EXPOSE 3000

# 啟動 Next.js 伺服器
CMD ["npm", "start"]
