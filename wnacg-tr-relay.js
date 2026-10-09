// wnacg标题翻译中转(CF Worker,模块式)
// 部署:Workers→新建→粘贴→部署→拿URL→浏览器开 ?test=1 见中文即成
const HANT = "同誌漢化雜短無修正陽頭個人翻訳圏愛蘭児優等生性感開発指導話撮星川御坂援交説読書館員図画頁巻号巻末特典描下書新作再録総集編前編後編番外";
const HANS = "同志汉化杂短无修正阳头个人翻译圈爱兰儿优等生性感开发指导话撮星川御坂援交说读书馆员图画页卷号卷末特典描下书新作再录总集编前编后编番外";
function h2s(s) {
  if (!s) return s;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const p = HANT.indexOf(s[i]);
    out += p >= 0 ? HANS[p] : s[i];
  }
  return out;
}
const cache = new Map();
async function gtx(text) {
  const u = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=" + encodeURIComponent(text);
  const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" } });
  const j = await r.json();
  return (j[0] || []).map((a) => a[0]).join("");
}
function timeout(ms) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error("t")), ms));
}
async function trOne(s) {
  if (!s || typeof s !== "string") return s;
  if (s.length > 300 || !/[^\x00-\x7f]/.test(s)) return s;
  if (cache.has(s)) return cache.get(s);
  const base = h2s(s);
  let out = base;
  if (/[\u3040-\u30ff]/.test(s)) {
    try {
      const t = await Promise.race([gtx(s), timeout(4500)]);
      if (t) out = h2s(t);
    } catch (e) { /* 保底原文 */ }
  }
  if (cache.size > 2000) cache.delete(cache.keys().next().value);
  cache.set(s, out);
  return out;
}
function cors() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
export default {
  async fetch(req) {
    const url = new URL(req.url);
    if (url.searchParams.get("test") === "1") {
      const zh = await trOne("[サークルふかみのこころ] 優等生ちゃんが性感開発指導を受けちゃう話");
      return new Response(JSON.stringify({ ok: true, zh }), { headers: cors() });
    }
    if (req.method === "OPTIONS") return new Response("", { headers: cors() });
    if (req.method !== "POST")
      return new Response(JSON.stringify({ use: "POST {texts:[...]}" }), { status: 405, headers: cors() });
    let body;
    try { body = await req.json(); }
    catch (e) { return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers: cors() }); }
    const texts = Array.isArray(body.texts)
      ? body.texts.filter((t) => typeof t === "string").slice(0, 40)
      : [];
    const zh = await Promise.all(texts.map(trOne));
    return new Response(JSON.stringify({ zh }), { headers: cors() });
  },
};
