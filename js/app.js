"use strict";
/* OBORO — leitura e autopublicação de quadrinhos. */

const CFG = window.OBORO_CONFIG || {};
const IMG = {avatar:"assets/avatar.jpg"};
const BUCKET = "oboro";
// Originais exclusivas do Oboro: os arquivos ficam no próprio site (não no Storage), então "paths" já são endereços finais.
const ORIGINALS = [{
  id:"magic", original:true, authorName:"the.gabri3ll", title:"MAGIC", genre:"Fantasia", age:"16+", mode:"v",
  synopsis:"Em um mundo onde a magia define o valor de alguém, Eiichiro Yuto é um jovem preso ao nível Subta 0.1. Na escola de magia, ele sofre bullying por sua fraqueza e luta para provar que pode superar seus limites.",
  cover:"assets/magic/capa.jpg", updatedAt:Date.UTC(2026, 9, 28),
  chapters:[{id:"magic-1", title:"Magia é ruim?", pages:2, paths:["assets/magic/1.png","assets/magic/2.png"], at:Date.UTC(2026, 9, 28)}]
}];
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
  q:"", genre:"", detailId:null, authorId:null, authorName:null, pub:null, reader:null,
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
// Originais do Oboro são arquivos estáticos (sem conta dona): ligam-se ao perfil pelo nome do autor.
const myOriginals = () => S.user && S.me.name ? ORIGINALS.filter(w => norm(w.authorName) === norm(S.me.name)) : [];
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
    const keep = ORIGINALS.map(w => w.id).filter(id => S.favs.has(id));   // salvos de originais ficam só no aparelho
    const local = ls.get("oboro:favs", []).filter(id => known.has(id));
    const add = local.filter(id => !server.has(id));
    if (add.length) await sb.from("favorites").upsert(add.map(id => ({work_id:id})), {onConflict:"user_id,work_id", ignoreDuplicates:true});
    S.favs = new Set(Array.from(server).concat(add, keep));
    ls.set("oboro:favs", Array.from(S.favs));
  }catch(e){}
}
async function toggleFav(id){
  const had = S.favs.has(id);
  had ? S.favs.delete(id) : S.favs.add(id);
  ls.set("oboro:favs", Array.from(S.favs)); render();
  if (!sb || !S.user || (findWork(id) || {}).original) return;
  const r = had ? await sb.from("favorites").delete().eq("work_id", id).eq("user_id", S.me.id) : await sb.from("favorites").insert({work_id:id});
  if (r.error && r.error.code !== "23505"){
    had ? S.favs.add(id) : S.favs.delete(id);
    ls.set("oboro:favs", Array.from(S.favs)); render();
    toast("Não foi possível atualizar seus salvos.");
  }
}
function recordRead(wid){
  const w = findWork(wid);
  if (!sb || !S.user || !w || w.original || w.authorId === S.me.id) return;
  sb.from("reads").upsert({work_id:wid, user_id:S.me.id}, {onConflict:"work_id,user_id", ignoreDuplicates:true}).then(() => {}, () => {});
}
async function getPages(wid, ci){
  const w = findWork(wid), c = w && w.chapters[ci];
  return c ? (w.original ? c.paths : c.paths.map(pubUrl)) : [];
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
    let scale = 1, q = o.cover ? 0.86 : 