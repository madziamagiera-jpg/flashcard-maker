// SCORM 1.2 export — builds a self-contained .zip package

function crc32(data) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function strToU8(s) { return new TextEncoder().encode(s); }

function buildZip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(localHeader.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 0, true);
    dv.setUint16(8, 0, true);   // STORE
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0x21, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, size, true);
    dv.setUint32(22, size, true);
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);
    chunks.push(localHeader);
    chunks.push(f.data);

    const cdh = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(cdh.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 20, true);
    cdv.setUint16(6, 20, true);
    cdv.setUint16(8, 0, true);
    cdv.setUint16(10, 0, true);
    cdv.setUint16(12, 0, true);
    cdv.setUint16(14, 0x21, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, size, true);
    cdv.setUint32(24, size, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint16(30, 0, true);
    cdv.setUint16(32, 0, true);
    cdv.setUint16(34, 0, true);
    cdv.setUint16(36, 0, true);
    cdv.setUint32(38, 0, true);
    cdv.setUint32(42, offset, true);
    cdh.set(nameBytes, 46);
    central.push(cdh);

    offset += localHeader.length + f.data.length;
  }

  let cdSize = 0;
  for (const c of central) cdSize += c.length;
  const cdOffset = offset;
  for (const c of central) chunks.push(c);

  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(4, 0, true);
  edv.setUint16(6, 0, true);
  edv.setUint16(8, files.length, true);
  edv.setUint16(10, files.length, true);
  edv.setUint32(12, cdSize, true);
  edv.setUint32(16, cdOffset, true);
  edv.setUint16(20, 0, true);
  chunks.push(eocd);

  return new Blob(chunks, { type: 'application/zip' });
}

function imsmanifest(title) {
  const safeTitle = String(title).replace(/[<>&"]/g, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="wset.flashcards.${Date.now()}" version="1.2"
 xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
 xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
  http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
  http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="default_org">
    <organization identifier="default_org">
      <title>${safeTitle}</title>
      <item identifier="i1" identifierref="r1">
        <title>${safeTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="r1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="flashcards.js"/>
      <file href="styles.css"/>
    </resource>
  </resources>
</manifest>`;
}

function standaloneHTML(set, variant) {
  const data = JSON.stringify(set).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${String(set.title).replace(/[<>&"]/g, '')}</title>
<link rel="stylesheet" href="styles.css"/>
</head>
<body>
<div id="root"></div>
<script>window.__WSET_FLASHCARD_SET__ = ${data};window.__WSET_VARIANT__ = ${JSON.stringify(variant)};</script>
<script src="flashcards.js"></script>
</body>
</html>`;
}

function standaloneCSS() {
  // Lato added to Google Fonts so the brand font renders in the exported package
  return `@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&family=Oswald:wght@700&display=swap');
:root { --blue:#3250E6; --wheat:#FFEAB1; --warm:#F8F4E7; --black:#1A1A1A; }
* { box-sizing: border-box; }
html, body { height:100%; margin:0; padding:0; }
body { font-family:'Lato',Arial,sans-serif; background:#fff; color:var(--black); display:flex; align-items:center; justify-content:center; padding:24px; box-sizing:border-box; }
/* Height is set by JS (applyWrapSize) to guarantee 16:10 ratio inside any LMS iframe */
.wrap { width:100%; max-width:960px; background:#fff; border-radius:14px; box-shadow:0 20px 40px -20px rgba(15,20,60,.18); display:flex; flex-direction:column; padding:28px 32px 24px; box-sizing:border-box; overflow:hidden; }
.top { display:flex; justify-content:space-between; font-weight:700; font-size:14px; color:var(--blue); margin-bottom:8px; flex-shrink:0; }
.top .side { color:#6b7280; font-weight:400; }
.bar { height:8px; border-radius:999px; background:var(--wheat); overflow:hidden; margin-bottom:18px; flex-shrink:0; }
.bar i { display:block; height:100%; background:var(--blue); transition: width .3s ease; }
/* Flip card fills all remaining vertical space — matches live preview behaviour */
.flip { perspective:1600px; flex:1; min-height:0; margin-bottom:18px; }
.flip .inner { position:relative; width:100%; height:100%; transform-style:preserve-3d; transition:transform .55s cubic-bezier(.2,.7,.2,1); }
.flip.flipped .inner { transform:rotateY(180deg); }
.face { position:absolute; inset:0; border-radius:12px; backface-visibility:hidden; -webkit-backface-visibility:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:36px 40px; text-align:center; cursor:pointer; font-weight:700; }
.face:focus-visible { outline:3px solid var(--blue); outline-offset:3px; }
.front { background:#FFFDF7; border:1.5px solid #C8CEEB; }
.back  { background:var(--blue); color:#fff; transform:rotateY(180deg); padding:0; }
.label { font-size:13px; letter-spacing:.12em; text-transform:uppercase; color:var(--blue); margin-bottom:18px; font-weight:700; }
.back .label { color:rgba(255,234,177,.9); }
.q { font-size:clamp(20px, 2.4vw, 28px); line-height:1.3; color:var(--black); max-width:90%; }
.back .scroll { width:100%; height:100%; overflow:auto; padding:36px 40px; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.back .scroll.scrolls { justify-content:flex-start; }
.a { line-height:1.35; max-width:90%; }
.tap { margin-top:20px; font-size:13px; color:#6b7280; font-weight:400; }
.row { display:flex; justify-content:space-between; gap:12px; align-items:center; flex-shrink:0; }
.btn { background:var(--wheat); color:var(--blue); border:none; padding:10px 18px; border-radius:999px; font-weight:700; font-size:14px; cursor:pointer; font-family:inherit; }
.btn:disabled { opacity:.4; cursor:not-allowed; }
.ghost { background:transparent; border:none; color:var(--black); font-weight:700; cursor:pointer; padding:10px; font-family:inherit; }
/* Title and done cards fill the same space as the flip card */
.title-card { flex:1; min-height:0; border-radius:12px; background-size:cover; background-position:center; position:relative; display:flex; align-items:center; justify-content:center; padding:36px; overflow:hidden; }
.title-card::before { content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.35)); }
.title-box { position:relative; z-index:1; background:rgba(255,255,255,.8); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); padding:32px 40px; border-radius:14px; text-align:center; max-width:640px; }
.kicker { font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--blue); font-weight:700; margin-bottom:10px; }
.title { font-size:clamp(28px, 4vw, 44px); margin:0 0 10px; font-weight:700; line-height:1.1; color:var(--black); }
.sub { color:#303b66; font-size:16px; line-height:1.5; margin:0 0 22px; }
.start { background:var(--blue); color:#fff; padding:12px 28px; border:none; border-radius:999px; font-weight:700; font-size:15px; cursor:pointer; font-family:inherit; }
.done { flex:1; min-height:0; background:var(--blue); color:#fff; border-radius:12px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:36px; }
.done h3 { font-size:clamp(24px, 3vw, 36px); margin:0 0 10px; font-weight:700; }
.kbd { display:inline-block; border:1px solid rgba(0,0,0,.2); border-bottom-width:2px; border-radius:4px; padding:1px 6px; font-family:monospace; font-size:11px; background:#fff; }
.variant-editorial .front { background:var(--warm); border:2px solid var(--blue); border-radius:0; }
.variant-editorial .back { border-radius:0; }
.variant-editorial .q, .variant-editorial .a { font-family:'Fraunces', Georgia, serif; font-weight:400; }
.variant-label .front { background:var(--wheat); border:2px solid var(--black); border-radius:12px 12px 120px 120px / 12px 12px 60px 60px; }
.variant-label .back { border-radius:12px 12px 120px 120px / 12px 12px 60px 60px; border:2px solid var(--black); }
.variant-label .front .q { color:var(--blue); }
.variant-label .front .label { color:var(--black); }
`;
}

function standaloneJS() {
  return `(function(){
  function findAPI(win){for(var n=0;n<10&&win;n++){if(win.API)return win.API;win=win.parent===win?null:win.parent;}return null;}
  var API = findAPI(window) || (window.opener?findAPI(window.opener):null);
  function sc(k,v){try{if(API){if(v===undefined)return API.LMSGetValue(k);API.LMSSetValue(k,v);API.LMSCommit('');}}catch(e){}}
  if(API){try{API.LMSInitialize('');sc('cmi.core.lesson_status','incomplete');}catch(e){}}
  window.addEventListener('beforeunload',function(){if(API){try{API.LMSCommit('');API.LMSFinish('');}catch(e){}}});

  var set = window.__WSET_FLASHCARD_SET__;
  var variant = window.__WSET_VARIANT__ || 'default';
  var root = document.getElementById('root');
  var pos = -1, side = 'front';
  var total = set.cards.length;

  function applyWrapSize(){
    var wrap = root.querySelector('.wrap');
    if(!wrap) return;
    var pad = 48;
    var w = Math.min(window.innerWidth - pad, 960);
    if(w < 100) return;
    var h = Math.round(w * 10/16);
    var maxH = window.innerHeight - pad;
    if(maxH > 0 && h > maxH){ h = maxH; w = Math.round(h * 16/10); }
    wrap.style.width = w + 'px';
    wrap.style.height = h + 'px';
  }

  function render(){
    var html = '<div class="wrap '+(variant?'variant-'+variant:'')+'">';
    if(pos === -1){ html += titleCard(); }
    else if(pos >= total){ html += doneCard(); }
    else { html += cardView(set.cards[pos], pos); }
    html += '</div>';
    root.innerHTML = html;
    bind();
    setTimeout(function(){
      applyWrapSize();
      if(pos >= 0 && pos < total) fitAnswer();
    }, 0);
  }

  window.addEventListener('resize', applyWrapSize);
  window.addEventListener('load', applyWrapSize);
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function titleCard(){
    var bg = set.hero ? 'background-image:url('+JSON.stringify(set.hero).slice(1,-1)+')' : 'background:var(--blue)';
    return '<div class="title-card" style="'+bg+'">'+
      '<div class="title-box">'+
        '<div class="kicker">Revision flashcards</div>'+
        '<h2 class="title">'+esc(set.title)+'</h2>'+
        '<p class="sub">'+esc(set.instructions)+'</p>'+
        '<button class="start" data-act="start">Start ›</button>'+
        '<div style="margin-top:14px;font-size:12px;color:#6b7280">Tip: use <span class="kbd">←</span> <span class="kbd">→</span> to navigate and <span class="kbd">Space</span> to flip.</div>'+
      '</div></div>';
  }
  function cardView(c, i){
    var pct = ((i+1)/total)*100;
    return '<div class="top"><span>Card '+(i+1)+' of '+total+'</span><span class="side">'+(side==='back'?'Answer':'Question')+'</span></div>'+
      '<div class="bar"><i style="width:'+pct+'%"></i></div>'+
      '<div class="flip '+(side==='back'?'flipped':'')+'"><div class="inner">'+
        '<div class="face front" tabindex="'+(side==='back'?-1:0)+'" role="button" aria-pressed="'+(side==='back')+'" data-act="flip">'+
          '<div class="label">Question</div><div class="q">'+esc(c.front)+'</div>'+
          '<div class="tap">Tap or press <span class="kbd">Space</span> to reveal answer</div>'+
        '</div>'+
        '<div class="face back" tabindex="'+(side==='back'?0:-1)+'" role="button" aria-pressed="'+(side==='back')+'" data-act="flip">'+
          '<div class="scroll" data-scroll><div class="label">Answer</div><div class="a" data-ans>'+esc(c.back)+'</div></div>'+
        '</div>'+
      '</div></div>'+
      '<div class="row">'+
        '<button class="btn" data-act="prev" '+(i===0?'disabled':'')+'>Previous</button>'+
        '<button class="ghost" data-act="restart">↺ Restart</button>'+
        '<button class="btn" data-act="next">'+(i===total-1?'Finish':'Next')+' ›</button>'+
      '</div>';
  }
  function doneCard(){
    return '<div class="done"><div><h3>Well done — you\\'ve reviewed every card.</h3><p>Seek more. Practice makes perfect.</p><button class="start" data-act="restart">↺ Restart deck</button></div></div>';
  }
  function fitAnswer(){
    var ans = root.querySelector('[data-ans]');
    var wrap = root.querySelector('[data-scroll]');
    if(!ans || !wrap) return;
    var s = 30;
    ans.style.fontSize = s+'px';
    while((wrap.scrollHeight > wrap.clientHeight + 1) && s > 16){ s--; ans.style.fontSize = s+'px'; }
    if(wrap.scrollHeight > wrap.clientHeight + 1){ wrap.classList.add('scrolls'); }
  }
  function bind(){
    root.querySelectorAll('[data-act]').forEach(function(el){
      el.addEventListener('click', function(e){ act(el.dataset.act); e.stopPropagation(); });
    });
  }
  function act(a){
    if(a==='start'){ pos=0; side='front'; render(); }
    else if(a==='flip'){ side=side==='front'?'back':'front'; render(); }
    else if(a==='next'){ pos=Math.min(pos+1,total); side='front'; render(); if(pos>=total&&API){sc('cmi.core.lesson_status','completed');sc('cmi.core.score.raw','100');} }
    else if(a==='prev'){ pos=Math.max(pos-1,0); side='front'; render(); }
    else if(a==='restart'){ pos=-1; side='front'; render(); }
  }
  window.addEventListener('keydown',function(e){
    if(/input|textarea/i.test(e.target.tagName)) return;
    if(pos===-1){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); act('start'); } return; }
    if(e.key==='ArrowRight'){ e.preventDefault(); act('next'); }
    if(e.key==='ArrowLeft'){ e.preventDefault(); act('prev'); }
    if(e.key===' '){ e.preventDefault(); if(pos<total) act('flip'); }
  });
  render();
})();`;
}

export async function exportScorm(set, variant) {
  // Only embed hero if it's a data URL — relative paths won't resolve inside the zip
  const exportSet = {
    ...set,
    hero: set.hero && set.hero.startsWith('data:') ? set.hero : '',
  };

  const files = [
    { name: 'imsmanifest.xml', data: strToU8(imsmanifest(exportSet.title)) },
    { name: 'index.html',      data: strToU8(standaloneHTML(exportSet, variant)) },
    { name: 'styles.css',      data: strToU8(standaloneCSS()) },
    { name: 'flashcards.js',   data: strToU8(standaloneJS()) },
  ];

  const blob = buildZip(files);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safe = String(set.title).replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'flashcards';
  a.href = url;
  a.download = `${safe}-scorm.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
