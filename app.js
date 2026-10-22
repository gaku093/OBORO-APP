const IMG = {avatar:"data:image/jpeg;base64,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"};
const ORIGINALS = [];
const GENRES = ["Ação","Aventura","Comédia","Drama","Fantasia","Ficção científica","Romance","Slice of life","Terror"];
const AGES = ["Livre","12+","14+","16+","18+"];
const MODES = {v:"Vertical (webtoon)", ltr:"Esquerda para direita", rtl:"Direita para esquerda (mangá)"};
const DAYS = ["dom","seg","ter","qua","qui","sex","sáb"];

const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ls = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
};
const fmt = n => Number(n || 0).toLocaleString("pt-BR");

const I = {
  back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3.5 7 12l8.5 8.5 2-2L11 12l6.5-6.5z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3h3v7.5H21v3h-7.5V21h-3v-7.5H3v-3h7.5z"/></svg>',
  book:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7a3 3 0 0 1 1 .2A3 3 0 0 1 13 4h7v15h-7a2 2 0 0 0-2 1.5A2 2 0 0 0 9 19H4z"/></svg>',
  mark:'<svg viewBox="0 0 36 52" aria-hidden="true"><path d="M2 2h32v48L18 36 2 50z"/></svg>',
  searchIc:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="26" cy="26" r="16" fill="none" stroke="currentColor" stroke-width="7"/><path d="M38 38 56 56" stroke="#FFB000" stroke-width="9" stroke-linecap="round"/></svg>'
};

const S = {
  view:"home", prev:[], works:[], reads:[], user:null, authMsg:"",
  favs:new Set(ls.get("oboro:favs", [])),
  me:{id:null, name:ls.get("oboro:name", "")},
  q:"", genre:"", detailId:null, pub:null, reader:null, confirmDel:false, busy:false
};
const SUPABASE_URL = "https://dvreimjduimzwouxkrdl.supabase.co";
const SUPABASE_KEY = "sb_publishable_OyUFfiDZcDaPfS0F8Uy-2w_3QGafWDr";
const sb = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const pubUrl = p => sb.storage.from("oboro").getPublicUrl(p).data.publicUrl;

/* ---------- dados (Supabase) ---------- */
const allWorks = () => ORIGINALS.concat(S.works);
const findWork = id => allWorks().find(w => w.id === id);
const myWorks = () => S.works.filter(w => w.authorId === S.me.id);
const readersOf = id => new Set(S.reads.filter(r => r.w === id && r.u !== S.me.id).map(r => r.u)).size;

function mapWork(r){
  const chs = (r.chapters || []).slice().sort((a,b) => a.idx - b.idx).map(c => ({title:c.title, pages:c.pages.length, paths:c.pages, at:Date.parse(c.created_at)}));
  return {id:r.id, authorId:r.author_id, authorName:r.author_name, title:r.title, genre:r.genre, age:r.age, mode:r.mode,
    synopsis:r.synopsis, coverPath:r.cover_path, cover:pubUrl(r.cover_path), chapters:chs, updatedAt:Date.parse(r.updated_at)};
}
async function loadAll(){
  if (!sb) return;
  const w = await sb.from("works").select("*, chapters(idx,title,pages,created_at)").order("updated_at", {ascending:false});
  if (w.error){ toast("Não foi possível carregar as obras."); return; }
  S.works = w.data.map(mapWork);
  const r = await sb.from("reads").select("work_id,user_id,created_at");
  S.reads = (r.data || []).map(x => ({w:x.work_id, u:x.user_id, at:Date.parse(x.created_at)}));
  refresh();
}
async function blobOf(dataUrl){ return (await fetch(dataUrl)).blob(); }
async function upload(path, dataUrl){
  const r = await sb.storage.from("oboro").upload(path, await blobOf(dataUrl), {contentType:"image/jpeg", upsert:true});
  if (r.error) throw r.error;
}
async function removeWork(w){
  const paths = [w.coverPath].concat((w.chapters || []).flatMap(c => c.paths || []));
  if (paths.length) await sb.storage.from("oboro").remove(paths);
  const r = await sb.from("works").delete().eq("id", w.id);
  if (r.error) throw r.error;
  S.works = S.works.filter(x => x.id !== w.id);
}
function recordRead(wid){
  const w = findWork(wid);
  if (!sb || !S.user || !w || w.authorId === S.me.id) return;
  sb.from("reads").upsert({work_id:wid, user_id:S.me.id}, {onConflict:"work_id,user_id", ignoreDuplicates:true}).then(() => {});
}
async function getPages(wid, ci){
  const w = findWork(wid), c = w && w.chapters[ci];
  return c ? c.paths.map(pubUrl) : [];
}

/* ---------- telas ---------- */
function coverHTML(w, cls){
  const tag = w.original ? '<span class="tag">original</span>' : "";
  if (w.cover) return `<span class="cover ${cls||""}"><img src="${w.cover}" alt="">${tag}</span>`;
  return `<span class="cover ph ${cls||""}">${esc(w.title)}</span>`;
}
function cardHTML(w){
  return `<button class="card" data-act="open" data-id="${esc(w.id)}">${coverHTML(w)}<span class="cap">${esc(w.title)}</span><span class="by">por ${esc(w.authorName || "autor")}</span></button>`;
}
function topbar(){
  const back = ["detail","publish"].includes(S.view);
  const left = back
    ? `<button class="ibtn" data-act="back" aria-label="Voltar">${I.back}</button>`
    : `<button class="avatar" data-act="tab" data-tab="profile" aria-label="Abrir perfil"><img src="${IMG.avatar}" alt=""></button>`;
  return `<header class="top">${left}<button class="ibtn mark${S.view==="library"?" on":""}" data-act="tab" data-tab="library" aria-label="Meus salvos">${I.mark}</button></header>`;
}
function emptyCommunity(){
  return `<div class="empty"><p>Ainda não há quadrinhos da comunidade. Publique o primeiro e ele aparece aqui para todo mundo.</p><button class="btn" data-act="newwork">${I.plus}Publicar QH</button></div>`;
}
function homeHTML(){
  const comm = S.works.slice().sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
  return `<h1 class="h1">originais oboro</h1>
    ${ORIGINALS.length ? `<div class="grid">${ORIGINALS.map(cardHTML).join("")}</div>` : `<div class="empty"><p>Os originais da Oboro aparecem aqui quando forem adicionados.</p></div>`}
    <h2 class="h2">novos da comunidade</h2>
    ${comm.length ? `<div class="grid">${comm.map(cardHTML).join("")}</div>` : emptyCommunity()}`;
}
function searchHTML(){
  return `<h1 class="h1">buscar</h1>
    <div class="search"><input id="q" type="search" placeholder="Título, autor ou gênero" value="${esc(S.q)}" aria-label="Buscar quadrinhos" autocomplete="off">${I.searchIc}</div>
    <div class="chips" id="genres" style="margin-top:14px">${genreChips()}</div>
    <div id="results" style="margin-top:18px"></div>`;
}
function genreChips(){
  return ['<button class="chip'+(S.genre===""?" on":"")+'" data-act="genre" data-g="">Todos</button>']
    .concat(GENRES.map(g => `<button class="chip${S.genre===g?" on":""}" data-act="genre" data-g="${esc(g)}">${esc(g)}</button>`)).join("");
}
function resultsHTML(){
  const q = S.q.trim().toLowerCase();
  const list = allWorks().filter(w =>
    (!S.genre || w.genre === S.genre) &&
    (!q || [w.title, w.authorName, w.genre].some(x => String(x||"").toLowerCase().includes(q))));
  if (!list.length) return `<div class="empty"><p>Nada encontrado${q ? ` para “${esc(S.q.trim())}”` : ""}. Tente outro gênero ou termo.</p></div>`;
  return `<div class="grid">${list.map(cardHTML).join("")}</div>`;
}
function libraryHTML(){
  const list = allWorks().filter(w => S.favs.has(w.id));
  return `<h1 class="h1">meus salvos</h1>` + (list.length
    ? `<div class="grid">${list.map(cardHTML).join("")}</div>`
    : `<div class="empty"><p>Toque em Salvar na página de uma obra para guardar aqui.</p><button class="btn" data-act="tab" data-tab="home">Ver obras</button></div>`);
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
  return {mine, chapters, pages, readers, days};
}
function themeChips(){
  return `<h2 class="h2">tema</h2><div class="chips" role="group" aria-label="Tema do app">
      <button class="chip${S.theme==="light"?" on":""}" data-act="theme" data-t="light" aria-pressed="${S.theme==="light"}">Claro</button>
      <button class="chip${S.theme==="dark"?" on":""}" data-act="theme" data-t="dark" aria-pressed="${S.theme==="dark"}">Escuro</button></div>`;
}
function authHTML(){
  return `<h1 class="h1">perfil</h1>
    <form class="form" id="authform" novalidate>
      <div class="note">Entre ou crie uma conta para publicar QHs, salvar o seu progresso e ver o dashboard.</div>
      <div class="f"><label for="a_email">E-mail</label><input id="a_email" type="email" autocomplete="email" inputmode="email" placeholder="voce@email.com"></div>
      <div class="f"><label for="a_pass">Senha</label><input id="a_pass" type="password" autocomplete="current-password" placeholder="Mínimo 6 caracteres"></div>
      <div class="row"><button class="btn" type="submit" id="a_login">Entrar</button><button class="btn ghost" type="button" data-act="signup">Criar conta</button></div>
      <div class="stat" id="a_msg" aria-live="polite">${esc(S.authMsg)}</div>
    </form>${themeChips()}`;
}
async function doAuth(create){
  if (!sb) return toast("Sem conexão com o servidor.");
  const email = ($("#a_email").value || "").trim(), pass = $("#a_pass").value || "";
  const msg = $("#a_msg");
  if (!email || pass.length < 6){ msg.textContent = "Informe o e-mail e uma senha de 6 ou mais caracteres."; return; }
  msg.textContent = create ? "Criando conta…" : "Entrando…";
  const r = create ? await sb.auth.signUp({email, password:pass}) : await sb.auth.signInWithPassword({email, password:pass});
  if (r.error){
    const m = r.error.message || "";
    msg.textContent = /Invalid login/i.test(m) ? "E-mail ou senha incorretos." : /already/i.test(m) ? "Este e-mail já tem conta. Toque em Entrar." : /confirm/i.test(m) ? "Confirme seu e-mail antes de entrar." : "Não foi possível continuar. Tente de novo.";
    return;
  }
  if (create && !r.data.session){ S.authMsg = "Conta criada. Confirme seu e-mail e depois toque em Entrar."; msg.textContent = S.authMsg; return; }
  S.authMsg = "";
}
function setUser(u){
  S.user = u || null;
  S.me.id = u ? u.id : null;
  if (u && !S.me.name) S.me.name = (u.email || "").split("@")[0];
}

function profileHTML(){
  if (!S.user) return authHTML();
  const D = dashData();
  const max = Math.max(1, ...D.days.map(d => d.n));
  const topR = Math.max(1, ...D.mine.map(w => readersOf(w.id)));
  const rows = D.mine.map(w => {
    const r = readersOf(w.id);
    return `<button class="work" data-act="open" data-id="${esc(w.id)}">
      <span class="thumb">${w.cover ? `<img src="${w.cover}" alt="">` : ""}</span>
      <span><span class="t">${esc(w.title)}</span><br><span class="m">${(w.chapters||[]).length} cap. · ${esc(w.genre)}</span>
        <span class="meter" aria-hidden="true"><i style="width:${Math.round(r/topR*100)}%"></i></span></span>
      <span class="n">${fmt(r)}<small>leitores</small></span></button>`;
  }).join("");
  return `<h1 class="h1">perfil</h1>
    <div class="me"><span class="avatar"><img src="${IMG.avatar}" alt=""></span>
      <div class="who"><label for="myname">Nome de autor</label><input id="myname" type="text" maxlength="40" placeholder="Seu nome ou pseudônimo" value="${esc(S.me.name)}"></div></div>
    <button class="btn" data-act="newwork">${I.plus}Publicar QH</button>
    <button class="btn ghost" data-act="logout" style="margin-left:8px">Sair</button>
    ${themeChips()}
    <h2 class="h2">dashboard</h2>
    <div class="tiles">
      <div class="tile"><b>${fmt(D.mine.length)}</b><span>obras</span></div>
      <div class="tile"><b>${fmt(D.chapters)}</b><span>capítulos</span></div>
      <div class="tile"><b>${fmt(D.pages)}</b><span>páginas</span></div>
      <div class="tile"><b>${fmt(D.readers)}</b><span>leitores</span></div>
    </div>
    <div class="panel"><h3>Novos leitores</h3><p class="sub">Últimos 7 dias, contando só quem não é você</p>
      <div class="bars">${D.days.map(d => `<div class="bar${d.n?"":" zero"}"><span>${d.n}</span><i style="height:${Math.max(4, Math.round(d.n/max*92))}px"></i></div>`).join("")}</div>
      <div class="days">${D.days.map(d => `<span>${d.label}</span>`).join("")}</div></div>
    <div class="panel"><h3>Minhas obras</h3><p class="sub">Toque para abrir, adicionar capítulo ou excluir</p>
      ${rows || `<div class="empty" style="background:none;padding:8px 0"><p>Você ainda não publicou nada. Sua primeira obra aparece aqui com as métricas.</p></div>`}</div>`;
}
function detailHTML(){
  const w = findWork(S.detailId);
  if (!w) return `<div class="empty"><p>Esta obra não existe mais.</p><button class="btn" data-act="tab" data-tab="home">Voltar ao início</button></div>`;
  const mine = !w.original && w.authorId === S.me.id;
  const saved = S.favs.has(w.id);
  const chs = w.chapters || [];
  return `<div class="hero">${coverHTML(w)}<div><h1>${esc(w.title)}</h1><div class="by">por ${esc(w.authorName || "autor")}</div>
      <div class="chips"><span class="chip on">${esc(w.genre)}</span><span class="chip">${esc(w.age)}</span></div></div></div>
    <div class="row">
      <button class="btn" data-act="read" data-id="${esc(w.id)}" data-ch="0" ${chs.length ? "" : "disabled"}>${I.book}${chs.length ? "Ler capítulo 1" : "Sem capítulos"}</button>
      <button class="btn ghost" data-act="fav" data-id="${esc(w.id)}" aria-pressed="${saved}">${saved ? "Salvo" : "Salvar"}</button>
    </div>
    ${w.synopsis ? `<div class="syn">${esc(w.synopsis)}</div>` : `<div class="syn">Sinopse em breve.</div>`}
    <p class="note" style="margin:0 0 12px">Leitura: ${esc(MODES[w.mode] || MODES.v)}${mine ? ` · ${fmt(readersOf(w.id))} leitores` : ""}</p>
    <h2 class="h2" style="margin-top:8px">capítulos</h2>
    ${chs.length ? `<div class="chlist">${chs.map((c,i) => `<button class="ch" data-act="read" data-id="${esc(w.id)}" data-ch="${i}"><span class="t">${i+1}. ${esc(c.title)}</span><span class="m">${c.pages} pág. · ${new Date(c.at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</span></button>`).join("")}</div>`
      : `<div class="empty"><p>Os capítulos ainda não foram publicados.</p></div>`}
    ${mine ? `<div class="row" style="margin-top:16px">
      <button class="btn" data-act="newch" data-id="${esc(w.id)}">${I.plus}Novo capítulo</button>
      ${S.confirmDel ? `<button class="btn warn" data-act="delwork" data-id="${esc(w.id)}">Confirmar exclusão</button><button class="btn ghost" data-act="canceldel">Cancelar</button>` : `<button class="btn warn" data-act="askdel">Excluir obra</button>`}
    </div>` : ""}`;
}
function publishHTML(){
  const p = S.pub, ch = !!p.workId;
  const opt = (arr, v) => arr.map(x => `<option${x===v?" selected":""}>${esc(x)}</option>`).join("");
  return `<h1 class="h1">${ch ? "novo capítulo" : "publicar qh"}</h1>
    <form class="form" id="pubform" autocomplete="off">
      ${ch ? `<div class="note">Obra: ${esc(p.title)}</div>` : `
      <div class="f"><label for="p_title">Título</label><input id="p_title" type="text" maxlength="60" value="${esc(p.title)}" placeholder="Nome da sua QH"></div>
      <div class="two">
        <div class="f"><label for="p_genre">Gênero</label><select id="p_genre">${opt(GENRES, p.genre)}</select></div>
        <div class="f"><label for="p_age">Classificação</label><select id="p_age">${opt(AGES, p.age)}</select></div>
      </div>
      <div class="f"><label for="p_mode">Direção de leitura</label><select id="p_mode">${Object.entries(MODES).map(([k,v]) => `<option value="${k}"${p.mode===k?" selected":""}>${esc(v)}</option>`).join("")}</select></div>
      <div class="f"><label for="p_syn">Sinopse</label><textarea id="p_syn" maxlength="600" placeholder="Do que se trata a história?">${esc(p.synopsis)}</textarea></div>
      <div class="f"><span class="lab">Capa</span>
        <label class="file"><input id="p_cover" type="file" accept="image/*">Escolher imagem da capa</label>
        <div id="covbox">${p.cover ? `<div class="covprev"><img src="${p.cover}" alt="Prévia da capa"></div>` : ""}</div></div>`}
      <div class="f"><label for="p_chtitle">Título do capítulo</label><input id="p_chtitle" type="text" maxlength="60" value="${esc(p.chTitle)}" placeholder="${ch ? "Ex.: O reencontro" : "Ex.: O começo"}"></div>
      <div class="f"><span class="lab">Páginas</span>
        <label class="file"><input id="p_pages" type="file" accept="image/*" multiple>Escolher páginas (várias)</label>
        <div class="stat" id="pstat"></div><div class="thumbs" id="thumbs"></div></div>
      <button class="btn" type="submit" id="pubbtn">Publicar</button>
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
    case "detail": body = detailHTML(); break;
    case "publish": body = publishHTML(); break;
  }
  v.innerHTML = topbar() + body;
  if (S.view === "search") $("#results").innerHTML = resultsHTML();
  if (S.view === "publish") renderThumbs();
  document.querySelectorAll(".tab").forEach(t => {
    const on = t.dataset.tab === S.view || (S.view === "detail" && t.dataset.tab === "home");
    on ? t.setAttribute("aria-current","page") : t.removeAttribute("aria-current");
  });
}
function refresh(){
  if (S.view === "publish" || !$("#reader").hidden) return;
  if (S.view === "search"){ $("#results").innerHTML = resultsHTML(); return; }
  const y = window.scrollY; render(); window.scrollTo(0, y);
}
function go(view, opts){
  opts = opts || {};
  if (opts.push) S.prev.push(S.view); else S.prev = [];
  S.view = view; S.confirmDel = false;
  render(); window.scrollTo(0, 0);
  if (!opts.push){ try{ history.replaceState(null, "", "#" + {home:"inicio",search:"buscar",profile:"perfil",library:"salvos"}[view]); }catch(e){} }
}
function back(){ S.view = S.prev.pop() || "home"; S.confirmDel = false; render(); window.scrollTo(0, 0); }
let toastT;
function toast(msg){
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200);
}

/* ---------- publicar ---------- */
function newPub(workId){
  if (!S.user){ S.authMsg = "Entre para publicar."; go("profile"); return toast("Entre ou crie uma conta para publicar."); }
  const w = workId ? findWork(workId) : null;
  S.pub = {workId:workId || null, title:w ? w.title : "", genre:GENRES[0], age:AGES[0], mode:"v", synopsis:"", cover:"", chTitle:"", pages:[]};
  go("publish", {push:true});
}
function loadImg(file){
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file), i = new Image();
    i.onload = () => { URL.revokeObjectURL(u); res(i); };
    i.onerror = () => { URL.revokeObjectURL(u); rej(new Error("img")); };
    i.src = u;
  });
}
async function shrink(file, o){
  const img = await loadImg(file);
  let w, h, sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (o.cover){
    w = 360; h = 540;
    const r = w / h, ir = sw / sh;
    if (ir > r){ const nw = sh * r; sx = (sw - nw) / 2; sw = nw; } else { const nh = sw / r; sy = (sh - nh) / 2; sh = nh; }
  } else {
    w = Math.min(800, sw); h = Math.round(sh * (w / sw));
  }
  let scale = 1, q = o.cover ? 0.82 : 0.74, out = "";
  for (let k = 0; k < 8; k++){
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
    const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    out = c.toDataURL("image/jpeg", q);
    if (out.length < 235000) break;
    if (q > 0.5) q -= 0.12; else scale *= 0.85;
  }
  return out;
}
function renderThumbs(){
  const th = $("#thumbs"); if (!th) return;
  const pg = S.pub.pages;
  th.innerHTML = pg.map((src, i) => `<div class="th"><img src="${src}" alt="Página ${i+1}"><em>${i+1}</em><button type="button" data-act="rmpage" data-i="${i}" aria-label="Remover página ${i+1}">×</button></div>`).join("");
  const st = $("#pstat"); if (st && !st.dataset.busy) st.textContent = pg.length ? `${pg.length} página${pg.length>1?"s":""} prontas` : "Nenhuma página escolhida.";
}
async function onPages(files){
  const list = Array.from(files).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric:true}));
  const st = $("#pstat"); st.dataset.busy = "1";
  try{
    for (let i = 0; i < list.length; i++){
      if (S.pub.pages.length >= 60){ toast("Limite de 60 páginas por capítulo."); break; }
      st.textContent = `Preparando ${i+1} de ${list.length}…`;
      S.pub.pages.push(await shrink(list[i], {}));
    }
  }catch(e){ toast("Uma das imagens não pôde ser lida."); }
  delete st.dataset.busy; renderThumbs();
}
async function submitPub(){
  const p = S.pub, ch = !!p.workId;
  if (S.busy) return;
  const btn = $("#pubbtn"), stat = $("#pubstat");
  if (!sb || !S.user) return toast("Entre para publicar.");
  if (!ch && !p.title.trim()) return toast("Dê um título para a obra.");
  if (!ch && !p.cover) return toast("Escolha uma capa.");
  if (!p.chTitle.trim()) return toast("Dê um título para o capítulo.");
  if (!p.pages.length) return toast("Escolha ao menos uma página.");
  const name = (S.me.name || "").trim() || "Autor";
  S.busy = true; btn.disabled = true;
  try{
    const uid = S.me.id;
    const base = ch ? S.works.find(w => w.id === p.workId) : null;
    if (ch && !base) throw {code:"gone"};
    const wid = base ? base.id : crypto.randomUUID();
    const ci = base ? base.chapters.length : 0;
    const dir = uid + "/" + wid;
    let coverPath = base ? base.coverPath : dir + "/cover.jpg";
    if (!base){ stat.textContent = "Enviando capa…"; await upload(coverPath, p.cover); }
    const paths = [];
    for (let i = 0; i < p.pages.length; i++){
      stat.textContent = `Enviando página ${i+1} de ${p.pages.length}…`;
      const path = `${dir}/c${ci}/${String(i).padStart(3,"0")}.jpg`;
      await upload(path, p.pages[i]); paths.push(path);
    }
    stat.textContent = "Salvando…";
    if (!base){
      const r = await sb.from("works").insert({id:wid, author_name:name, title:p.title.trim(), genre:p.genre, age:p.age, mode:p.mode, synopsis:p.synopsis.trim(), cover_path:coverPath});
      if (r.error) throw r.error;
    }
    const rc = await sb.from("chapters").insert({work_id:wid, idx:ci, title:p.chTitle.trim(), pages:paths});
    if (rc.error) throw rc.error;
    await loadAll();
    S.pub = null; S.detailId = wid; S.prev = ["profile"]; S.view = "detail"; render(); window.scrollTo(0, 0);
    toast("Publicado!");
  }catch(e){
    const m = (e && (e.message || e.code)) || "";
    toast(/exceed|size|too large/i.test(m) ? "Uma imagem passou do limite de 5 MB." : /row-level|policy|JWT/i.test(m) ? "Sem permissão. Entre de novo e tente." : "Não foi possível publicar. Tente de novo.");
    if (stat) stat.textContent = "";
  }
  S.busy = false; if ($("#pubbtn")) $("#pubbtn").disabled = false;
}

/* ---------- leitor ---------- */
async function openReader(wid, ci){
  const w = findWork(wid); if (!w || !(w.chapters || [])[ci]) return;
  const R = $("#reader");
  S.reader = {wid, ci, pages:null, i:0};
  R.hidden = false; document.body.style.overflow = "hidden";
  R.innerHTML = readerShell(w, ci, '<div class="rmsg">Carregando páginas…</div>');
  R.scrollTop = 0;
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
  return `<div class="rtop"><button class="ibtn" data-act="closereader" aria-label="Fechar leitor" style="color:#fff">${I.back.replace("<svg","<svg fill=\"#fff\"")}</button>
    <div class="tt"><b>${esc(w.title)}</b><span>${ci+1}. ${esc(c.title)}</span></div></div><div class="rbody" id="rbody">${inner}</div>`;
}
function drawReader(){
  const r = S.reader, w = findWork(r.wid); if (!w) return;
  const R = $("#reader"), chs = w.chapters, paged = w.mode === "ltr" || w.mode === "rtl";
  let inner;
  if (!r.pages.length) inner = '<div class="rmsg">Este capítulo não tem páginas.</div>';
  else if (!paged) inner = r.pages.map((s, i) => `<img src="${s}" alt="Página ${i+1}" loading="lazy">`).join("");
  else {
    const rtl = w.mode === "rtl";
    inner = `<div class="rpage"><button class="zone l" data-act="turn" data-d="${rtl?1:-1}" aria-label="${rtl?"Próxima página":"Página anterior"}"></button>
      <img src="${r.pages[r.i]}" alt="Página ${r.i+1}"><button class="zone r" data-act="turn" data-d="${rtl?-1:1}" aria-label="${rtl?"Página anterior":"Próxima página"}"></button></div>
      <div class="counter">${r.i+1} / ${r.pages.length}</div>`;
  }
  const atEnd = !paged || r.i >= r.pages.length - 1;
  const foot = atEnd ? `<div class="rfoot">${r.ci > 0 ? `<button class="btn" data-act="read" data-id="${esc(w.id)}" data-ch="${r.ci-1}">Capítulo anterior</button>` : ""}
    ${r.ci < chs.length - 1 ? `<button class="btn" data-act="read" data-id="${esc(w.id)}" data-ch="${r.ci+1}">Próximo capítulo</button>` : ""}
    <button class="btn" data-act="closereader">Fechar</button></div>` : "";
  R.innerHTML = readerShell(w, r.ci, inner + foot);
}
function closeReader(){ S.reader = null; const R = $("#reader"); R.hidden = true; R.innerHTML = ""; document.body.style.overflow = ""; }

/* ---------- eventos ---------- */
document.addEventListener("click", async ev => {
  const el = ev.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act, d = el.dataset;
  switch (a){
    case "tab": go(d.tab); break;
    case "open": S.detailId = d.id; go("detail", {push:true}); break;
    case "back": back(); break;
    case "genre": S.genre = d.g; $("#genres").innerHTML = genreChips(); $("#results").innerHTML = resultsHTML(); break;
    case "fav":
      S.favs.has(d.id) ? S.favs.delete(d.id) : S.favs.add(d.id);
      ls.set("oboro:favs", Array.from(S.favs)); render(); break;
    case "theme": setTheme(d.t); render(); break;
    case "newwork": newPub(null); break;
    case "signup": doAuth(true); break;
    case "logout": await sb.auth.signOut(); toast("Você saiu."); break;
    case "newch": newPub(d.id); break;
    case "rmpage": S.pub.pages.splice(+d.i, 1); renderThumbs(); break;
    case "askdel": S.confirmDel = true; render(); break;
    case "canceldel": S.confirmDel = false; render(); break;
    case "delwork": {
      const w = S.works.find(x => x.id === d.id); if (!w) break;
      el.disabled = true;
      try{ await removeWork(w); S.favs.delete(w.id); ls.set("oboro:favs", Array.from(S.favs)); S.confirmDel = false; S.prev = []; toast("Obra excluída."); go("profile"); }
      catch(e){ toast("Não foi possível excluir."); el.disabled = false; }
      break;
    }
    case "read": openReader(d.id, +d.ch); break;
    case "closereader": closeReader(); break;
    case "turn": {
      const r = S.reader; if (!r || !r.pages) break;
      const n = r.i + (+d.d);
      if (n >= 0 && n < r.pages.length){ r.i = n; drawReader(); $("#reader").scrollTop = 0; }
      break;
    }
  }
});
document.addEventListener("input", ev => {
  const t = ev.target;
  if (t.id === "q"){ S.q = t.value; $("#results").innerHTML = resultsHTML(); }
  else if (t.id === "myname"){ S.me.name = t.value; ls.set("oboro:name", t.value); }
  else if (S.pub && t.id && t.id.startsWith("p_")){
    const m = {p_title:"title", p_genre:"genre", p_age:"age", p_mode:"mode", p_syn:"synopsis", p_chtitle:"chTitle"}[t.id];
    if (m) S.pub[m] = t.value;
  }
});
document.addEventListener("change", async ev => {
  const t = ev.target;
  if (t.id === "p_cover" && t.files[0]){
    try{ S.pub.cover = await shrink(t.files[0], {cover:true}); $("#covbox").innerHTML = `<div class="covprev"><img src="${S.pub.cover}" alt="Prévia da capa"></div>`; }
    catch(e){ toast("Não foi possível ler a imagem da capa."); }
  } else if (t.id === "p_pages" && t.files.length){ await onPages(t.files); t.value = ""; }
});
document.addEventListener("submit", ev => {
  if (ev.target.id === "pubform"){ ev.preventDefault(); submitPub(); }
  if (ev.target.id === "authform"){ ev.preventDefault(); doAuth(false); }
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && !$("#reader").hidden) closeReader();
  const r = S.reader;
  if (r && r.pages && (ev.key === "ArrowRight" || ev.key === "ArrowLeft")){
    const w = findWork(r.wid); if (!w || (w.mode !== "ltr" && w.mode !== "rtl")) return;
    const dir = (ev.key === "ArrowRight" ? 1 : -1) * (w.mode === "rtl" ? -1 : 1);
    const n = r.i + dir; if (n >= 0 && n < r.pages.length){ r.i = n; drawReader(); $("#reader").scrollTop = 0; }
  }
});

/* ---------- início ---------- */
async function boot(){
  if (!sb){ toast("Não foi possível conectar ao servidor."); return; }
  const first = await sb.auth.getSession();
  setUser(first.data.session && first.data.session.user);
  sb.auth.onAuthStateChange((ev, sess) => {
    setUser(sess && sess.user);
    if (ev === "SIGNED_IN" || ev === "SIGNED_OUT"){ setTimeout(() => { loadAll(); if (S.view === "profile") render(); }, 0); }
  });
  await loadAll();
  render();
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) loadAll(); });

function setTheme(t){
  S.theme = t === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", S.theme);
  ls.set("oboro:theme", S.theme);
}
(function init(){
  setTheme(ls.get("oboro:theme", "light"));
  let h = ""; try{ h = location.hash.replace("#", ""); }catch(e){}
  const map = {inicio:"home", buscar:"search", perfil:"profile", salvos:"library"};
  S.view = map[h] || "home";
  render();
  boot();
})();
