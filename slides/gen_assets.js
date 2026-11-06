// Gera os fundos e desenhos do slide (mesmo visual do site) como imagens.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'assets');
fs.mkdirSync(OUT, { recursive: true });

const W = 1920, H = 1080;
const PAL = ['#ff2e88', '#ffd23f', '#00d1b2', '#ff7a1a', '#4d7cff', '#b14dff'];

function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

/* ---------- bandeiras ---------- */
const FLAGS = {
  br: { vb: [20, 14], body: '<rect width="20" height="14" fill="#009c3b"/><polygon points="10,1.6 18.4,7 10,12.4 1.6,7" fill="#ffdf00"/><circle cx="10" cy="7" r="3.4" fill="#002776"/><path d="M6.7 6.3 Q10 5.4 13.3 7.7" stroke="#fff" stroke-width=".55" fill="none"/>' },
  mx: { vb: [21, 12], body: '<rect width="7" height="12" fill="#006847"/><rect x="7" width="7" height="12" fill="#fff"/><rect x="14" width="7" height="12" fill="#ce1126"/><circle cx="10.5" cy="6" r="1.9" fill="#8c5a2b"/><path d="M8.7 6.8 Q10.5 9 12.3 6.8" stroke="#006847" stroke-width=".5" fill="none"/>' },
  ar: { vb: [18, 12], body: '<rect width="18" height="12" fill="#74acdf"/><rect y="4" width="18" height="4" fill="#fff"/><circle cx="9" cy="6" r="1.9" fill="none" stroke="#f6b40e" stroke-width=".6" stroke-dasharray=".45 .45"/><circle cx="9" cy="6" r="1.2" fill="#f6b40e"/>' }
};
const flag = (c, w) => { const [vw, vh] = FLAGS[c].vb; return `<svg width="${w}" height="${(w * vh / vw).toFixed(1)}" viewBox="0 0 ${vw} ${vh}">${FLAGS[c].body}</svg>`; };

/* ---------- caveira com sombrero ---------- */
const CALAVERA_BODY = (() => {
  let s = '<path d="M60 30 C33 30 24 50 24 68 C24 83 31 92 39 96 L39 110 C39 117 45 122 52 122 L68 122 C75 122 81 117 81 110 L81 96 C89 92 96 83 96 68 C96 50 87 30 60 30 Z" fill="#fff6e6" stroke="#14081f" stroke-width="3"/>';
  for (const cx of [45, 75]) {
    for (let a = 0; a < 8; a++) {
      const an = a * Math.PI / 4;
      s += `<circle cx="${(cx + Math.cos(an) * 11.5).toFixed(1)}" cy="${(72 + Math.sin(an) * 11.5).toFixed(1)}" r="3.6" fill="${a % 2 ? '#ff9f1c' : '#ff2e88'}"/>`;
    }
    s += `<circle cx="${cx}" cy="72" r="9.5" fill="#14081f"/><circle cx="${cx + 3}" cy="69" r="2.4" fill="#fff"/>`;
  }
  s += '<path d="M60 92 C53 87 54 80 57.5 80 C59 80 60 82 60 82 C60 82 61 80 62.5 80 C66 80 67 87 60 92 Z" fill="#14081f"/>';
  s += '<path d="M45 106 H75" stroke="#14081f" stroke-width="2.6" stroke-linecap="round"/>';
  for (let x = 49; x <= 71; x += 5.5) s += `<path d="M${x} 100 V112" stroke="#14081f" stroke-width="2" stroke-linecap="round"/>`;
  s += '<path d="M30 84 q4 -6 8 0 q-4 6 -8 0 M82 84 q4 -6 8 0 q-4 6 -8 0" fill="none" stroke="#00d1b2" stroke-width="2.2"/>';
  for (let a = 0; a < 5; a++) {
    const an = a * Math.PI * 2 / 5 - Math.PI / 2;
    s += `<circle cx="${(60 + Math.cos(an) * 4.5).toFixed(1)}" cy="${(57 + Math.sin(an) * 4.5).toFixed(1)}" r="3" fill="#00d1b2"/>`;
  }
  s += '<circle cx="60" cy="57" r="2.4" fill="#ffd23f"/>';
  s += '<ellipse cx="60" cy="36" rx="58" ry="13" fill="#e9b44c" stroke="#14081f" stroke-width="3"/>';
  s += '<ellipse cx="60" cy="36" rx="47" ry="8.5" fill="none" stroke="#e53935" stroke-width="2.6" stroke-dasharray="4 3"/>';
  s += '<path d="M39 37 C38 14 46 3 60 3 C74 3 82 14 81 37 Z" fill="#f4c55c" stroke="#14081f" stroke-width="3"/>';
  s += '<path d="M39.5 27 C47 31 73 31 80.5 27 L81 35 C73 39 47 39 39 35 Z" fill="#e53935" stroke="#14081f" stroke-width="2"/>';
  s += '<path d="M41 33 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3" fill="none" stroke="#2ecc71" stroke-width="1.8"/>';
  return s;
})();
const caveira = w => `<svg width="${w}" height="${(w * 132 / 120).toFixed(1)}" viewBox="0 0 120 132">${CALAVERA_BODY}</svg>`;

/* ---------- temas ---------- */
const TEMAS = {
  mix:     { blobs: ['#ff2e88', '#00d1b2', '#ff7a1a', '#4d7cff', '#ffd23f'], cores: PAL, formas: ['confete', 'bola', 'brilho'] },
  br:      { blobs: ['#00a651', '#ffd23f', '#00c853', '#1e4fd8', '#ffd23f'], cores: ['#00e676', '#ffd23f', '#4d7cff', '#fff6e6'], formas: ['losango', 'brilho', 'bola'] },
  ar:      { blobs: ['#4d8fd6', '#f6b40e', '#74acdf', '#9fd0ff', '#f6b40e'], cores: ['#9fd0ff', '#fff6e6', '#f6b40e'], formas: ['sol', 'brilho', 'bola'] },
  mx:      { blobs: ['#00a650', '#ff3b4f', '#ff9f1c', '#c2185b', '#2ecc71'], cores: ['#2ecc71', '#ff4d5e', '#ff9f1c', '#fff6e6'], formas: ['flor', 'confete', 'bola'] },
  muertos: { blobs: ['#7b2ff7', '#ff7a1a', '#ff2e88', '#4a148c', '#ff9f1c'], cores: ['#ff9f1c', '#ff2e88', '#b14dff', '#fff6e6'], formas: ['flor', 'flor', 'brilho'] }
};

function blobs(cores, forte) {
  const op = forte ? .6 : .42;
  const B = [[-120, -160, 760], [2000, 1150, 680], [820, 1260, 560], [1950, -120, 600], [960, 520, 330]];
  return `<g filter="url(#blur)">` + B.map(([x, y, r], k) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${cores[k]}" opacity="${k === 4 ? op * .3 : op}"/>`).join('') + '</g>';
}

function particula(forma, x, y, r, cor, rot, op) {
  const g = (inner) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${rot.toFixed(0)})" opacity="${op.toFixed(2)}">${inner}</g>`;
  switch (forma) {
    case 'bola': return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(r * 2.4).toFixed(0)}" fill="url(#glow-${cor.slice(1)})" opacity="${(op * .8).toFixed(2)}"/>`;
    case 'confete': return g(`<rect x="${-r}" y="${-r * .4}" width="${r * 2}" height="${r * .8}" fill="${cor}"/>`);
    case 'brilho': return g(`<path d="M0 ${-r * 1.6} L${r * .3} ${-r * .3} L${r * 1.6} 0 L${r * .3} ${r * .3} L0 ${r * 1.6} L${-r * .3} ${r * .3} L${-r * 1.6} 0 L${-r * .3} ${-r * .3} Z" fill="${cor}"/>`);
    case 'losango': return g(`<path d="M0 ${-r * 1.3} L${r} 0 L0 ${r * 1.3} L${-r} 0 Z" fill="${cor}"/>`);
    case 'sol': {
      let s = `<circle r="${r * .55}" fill="${cor}"/>`;
      for (let a = 0; a < 12; a++) { const an = a * Math.PI / 6; s += `<line x1="${Math.cos(an) * r * .8}" y1="${Math.sin(an) * r * .8}" x2="${Math.cos(an) * r * 1.4}" y2="${Math.sin(an) * r * 1.4}" stroke="${cor}" stroke-width="${Math.max(1.5, r * .18)}"/>`; }
      return g(s);
    }
    case 'flor': {
      let s = '';
      for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; s += `<circle cx="${Math.cos(an) * r * .7}" cy="${Math.sin(an) * r * .7}" r="${r * .5}" fill="${cor}"/>`; }
      return g(s + `<circle r="${r * .45}" fill="#ffd23f"/>`);
    }
  }
  return '';
}

function varal(modo) {
  let s = `<path d="M-20 18 Q960 34 1940 18" stroke="rgba(255,246,230,.6)" stroke-width="3" fill="none"/>`;
  const n = 15, passo = W / n;
  for (let i = 0; i < n; i++) {
    const cx = passo * (i + .5), cy = 18 + 16 * (1 - Math.pow((cx - 960) / 980, 2)) * .9;
    const rot = ((i * 37) % 11) - 5;
    const tipo = modo === 'mix' ? ['br', 'ar', 'mx'][i % 3] : modo;
    if (modo === 'muertos') {
      s += `<g transform="translate(${cx} ${cy}) rotate(${rot})" filter="url(#sombra)"><g transform="translate(-55 -4)">${caveira(110)}</g></g>`;
    } else {
      const w = 104, [vw, vh] = FLAGS[tipo].vb, h = w * vh / vw;
      s += `<g transform="translate(${cx} ${cy + 6}) rotate(${rot})" filter="url(#sombra)">` +
        `<rect x="${-w / 2 - 2}" y="-2" width="${w + 4}" height="${h + 4}" rx="4" fill="#0b0414" opacity=".55"/>` +
        `<g transform="translate(${-w / 2} 0)">${flag(tipo, w)}</g>` +
        `<rect x="-5" y="-12" width="10" height="18" rx="2" fill="#d9b26f"/><rect x="-5" y="1" width="10" height="5" fill="rgba(0,0,0,.25)"/></g>`;
    }
  }
  return s;
}

function faixaTecida() {
  const y0 = 1026;
  let s = `<rect x="0" y="${y0}" width="${W}" height="54" fill="#ffd23f"/>`;
  let z = `M0 ${y0 + 46}`;
  for (let x = 0; x <= W; x += 38) z += ` L${x + 19} ${y0 + 10} L${x + 38} ${y0 + 46}`;
  s += `<path d="${z} L${W} ${y0 + 46} Z" fill="#ff2e88"/>`;
  s += `<rect x="0" y="${y0}" width="${W}" height="8" fill="#00d1b2"/><rect x="0" y="${H - 8}" width="${W}" height="8" fill="#ff7a1a"/>`;
  return s;
}

function desfile(modo, r) {
  let s = '';
  const qtd = modo === 'muertos' ? 9 : 8;
  for (let k = 0; k < qtd; k++) {
    const z = .35 + r() * .65;
    const x = 40 + r() * 1800, y = 190 + r() * 760;
    const w = (modo === 'muertos' ? 110 : 150) * (.6 + z);
    const tipo = modo === 'mix' ? ['br', 'ar', 'mx'][k % 3] : modo;
    const blur = z < .6 ? ' filter="url(#blurLeve)"' : '';
    s += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${(r() * 16 - 8).toFixed(0)})" opacity="${(.1 + z * .16).toFixed(2)}"${blur}>${modo === 'muertos' ? caveira(w) : flag(tipo, w)}</g>`;
  }
  return s;
}

function defs(cores) {
  return `<defs>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="150"/></filter>
    <filter id="blurLeve"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="sombra" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity=".45"/></filter>
    <radialGradient id="vinheta" cx="50%" cy="50%" r="75%"><stop offset=".55" stop-color="#05000c" stop-opacity="0"/><stop offset="1" stop-color="#05000c" stop-opacity=".7"/></radialGradient>
    <radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff2e88" stop-opacity=".45"/><stop offset="1" stop-color="#ff2e88" stop-opacity="0"/></radialGradient>
    ${[...new Set(cores)].map(c => `<radialGradient id="glow-${c.slice(1)}"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('')}
  </defs>`;
}

function fundo(modo, { capa = false, fim = false, forte = false, seed = 3 } = {}) {
  const t = TEMAS[modo], r = rng(seed);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs(t.cores.concat(PAL))}`;
  s += `<rect width="${W}" height="${H}" fill="#14081f"/>` + blobs(t.blobs, forte);
  if (capa) {
    s += `<ellipse cx="960" cy="500" rx="900" ry="420" fill="url(#aura)"/>`;
    for (let a = 0; a < 32; a++) {
      const a1 = a / 32 * Math.PI * 2, a2 = a1 + .07;
      const p = (an, rr) => `${(960 + Math.cos(an) * rr).toFixed(0)},${(500 + Math.sin(an) * rr).toFixed(0)}`;
      s += `<polygon points="${p(a1, 330)} ${p(a1, 470)} ${p(a2, 470)} ${p(a2, 330)}" fill="#ffd23f" opacity=".16"/>`;
    }
    s += `<circle cx="960" cy="500" r="300" fill="none" stroke="#ff2e88" stroke-width="4" stroke-dasharray="14 12" opacity=".45"/>`;
  }
  s += desfile(modo, r);
  for (let k = 0; k < 64; k++) {
    const z = .25 + r() * .75;
    s += particula(t.formas[k % t.formas.length], r() * W, 130 + r() * 880, (3 + r() * 6) * z * 1.6, t.cores[Math.floor(r() * t.cores.length)], r() * 360, .25 + z * .5);
  }
  if (fim) {
    for (const [fx, fy, cor] of [[380, 300, '#ffd23f'], [1540, 260, '#ff2e88'], [1180, 190, '#00d1b2'], [700, 170, '#4d7cff']]) {
      for (let k = 0; k < 44; k++) {
        const an = k / 44 * Math.PI * 2, rr = 90 + r() * 70;
        const x2 = fx + Math.cos(an) * rr, y2 = fy + Math.sin(an) * rr;
        s += `<line x1="${(fx + Math.cos(an) * 25).toFixed(0)}" y1="${(fy + Math.sin(an) * 25).toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="${cor}" stroke-width="3" stroke-linecap="round" opacity=".7"/><circle cx="${x2.toFixed(0)}" cy="${y2.toFixed(0)}" r="4" fill="#fff6e6"/>`;
      }
    }
    for (let k = 0; k < 90; k++) {
      const x = r() * W, y = r() < .5 ? 130 + r() * 200 : 760 + r() * 240;
      s += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${(8 + r() * 10).toFixed(0)}" height="${(5 + r() * 7).toFixed(0)}" fill="${PAL[k % 6]}" transform="rotate(${(r() * 360).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
    }
  }
  s += `<rect width="${W}" height="${H}" fill="url(#vinheta)"/>`;
  s += varal(modo) + faixaTecida();
  return s + '</svg>';
}

/* ---------- mascote ---------- */
const MASCOTE = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="600" viewBox="0 0 640 600">
  <rect x="44" y="44" width="560" height="520" rx="70" fill="#ff2e88"/>
  <rect x="20" y="20" width="560" height="520" rx="70" fill="#fff6e6" stroke="#0b0414" stroke-width="16"/>
  <path d="M28 160 V90 Q28 28 90 28 H510 Q572 28 572 90 V160 Z" fill="#00d1b2"/>
  <line x1="28" y1="160" x2="572" y2="160" stroke="#0b0414" stroke-width="16"/>
  <circle cx="110" cy="94" r="24" fill="#ff2e88" stroke="#0b0414" stroke-width="8"/>
  <circle cx="190" cy="94" r="24" fill="#ffd23f" stroke="#0b0414" stroke-width="8"/>
  <circle cx="270" cy="94" r="24" fill="#fff6e6" stroke="#0b0414" stroke-width="8"/>
  <ellipse cx="205" cy="270" rx="42" ry="54" fill="#0b0414"/><ellipse cx="395" cy="270" rx="42" ry="54" fill="#0b0414"/>
  <ellipse cx="190" cy="250" rx="15" ry="17" fill="#fff"/><ellipse cx="380" cy="250" rx="15" ry="17" fill="#fff"/>
  <ellipse cx="120" cy="365" rx="46" ry="30" fill="#ff2e88" opacity=".45"/><ellipse cx="480" cy="365" rx="46" ry="30" fill="#ff2e88" opacity=".45"/>
  <path d="M215 355 Q300 360 385 355 Q380 460 300 460 Q220 460 215 355 Z" fill="#0b0414"/>
  <path d="M250 430 Q300 400 350 430 Q330 458 300 458 Q270 458 250 430 Z" fill="#ff2e88"/>
</svg>`;

/* ---------- bandeira ondulando (estática, em tiras) ---------- */
function bandeiraOndulante(c, w = 1200) {
  const [vw, vh] = FLAGS[c].vb, h = w * vh / vw, N = 60, amp = h * .05, pad = 80;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + pad * 2}" height="${(h + pad * 2 + amp * 2).toFixed(0)}">
    <defs><filter id="sb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter></defs>
    <rect x="${pad + 20}" y="${pad + amp + 40}" width="${w}" height="${h}" fill="#000" opacity=".5" filter="url(#sb)"/>`;
  const sw = w / N;
  for (let k = 0; k < N; k++) {
    const fase = k / N * Math.PI * 2.2, a = amp * (k / N + .15);
    const dy = Math.sin(fase) * a, luz = Math.cos(fase);
    const x = pad + k * sw, y = pad + amp + dy;
    s += `<svg x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(sw + .8).toFixed(2)}" height="${h.toFixed(2)}" viewBox="${(k * vw / N).toFixed(4)} 0 ${(vw / N).toFixed(4)} ${vh}" preserveAspectRatio="none">${FLAGS[c].body}</svg>`;
    s += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(sw + .8).toFixed(2)}" height="${h.toFixed(2)}" fill="${luz > 0 ? '#fff' : '#000'}" opacity="${(Math.abs(luz) * .14).toFixed(3)}"/>`;
  }
  return s + '</svg>';
}

async function png(svg, nome, opts = {}) {
  const file = path.join(OUT, nome);
  let img = sharp(Buffer.from(svg));
  img = nome.endsWith('.jpg') ? img.jpeg({ quality: 90 }) : img.png();
  await img.toFile(file);
  console.log('ok', nome);
}

(async () => {
  await png(fundo('mix', { capa: true, forte: true, seed: 5 }), 'bg_capa.jpg');
  await png(fundo('mix', { seed: 7 }), 'bg_mix.jpg');
  await png(fundo('mix', { fim: true, forte: true, seed: 9 }), 'bg_fim.jpg');
  for (const m of ['br', 'ar', 'mx', 'muertos']) {
    await png(fundo(m, { seed: 11 }), `bg_${m}.jpg`);
    if (m !== 'muertos') await png(fundo(m, { forte: true, seed: 13 }), `bg_${m}_espera.jpg`);
  }
  await png(MASCOTE, 'mascote.png');
  for (const c of ['br', 'ar', 'mx']) {
    await png(bandeiraOndulante(c), `onda_${c}.png`);
    const [vw, vh] = FLAGS[c].vb;
    await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${vw * 30}" height="${vh * 30}" viewBox="0 0 ${vw} ${vh}"><clipPath id="r"><rect width="${vw}" height="${vh}" rx="${vh * .08}"/></clipPath><g clip-path="url(#r)">${FLAGS[c].body}</g></svg>`, `flag_${c}.png`);
  }
})();
