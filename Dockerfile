FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force && npm install

COPY . .

# 환경변수 ARG로 받아서 빌드시 사용
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]