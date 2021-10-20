FROM node:16.11.1-slim as express-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY src/ src/
RUN npm run build --production

FROM node:16.11.1-slim as react-build
WORKDIR /app
COPY client/package.json package-lock.json ./
RUN npm ci --production
COPY client/src/ src/
COPY client/public/ public/
WORKDIR /app/client
RUN npm run build 

FROM node:16.11.1-slim
WORKDIR /app

COPY --from=express-build /app/dist/app.js ./
COPY --from=react-build /app/build /app/public

ENV PORT=8080

EXPOSE ${PORT}
CMD ["node", "app.js"]
