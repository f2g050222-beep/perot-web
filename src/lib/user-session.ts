/* 当前用户标识（演示期）：未接入账号系统前，用本地持久的匿名 id 作为 key。
   接入后端后只需让 getCurrentUserId() 返回登录用户 id。 */
const KEY = "perot:user:id";
export function getCurrentUserId(): string {
  if (typeof window === "undefined") return "local-guest";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) { id = `local-${Math.random().toString(36).slice(2, 10)}`; window.localStorage.setItem(KEY, id); }
    return id;
  } catch { return "local-guest"; }
}
