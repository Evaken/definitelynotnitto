FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY packages/game-core/package.json packages/game-core/package.json
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY packages/game-core packages/game-core
COPY apps/server apps/server
RUN node node_modules/typescript/bin/tsc --build packages/game-core apps/server --force

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8787 NITTO_DATA_PATH=/data/nitto.json
COPY --from=build /app/packages/game-core/dist packages/game-core/dist
COPY --from=build /app/packages/game-core/package.json packages/game-core/package.json
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/server/package.json apps/server/package.json
COPY --from=build /app/node_modules node_modules
VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "apps/server/dist/server.js"]
