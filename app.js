"use strict";
/* OBORO — leitura e autopublicação de quadrinhos. */

const CFG = window.OBORO_CONFIG || {};
const IMG = {avatar:"avatar.jpg"};
const BUCKET = "oboro";
const ORIGINALS = [];
const GENRES = ["Ação","Aventura","Comédia","Drama","Fantasia","Ficção científica","Romance","Slice of life","Terror"];
const AGES = ["Livre","12+","14+","16+","18+"];
const MODES = {v:"Vertical (webtoon)", ltr:"Esquerda para direita", rtl:"Direita para esquerda (mangá)"};
const DAYS = ["dom","seg","ter","qua","qui","sex","sáb"];
const LIM = {
  pages:60, rawBytes:30*1024*1024, pageW:1080, coverW:480, coverH:720,
  pageBytes:1500000, coverBytes:400000, maxPixels:16000000, maxSourcePixels:200000000,
  title:60, synopsis:600, name:40, pass:8, bio:300, comment:400
};
const PLUS_PRICE = 300, PLUS_DAYS = 30, DAILY = 10, DAILY_PLUS = 20;   // espelham as funções SQL (buy_plus / claim_daily)

const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ls = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
};
const fmt = n => Number(n || 0).toLocaleString("pt-BR");
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));

const I = {
  back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3.5 7 12l8.5 8.5 2-2L11 12l6.5-6.5z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3h3v7.5H21v3h-7.5V21h-3v-7.5H3v-3h7.5z"/></svg>',
  book:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7a3 3 0 0 1 1 .2A3 3 0 0 1 13 4h7v15h-7a2 2 0 0 0-2 1.5A2 2 0 0 0 9 19H4z"/></svg>',
  mark:'<svg viewBox="0 0 36 52" aria-hidden="true"><path d="M2 2h32v48L18 36 2 50z"/></svg>',
  searchIc:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="26" cy="26" r="16" fill="none" stroke="currentColor" stroke-width="7"/><path d="M38 38 56 56" stroke="#FC9900" stroke-width="9" stroke-linecap="round"/></svg>',
  left:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5V11h4.5v9.5zm6.25 0V3.5h4.5v17zm6.25 0V8h4.5v12.5z"/></svg>',
  heart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.2 3.9 13.4A5.3 5.3 0 0 1 11.4 6l.6.6.6-.6a5.3 5.3 0 0 1 7.5 7.4z"/></svg>',
  coin:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="#FFE066" stroke="#111" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#111" stroke-width="2.4"/></svg>',
  star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>'
};

/* ---------- estado ---------- */
const S = {
  view:"home", prev:[], works:[], reads:[], user:null,
  favs:new Set(ls.get("oboro:favs", [])),
  me:{id:null, name:"", bio:""},
  q:"", genre:"", detailId:null, authorId:null, pub:null, reader:null,
  confirmDel:false, busy:false, loaded:false, loadErr:false, lastFocus:null,
  authMode:"login", authEmail:"", authMsg:"", recovery:false, theme:"light",
  editProfile:false, dashOpen:null,
  wallet:null, walletErr:false, tx:[], bios:{}, likeRows:[], comments:{}
};

/* ---------- cliente Supabase (somente chave pública) ---------- */
const sb = (window.supabase && window.supabase.createClient && CFG.SUPABASE_URL && CFG.SUPABASE_KEY)
  ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}})
  : null;
const pubUrl = p => sb ? sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl : "";
const siteUrl = () => CFG.SITE_URL || (location.origin + location.pathname);

/* ---------- dados ---------- */
const allWorks = () => ORIGINALS.concat(S.works);
const findWork = id => allWorks().find(w => w.id === id);
const myWorks = () => S.works.filter(w => S.user && w.authorId === S.me.id);
const readersOf = id => new Set(S.reads.filter(r => r.w === id && r.u !== S.me.id).map(r => r.u)).size;

function mapWork(r){
  const chs = (r.chapters || []).slice().sort((a,b) => a.idx - b.idx)
    .map(c => ({id:c.id, title:c.title, pages:c.pages.length, paths:c.pages, at:Date.parse(c.created_at)}));
  return {id:r.id, authorId:r.author_id, authorName:r.author_name, title:r.title, genre:r.genre, age:r.age, mode:r.mode,
    synopsis:r.synopsis, coverPath:r.cover_path, cover:pubUrl(r.cover_path), chapters:chs, updatedAt:Date.parse(r.updated_at)};
}
async function loadAll(){
  if (!sb) return;
  try{
    const w = await sb.from("works")
      .select("id,author_id,author_name,title,genre,age,mode,synopsis,cover_path,updated_at,chapters(id,idx,title,pages,created_at)")
      .order("updated_at", {ascending:false}).limit(300);
    if (w.error) throw w.error;
    S.works = w.data.map(mapWork);
    if (S.user){
      const r = await sb.from("reads").select("work_id,user_id,created_at").limit(5000);
      S.reads = r.error ? [] : r.data.map(x => ({w:x.work_id, u:x.user_id, at:Date.parse(x.created_at)}));
    } else S.reads = [];
    S.loaded = true; S.loadErr = false;
    await loadFavs();
    await loadExtras();
    refresh();
  }catch(e){
    S.loadErr = !S.loaded;
    toast("Sem conexão com o servidor. Tente de novo.");
    if (S.loadErr) refresh();
  }
}
/* ---------- OBORO+ / OboroCoin / curtidas / bios ----------
 * Tudo que vale dinheiro (saldo, assinatura) é decidido no servidor, por funções SQL
 * (wallet_get, claim_daily, buy_plus). O navegador só exibe o resultado. */
const isPlus = () => !!(S.wallet && S.wallet.until > Date.now());
const likesOf = id => S.likeRows.filter(l => l.work_id === id).length;
const iLiked = id => !!S.user && S.likeRows.some(l => l.work_id === id && l.user_id === S.me.id);
const todaySP = () => new Date().toLocaleDateString("en-CA", {timeZone:"America/Sao_Paulo"});
async function loadWallet(){
  S.wallet = null;
  if (!sb || !S.user){ S.walletErr = false; return; }
  try{
    const r = await sb.rpc("wallet_get");
    if (r.error) throw r.error;
    const row = Array.isArray(r.data) ? r.data[0] : r.data;
    if (!row) throw new Error("vazio");
    S.wallet = {coins:Number(row.coins) || 0, until:row.plus_until ? Date.parse(row.plus_until) : 0, last:row.last_checkin || ""};
    S.walletErr = false;
  }catch(e){ S.walletErr = true; }
}
async function loadExtras(){
  try{
    const l = await sb.from("likes").select("work_id,user_id").limit(5000);
    S.likeRows = l.error ? [] : l.data;
    const p = await sb.from("profiles").select("id,bio").limit(1000);
    S.bios = {}; if (!p.error) p.data.forEach(x => { S.bios[x.id] = x.bio || ""; });
  }catch(e){}
  await loadWallet();
}
async function loadTx(){
  if (!sb || !S.user) return;
  try{
    const r = await sb.from("coin_tx").select("delta,reason,created_at").order("created_at", {ascending:false}).limit(10);
    S.tx = r.error ? [] : r.data;
    if (S.view === "plus") render();
  }catch(e){}
}
async function loadComments(wid){
  if (!sb) return;
  try{
    const r = await sb.from("comments").select("id,user_id,author_name,body,created_at").eq("work_id", wid).order("created_at", {ascending:false}).limit(50);
    S.comments[wid] = r.error ? [] : r.data;
    if (S.view === "detail" && S.detailId === wid) refresh();
  }catch(e){}
}
async function claimDaily(){
  if (S.busy) return; S.busy = true;
  try{
    const r = await sb.rpc("claim_daily");
    if (r.error) throw r.error;
    await loadWallet(); await loadTx();
    toast(`+${isPlus() ? DAILY_PLUS : DAILY} OboroCoin!`);
  }catch(e){
    toast(/already_claimed/.test(String(e && e.message)) ? "Você já resgatou o bônus de hoje. Volte amanhã!" : "Não foi possível resgatar agora.");
    await loadWallet();
  }
  S.busy = false; if (S.view === "plus") render();
}
async function buyPlus(){
  if (S.busy) return;
  if (!S.wallet || S.wallet.coins < PLUS_PRICE) return toast(`Faltam OboroCoin: a assinatura custa ${PLUS_PRICE}.`);
  S.busy = true;
  try{
    const r = await sb.rpc("buy_plus");
    if (r.error) throw r.error;
    await loadWallet(); await loadTx();
    toast("OBORO+ ativado! Obrigado por apoiar.");
  }catch(e){
    toast(/insufficient_coins/.test(String(e && e.message)) ? "OboroCoin insuficiente." : "Não foi possível assinar agora.");
    await loadWallet();
  }
  S.busy = false; if (S.view === "plus") render();
}
function needPlus(what){
  if (!S.user){ S.authMode = "login"; S.authMsg = "Entre para continuar."; go("profile"); toast("Entre ou crie uma conta."); return false; }
  if (!isPlus()){ toast(`${what} é exclusivo de quem tem OBORO+.`); go("plus", {push:true}); loadTx(); return false; }
  return true;
}
async function toggleLike(id){
  if (!needPlus("Curtir")) return;
  const had = iLiked(id);
  S.likeRows = had ? S.likeRows.filter(l => !(l.work_id === id && l.user_id === S.me.id)) : S.likeRows.concat({work_id:id, user_id:S.me.id});
  render();
  const r = had ? await sb.from("likes").delete().eq("work_id", id).eq("user_id", S.me.id) : await sb.from("likes").insert({work_id:id});
  if (r.error && r.error.code !== "23505"){ await loadExtras(); render(); toast(r.error.code === "42501" ? "Curtir é exclusivo de quem tem OBORO+." : "Não foi possível curtir."); }
}
async function postComment(wid){
  const ta = $("#cm_body"); if (!ta || S.busy) return;
  const body = ta.value.trim();
  if (!needPlus("Comentar")) return;
  if (!body) return toast("Escreva algo antes de enviar.");
  S.busy = true;
  try{
    const r = await sb.from("comments").insert({work_id:wid, author_name:(S.me.name || "Leitor").slice(0, LIM.name), body:body.slice(0, LIM.comment)});
    if (r.error) throw r.error;
    ta.value = ""; await loadComments(wid); toast("Comentário enviado.");
  }catch(e){ toast(e && e.code === "42501" ? "Comentar é exclusivo de quem tem OBORO+." : "Não foi possível comentar."); }
  S.busy = false;
}
async function delComment(wid, id){
  if (S.busy) return; S.busy = true;
  try{
    const r = await sb.from("comments").delete().eq("id", id);
    if (r.error) throw r.error;
    S.comments[wid] = (S.comments[wid] || []).filter(c => c.id !== id); render();
  }catch(e){ toast("Não foi possível excluir o comentário."); }
  S.busy = false;
}
async function renameWork(id, v){
  const w = S.works.find(x => x.id === id && x.authorId === S.me.id); if (!w || S.busy) return;
  const title = v.trim().slice(0, LIM.title);
  if (!title) return toast("Dê um nome para a HQ.");
  if (title === w.title) return toast("Esse já é o nome da HQ.");
  S.busy = true;
  try{
    const r = await sb.from("works").update({title}).eq("id", id).eq("author_id", S.me.id);
    if (r.error) throw r.error;
    w.title = title; toast("Nome atualizado."); render();
  }catch(e){ toast("Não foi possível renomear. Tente de novo."); }
  S.busy = false;
}
async function saveProfile(){
  if (S.busy) return;
  const st = $("#pf_stat");
  const name = $("#pf_name").value.trim().slice(0, LIM.name), bio = $("#pf_bio").value.trim().slice(0, LIM.bio);
  if (!name){ if (st) st.textContent = "Digite um nome (1 a 40 caracteres)."; return; }
  if (!sb || !S.user) return;
  S.busy = true; if (st) st.textContent = "Salvando…";
  let ok = false;
  try{
    const u = await sb.auth.updateUser({data:{name, bio}});
    if (u.error) throw u.error;
    // a política de RLS só deixa o autor alterar as próprias obras
    const r = await sb.from("works").update({author_name:name}).eq("author_id", S.me.id);
    if (r.error) throw r.error;
    S.works.forEach(w => { if (w.authorId === S.me.id) w.authorName = name; });
    S.me.name = name; S.me.bio = bio;
    const p = await sb.from("profiles").upsert({id:S.me.id, bio}, {onConflict:"id"});
    if (!p.error) S.bios[S.me.id] = bio;
    ok = true;
  }catch(e){}
  S.busy = false;
  if (ok){ S.editProfile = false; toast("Perfil salvo."); render(); }
  else { const el = $("#pf_stat"); if (el) el.textContent = "Não foi possível salvar. Tente de novo."; }
}

// salvos: ficam no navegador e, com login, também na conta (tabela favorites, protegida por RLS)
async function loadFavs(){
  if (!sb || !S.user) return;
  try{
    const r = await sb.from("favorites").select("work_id");
    if (r.error) return;
    const server = new Set(r.data.map(x => x.work_id));
    const known = new Set(S.works.map(w => w.id));
    const local = ls.get("oboro:favs", []).filter(id => known.has(id));
    const add = local.filter(id => !server.has(id));
    if (add.length) await sb.from("favorites").upsert(add.map(id => ({work_id:id})), {onConflict:"user_id,work_id", ignoreDuplicates:true});
    S.favs = new Set(Array.from(server).concat(add));
    ls.set("oboro:favs", Array.from(S.favs));
  }catch(e){}
}
async function toggleFav(id){
  const had = S.favs.has(id);
  had ? S.favs.delete(id) : S.favs.add(id);
  ls.set("oboro:favs", Array.from(S.favs)); render();
  if (!sb || !S.user) return;
  const r = had ? await sb.from("favorites").delete().eq("work_id", id).eq("user_id", S.me.id) : await sb.from("favorites").insert({work_id:id});
  if (r.error && r.error.code !== "23505"){
    had ? S.favs.add(id) : S.favs.delete(id);
    ls.set("oboro:favs", Array.from(S.favs)); render();
    toast("Não foi possível atualizar seus salvos.");
  }
}
function recordRead(wid){
  const w = findWork(wid);
  if (!sb || !S.user || !w || w.authorId === S.me.id) return;
  sb.from("reads").upsert({work_id:wid, user_id:S.me.id}, {onConflict:"work_id,user_id", ignoreDuplicates:true}).then(() => {}, () => {});
}
async function getPages(wid, ci){
  const w = findWork(wid), c = w && w.chapters[ci];
  return c ? c.paths.map(pubUrl) : [];
}

/* ---------- Storage: envio, remoção e limpeza ---------- */
const PEND_KEY = "oboro:pending";
const pendList = () => ls.get(PEND_KEY, []);
function pendAdd(rec){ const l = pendList(); l.push(rec); ls.set(PEND_KEY, l.slice(-50)); }
function pendDrop(id){ ls.set(PEND_KEY, pendList().filter(r => r.id !== id)); }

async function uploadBlob(path, blob){
  let last;
  for (let t = 0; t < 3; t++){
    const r = await sb.storage.from(BUCKET).upload(path, blob, {contentType:"image/jpeg", upsert:false, cacheControl:"31536000"});
    if (!r.error) return;
    last = r.error;
    const m = String(last.message || "");
    if (/already exists|duplicate/i.test(m)) return;            // tentativa anterior chegou ao servidor
    const st = Number(last.statusCode || last.status || 0);
    if (st && st < 500 && !/fetch|network/i.test(m)) break;     // erro definitivo (permissão, tamanho, tipo)
    await sleep(700 * (t + 1));
  }
  throw last;
}
// só tenta apagar arquivos da pasta do próprio usuário (o Storage também exige isso)
async function removePaths(paths){
  const mine = Array.from(new Set(paths)).filter(p => S.me.id && p.startsWith(S.me.id + "/"));
  let ok = true;
  for (let i = 0; i < mine.length; i += 100){
    try{
      const r = await sb.storage.from(BUCKET).remove(mine.slice(i, i + 100));
      if (r.error) ok = false;
    }catch(e){ ok = false; }
  }
  return ok;
}
// limpa publicações cuja resposta se perdeu e exclusões que deixaram arquivos para trás
async function reconcile(){
  if (!sb || !S.user) return;
  for (const rec of pendList().filter(r => r.uid === S.me.id)){
    try{
      if (rec.chid){
        const r = await sb.from("chapters").select("id").eq("id", rec.chid).maybeSingle();
        if (r.error) continue;
        if (r.data){ pendDrop(rec.id); continue; }              // publicou de fato: mantém os arquivos
      }
      if (await removePaths(rec.paths)) pendDrop(rec.id);
    }catch(e){}
  }
}
async function removeWork(w){
  const r = await sb.from("works").delete().eq("id", w.id);
  if (r.error) throw r.error;
  S.works = S.works.filter(x => x.id !== w.id);
  const paths = [w.coverPath].concat((w.chapters || []).flatMap(c => c.paths || []));
  const ok = await removePaths(paths);
  if (!ok) pendAdd({id:uuid(), uid:S.me.id, paths, at:Date.now()});
  return ok;
}

/* ---------- imagens: validação real, redução e reencode ---------- */
class ImgError extends Error { constructor(code, name){ super(code); this.code = code; this.fname = name; } }
const asc = (b, a, z) => String.fromCharCode.apply(null, Array.from(b.slice(a, z)));
async function sniff(file){
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return "jpeg";
  if (b[0] === 0x89 && asc(b, 1, 4) === "PNG" && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A) return "png";
  if (asc(b, 0, 4) === "RIFF" && asc(b, 8, 12) === "WEBP") return "webp";
  return null;
}
async function decode(file){
  if (window.createImageBitmap){
    try{ const bm = await createImageBitmap(file); return {src:bm, w:bm.width, h:bm.height, close:() => bm.close && bm.close()}; }catch(e){}
  }
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file), i = new Image();
    i.onload = () => res({src:i, w:i.naturalWidth, h:i.naturalHeight, close:() => URL.revokeObjectURL(u)});
    i.onerror = () => { URL.revokeObjectURL(u); rej(new Error("decode")); };
    i.src = u;
  });
}
const toBlob = (c, q) => new Promise(res => c.toBlob(res, "image/jpeg", q));
async function prepareImage(file, o){
  const name = file.name || "imagem";
  if (file.size > LIM.rawBytes) throw new ImgError("big", name);
  if (!(await sniff(file))) throw new ImgError("type", name);         // confere os bytes, não a extensão
  let d; try{ d = await decode(file); }catch(e){ throw new ImgError("decode", name); }
  try{
    if (!d.w || !d.h || d.w * d.h > LIM.maxSourcePixels) throw new ImgError("dims", name);
    let sx = 0, sy = 0, sw = d.w, sh = d.h, w, h;
    if (o.cover){
      w = LIM.coverW; h = LIM.coverH;
      const r = w / h, ir = sw / sh;
      if (ir > r){ const nw = sh * r; sx = (sw - nw) / 2; sw = nw; } else { const nh = sw / r; sy = (sh - nh) / 2; sh = nh; }
    } else {
      w = Math.min(LIM.pageW, d.w); h = Math.round(d.h * (w / d.w));
      if (w * h > LIM.maxPixels){ const k = Math.sqrt(LIM.maxPixels / (w * h)); w = Math.round(w * k); h = Math.round(h * k); }
    }
    const max = o.cover ? LIM.coverBytes : LIM.pageBytes;
    let scale = 1, q = o.cover ? 0.86 : 0.82, blob = null;
    for (let k = 0; k < 10; k++){
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
      const x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(d.src, sx, sy, sw, sh, 0, 0, c.width, c.height);
      blob = await toBlob(c, q);
      c.width = c.height = 0;
      if (!blob) throw new ImgError("decode", name);
      if (blob.size <= max) return blob;
      if (q > 0.55) q -= 0.09; else scale *= 0.85;
    }
    throw new ImgError("big", name);
  } finally { d.close(); }
}
function imgMsg(e){
  const n = e && e.fname ? `“${e.fname}”` : "A imagem";
  switch (e && e.code){
    case "type": return `${n} não é uma imagem JPG, PNG ou WebP válida.`;
    case "big": return `${n} é grande demais. Use uma imagem de até 30 MB.`;
    case "dims": return `${n} tem dimensões inválidas.`;
    default: return `Não foi possível ler ${n}.`;
  }
}

/* ---------- telas ---------- */
function coverHTML(w, cls){
  const tag = w.original ? '<span class="tag">original</span>' : "";
  if (w.cover) return `<span class="cover ${cls||""}"><img src="${esc(w.cover)}" alt="" width="480" height="720" loading="lazy" decoding="async">${tag}</span>`;
  return `<span class="cover ph ${cls||""}">${esc(w.title)}</span>`;
}
function cardHTML(w){
  return `<button class="card" data-act="open" data-id="${esc(w.id)}">${coverHTML(w)}<span class="cap">${esc(w.title)}</span><span class="by">por ${esc(w.authorName || "autor")}</span><span class="gn">${esc(w.genre)}</span></button>`;
}
function skeletons(n){ return `<div class="grid" aria-hidden="true">${'<div class="card sk"><span class="cover"></span><span class="cap">&nbsp;</span></div>'.repeat(n)}</div>`; }
function topbar(){
  const back = ["detail","publish","author","plus"].includes(S.view);
  const left = back
    ? `<button class="ibtn" data-act="back" aria-label="Voltar">${I.back}</button>`
    : `<button class="avatar" data-act="tab" data-tab="profile" aria-label="Abrir perfil"><img src="${IMG.avatar}" alt=""></button>`;
  return `<header class="top">${left}<button class="brand" data-act="tab" data-tab="home" aria-label="OBORO, início">OBORO</button><span class="topr"><button class="ibtn dash${S.view==="dashboard"?" on":""}" data-act="tab" data-tab="dashboard" aria-label="Dashboard">${I.chart}</button><button class="ibtn mark${S.view==="library"?" on":""}" data-act="tab" data-tab="library" aria-label="Meus salvos">${I.mark}</button></span></header>`;
}
function emptyCommunity(){
  if (!S.loaded && !S.loadErr) return skeletons(4);
  if (S.loadErr) return `<div class="empty"><p>Não foi possível carregar as obras.</p><button class="btn" data-act="reload">Tentar de novo</button></div>`;
  return `<div class="empty"><img class="mascot" src="${IMG.avatar}" alt=""><p>Ainda não há quadrinhos da comunidade. Publique o primeiro e ele aparece aqui para todo mundo.</p><button class="btn" data-act="newwork">${I.plus}Publicar QH</button></div>`;
}
function homeHTML(){
  const comm = S.works.slice().sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
  const f = comm.find(w => w.cover && w.chapters.length);
  const hero = f ? `<section class="feature" aria-label="Em destaque">
      <button class="fcover" data-act="open" data-id="${esc(f.id)}" aria-label="Abrir ${esc(f.title)}">${coverHTML(f)}</button>
      <div class="finfo"><span class="kicker">em destaque</span><h2>${esc(f.title)}</h2><p class="by">por ${esc(f.authorName || "autor")}</p>
        <div class="chips"><span class="chip on">${esc(f.genre)}</span><span class="chip">${esc(f.age)}</span></div>
        <button class="btn" data-act="read" data-id="${esc(f.id)}" data-ch="${f.chapters.length - 1}">${I.book}Ler agora</button></div></section>` : "";
  return `${hero}
    ${ORIGINALS.length ? `<h2 class="h2">originais oboro</h2><div class="grid">${ORIGINALS.map(cardHTML).join("")}</div>` : ""}
    <h2 class="h2">novos da comunidade</h2>
    ${comm.length ? `<div class="grid">${comm.map(cardHTML).join("")}</div>` : emptyCommunity()}`;
}
function searchHTML(){
  return `<h1 class="h1">buscar</h1>
    <div class="search"><input id="q" type="search" placeholder="Título, autor ou gênero" value="${esc(S.q)}" aria-label="Buscar quadrinhos" autocomplete="off">${I.searchIc}</div>
    <div class="chips scroll" id="genres" role="group" aria-label="Filtrar por gênero">${genreChips()}</div>
    <div id="results"></div>`;
}
function genreChips(){
  return ['<button class="chip'+(S.genre===""?" on":"")+'" data-act="genre" data-g="" aria-pressed="'+(S.genre==="")+'">Todos</button>']
    .concat(GENRES.map(g => `<button class="chip${S.genre===g?" on":""}" data-act="genre" data-g="${esc(g)}" aria-pressed="${S.genre===g}">${esc(g)}</button>`)).join("");
}
function resultsHTML(){
  const q = norm(S.q.trim());
  const list = allWorks().filter(w =>
    (!S.genre || w.genre === S.genre) &&
    (!q || [w.title, w.authorName, w.genre].some(x => norm(x).includes(q))));
  if (!list.length && !S.loaded && !S.loadErr) return skeletons(4);
  if (!list.length) return `<div class="empty"><p>Nada encontrado${q ? ` para “${esc(S.q.trim())}”` : ""}. Tente outro gênero ou termo.</p></div>`;
  return `<p class="sub">${list.length} ${list.length > 1 ? "obras" : "obra"}</p><div class="grid">${list.map(cardHTML).join("")}</div>`;
}
function libraryHTML(){
  const list = allWorks().filter(w => S.favs.has(w.id));
  return `<h1 class="h1">meus salvos</h1>` + (list.length
    ? `<div class="grid">${list.map(cardHTML).join("")}</div>`
    : `<div class="empty"><p>Toque em Salvar na página de uma obra para guardar aqui.</p><button class="btn" data-act="tab" data-tab="home">Ver obras</button></div>`);
}
function authorHTML(){
  const list = S.works.filter(w => w.authorId === S.authorId);
  const own = !!S.user && S.authorId === S.me.id;
  const name = list[0] ? list[0].authorName : (own && S.me.name) || "Autor";
  const bio = own ? S.me.bio : (S.bios[S.authorId] || "");
  return `<div class="me"><span class="avatar"><img src="${IMG.avatar}" alt=""></span><div class="who"><h1 class="h1 nm">${esc(name)}</h1></div></div>
    ${bio ? `<p class="bio">${esc(bio)}</p>` : ""}
    ${own ? `<div class="row"><button class="btn" data-act="editprofile">Editar perfil</button></div>` : ""}
    <p class="sub subgap">${list.length} ${list.length === 1 ? "obra publicada" : "obras publicadas"}</p>` +
    (list.length ? `<div class="grid">${list.map(cardHTML).join("")}</div>` : `<div class="empty"><p>Este autor ainda não tem obras.</p></div>`);
}

function dashData(){
  const mine = myWorks();
  const ids = new Set(mine.map(w => w.id));
  const chapters = mine.reduce((n,w) => n + (w.chapters||[]).length, 0);
  const pages = mine.reduce((n,w) => n + (w.chapters||[]).reduce((m,c) => m + (c.pages||0), 0), 0);
  const rs = S.reads.filter(r => ids.has(r.w) && r.u !== S.me.id);
  const readers = new Set(rs.map(r => r.u + "|" + r.w)).size;
  const start = new Date(); start.setHours(0,0,0,0);
  const days = [];
  for (let i = 6; i >= 0; i--){
    const d0 = new Date(start); d0.setDate(d0.getDate() - i);
    const d1 = new Date(d0); d1.setDate(d1.getDate() + 1);
    days.push({label:DAYS[d0.getDay()], n:rs.filter(r => r.at >= d0.getTime() && r.at < d1.getTime()).length});
  }
  const likes = mine.reduce((n,w) => n + likesOf(w.id), 0);
  return {mine, chapters, pages, readers, likes, days};
}
function themeChips(){
  return `<h2 class="h2">tema</h2><div class="chips" role="group" aria-label="Tema do app">
      <button class="chip${S.theme==="light"?" on":""}" data-act="theme" data-t="light" aria-pressed="${S.theme==="light"}">Claro</button>
      <button class="chip${S.theme==="dark"?" on":""}" data-act="theme" data-t="dark" aria-pressed="${S.theme==="dark"}">Escuro</button></div>`;
}
function authHTML(){
  if (S.recovery) return `<h1 class="h1">nova senha</h1>
    <form class="form" id="authform" novalidate>
      <div class="note">Escolha uma nova senha para a sua conta.</div>
      <div class="f"><label for="a_pass">Nova senha</label><input id="a_pass" type="password" autocomplete="new-password" placeholder="Mínimo ${LIM.pass} caracteres"></div>
      <button class="btn" type="submit">Salvar nova senha</button>
      <div class="stat" id="a_msg" aria-live="polite">${esc(S.authMsg)}</div>
    </form>`;
  const m = S.authMode;
  return `<h1 class="h1">perfil</h1>
    <form class="form" id="authform" novalidate>
      <div class="seg" role="tablist" aria-label="Entrar ou criar conta">
        <button type="button" role="tab" class="${m==="signup"?"":"on"}" aria-selected="${m!=="signup"}" data-act="authmode" data-m="login">Entrar</button>
        <button type="button" role="tab" class="${m==="signup"?"on":""}" aria-selected="${m==="signup"}" data-act="authmode" data-m="signup">Criar conta</button>
      </div>
      <div class="note">${m==="reset" ? "Informe o e-mail da conta. Enviaremos um link para criar uma nova senha." : "Entre ou crie uma conta para publicar QHs, sincronizar seus salvos e ver o dashboard."}</div>
      <div class="f"><label for="a_email">E-mail</label><input id="a_email" type="email" autocomplete="email" inputmode="email" placeholder="voce@email.com" value="${esc(S.authEmail)}"></div>
      ${m==="reset" ? "" : `<div class="f"><label for="a_pass">Senha</label><input id="a_pass" type="password" autocomplete="${m==="signup"?"new-password":"current-password"}" placeholder="Mínimo ${LIM.pass} caracteres"></div>`}
      <button class="btn" type="submit" id="a_go">${m==="signup" ? "Criar conta" : m==="reset" ? "Enviar link" : "Entrar"}</button>
      <button class="link" type="button" data-act="authmode" data-m="${m==="reset" ? "login" : "reset"}">${m==="reset" ? "Voltar para o login" : "Esqueci minha senha"}</button>
      <div class="stat" id="a_msg" aria-live="polite">${esc(S.authMsg)}</div>
    </form>${themeChips()}`;
}
function authErr(e){
  const AUTH = {
    invalid_credentials:"E-mail ou senha incorretos.",
    email_not_confirmed:"Confirme seu e-mail antes de entrar. Procure o link na caixa de entrada (e no spam).",
    user_already_exists:"Este e-mail já tem conta. Toque em Entrar.",
    weak_password:"Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
    over_request_rate_limit:"Muitas tentativas. Aguarde um pouco e tente de novo.",
    over_email_send_rate_limit:"Muitos e-mails enviados. Tente de novo em alguns minutos.",
    signup_disabled:"Novos cadastros estão desativados no momento.",
    same_password:"A nova senha precisa ser diferente da atual.",
    validation_failed:"Confira o e-mail e a senha informados."
  };
  if (e && AUTH[e.code]) return AUTH[e.code];
  const m = String((e && e.message) || "");
  if (/fetch|network|failed to/i.test(m)) return "Sem conexão. Verifique a internet.";
  if (/invalid login/i.test(m)) return AUTH.invalid_credentials;
  if (/not confirmed/i.test(m)) return AUTH.email_not_confirmed;
  if (/already/i.test(m)) return AUTH.user_already_exists;
  if (e && e.status === 429) return AUTH.over_request_rate_limit;
  return "Não foi possível continuar. Tente de novo.";
}
function lockAuth(on){ document.querySelectorAll("#authform button, #authform input").forEach(el => el.disabled = on); }
async function doAuth(){
  if (S.busy) return;
  const msg = $("#a_msg"); if (!msg) return;
  if (!sb){ msg.textContent = "Sem conexão com o servidor."; return; }
  const mode = S.recovery ? "recovery" : S.authMode;
  const emailEl = $("#a_email"), passEl = $("#a_pass");
  const email = emailEl ? emailEl.value.trim() : "", pass = passEl ? passEl.value : "";
  if (emailEl) S.authEmail = email;
  if (mode !== "recovery" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ msg.textContent = "Informe um e-mail válido."; emailEl.focus(); return; }
  if (mode !== "reset" && pass.length < LIM.pass){ msg.textContent = `A senha precisa ter pelo menos ${LIM.pass} caracteres.`; passEl.focus(); return; }
  msg.textContent = {login:"Entrando…", signup:"Criando conta…", reset:"Enviando…", recovery:"Salvando…"}[mode];
  S.busy = true; lockAuth(true);
  let done = "";
  try{
    if (mode === "login"){
      const r = await sb.auth.signInWithPassword({email, password:pass});
      if (r.error) throw r.error;
    } else if (mode === "signup"){
      const r = await sb.auth.signUp({email, password:pass, options:{emailRedirectTo:siteUrl()}});
      if (r.error) throw r.error;
      const u = r.data.user;
      if (!r.data.session){
        done = (u && Array.isArray(u.identities) && u.identities.length === 0)
          ? "Este e-mail já tem conta. Toque em Entrar ou recupere a senha."
          : `Quase lá! Enviamos um link de confirmação para ${email}. Abra-o e depois toque em Entrar.`;
        if (u && Array.isArray(u.identities) && u.identities.length > 0) S.authMode = "login";
      }
    } else if (mode === "reset"){
      const r = await sb.auth.resetPasswordForEmail(email, {redirectTo:siteUrl()});
      if (r.error) throw r.error;
      done = "Se esse e-mail tiver conta, o link de recuperação já está a caminho.";
    } else {
      const r = await sb.auth.updateUser({password:pass});
      if (r.error) throw r.error;
      S.recovery = false; toast("Senha atualizada.");
    }
    S.authMsg = done;
  }catch(e){ S.authMsg = authErr(e); }
  S.busy = false;
  if (S.view === "profile"){ if (S.user && !S.recovery) render(); else { render(); } }
}
function setUser(u){
  S.user = u || null;
  S.me.id = u ? u.id : null;
  S.me.name = u ? (((u.user_metadata && u.user_metadata.name) || (u.email || "").split("@")[0] || "").slice(0, LIM.name)) : "";
  S.me.bio = u && u.user_metadata && u.user_metadata.bio ? String(u.user_metadata.bio).slice(0, LIM.bio) : "";
}
function badgeHTML(){ return isPlus() ? '<span class="plusbadge" title="OBORO+">+</span>' : ""; }
function walletCardHTML(){
  const w = S.wallet;
  return `<button class="wallet" data-act="plus"><span class="wl"><span class="cn">${I.coin}</span><span><b>${w ? fmt(w.coins) : "—"}</b><small>OboroCoin</small></span></span>
    <span class="wr">${isPlus() ? "OBORO+ ativo" : "Conhecer OBORO+"}${I.right}</span></button>`;
}
function profileHTML(){
  if (!S.user || S.recovery) return authHTML();
  if (S.editProfile) return `<h1 class="h1">editar perfil</h1>
    <form class="form" id="profform" novalidate>
      <div class="f"><label for="pf_name">Nome</label><input id="pf_name" type="text" maxlength="${LIM.name}" placeholder="Seu nome ou pseudônimo" value="${esc(S.me.name)}" autocomplete="nickname"></div>
      <div class="f"><label for="pf_bio">Bio</label><textarea id="pf_bio" maxlength="${LIM.bio}" placeholder="Conte um pouco sobre você">${esc(S.me.bio)}</textarea><span class="hint">Até ${LIM.bio} caracteres.</span></div>
      <div class="row"><button class="btn" type="submit">Salvar</button><button class="btn ghost" type="button" data-act="cancelprofile">Cancelar</button></div>
      <div class="stat" id="pf_stat" aria-live="polite"></div>
    </form>`;
  return `<h1 class="h1">perfil</h1>
    <div class="me"><span class="avatar"><img src="${IMG.avatar}" alt=""></span>
      <div class="who"><b class="nm">${esc(S.me.name || "Sem nome")}</b>${badgeHTML()}</div></div>
    ${S.me.bio ? `<p class="bio">${esc(S.me.bio)}</p>` : `<p class="bio mute">Você ainda não escreveu uma bio.</p>`}
    <div class="row"><button class="btn" data-act="editprofile">Editar perfil</button>
    <button class="btn ghost" data-act="logout">Sair</button></div>
    <h2 class="h2">oboro+</h2>${walletCardHTML()}
    ${themeChips()}`;
}
function dashboardHTML(){
  if (!S.user || S.recovery) return `<h1 class="h1">dashboard</h1><div class="empty"><p>Entre na sua conta para gerenciar suas obras e ver as métricas.</p><button class="btn" data-act="tab" data-tab="profile">Entrar</button></div>`;
  const D = dashData();
  const max = Math.max(1, ...D.days.map(d => d.n));
  const topR = Math.max(1, ...D.mine.map(w => readersOf(w.id)));
  const rows = D.mine.map(w => {
    const r = readersOf(w.id), open = S.dashOpen === w.id, chs = w.chapters || [];
    const panel = !open ? "" : `<div class="mpanel">
      <form class="renform" data-id="${esc(w.id)}"><label for="rn_${esc(w.id)}">Nome da HQ</label>
        <div class="rn"><input id="rn_${esc(w.id)}" type="text" maxlength="${LIM.title}" value="${esc(w.title)}"><button class="btn sm" type="submit">Salvar</button></div></form>
      <h4>Capítulos</h4>
      ${chs.length ? chs.map((c, i) => `<div class="mch"><span class="t">${i+1}. ${esc(c.title)}<small>${c.pages} pág.</small></span>
        <button class="btn alt sm" data-act="addpages" data-id="${esc(w.id)}" data-ch="${esc(c.id)}">${I.plus}Páginas</button></div>`).join("") : `<p class="sub">Nenhum capítulo ainda.</p>`}
      <div class="row owner"><button class="btn sm" data-act="newch" data-id="${esc(w.id)}">${I.plus}Novo capítulo</button>
        <button class="btn alt sm" data-act="open" data-id="${esc(w.id)}">Ver obra</button>
        ${S.confirmDel ? `<button class="btn warn sm" data-act="delwork" data-id="${esc(w.id)}">Confirmar exclusão</button><button class="btn ghost sm" data-act="canceldel">Cancelar</button>` : `<button class="btn warn sm" data-act="askdel">Excluir</button>`}</div>
      ${S.confirmDel ? `<p class="note warnnote">Isso apaga a obra, os capítulos, as imagens e as leituras. Não dá para desfazer.</p>` : ""}
    </div>`;
    return `<div class="mw"><button class="work" data-act="dopen" data-id="${esc(w.id)}" aria-expanded="${open}">
      <span class="thumb">${w.cover ? `<img src="${esc(w.cover)}" alt="" loading="lazy" decoding="async">` : ""}</span>
      <span><span class="t">${esc(w.title)}</span><br><span class="m">${(w.chapters||[]).length} cap. · ${esc(w.genre)} · ${fmt(likesOf(w.id))} curtidas</span>
        <span class="meter" aria-hidden="true"><i style="width:${Math.round(r/topR*100)}%"></i></span></span>
      <span class="n">${fmt(r)}<small>leitores</small></span></button>${panel}</div>`;
  }).join("");
  return `<h1 class="h1">dashboard</h1>
    <div class="row"><button class="btn" data-act="newwork">${I.plus}Publicar QH</button><button class="btn alt" data-act="plus">${I.coin}${S.wallet ? fmt(S.wallet.coins) : "OboroCoin"}</button></div>
    <h2 class="h2">resumo</h2>
    <div class="tiles">
      <div class="tile"><b>${fmt(D.mine.length)}</b><span>obras</span></div>
      <div class="tile"><b>${fmt(D.chapters)}</b><span>capítulos</span></div>
      <div class="tile"><b>${fmt(D.pages)}</b><span>páginas</span></div>
      <div class="tile"><b>${fmt(D.readers)}</b><span>leitores</span></div>
      <div class="tile"><b>${fmt(D.likes)}</b><span>curtidas</span></div>
    </div>
    <div class="panel"><h3>Novos leitores</h3><p class="sub">Últimos 7 dias, contando só quem não é você</p>
      <div class="bars">${D.days.map(d => `<div class="bar${d.n?"":" zero"}"><span>${d.n}</span><i style="height:${Math.max(4, Math.round(d.n/max*92))}px"></i></div>`).join("")}</div>
      <div class="days">${D.days.map(d => `<span>${d.label}</span>`).join("")}</div></div>
    <h2 class="h2">gerenciar obras</h2>
    <div class="panel"><p class="sub">Toque numa obra para renomear, adicionar páginas, criar capítulo ou excluir</p>
      ${rows || `<div class="empty flat"><p>Você ainda não publicou nada. Sua primeira obra aparece aqui com as métricas.</p></div>`}</div>`;
}
const TXR = {daily:"Bônus diário", plus:"Assinatura OBORO+"};
function plusHTML(){
  const head = `<h1 class="h1">oboro+</h1>`;
  if (!S.user) return head + `<div class="empty"><p>Entre para usar o OBORO+ e o OboroCoin.</p><button class="btn" data-act="tab" data-tab="profile">Entrar</button></div>`;
  if (S.walletErr) return head + `<div class="empty"><p>O OBORO+ ainda está sendo ativado neste servidor. Tente de novo mais tarde.</p><button class="btn" data-act="reload">Tentar de novo</button></div>`;
  if (!S.wallet) return head + skeletons(2);
  const w = S.wallet, plus = isPlus(), claimed = w.last === todaySP();
  return head + `<div class="plushero"><span class="kicker">moeda do oboro</span>
      <div class="bal"><span class="cn big">${I.coin}</span><b>${fmt(w.coins)}</b><small>OboroCoin</small></div>
      <p class="pst">${plus ? `OBORO+ ativo até ${new Date(w.until).toLocaleDateString("pt-BR")}` : "Você ainda não assina o OBORO+"}</p></div>
    <div class="panel"><h3>Vantagens do OBORO+</h3>
      <ul class="perks"><li>Curtir as obras que você lê</li><li>Comentar nos quadrinhos</li><li>Selo + no seu perfil</li><li>Bônus diário em dobro (${DAILY_PLUS} OboroCoin)</li></ul>
      <button class="btn" data-act="buyplus" ${w.coins < PLUS_PRICE ? "disabled" : ""}>${I.star}${plus ? "Renovar" : "Assinar"} · ${PLUS_PRICE} OboroCoin / ${PLUS_DAYS} dias</button>
      ${w.coins < PLUS_PRICE ? `<p class="sub subgap">Faltam ${fmt(PLUS_PRICE - w.coins)} OboroCoin. Resgate o bônus diário para juntar.</p>` : ""}</div>
    <div class="panel"><h3>Bônus diário</h3><p class="sub">${plus ? DAILY_PLUS : DAILY} OboroCoin por dia${plus ? "" : ` (${DAILY_PLUS} com OBORO+)`}</p>
      <button class="btn alt" data-act="claim" ${claimed ? "disabled" : ""}>${claimed ? "Já resgatado hoje" : "Resgatar agora"}</button></div>
    ${S.tx.length ? `<div class="panel"><h3>Últimas movimentações</h3>${S.tx.map(t => `<div class="txr"><span>${esc(TXR[t.reason] || t.reason)}<small>${new Date(t.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</small></span><b class="${t.delta < 0 ? "neg" : "pos"}">${t.delta > 0 ? "+" : ""}${fmt(t.delta)}</b></div>`).join("")}</div>` : ""}
    <p class="note">OboroCoin é a moeda do Oboro: você ganha usando o app e gasta aqui dentro. Ela não vale dinheiro.</p>`;
}
function commentsHTML(w){
  const list = S.comments[w.id] || [];
  const form = !S.user ? `<div class="note">Entre na sua conta para participar.</div>`
    : isPlus() ? `<form class="form" id="cmform" data-id="${esc(w.id)}" novalidate><div class="f"><label for="cm_body">Seu comentário</label><textarea id="cm_body" maxlength="${LIM.comment}" placeholder="O que você achou?"></textarea></div><button class="btn" type="submit">Comentar</button></form>`
    : `<div class="note">Comentar e curtir são exclusivos de quem tem OBORO+.</div><button class="btn alt" data-act="plus">${I.star}Conhecer OBORO+</button>`;
  const items = list.map(c => `<div class="cmi"><b>${esc(c.author_name || "Leitor")}</b><span class="m">${new Date(c.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</span>
    <p>${esc(c.body)}</p>${S.user && (c.user_id === S.me.id || w.authorId === S.me.id) ? `<button class="link sm" data-act="delcm" data-id="${esc(c.id)}" data-w="${esc(w.id)}">Excluir</button>` : ""}</div>`).join("");
  return `<h2 class="h2">comentários</h2>${form}${items ? `<div class="chlist cms">${items}</div>` : ""}`;
}
function detailHTML(){
  const w = findWork(S.detailId);
  if (!w) return `<div class="empty"><p>Esta obra não existe mais.</p><button class="btn" data-act="tab" data-tab="home">Voltar ao início</button></div>`;
  const mine = !w.original && !!S.user && w.authorId === S.me.id;
  const saved = S.favs.has(w.id);
  const chs = w.chapters || [];
  return `<div class="hero">${coverHTML(w)}<div><h1>${esc(w.title)}</h1>
      ${w.authorId ? `<button class="by lnk" data-act="author" data-id="${esc(w.authorId)}">por ${esc(w.authorName || "autor")}</button>` : `<div class="by">por ${esc(w.authorName || "autor")}</div>`}
      <div class="chips"><span class="chip on">${esc(w.genre)}</span><span class="chip">${esc(w.age)}</span></div></div></div>
    <div class="row">
      <button class="btn" data-act="read" data-id="${esc(w.id)}" data-ch="0" ${chs.length ? "" : "disabled"}>${I.book}${chs.length ? "Ler capítulo 1" : "Sem capítulos"}</button>
      <button class="btn alt" data-act="fav" data-id="${esc(w.id)}" aria-pressed="${saved}">${saved ? "Salvo ✓" : "Salvar"}</button>
      ${w.original ? "" : `<button class="btn alt" data-act="like" data-id="${esc(w.id)}" aria-pressed="${iLiked(w.id)}" aria-label="Curtir">${I.heart}${fmt(likesOf(w.id))}</button>`}
    </div>
    <div class="syn">${w.synopsis ? esc(w.synopsis) : "Sinopse em breve."}</div>
    <p class="note">Leitura: ${esc(MODES[w.mode] || MODES.v)}${mine ? ` · ${fmt(readersOf(w.id))} leitores` : ""}</p>
    <h2 class="h2">capítulos</h2>
    ${chs.length ? `<div class="chlist">${chs.map((c,i) => `<button class="ch" data-act="read" data-id="${esc(w.id)}" data-ch="${i}"><span class="n">${i+1}</span><span class="t">${esc(c.title)}</span><span class="m">${c.pages} pág. · ${new Date(c.at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</span></button>`).join("")}</div>`
      : `<div class="empty"><p>Os capítulos ainda não foram publicados.</p></div>`}
    ${mine ? `<div class="row owner">
      <button class="btn" data-act="newch" data-id="${esc(w.id)}">${I.plus}Novo capítulo</button>
      ${S.confirmDel ? `<button class="btn warn" data-act="delwork" data-id="${esc(w.id)}">Confirmar exclusão</button><button class="btn ghost" data-act="canceldel">Cancelar</button>` : `<button class="btn warn" data-act="askdel">Excluir obra</button>`}
    </div>${S.confirmDel ? `<p class="note warnnote">Isso apaga a obra, os capítulos, as imagens e as leituras. Não dá para desfazer.</p>` : ""}` : ""}
    ${w.original ? "" : commentsHTML(w)}`;
}
function pubThumbsHTML(){
  const pg = S.pub.pages;
  return pg.map((p, i) => `<div class="th"><img src="${esc(p.url)}" alt="Página ${i+1}"><em>${i+1}</em>
    <button type="button" class="x" data-act="rmpage" data-i="${i}" aria-label="Remover página ${i+1}">×</button>
    <span class="mv"><button type="button" data-act="mvpage" data-i="${i}" data-d="-1" aria-label="Mover página ${i+1} para antes" ${i===0?"disabled":""}>${I.left}</button><button type="button" data-act="mvpage" data-i="${i}" data-d="1" aria-label="Mover página ${i+1} para depois" ${i===pg.length-1?"disabled":""}>${I.right}</button></span></div>`).join("");
}
function publishHTML(){
  const p = S.pub, ch = !!p.workId, ap = !!p.chapterId;
  const opt = (arr, v) => arr.map(x => `<option${x===v?" selected":""}>${esc(x)}</option>`).join("");
  return `<h1 class="h1">${ap ? "adicionar páginas" : ch ? "novo capítulo" : "publicar qh"}</h1>
    <form class="form" id="pubform" autocomplete="off" novalidate>
      ${ch ? `<div class="note">Obra: <b>${esc(p.title)}</b>${ap ? ` · Capítulo: <b>${esc(p.chName)}</b>` : ""}</div>` : `
      <div class="step"><span>1</span>Sobre a obra</div>
      <div class="f"><label for="p_title">Título</label><input id="p_title" type="text" maxlength="${LIM.title}" value="${esc(p.title)}" placeholder="Nome da sua QH"></div>
      <div class="two">
        <div class="f"><label for="p_genre">Gênero</label><select id="p_genre">${opt(GENRES, p.genre)}</select></div>
        <div class="f"><label for="p_age">Classificação</label><select id="p_age">${opt(AGES, p.age)}</select></div>
      </div>
      <div class="f"><label for="p_mode">Direção de leitura</label><select id="p_mode">${Object.entries(MODES).map(([k,v]) => `<option value="${k}"${p.mode===k?" selected":""}>${esc(v)}</option>`).join("")}</select></div>
      <div class="f"><label for="p_syn">Sinopse</label><textarea id="p_syn" maxlength="${LIM.synopsis}" placeholder="Do que se trata a história?">${esc(p.synopsis)}</textarea></div>
      <div class="f"><span class="lab">Capa</span>
        <label class="file"><input id="p_cover" type="file" accept="image/jpeg,image/png,image/webp">Escolher imagem da capa</label>
        <span class="hint">JPG, PNG ou WebP. Vira 480×720 (2:3).</span>
        <div id="covbox">${p.cover ? `<div class="covprev"><img src="${esc(p.cover.url)}" alt="Prévia da capa"></div>` : ""}</div></div>`}
      ${ap ? "" : `<div class="step"><span>${ch ? "1" : "2"}</span>Capítulo</div>
      <div class="f"><label for="p_chtitle">Título do capítulo</label><input id="p_chtitle" type="text" maxlength="${LIM.title}" value="${esc(p.chTitle)}" placeholder="${ch ? "Ex.: O reencontro" : "Ex.: O começo"}"></div>`}
      <div class="f"><span class="lab">Páginas</span>
        <label class="file"><input id="p_pages" type="file" accept="image/jpeg,image/png,image/webp" multiple>Escolher páginas (várias)</label>
        <span class="hint">Até ${LIM.pages} páginas, na ordem do nome do arquivo. Reordene abaixo se precisar. Para webtoon, envie a tira já fatiada.</span>
        <div class="stat" id="pstat" aria-live="polite"></div><div class="thumbs" id="thumbs"></div></div>
      <button class="btn" type="submit" id="pubbtn">${ap ? "Adicionar páginas" : "Publicar"}</button>
      <div class="progress" id="pubprog" hidden><progress id="pubbar" max="100" value="0"></progress></div>
      <div class="stat" id="pubstat" aria-live="polite"></div>
    </form>`;
}

function render(){
  const v = $("#view");
  let body = "";
  switch (S.view){
    case "home": body = homeHTML(); break;
    case "search": body = searchHTML(); break;
    case "profile": body = profileHTML(); break;
    case "library": body = libraryHTML(); break;
    case "dashboard": body = dashboardHTML(); break;
    case "plus": body = plusHTML(); break;
    case "detail": body = detailHTML(); break;
    case "author": body = authorHTML(); break;
    case "publish": body = publishHTML(); break;
  }
  const dr = $("#cm_body"), draft = dr ? dr.value : "";
  v.innerHTML = topbar() + body;
  if (draft){ const n = $("#cm_body"); if (n) n.value = draft; }
  if (S.view === "search") $("#results").innerHTML = resultsHTML();
  if (S.view === "publish") renderThumbs();
  document.querySelectorAll(".tab").forEach(t => {
    const on = t.dataset.tab === S.view || (["detail","author"].includes(S.view) && t.dataset.tab === "home") || (S.view === "plus" && t.dataset.tab === "profile");
    on ? t.setAttribute("aria-current","page") : t.removeAttribute("aria-current");
  });
}
function refresh(){
  if (S.view === "publish" || !$("#reader").hidden) return;
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;     // não apaga o que a pessoa está digitando
  if (S.view === "search"){ $("#results").innerHTML = resultsHTML(); return; }
  const y = window.scrollY; render(); window.scrollTo(0, y);
}
function go(view, opts){
  opts = opts || {};
  if (opts.push) S.prev.push(S.view); else S.prev = [];
  S.view = view; S.confirmDel = false; S.editProfile = !!opts.edit;
  render(); window.scrollTo(0, 0);
  try{
    if (opts.push) history.pushState({v:1}, "");
    else history.replaceState(null, "", "#" + {home:"inicio",search:"buscar",profile:"perfil",library:"salvos",dashboard:"dashboard",plus:"plus"}[view]);
  }catch(e){}
}
function stepBack(){ S.view = S.prev.pop() || "home"; S.confirmDel = false; render(); window.scrollTo(0, 0); }
function pubDirty(){ const p = S.pub; return !!(p && (p.pages.length || p.cover || p.title || p.chTitle)); }
function back(){
  if (S.busy) return;
  if (S.view === "publish" && pubDirty() && !confirm("Descartar o que você preencheu?")) return;
  if (history.state && history.state.v) history.back(); else stepBack();
}
// botão voltar do celular: fecha o leitor ou volta uma tela, em vez de sair do app
window.addEventListener("popstate", () => {
  if (!$("#reader").hidden){ hardCloseReader(); return; }
  if (S.prev.length) stepBack();
});
window.addEventListener("beforeunload", ev => { if (S.busy && S.view === "publish"){ ev.preventDefault(); ev.returnValue = ""; } });
let toastT;
function toast(msg){
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3600);
}

/* ---------- publicar ---------- */
function freePub(p){
  if (!p) return;
  if (p.cover) URL.revokeObjectURL(p.cover.url);
  p.pages.forEach(x => URL.revokeObjectURL(x.url));
}
function newPub(workId, chapterId){
  if (!S.user){ S.authMode = "login"; S.authMsg = "Entre para publicar."; go("profile"); return toast("Entre ou crie uma conta para publicar."); }
  freePub(S.pub);
  const w = workId ? findWork(workId) : null;
  const c = w && chapterId ? w.chapters.find(x => x.id === chapterId) : null;
  S.pub = {workId:workId || null, chapterId:c ? c.id : null, chName:c ? c.title : "", title:w ? w.title : "", genre:GENRES[0], age:AGES[0], mode:"v", synopsis:"", cover:null, chTitle:"", pages:[]};
  go("publish", {push:true});
}
function renderThumbs(){
  const th = $("#thumbs"); if (!th) return;
  th.innerHTML = pubThumbsHTML();
  const st = $("#pstat"); if (st && !st.dataset.busy){ const n = S.pub.pages.length; st.textContent = n ? `${n} página${n>1?"s":""} pronta${n>1?"s":""} (máx. ${LIM.pages})` : "Nenhuma página escolhida."; }
}
async function onPages(files){
  const list = Array.from(files).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric:true}));
  const st = $("#pstat"); st.dataset.busy = "1";
  let bad = 0;
  for (let i = 0; i < list.length; i++){
    if (S.pub.pages.length >= LIM.pages){ toast(`Limite de ${LIM.pages} páginas por capítulo.`); break; }
    st.textContent = `Preparando ${i+1} de ${list.length}…`;
    try{
      const blob = await prepareImage(list[i], {});
      S.pub.pages.push({id:uuid(), blob, url:URL.createObjectURL(blob), name:list[i].name});
    }catch(e){ bad++; toast(imgMsg(e)); await sleep(900); }
  }
  delete st.dataset.busy; renderThumbs();
  if (bad && bad === list.length) st.textContent = "Nenhuma imagem válida. Use JPG, PNG ou WebP.";
}
function setProgress(done, total, text){
  const pr = $("#pubprog"), bar = $("#pubbar"), st = $("#pubstat");
  if (pr) pr.hidden = false;
  if (bar) bar.value = total ? Math.round(done / total * 100) : 0;
  if (st) st.textContent = text;
}
function lockPub(on){ document.querySelectorAll("#pubform button, #pubform input, #pubform select, #pubform textarea").forEach(el => el.disabled = on); }
function afterPub(wid, ap){
  if (ap){ S.prev = []; S.view = "dashboard"; S.dashOpen = wid; }
  else { S.detailId = wid; S.prev = ["dashboard"]; S.view = "detail"; }
  render(); window.scrollTo(0, 0);
}
async function submitPub(){
  const p = S.pub; if (!p || S.busy) return;
  const ch = !!p.workId, ap = !!p.chapterId;
  if (!sb || !S.user) return toast("Entre para publicar.");
  const title = p.title.trim(), chTitle = p.chTitle.trim();
  if (!ch && !title) return toast("Dê um título para a obra.");
  if (!ch && !p.cover) return toast("Escolha uma capa.");
  if (!ap && !chTitle) return toast("Dê um título para o capítulo.");
  if (!p.pages.length) return toast("Escolha ao menos uma página.");
  const base = ch ? S.works.find(w => w.id === p.workId) : null;
  if (ch && (!base || base.authorId !== S.me.id)) return toast("Esta obra não é sua ou não existe mais.");
  if (ap && !base.chapters.some(c => c.id === p.chapterId)) return toast("Este capítulo não existe mais.");

  S.busy = true; lockPub(true);
  const uid = S.me.id, wid = base ? base.id : uuid(), chid = ap ? p.chapterId : uuid(), tag = uuid().slice(0, 8);
  const items = [];                                           // {path, blob}
  const coverPath = base ? base.coverPath : `${uid}/${wid}/cover.jpg`;
  if (!base) items.push({path:coverPath, blob:p.cover.blob, label:"capa"});
  // ao acrescentar a um capítulo existente, nomes únicos evitam sobrescrever/confundir páginas antigas
  const pagePaths = p.pages.map((x, i) => `${uid}/${wid}/${chid}/${ap ? tag + "_" : ""}${String(i).padStart(3,"0")}.jpg`);
  p.pages.forEach((x, i) => items.push({path:pagePaths[i], blob:x.blob, label:`página ${i+1}`}));
  const uploaded = [];
  let stage = "upload";
  try{
    // 1) envio dos arquivos (em paralelo, até 3 por vez)
    let done = 0, failed = null, next = 0;
    setProgress(0, items.length, "Enviando imagens…");
    const worker = async () => {
      while (!failed && next < items.length){
        const it = items[next++];
        try{ await uploadBlob(it.path, it.blob); uploaded.push(it.path); done++; setProgress(done, items.length, `Enviando imagens… ${done} de ${items.length}`); }
        catch(e){ failed = {e, it}; }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    if (failed){ const err = failed.e || {}; err.__label = failed.it.label; throw err; }
    // 2) o servidor grava obra + capítulo em UMA transação (publish_work / publish_chapter)
    stage = "save";
    setProgress(items.length, items.length, "Salvando no servidor…");
    const r = ap
      ? await sb.rpc("add_chapter_pages", {p_chapter_id:chid, p_pages:pagePaths})
      : base
      ? await sb.rpc("publish_chapter", {p_work_id:wid, p_chapter_id:chid, p_title:chTitle, p_pages:pagePaths})
      : await sb.rpc("publish_work", {p_id:wid, p_title:title, p_genre:p.genre, p_age:p.age, p_mode:p.mode, p_synopsis:p.synopsis.trim(),
          p_author_name:(S.me.name || "").trim().slice(0, LIM.name) || "Autor", p_cover_path:coverPath, p_chapter_id:chid, p_chapter_title:chTitle, p_pages:pagePaths});
    if (r.error) throw r.error;
    // 3) só aqui a publicação conta como concluída
    freePub(p); S.pub = null;
    await loadAll();
    afterPub(wid, ap);
    toast(ap ? "Páginas adicionadas!" : "Publicado!");
  }catch(e){
    // compensação: o banco é atômico, o Storage não — apagamos o que subiu e que não foi publicado
    let note = "";
    const definite = stage === "upload" || !!(e && e.code);   // resposta do servidor = falha definitiva
    if (definite){
      const ok = uploaded.length ? await removePaths(uploaded) : true;
      if (!ok){ pendAdd({id:uuid(), uid, paths:uploaded, at:Date.now()}); note = " Algumas imagens enviadas serão limpas automaticamente depois."; }
    } else if (ap){
      // o capítulo já existia, então não dá para confirmar pela existência dele: não apagamos nada
      note = " Confira no dashboard se as páginas entraram antes de tentar de novo.";
    } else {
      // a resposta pode ter se perdido com o servidor já tendo gravado: confirma antes de apagar qualquer coisa
      let exists = null;
      try{ const c = await sb.from("chapters").select("id").eq("id", chid).maybeSingle(); if (!c.error) exists = !!c.data; }catch(_){}
      if (exists === true){
        freePub(p); S.pub = null; await loadAll();
        afterPub(wid, false);
        S.busy = false; toast("Publicado!"); return;
      }
      if (exists === null){ pendAdd({id:uuid(), uid, chid, paths:uploaded, at:Date.now()}); note = " Sem conexão para confirmar; verificaremos assim que possível."; }
      else if (!(await removePaths(uploaded))) pendAdd({id:uuid(), uid, paths:uploaded, at:Date.now()});
    }
    const m = String((e && (e.message || e.code)) || "");
    let msg;
    if (stage === "upload"){
      const what = e && e.__label ? ` (${e.__label})` : "";
      msg = /exceed|too large|size|payload/i.test(m) ? `Uma imagem${what} passou do limite de tamanho.`
        : /mime|type/i.test(m) ? `Tipo de arquivo não aceito${what}.`
        : /row-level|policy|jwt|unauthor|42501/i.test(m) ? "Sem permissão para enviar. Entre de novo e tente."
        : /fetch|network/i.test(m) ? `Falha de conexão durante o envio${what}.` : `Não foi possível enviar a imagem${what}.`;
    } else {
      msg = /42501|row-level|jwt/i.test(m) ? "O servidor recusou: você não tem permissão. Entre de novo e tente."
        : /54000|limite/i.test(m) ? "Limite de obras ou capítulos atingido."
        : /fetch|network/i.test(m) ? "Falha de conexão ao salvar." : "O servidor não aceitou a publicação.";
    }
    const st = $("#pubstat"); if (st) st.textContent = msg + note + " Seus dados continuam aqui: toque em Publicar para tentar de novo.";
    const pr = $("#pubprog"); if (pr) pr.hidden = true;
    toast(msg);
  }
  S.busy = false; lockPub(false);
}

/* ---------- leitor ---------- */
async function openReader(wid, ci){
  const w = findWork(wid); if (!w || !(w.chapters || [])[ci]) return;
  const R = $("#reader");
  const wasOpen = !R.hidden;
  S.reader = {wid, ci, pages:null, i:0};
  if (!wasOpen){
    S.lastFocus = document.activeElement;
    try{ history.pushState({r:1}, ""); }catch(e){}
  }
  R.hidden = false; document.body.style.overflow = "hidden";
  $("#app").inert = true;
  R.innerHTML = readerShell(w, ci, '<div class="rmsg" role="status">Carregando páginas…</div>');
  R.scrollTop = 0;
  const cb = R.querySelector("[data-act=closereader]"); if (cb) cb.focus();
  try{
    const pages = await getPages(wid, ci);
    if (!S.reader || S.reader.wid !== wid || S.reader.ci !== ci) return;
    S.reader.pages = pages;
    drawReader();
    recordRead(wid);
  }catch(e){ R.innerHTML = readerShell(w, ci, '<div class="rmsg">Não foi possível carregar este capítulo.</div>'); }
}
function readerShell(w, ci, inner){
  const c = w.chapters[ci];
  return `<div class="rtop"><button class="ibtn" data-act="closereader" aria-label="Fechar leitor">${I.back}</button>
    <div class="tt"><b>${esc(w.title)}</b><span>${ci+1}. ${esc(c.title)}</span></div></div><div class="rbody" id="rbody">${inner}</div>`;
}
function drawReader(){
  const r = S.reader, w = findWork(r.wid); if (!w) return;
  const R = $("#reader"), chs = w.chapters, paged = w.mode === "ltr" || w.mode === "rtl";
  let inner;
  if (!r.pages.length) inner = '<div class="rmsg">Este capítulo não tem páginas.</div>';
  else if (!paged) inner = r.pages.map((s, i) => `<img src="${esc(s)}" alt="Página ${i+1}" ${i < 2 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`).join("");
  else {
    const rtl = w.mode === "rtl";
    inner = `<div class="rpage"><button class="zone l" data-act="turn" data-d="${rtl?1:-1}" aria-label="${rtl?"Próxima página":"Página anterior"}"></button>
      <img src="${esc(r.pages[r.i])}" alt="Página ${r.i+1}"><button class="zone r" data-act="turn" data-d="${rtl?-1:1}" aria-label="${rtl?"Página anterior":"Próxima página"}"></button></div>
      <div class="counter" aria-live="polite">${r.i+1} / ${r.pages.length}</div>`;
    // pré-carrega as páginas vizinhas para a virada ser instantânea
    [r.i - 1, r.i + 1, r.i + 2].forEach(k => { if (r.pages[k]) new Image().src = r.pages[k]; });
  }
  const atEnd = !paged || r.i >= r.pages.length - 1;
  const foot = atEnd ? `<div class="rfoot">${r.ci > 0 ? `<button class="btn" data-act="read" data-id="${esc(w.id)}" data-ch="${r.ci-1}">Capítulo anterior</button>` : ""}
    ${r.ci < chs.length - 1 ? `<button class="btn" data-act="read" data-id="${esc(w.id)}" data-ch="${r.ci+1}">Próximo capítulo</button>` : ""}
    <button class="btn" data-act="closereader">Fechar</button></div>` : "";
  R.innerHTML = readerShell(w, r.ci, inner + foot);
}
function hardCloseReader(){
  S.reader = null; const R = $("#reader"); R.hidden = true; R.innerHTML = "";
  document.body.style.overflow = ""; $("#app").inert = false;
  const f = S.lastFocus; S.lastFocus = null;
  if (f && document.contains(f)) try{ f.focus({preventScroll:true}); }catch(e){}
  refresh();
}
function closeReader(){
  if (history.state && history.state.r) history.back(); else hardCloseReader();
}
function turnPage(d){
  const r = S.reader; if (!r || !r.pages) return;
  const n = r.i + d;
  if (n >= 0 && n < r.pages.length){ r.i = n; drawReader(); $("#reader").scrollTop = 0; }
}
// deslizar para virar página (no mangá da direita para a esquerda, deslizar para a direita avança)
let tx = 0, ty = 0;
document.addEventListener("touchstart", ev => { if (S.reader && ev.touches.length === 1){ tx = ev.touches[0].clientX; ty = ev.touches[0].clientY; } }, {passive:true});
document.addEventListener("touchend", ev => {
  const r = S.reader; if (!r || !r.pages || !ev.changedTouches.length) return;
  const w = findWork(r.wid); if (!w || (w.mode !== "ltr" && w.mode !== "rtl")) return;
  const dx = ev.changedTouches[0].clientX - tx, dy = ev.changedTouches[0].clientY - ty;
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  turnPage((w.mode === "rtl" ? dx > 0 : dx < 0) ? 1 : -1);
}, {passive:true});

/* ---------- eventos ---------- */
document.addEventListener("click", async ev => {
  const el = ev.target.closest("[data-act]"); if (!el || el.disabled) return;
  const a = el.dataset.act, d = el.dataset;
  switch (a){
    case "tab": if (S.busy && S.view === "publish") return toast("Aguarde o envio terminar."); go(d.tab); break;
    case "open": S.detailId = d.id; go("detail", {push:true}); loadComments(d.id); break;
    case "author": S.authorId = d.id; go("author", {push:true}); break;
    case "back": back(); break;
    case "genre": S.genre = d.g; $("#genres").innerHTML = genreChips(); $("#results").innerHTML = resultsHTML(); break;
    case "fav": toggleFav(d.id); break;
    case "theme": setTheme(d.t); render(); break;
    case "newwork": newPub(null); break;
    case "plus": go("plus", {push:true}); loadTx(); break;
    case "dashboard": go("dashboard"); break;
    case "dopen": S.dashOpen = S.dashOpen === d.id ? null : d.id; S.confirmDel = false; render(); break;
    case "editprofile": go("profile", {edit:true}); break;
    case "cancelprofile": S.editProfile = false; render(); break;
    case "like": toggleLike(d.id); break;
    case "claim": claimDaily(); break;
    case "buyplus": buyPlus(); break;
    case "delcm": delComment(d.w, d.id); break;
    case "addpages": newPub(d.id, d.ch); break;
    case "authmode": S.authMode = d.m; S.authMsg = ""; render(); break;
    case "logout":
      if (S.busy) break;
      try{ await sb.auth.signOut({scope:"local"}); }catch(e){}
      setUser(null); S.reads = []; S.pub = null; S.authMsg = ""; S.wallet = null; S.tx = []; S.editProfile = false;   // encerra a sessão local mesmo se a rede falhar
      toast("Você saiu."); loadAll(); go("profile"); break;
    case "newch": newPub(d.id); break;
    case "rmpage": { const [x] = S.pub.pages.splice(+d.i, 1); if (x) URL.revokeObjectURL(x.url); renderThumbs(); break; }
    case "mvpage": { const i = +d.i, j = i + +d.d, pg = S.pub.pages; if (j >= 0 && j < pg.length){ [pg[i], pg[j]] = [pg[j], pg[i]]; renderThumbs(); } break; }
    case "askdel": S.confirmDel = true; render(); break;
    case "canceldel": S.confirmDel = false; render(); break;
    case "delwork": {
      const w = S.works.find(x => x.id === d.id && x.authorId === S.me.id); if (!w || S.busy) break;
      S.busy = true; el.disabled = true; el.textContent = "Excluindo…";
      try{
        const clean = await removeWork(w);
        S.favs.delete(w.id); ls.set("oboro:favs", Array.from(S.favs));
        S.confirmDel = false; S.prev = [];
        toast(clean ? "Obra excluída." : "Obra excluída. Algumas imagens serão limpas depois.");
        S.dashOpen = null; go("dashboard");
      }catch(e){ toast("Não foi possível excluir. Tente de novo."); el.disabled = false; el.textContent = "Confirmar exclusão"; }
      S.busy = false;
      break;
    }
    case "read": openReader(d.id, +d.ch); break;
    case "closereader": closeReader(); break;
    case "turn": turnPage(+d.d); break;
    case "reload": S.loadErr = false; refresh(); loadAll(); break;
  }
});
document.addEventListener("input", ev => {
  const t = ev.target;
  if (t.id === "q"){ S.q = t.value; $("#results").innerHTML = resultsHTML(); }
  else if (t.id === "a_email"){ S.authEmail = t.value; }
  else if (S.pub && t.id && t.id.startsWith("p_")){
    const m = {p_title:"title", p_genre:"genre", p_age:"age", p_mode:"mode", p_syn:"synopsis", p_chtitle:"chTitle"}[t.id];
    if (m) S.pub[m] = t.value;
  }
});
document.addEventListener("change", async ev => {
  const t = ev.target;
  if (t.id === "p_cover" && t.files[0]){
    try{
      const blob = await prepareImage(t.files[0], {cover:true});
      if (S.pub.cover) URL.revokeObjectURL(S.pub.cover.url);
      S.pub.cover = {blob, url:URL.createObjectURL(blob)};
      $("#covbox").innerHTML = `<div class="covprev"><img src="${esc(S.pub.cover.url)}" alt="Prévia da capa"></div>`;
    }catch(e){ toast(imgMsg(e)); }
    t.value = "";
  } else if (t.id === "p_pages" && t.files.length){ await onPages(t.files); t.value = ""; }
});
document.addEventListener("submit", ev => {
  if (ev.target.id === "pubform"){ ev.preventDefault(); submitPub(); }
  if (ev.target.id === "authform"){ ev.preventDefault(); doAuth(); }
  if (ev.target.id === "profform"){ ev.preventDefault(); saveProfile(); }
  if (ev.target.id === "cmform"){ ev.preventDefault(); postComment(ev.target.dataset.id); }
  if (ev.target.classList.contains("renform")){ ev.preventDefault(); renameWork(ev.target.dataset.id, ev.target.querySelector("input").value); }
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && !$("#reader").hidden) closeReader();
  const r = S.reader;
  if (r && r.pages && (ev.key === "ArrowRight" || ev.key === "ArrowLeft")){
    const w = findWork(r.wid); if (!w || (w.mode !== "ltr" && w.mode !== "rtl")) return;
    const dir = (ev.key === "ArrowRight" ? 1 : -1) * (w.mode === "rtl" ? -1 : 1);
    turnPage(dir);
  }
});

/* ---------- início ---------- */
async function boot(){
  if (!sb){ S.loadErr = true; toast("Não foi possível conectar ao servidor."); refresh(); return; }
  try{
    const first = await sb.auth.getSession();
    setUser(first.data.session && first.data.session.user);
  }catch(e){}
  sb.auth.onAuthStateChange((ev, sess) => {
    if (ev === "USER_UPDATED" || ev === "TOKEN_REFRESHED") { if (sess) setUser(sess.user); return; }
    setUser(sess && sess.user);
    if (ev === "PASSWORD_RECOVERY"){ S.recovery = true; setTimeout(() => go("profile"), 0); return; }
    if (ev === "SIGNED_IN" || ev === "SIGNED_OUT"){
      setTimeout(async () => { await loadAll(); await reconcile(); if (S.view === "profile") render(); }, 0);
    }
  });
  await loadAll();
  await reconcile();
  render();
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && !S.busy) loadAll(); });

function setTheme(t){
  S.theme = t === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", S.theme);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", S.theme === "dark" ? "#120D08" : "#FC9900");
  ls.set("oboro:theme", S.theme);
}
(function init(){
  setTheme(ls.get("oboro:theme", "light"));
  let h = ""; try{ h = location.hash.replace("#", ""); }catch(e){}
  const map = {inicio:"home", buscar:"search", perfil:"profile", salvos:"library", dashboard:"dashboard", plus:"plus"};
  S.view = map[h] || "home";
  render();
  boot();
})();
