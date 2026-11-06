// Monta o PowerPoint da Feira de Ciências (mesmo visual do site) + plano de animações para o PowerPoint aplicar.
const pptxgen = require('pptxgenjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const A = f => path.join(__dirname, 'assets', f);
const PAL = ['FF2E88', 'FFD23F', '00D1B2', 'FF7A1A', '4D7CFF', 'B14DFF'];
const CREME = 'FFF6E6', FUNDO = '14081F', TINTA = '0B0414';
const SW = 13.333, SH = 7.5;
const TITULO = 'Arial Black', CORPO = 'Calibri';

/* ---------- os textos vêm direto do site (index.html): mudou lá, muda aqui ---------- */
const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const ini = HTML.indexOf('function secao(');
const fimTextos = HTML.indexOf('\n];', HTML.indexOf('const TEXTOS = ['));
const TEXTOS_SITE = new Function(HTML.slice(ini, fimTextos + 3) + '\nreturn TEXTOS;')();
const hex = c => c.replace('#', '').toUpperCase();
let nFala = 0;
const FALAS = [];   // frases que o falas.ps1 grava com a voz da Maria
const TEXTOS = TEXTOS_SITE.map(t => {
  if (typeof t === 'string') return { texto: t };
  const it = { ...t };
  if (it.cor) it.cor = [].concat(it.cor).map(hex);
  if (it.rotulo) it.rotulo = it.rotulo.toUpperCase();
  if (it.fala) {
    const frases = [].concat(it.fala);
    it.audio = `fala${++nFala}.wav`;
    FALAS.push({ arquivo: it.audio, frases: frases.map(limpaAst) });
    it.fala = frases.join(' ');
    it.mao = it.mao != null;
  }
  return it;
});
function limpaAst(t) { return t.replace(/\*/g, ''); }
const PESSOAS = [...new Map(TEXTOS.filter(t => t.por).map(t => [t.por, t])).values()];
/* ---------- ajudantes ---------- */
const limpa = t => t.replace(/\*/g, '');
const palavras = t => limpa(t).split(/\s+/).filter(Boolean).length;
// *destaque* vira um trecho colorido em negrito
function trechos(t, base, destaque) {
  return t.split(/(\*[^*]+\*)/g).filter(Boolean).map(p => {
    const hl = p.startsWith('*') && p.endsWith('*');
    return { text: hl ? p.slice(1, -1) : p, options: { color: hl ? destaque : base, bold: true } };
  });
}
const tamanho = n => n < 110 ? 38 : n < 150 ? 34 : n < 200 ? 31 : n < 250 ? 28 : 26;
const sombra = (cor, off = 5, blur = 0, op = 1) => ({ type: 'outer', color: cor, blur, offset: off, angle: 45, opacity: op });
const letrasColoridas = (txt, k0 = 0) => [...txt].map((ch, k) => ({ text: ch, options: { color: ch === ' ' ? CREME : PAL[(k + k0) % 6] } }));

async function tam(f) { const m = await sharp(A(f)).metadata(); return { w: m.width, h: m.height }; }

function selo(slide, it, cx, y, cor, grande, nomes) {
  const s = grande ? 1.25 : 1;
  const w = (1.65 + it.por.length * .12) * s, h = .62 * s, x = cx - w / 2;
  const ini = it.por.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const n = k => { const nome = `selo_${k}`; nomes.push(nome); return nome; };
  slide.addShape('roundRect', { x, y, w, h, rectRadius: h / 2, fill: { color: FUNDO, transparency: 30 }, line: { color: cor, width: 1.75 }, shadow: sombra('000000', 3, 12, .4), objectName: n('pilula') });
  slide.addShape('ellipse', { x: x + .07 * s, y: y + .07 * s, w: h - .14 * s, h: h - .14 * s, fill: { color: cor }, objectName: n('avatar') });
  slide.addText(ini, { x: x + .07 * s, y: y + .07 * s, w: h - .14 * s, h: h - .14 * s, fontFace: TITULO, fontSize: 13 * s, color: TINTA, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: n('ini') });
  slide.addText([
    { text: 'APRESENTANDO', options: { fontSize: 8.5 * s, bold: true, color: CREME, charSpacing: 2.5, transparency: 35, breakLine: true } },
    { text: it.por, options: { fontSize: 15 * s, bold: true, color: CREME } }
  ], { x: x + h + .02, y, w: w - h - .55 * s, h, fontFace: CORPO, valign: 'middle', margin: 0, isTextBox: true, objectName: n('nome') });
  [.5, .9, .65, 1].forEach((f, k) => {
    const bh = .26 * s * f;
    slide.addShape('roundRect', { x: x + w - .42 * s + k * .075 * s, y: y + h / 2 + .13 * s - bh, w: .05 * s, h: bh, rectRadius: .02, fill: { color: cor }, objectName: n('eq' + k) });
  });
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Feira de Ciências: O idioma visual de uma América Latina';
  pres.author = 'Feira de Ciências';
  const plano = [];
  const total = TEXTOS.length;
  const FLAGS = { br: await tam('flag_br.png'), ar: await tam('flag_ar.png'), mx: await tam('flag_mx.png') };
  const ONDA = { br: await tam('onda_br.png'), ar: await tam('onda_ar.png'), mx: await tam('onda_mx.png') };

  /* ===== CAPA ===== */
  {
    const s = pres.addSlide();
    s.background = { path: A('bg_capa.jpg') };
    s.addText(letrasColoridas('FEIRA DE'), { x: 0, y: 1.55, w: SW, h: 1.15, fontFace: TITULO, fontSize: 60, align: 'center', valign: 'middle', margin: 0, isTextBox: true, shadow: sombra(TINTA, 5), objectName: 'tit1' });
    s.addText(letrasColoridas('CIÊNCIAS', 3), { x: 0, y: 2.55, w: SW, h: 2.0, fontFace: TITULO, fontSize: 112, align: 'center', valign: 'middle', margin: 0, isTextBox: true, shadow: sombra(TINTA, 8), objectName: 'tit2' });
    s.addText([
      { text: 'O idioma visual de uma ', options: { color: CREME } },
      { text: 'América Latina', options: { color: 'FFD23F' } }
    ], { x: 0, y: 4.55, w: SW, h: .75, fontFace: 'Georgia', italic: true, fontSize: 32, align: 'center', valign: 'middle', margin: 0, isTextBox: true, shadow: sombra('000000', 2, 10, .6), objectName: 'sub' });
    s.addText('CULTURA  ✦  MÚSICA  ✦  DANÇA  ✦  FESTAS  ✦  TRADIÇÕES  ✦  CULTURA  ✦  MÚSICA  ✦  DANÇA', { x: -.6, y: 5.95, w: SW + 1.2, h: .52, rotate: 2.2, fill: { color: 'FFD23F' }, line: { color: TINTA, width: 2.5 }, fontFace: TITULO, fontSize: 17, color: FUNDO, align: 'center', valign: 'middle', margin: 0, wrap: false, isTextBox: true, objectName: 'fitaB' });
    s.addText('BRASIL  ✦  MÉXICO  ✦  ARGENTINA  ✦  AMÉRICA LATINA  ✦  BRASIL  ✦  MÉXICO  ✦  ARGENTINA', { x: -.6, y: 6.05, w: SW + 1.2, h: .56, rotate: -2.6, fill: { color: 'FF2E88' }, line: { color: TINTA, width: 2.5 }, fontFace: TITULO, fontSize: 18, color: FUNDO, align: 'center', valign: 'middle', margin: 0, wrap: false, isTextBox: true, objectName: 'fitaA' });
    s.addNotes('Capa: Feira de Ciências, O idioma visual de uma América Latina.');
    plano.push({ transicao: 'fade', efeitos: [
      { nome: 'tit1', efeito: 'bounce', gatilho: 'com', dur: .7, porLetra: true },
      { nome: 'tit2', efeito: 'bounce', gatilho: 'depois', dur: .7, porLetra: true },
      { nome: 'sub', efeito: 'rise', gatilho: 'depois', dur: .8 },
      { nome: 'fitaB', efeito: 'wipe', gatilho: 'depois', dur: .6 },
      { nome: 'fitaA', efeito: 'wipe', gatilho: 'com', dur: .6, atraso: .15 }
    ] });
  }

  /* ===== TELAS DOS TEXTOS ===== */
  let secaoAnterior = null;
  for (let i = 0; i < total; i++) {
    const it = TEXTOS[i];
    const s = pres.addSlide();
    const cores = it.cor || PAL;
    const acc = cores[i % cores.length];
    const efeitos = [];
    let transicao = 'fade';

    if (it.fala) {
      /* --- o site falando --- */
      s.background = { path: A('bg_mix.jpg') };
      s.addImage({ path: A('mascote.png'), x: .95, y: 2.0, w: 3.6, h: 3.375, objectName: 'mascote' });
      s.addText('👋', { x: 3.45, y: 1.15, w: 1.6, h: 1.6, fontFace: 'Segoe UI Emoji', fontSize: 84, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'mao' });
      s.addShape('triangle', { x: 4.72, y: 3.45, w: .62, h: .62, rotate: 270, fill: { color: CREME }, line: { color: TINTA, width: 3 }, objectName: 'rabo' });
      s.addShape('roundRect', { x: 5.15, y: 1.95, w: 7.35, h: 3.75, rectRadius: .4, fill: { color: CREME }, line: { color: TINTA, width: 3.5 }, shadow: sombra('00D1B2', 9, 0, 1), objectName: 'balao' });
      s.addText('🔊  SITE DO TRABALHO', { x: 5.55, y: 1.68, w: 3.4, h: .52, shape: 'roundRect', rectRadius: .26, fill: { color: 'FF2E88' }, line: { color: TINTA, width: 2.5 }, fontFace: TITULO, fontSize: 13, color: CREME, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'etiqueta' });
      const n = limpa(it.fala).length;
      s.addText(trechos(it.fala, FUNDO, 'E0156E'), { x: 5.6, y: 2.4, w: 6.5, h: 3.0, fontFace: CORPO, fontSize: n < 60 ? 42 : 30, valign: 'middle', margin: 0, lineSpacingMultiple: 1.05, isTextBox: true, objectName: 'falatxt' });
      s.addNotes('O site fala sozinho (áudio automático): ' + limpa(it.fala));
      transicao = 'ripple';
      efeitos.push(
        { nome: 'mascote', efeito: 'zoom', gatilho: 'com', dur: .7 },
        { nome: 'rabo', efeito: 'fade', gatilho: 'com', dur: .4, atraso: .35 },
        { nome: 'balao', efeito: 'zoom', gatilho: 'com', dur: .6, atraso: .3 },
        { nome: 'etiqueta', efeito: 'zoom', gatilho: 'com', dur: .5, atraso: .6 },
        { nome: 'falatxt', efeito: 'fade', gatilho: 'com', atraso: .7, porPalavra: true, total: 'audio' },
        { nome: 'mao', efeito: 'zoom', gatilho: 'com', dur: .5, atraso: .5 },
        { nome: 'mao', efeito: 'teeter', gatilho: 'com', dur: .9, atraso: 1.0, repetir: 12, enfase: true }
      );
      plano.push({ transicao, efeitos, audio: it.audio });
      secaoAnterior = null;
      continue;
    }

    if (it.espera) {
      /* --- tela "A seguir..." --- */
      s.background = { path: A(`bg_${it.bandeira}_espera.jpg`) };
      const nome = it.titulo.replace(/^Cultura d[aoe]s? /i, '').toUpperCase();
      s.addText(nome, { x: -1, y: 1.6, w: SW + 2, h: 2.6, fontFace: TITULO, fontSize: 170, color: CREME, transparency: 92, align: 'center', valign: 'middle', margin: 0, wrap: false, isTextBox: true, objectName: 'gigante' });
      s.addText('✦   A SEGUIR   ✦', { x: 0, y: 1.2, w: SW, h: .45, fontFace: CORPO, fontSize: 17, bold: true, color: 'FFD23F', charSpacing: 6, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'kicker' });
      const fw = 4.9, fh = fw * ONDA[it.bandeira].h / ONDA[it.bandeira].w;
      s.addImage({ path: A(`onda_${it.bandeira}.png`), x: (SW - fw) / 2, y: 1.6, w: fw, h: fh, objectName: 'bandeira' });
      s.addText(it.titulo.toUpperCase(), { x: 0, y: 4.95, w: SW, h: .95, fontFace: TITULO, fontSize: 48, color: CREME, align: 'center', valign: 'middle', margin: 0, isTextBox: true, shadow: sombra(cores[0], 4), objectName: 'tituloEspera' });
      const nomesSelo = [];
      selo(s, it, SW / 2, 6.0, cores[0], true, nomesSelo);
      s.addNotes(`Tela de espera: aguarde ${it.por} chegar e aperte para começar a ${it.titulo}.`);
      plano.push({ transicao: 'vortex', efeitos: [
        { nome: 'kicker', efeito: 'fade', gatilho: 'com', dur: .6 },
        { nome: 'bandeira', efeito: 'float', gatilho: 'com', dur: 1.0, atraso: .2 },
        { nome: 'tituloEspera', efeito: 'rise', gatilho: 'depois', dur: .8 },
        ...nomesSelo.map((nm, k) => ({ nome: nm, efeito: 'fade', gatilho: k ? 'com' : 'depois', dur: .6 }))
      ] });
      secaoAnterior = null;
      continue;
    }

    /* --- legenda --- */
    const temSecao = !!it.titulo;
    s.background = { path: A(it.muertos ? 'bg_muertos.jpg' : temSecao ? `bg_${it.bandeira}.jpg` : 'bg_mix.jpg') };
    const num = String(i + 1).padStart(2, '0');
    s.addText(num, { x: 8.9, y: 4.25, w: 4.6, h: 3.0, fontFace: TITULO, fontSize: 190, color: acc, transparency: 86, align: 'right', valign: 'bottom', margin: 0, isTextBox: true, objectName: 'numero' });

    const nomesCab = [];
    if (temSecao) {
      const tw = it.titulo.length * .345, fwv = .95, fhv = fwv * FLAGS[it.bandeira].h / FLAGS[it.bandeira].w;
      const x0 = (SW - (fwv + .28 + tw)) / 2;
      s.addImage({ path: A(`flag_${it.bandeira}.png`), x: x0, y: 1.2 + (.72 - fhv) / 2, w: fwv, h: fhv, rotate: -4, shadow: sombra(TINTA, 4), objectName: 'cab_bandeira' });
      s.addText(it.titulo.toUpperCase(), { x: x0 + fwv + .28, y: 1.15, w: tw + .4, h: .82, fontFace: TITULO, fontSize: 34, color: CREME, valign: 'middle', margin: 0, isTextBox: true, shadow: sombra(acc, 3), objectName: 'cab_titulo' });
      nomesCab.push('cab_bandeira', 'cab_titulo');
      selo(s, it, SW / 2, 2.0, acc, false, nomesCab);
    }
    const cy = temSecao ? 2.85 : 1.75, ch = temSecao ? 3.6 : 4.55;
    s.addShape('roundRect', { x: .9, y: cy, w: SW - 1.8, h: ch, rectRadius: .32, fill: { color: 'FFFFFF', transparency: 90 }, line: { color: acc, width: 2, transparency: 20 }, shadow: sombra('000000', 6, 24, .45), objectName: 'cartao' });
    if (!temSecao) s.addText('“', { x: .95, y: cy - .95, w: 1.4, h: 1.6, fontFace: 'Georgia', fontSize: 120, color: acc, margin: 0, isTextBox: true, objectName: 'aspas' });
    if (it.rotulo) s.addText(it.rotulo, { x: 1.4, y: cy - .27, w: 2.9, h: .52, shape: 'roundRect', rectRadius: .26, fill: { color: acc }, line: { color: TINTA, width: 2.5 }, shadow: sombra(TINTA, 4), fontFace: TITULO, fontSize: 14, color: FUNDO, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'rotulo' });
    const n = limpa(it.texto).length;
    s.addText(trechos(it.texto, CREME, acc), { x: 1.45, y: cy + .38, w: SW - 2.9, h: ch - .76, fontFace: CORPO, fontSize: tamanho(n), valign: 'middle', margin: 0, lineSpacingMultiple: 1.08, isTextBox: true, shadow: sombra('000000', 2, 10, .5), objectName: 'texto' });

    // contador e barra de progresso
    s.addText([{ text: num, options: { color: acc } }, { text: ` / ${String(total).padStart(2, '0')}`, options: { color: CREME, transparency: 40 } }],
      { x: .55, y: 6.6, w: 1.3, h: .32, fontFace: TITULO, fontSize: 13, valign: 'middle', margin: 0, isTextBox: true, objectName: 'contador' });
    const bx = 1.9, bw = SW - 2.45, gap = .05, segw = (bw - gap * (total - 1)) / total;
    for (let j = 0; j < total; j++) {
      const on = j <= i, atual = j === i;
      s.addShape('roundRect', { x: bx + j * (segw + gap), y: 6.73 - (atual ? .03 : 0), w: segw, h: atual ? .12 : .065, rectRadius: .03, fill: { color: on ? PAL[j % 6] : CREME, transparency: on ? 0 : 84 }, objectName: `seg${j}` });
    }
    s.addNotes((it.titulo ? `${it.titulo} (apresenta: ${it.por})\n\n` : '') + limpa(it.texto));

    const novaSecao = temSecao && secaoAnterior !== it.titulo;
    if (novaSecao) {
      transicao = 'push';
      efeitos.push({ nome: 'cab_bandeira', efeito: 'zoom', gatilho: 'com', dur: .6 },
        { nome: 'cab_titulo', efeito: 'rise', gatilho: 'com', dur: .7, atraso: .15 },
        ...nomesCab.filter(nm => nm.startsWith('selo_')).map(nm => ({ nome: nm, efeito: 'fade', gatilho: 'com', dur: .6, atraso: .5 })));
    }
    if (it.muertos) transicao = 'curtains';
    efeitos.push({ nome: 'cartao', efeito: 'fade', gatilho: 'com', dur: .6, atraso: novaSecao ? .4 : 0 });
    if (!temSecao) efeitos.push({ nome: 'aspas', efeito: 'zoom', gatilho: 'com', dur: .5, atraso: .2 });
    if (it.rotulo) efeitos.push({ nome: 'rotulo', efeito: 'zoom', gatilho: 'com', dur: .5, atraso: .3 });
    efeitos.push({ nome: 'texto', efeito: 'fade', gatilho: 'com', atraso: novaSecao ? .9 : .4, porPalavra: true, total: palavras(it.texto) * .33 });
    plano.push({ transicao, efeitos });
    secaoAnterior = it.titulo || null;
  }

  /* ===== OBRIGADO ===== */
  {
    const s = pres.addSlide();
    s.background = { path: A('bg_fim.jpg') };
    s.addText(letrasColoridas('OBRIGADO!', 3), { x: 0, y: 1.7, w: SW, h: 2.0, fontFace: TITULO, fontSize: 104, align: 'center', valign: 'middle', margin: 0, isTextBox: true, shadow: sombra(TINTA, 8), objectName: 'obrigado' });
    s.addText([{ text: 'pela atenção  ·  ', options: { color: CREME } }, { text: '¡gracias!', options: { color: 'FFD23F' } }],
      { x: 0, y: 3.7, w: SW, h: .75, fontFace: 'Georgia', italic: true, fontSize: 32, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'subfim' });
    const pessoas = PESSOAS;
    const pw = 3.1, ph = .66, pg = .35, px0 = (SW - (pw * pessoas.length + pg * (pessoas.length - 1))) / 2;
    const ef = [{ nome: 'obrigado', efeito: 'bounce', gatilho: 'com', dur: .7, porLetra: true }, { nome: 'subfim', efeito: 'rise', gatilho: 'depois', dur: .7 }];
    pessoas.forEach((p, k) => {
      const x = px0 + k * (pw + pg), y = 4.95;
      s.addShape('roundRect', { x, y, w: pw, h: ph, rectRadius: ph / 2, fill: { color: FUNDO, transparency: 30 }, line: { color: p.cor[0], width: 2 }, objectName: `cred${k}` });
      const fwv = .62, fhv = fwv * FLAGS[p.bandeira].h / FLAGS[p.bandeira].w;
      s.addImage({ path: A(`flag_${p.bandeira}.png`), x: x + .28, y: y + (ph - fhv) / 2, w: fwv, h: fhv, objectName: `credf${k}` });
      s.addText(p.por, { x: x + 1.05, y, w: pw - 1.2, h: ph, fontFace: CORPO, fontSize: 19, bold: true, color: CREME, valign: 'middle', margin: 0, isTextBox: true, objectName: `credn${k}` });
      ef.push({ nome: `cred${k}`, efeito: 'rise', gatilho: 'depois', dur: .6 }, { nome: `credf${k}`, efeito: 'rise', gatilho: 'com', dur: .6 }, { nome: `credn${k}`, efeito: 'rise', gatilho: 'com', dur: .6 });
    });
    s.addNotes('Obrigado pela atenção!');
    plano.push({ transicao: 'honeycomb', efeitos: ef });
  }

  const saida = path.join(__dirname, 'base.pptx');
  await pres.writeFile({ fileName: saida });
  fs.writeFileSync(path.join(__dirname, 'plano.json'), JSON.stringify(plano, null, 1));
  fs.writeFileSync(path.join(__dirname, 'falas.json'), JSON.stringify(FALAS, null, 1));
  console.log('slides:', plano.length, '->', saida);
})();
