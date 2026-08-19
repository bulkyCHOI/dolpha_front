const { createProxyMiddleware } = require("http-proxy-middleware");

// LAN IP나 DDNS 등 localhost가 아닌 호스트로 접속해도 API가 동작하도록
// 프론트엔드 dev 서버(3000)로 들어온 /api 요청을 백엔드(8000)로 전달한다.
module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
    })
  );
};
