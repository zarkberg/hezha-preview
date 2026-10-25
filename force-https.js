// 明文访问兜底跳转
// 背景：GitHub Pages 返回的证书有效，但其内部证书状态卡在 new，
// 导致 Enforce HTTPS 开关无法启用，http:// 访问不会被服务端 301。
// 该脚本在首屏渲染前把 http 请求重定向到 https，尽量缩小明文窗口。
// 注意：脚本本身也会通过明文加载，属已知局限；真正的修复需 GitHub 侧状态恢复。
(function () {
  if (location.protocol !== "http:") return;
  // 本地/内网开发环境没有 TLS，跳转只会 SSL 报错，豁免
  var h = location.hostname;
  if (
    h === "localhost" ||
    h === "[::1]" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  ) {
    return;
  }
  location.replace(
    "https://" + location.host + location.pathname + location.search + location.hash
  );
})();
