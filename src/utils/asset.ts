/**
 * 资源 URL 处理工具。
 *
 * 设计原则：数据库只存「相对资源域名的路径」（如 `/bhgt-public-files/cg/x.png`），
 * 域名由前端统一配置（VITE_BHGT_ASSET_BASE_URL），这样换 CDN / OSS 域名时无需改数据。
 *
 * - stripAssetDomain：把粘贴进来的完整 URL 去掉域名/基础地址，只留路径。
 * - resolveAssetUrl：把存储的路径拼回可访问的完整 URL（已是完整 URL 则原样返回）。
 */

/**
 * 去掉粘贴 URL 中的域名（或配置的基础地址前缀），只返回路径部分。
 * @param url   原始输入（可能带 https:// 域名）
 * @param base  配置的资源基础地址（如 https://oss-cn-beijing.aliyuncs.com/bhgt-public-files）
 */
export function stripAssetDomain(url: string, base: string): string {
  if (!url) return url;
  const v = url.trim();
  if (!v) return v;

  // 1) 若以配置的基础地址开头，直接去掉该前缀
  if (base && v.startsWith(base)) {
    return v.slice(base.length) || '';
  }

  // 2) 否则去掉任意 http(s)://host 前缀（保留 /path 部分）
  const m = v.match(/^https?:\/\/[^/]+(\/.*)?$/);
  if (m) {
    return m[1] ?? '';
  }

  return v;
}

/**
 * 把存储的路径拼成可访问的完整 URL；若已经是完整 URL 则原样返回。
 */
export function resolveAssetUrl(path: string, base: string): string {
  if (!path) return '';
  const v = path.trim();
  if (/^https?:\/\//i.test(v)) return v; // 已是完整 URL
  if (!base) return v;
  return base.replace(/\/$/, '') + (v.startsWith('/') ? v : '/' + v);
}
