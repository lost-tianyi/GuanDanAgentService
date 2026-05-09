# syntax=docker/dockerfile:1
# 单容器：Node 托管前端静态资源 + Socket.IO + API（默认端口 3001）
# 构建（仓库根目录）：
#   docker build -t guandan:latest .
# 可选：反向代理拆分时指定前端 Socket 根地址，例如
#   docker build --build-arg VITE_SOCKET_URL=https://api.example.com -t guandan:latest .
FROM node:20-bookworm-slim AS client-builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
# 默认空字符串 → 前端与页面同源（单容器部署）；覆盖示例见文件头注释
ARG VITE_SOCKET_URL=
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN npm run build

FROM node:20-bookworm-slim AS server-builder
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

FROM node:20-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=client-builder /app/client/dist ./client/dist

WORKDIR /app/server
EXPOSE 3001
ENV PORT=3001
# 默认相对 server/dist 解析到 /app/client/dist；如需自定义挂载路径可覆盖
ENV CLIENT_DIST_PATH=/app/client/dist

CMD ["node", "dist/index.js"]
