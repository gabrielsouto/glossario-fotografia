const CATS = {
  exposicao: { label: 'Exposição', corVar: '--c-exposicao', bgVar: '--c-exposicao-bg' },
  cor: { label: 'Cor', corVar: '--c-cor', bgVar: '--c-cor-bg' },
  lente: { label: 'Lente', corVar: '--c-lente', bgVar: '--c-lente-bg' },
  foco: { label: 'Foco', corVar: '--c-foco', bgVar: '--c-foco-bg' },
  arquivo: { label: 'Arquivo', corVar: '--c-arquivo', bgVar: '--c-arquivo-bg' }
};

const TERMS = [
  {"t":"Abertura","meta":"controle de luz","cat":"exposicao","d":"A abertura do diafragma controla a quantidade de luz que entra pela lente; é indicada pelo número f."},
  {"t":"Balanço de branco","meta":"reprodução de cor","cat":"cor","d":"Ajuste que busca neutralizar a cor da luz para que os tons pareçam naturais."},
  {"t":"Bokeh","meta":"característica óptica","cat":"lente","d":"Qualidade visual das áreas desfocadas, especialmente nos pontos de luz ao fundo."},
  {"t":"Compensação de exposição","meta":"controle de luz","cat":"exposicao","d":"Ajuste que clareia ou escurece a foto em relação à leitura automática da câmera."},
  {"t":"Distância focal","meta":"característica óptica","cat":"lente","d":"Característica da lente que influencia o ângulo de visão e a aproximação aparente da cena."},
  {"t":"Exposição","meta":"controle de luz","cat":"exposicao","d":"Quantidade de luz registrada, determinada principalmente por abertura, velocidade e ISO."},
  {"t":"ISO","meta":"controle de luz","cat":"exposicao","d":"Sensibilidade usada pela câmera na captura; valores maiores ajudam em pouca luz, mas podem aumentar ruído."},
  {"t":"Profundidade de campo","meta":"nitidez da imagem","cat":"foco","d":"Faixa da cena que parece nítida antes e depois do ponto de foco."},
  {"t":"RAW","meta":"formato de imagem","cat":"arquivo","d":"Formato que preserva mais dados da captura para edição posterior."},
  {"t":"Velocidade do obturador","meta":"controle de luz","cat":"exposicao","d":"Tempo em que o obturador fica aberto; valores rápidos congelam melhor o movimento."}
];

function escapar(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function filtrarTermos(termos, { cat, query }) {
  const q = normalizar(query).trim();
  return termos.filter(item => {
    const bateCategoria = !cat || item.cat === cat;
    const conteudo = normalizar(`${item.t} ${item.meta} ${item.d}`);
    return bateCategoria && (!q || conteudo.includes(q));
  });
}

function contarPorCategoria(termos) {
  return Object.keys(CATS).reduce((acc, chave) => {
    acc[chave] = termos.filter(item => item.cat === chave).length;
    return acc;
  }, {});
}

function destacar(textoOriginal, query) {
  const q = String(query || '').trim();
  if (!q) return escapar(textoOriginal);
  const indice = String(textoOriginal).toLocaleLowerCase('pt-BR').indexOf(q.toLocaleLowerCase('pt-BR'));
  if (indice === -1) return escapar(textoOriginal);
  return `${escapar(textoOriginal.slice(0, indice))}<mark>${escapar(textoOriginal.slice(indice, indice + q.length))}</mark>${escapar(textoOriginal.slice(indice + q.length))}`;
}

if (typeof document !== 'undefined') {
  let categoriaAtiva = null;
  let termoBusca = '';
  const catNav = document.querySelector('#catNav');
  const resultsEl = document.querySelector('#results');
  const countEl = document.querySelector('#resultCount');
  const searchEl = document.querySelector('#search');
  const resetBtn = document.querySelector('#resetBtn');

  function montarNav() {
    const contagens = contarPorCategoria(TERMS);
    catNav.innerHTML = Object.entries(CATS).map(([chave, info]) => `
      <button class="cat-btn${categoriaAtiva === chave ? ' active' : ''}" type="button" data-cat="${chave}" aria-pressed="${categoriaAtiva === chave}">
        <span class="cat-dot" style="background:var(${info.corVar})"></span>${escapar(info.label)}<span class="cat-count">${contagens[chave]}</span>
      </button>
    `).join('');
  }

  function render() {
    montarNav();
    const filtrados = filtrarTermos(TERMS, { cat: categoriaAtiva, query: termoBusca });
    countEl.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'termo' : 'termos'}`;
    if (!filtrados.length) {
      resultsEl.innerHTML = '<p class="empty-state">Nenhum termo encontrado. Tente outra busca ou limpe o filtro de categoria.</p>';
      return;
    }

    const blocos = [];
    filtrados.forEach(item => {
      const letra = item.t[0].toLocaleUpperCase('pt-BR');
      const ultimo = blocos.at(-1);
      if (!ultimo || ultimo.letra !== letra) blocos.push({ letra, itens: [] });
      blocos.at(-1).itens.push(item);
    });

    resultsEl.innerHTML = blocos.map(bloco => `
      <h2 class="letter-heading">${escapar(bloco.letra)}</h2>
      <div class="grid">
        ${bloco.itens.map(item => {
          const info = CATS[item.cat];
          return `<article class="term-card">
            <div class="term-head">
              <span><span class="term-name">${destacar(item.t, termoBusca)}</span><span class="term-meta">${escapar(item.meta)}</span></span>
              <span class="chip" style="background:var(${info.bgVar});color:var(${info.corVar})">${escapar(info.label)}</span>
            </div>
            <p class="term-def">${destacar(item.d, termoBusca)}</p>
          </article>`;
        }).join('')}
      </div>
    `).join('');
  }

  catNav.addEventListener('click', event => {
    const botao = event.target.closest('[data-cat]');
    if (!botao) return;
    categoriaAtiva = categoriaAtiva === botao.dataset.cat ? null : botao.dataset.cat;
    render();
  });
  searchEl.addEventListener('input', event => { termoBusca = event.target.value; render(); });
  resetBtn.addEventListener('click', () => { categoriaAtiva = null; termoBusca = ''; searchEl.value = ''; render(); });
  render();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CATS, TERMS, escapar, normalizar, filtrarTermos, contarPorCategoria, destacar };
}
