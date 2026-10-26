const IMG = {avatar:"avatar.jpg"};
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
  me:{id:null, name:""},
  q:"", genre:"", detailId:null, pub:null, reader:null, confirmDel:false, busy:false,
  loaded:false, loadErr:false, lastFocus:null
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
  try{
    const w = await sb.from("works").select("*, chapters(idx,title,pages,created_at)").order("updated_at", {ascending:false});
    if (w.error) throw w.error;
    S.works = w.data.map(mapWork);
    const r = await sb.from("reads").select("work_id,user_id,created_at");
    S.reads = (r.data || []).map(x => ({w:x.work_id, u:x.user_id, at:Date.parse(x.created_at)}));
    S.loaded = true; S.loadErr = false;
    refresh();
  }catch(e){
    S.loadErr = !S.loaded;
    toast("Sem conexão com o servidor. Tente de novo.");
    if (S.loadErr) refresh();
  }
}
async function blobOf(dataUrl){ return (await fetch(dataUrl)).blob(); }
async function upload(path, dataUrl){
  const r = await sb.storage.from("oboro").upload(path, await blobOf(dataUrl), {contentType:"image/jpeg", upsert:true});
  if (r.error) throw r.error;
}
async function removeWork(w){
  const r = await sb.from("works").delete().eq("id", w.id);
  if (r.error) throw r.error;
  S.works = S.works.filter(x => x.id !== w.id);
  const paths = [w.coverPath].concat((w.chapters || []).flatMap(c => c.paths || []));
  if (paths.length) sb.storage.from("oboro").remove(paths).then(() => {}, () => {});
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
  if (w.cover) return `<span class="cover ${cls||""}"><img src="${w.cover}" alt="" loading="lazy" decoding="async">${tag}</span>`;
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
  if (!S.loaded && !S.loadErr) return `<div class="empty" role="status"><p>Carregando obras…</p></div>`;
  if (S.loadErr) return `<div class="empty"><p>Não foi possível carregar as obras.</p><button class="btn" data-act="reload">Tentar de novo</button></div>`;
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
  if (!list.length && !S.loaded && !S.loadErr) return `<div class="empty" role="status"><p>Carregando obras…</p></div>`;
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
  if (S.busy) return;
  if (!email || pass.length < 6){ msg.textContent = "Informe o e-mail e uma senha de 6 ou mais caracteres."; return; }
  msg.textContent = create ? "Criando conta…" : "Entrando…";
  const btns = document.querySelectorAll("#authform button");
  S.busy = true; btns.forEach(b => b.disabled = true);
  let r;
  try{
    r = create ? await sb.auth.signUp({email, password:pass, options:{emailRedirectTo:"https://gaku093.github.io/OBORO-APP/#perfil"}}) : await sb.auth.signInWithPassword({email, password:pass});
  }catch(e){ r = {error:{message:"network"}}; }
  S.busy = false; btns.forEach(b => b.disabled = false);
  if (r.error){
    const m = r.error.message || "";
    msg.textContent = /network|fetch/i.test(m) ? "Sem conexão. Verifique a internet." : /Invalid login/i.test(m) ? "E-mail ou senha incorretos." : /already/i.test(m) ? "Este e-mail já tem conta. Toque em Entrar." : /confirm/i.test(m) ? "Confirme seu e-mail antes de entrar." : "Não foi possível continuar. Tente de novo.";
    return;
  }
  if (create && !r.data.session){
    const r2 = await sb.auth.signInWithPassword({email, password:pass});
    if (r2.error){ msg.textContent = "Conta criada. Toque em Entrar para continuar."; return; }
  }
  S.authMsg = "";
}
function setUser(u){
  S.user = u || null;
  S.me.id = u ? u.id : null;
  S.me.name = u ? ((u.user_metadata && u.user_metadata.name) || (u.email || "").split("@")[0]) : "";
}
let nameT;
function saveName(v){
  clearTimeout(nameT);
  nameT = setTimeout(async () => {
    if (!sb || !S.user) return;
    const name = v.trim();
    try{
      await sb.auth.updateUser({data:{name}});
      // mantém o nome nas obras já publicadas (a tabela exige de 1 a 40 caracteres)
      if (name){
        const r = await sb.from("works").update({author_name:name}).eq("author_id", S.me.id);
        if (!r.error) S.works.forEach(w => { if (w.authorId === S.me.id) w.authorName = name; });
      }
    }catch(e){}
  }, 700);
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
  try{
    if (opts.push) history.pushState({v:1}, "");
    else history.replaceState(null, "", "#" + {home:"inicio",search:"buscar",profile:"perfil",library:"salvos"}[view]);
  }catch(e){}
}
function stepBack(){ S.view = S.prev.pop() || "home"; S.confirmDel = false; render(); window.scrollTo(0, 0); }
function back(){
  if (S.view === "publish" && S.pub && (S.pub.pages.length || S.pub.cover || S.pub.title || S.pub.chTitle) && !confirm("Descartar o que você preencheu?")) return;
  if (history.state && history.state.v) history.back(); else stepBack();
}
// botão voltar do celular: fecha o leitor ou volta uma tela, em vez de sair do app
window.addEventListener("popstate", () => {
  if (!$("#reader").hidden){ hardCloseReader(); return; }
  if (S.prev.length) stepBack();
});
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
  let wid = null, createdWork = false;
  const uploaded = [];
  try{
    const uid = S.me.id;
    const base = ch ? S.works.find(w => w.id === p.workId) : null;
    if (ch && !base) throw {code:"gone"};
    wid = base ? base.id : crypto.randomUUID();
    const ci = base ? base.chapters.length : 0;
    const dir = uid + "/" + wid;
    let coverPath = base ? base.coverPath : dir + "/cover.jpg";
    if (!base){ stat.textContent = "Enviando capa…"; await upload(coverPath, p.cover); uploaded.push(coverPath); }
    const paths = [];
    for (let i = 0; i < p.pages.length; i++){
      stat.textContent = `Enviando página ${i+1} de ${p.pages.length}…`;
      const path = `${dir}/c${ci}/${String(i).padStart(3,"0")}.jpg`;
      await upload(path, p.pages[i]); uploaded.push(path); paths.push(path);
    }
    stat.textContent = "Salvando…";
    if (!base){
      const r = await sb.from("works").insert({id:wid, author_id:uid, author_name:name, title:p.title.trim(), genre:p.genre, age:p.age, mode:p.mode, synopsis:p.synopsis.trim(), cover_path:coverPath});
      if (r.error) throw r.error;
      createdWork = true;
    }
    const rc = await sb.from("chapters").insert({work_id:wid, idx:ci, title:p.chTitle.trim(), pages:paths});
    if (rc.error) throw rc.error;
    await loadAll();
    S.pub = null; S.detailId = wid; S.prev = ["profile"]; S.view = "detail"; render(); window.scrollTo(0, 0);
    toast("Publicado!");
  }catch(e){
    try{
      if (createdWork) await sb.from("works").delete().eq("id", wid);
      if (uploaded.length) await sb.storage.from("oboro").remove(uploaded);
    }catch(_){}
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
  return `<div class="rtop"><button class="ibtn" data-act="closereader" aria-label="Fechar leitor" style="color:#fff">${I.back.replace("<svg","<svg fill=\"#fff\"")}</button>
    <div class="tt"><b>${esc(w.title)}</b><span>${ci+1}. ${esc(c.title)}</span></div></div><div class="rbody" id="rbody">${inner}</div>`;
}
function drawReader(){
  const r = S.reader, w = findWork(r.wid); if (!w) return;
  const R = $("#reader"), chs = w.chapters, paged = w.mode === "ltr" || w.mode === "rtl";
  let inner;
  if (!r.pages.length) inner = '<div class="rmsg">Este capítulo não tem páginas.</div>';
  else if (!paged) inner = r.pages.map((s, i) => `<img src="${s}" alt="Página ${i+1}" loading="lazy" decoding="async">`).join("");
  else {
    const rtl = w.mode === "rtl";
    inner = `<div class="rpage"><button class="zone l" data-act="turn" data-d="${rtl?1:-1}" aria-label="${rtl?"Próxima página":"Página anterior"}"></button>
      <img src="${r.pages[r.i]}" alt="Página ${r.i+1}"><button class="zone r" data-act="turn" data-d="${rtl?-1:1}" aria-label="${rtl?"Página anterior":"Próxima página"}"></button></div>
      <div class="counter" aria-live="polite">${r.i+1} / ${r.pages.length}</div>`;
    // pré-carrega as páginas vizinhas para a virada ser instantânea
    [r.i - 1, r.i + 1].forEach(k => { if (r.pages[k]) new Image().src = r.pages[k]; });
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
    case "logout": try{ await sb.auth.signOut(); toast("Você saiu."); }catch(e){ toast("Não foi possível sair. Tente de novo."); } break;
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
    case "turn": turnPage(+d.d); break;
    case "reload": loadAll(); break;
  }
});
document.addEventListener("input", ev => {
  const t = ev.target;
  if (t.id === "q"){ S.q = t.value; $("#results").innerHTML = resultsHTML(); }
  else if (t.id === "myname"){ S.me.name = t.value; saveName(t.value); }
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
    turnPage(dir);
  }
});

/* ---------- início ---------- */
async function boot(){
  if (!sb){ toast("Não foi possível conectar ao servidor."); return; }
  const first = await sb.auth.getSession();
  setUser(first.data.session && first.data.session.user);
  sb.auth.onAuthStateChange((ev, sess) => {
    if (ev === "USER_UPDATED") return;
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
