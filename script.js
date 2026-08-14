// Preferência do sistema por menos movimento (usada por vários efeitos abaixo)
const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Sombra na navbar ao rolar a página
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 20) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Menu mobile (abrir/fechar)
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("open");
  navLinks.classList.toggle("open");
});

// Fecha o menu ao clicar em um link
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.classList.remove("open");
    navLinks.classList.remove("open");
  });
});

// ===== About: painel que cresce até a tela inteira conforme a rolagem =====
const aboutTrack = document.querySelector(".about-track");
const aboutSticky = document.querySelector(".about-sticky");
const aboutContent = document.querySelector(".about-content");

if (aboutTrack && aboutSticky && aboutContent) {
  function atualizarAbout() {
    const area = aboutTrack.getBoundingClientRect();
    const percurso = area.height - window.innerHeight;

    // 0 quando o trilho encosta no topo, 1 quando termina de passar
    let p = percurso > 0 ? -area.top / percurso : 0;
    p = Math.min(Math.max(p, 0), 1);

    // o painel termina de abrir na metade do trilho e fica cheio o resto do tempo
    const abertura = Math.min(p / 0.5, 1);

    // no pai: o título, o painel e o conteúdo herdam a mesma variável
    aboutSticky.style.setProperty("--p", abertura.toFixed(3));
  }

  // No celular o painel e estatico (ver o CSS): a animacao so roda no desktop
  const telaGrande = window.matchMedia("(min-width: 901px)");

  function ligarAbout() {
    if (semMovimento || !telaGrande.matches) {
      // painel aberto, sem depender da rolagem
      aboutSticky.style.setProperty("--p", "1");
      return;
    }
    atualizarAbout();
  }

  window.addEventListener("scroll", ligarAbout, { passive: true });
  window.addEventListener("resize", ligarAbout);
  telaGrande.addEventListener("change", ligarAbout);
  ligarAbout();
}

// ===== Painel lateral dos projetos =====
// preenchido mais abaixo; o seletor de idioma usa para redesenhar o texto
let redesenharPainel = null;

const projectCards = document.querySelectorAll(".project-card");
const painelLista = document.querySelector(".panel-list");
const painelMeta = document.querySelector(".panel-meta");

if (projectCards.length && painelLista && painelMeta) {
  const painelDesc = painelMeta.querySelector(".project-desc");
  const painelLink = painelMeta.querySelector(".project-cta");

  // Monta a lista de nomes uma vez, a partir dos data-nome dos cards
  painelLista.innerHTML = [...projectCards]
    .map(
      (card, i) =>
        `<li data-indice="${i}">${card.dataset.nome || ""}` +
        ` <span class="panel-seta" aria-hidden="true">&#9666;</span></li>`
    )
    .join("");

  const itens = painelLista.querySelectorAll("li");
  let ativo = -1;

  function mostrarProjeto(indice) {
    if (indice === ativo) return;
    ativo = indice;

    itens.forEach((li, i) => li.classList.toggle("is-active", i === indice));

    const card = projectCards[indice];

    // sai, troca o conteúdo, entra: a transição fica no CSS (.trocando)
    painelMeta.classList.add("trocando");

    setTimeout(() => {
      painelLink.href = card.dataset.link || "#";
      escreverPalavras(painelDesc, card.dataset.desc || "");
      painelMeta.classList.remove("trocando");
    }, 280);
  }

  // Cada palavra sobe de dentro de uma "fenda", uma depois da outra
  function escreverPalavras(el, texto) {
    if (semMovimento) {
      el.textContent = texto;
      return;
    }

    el.classList.remove("entrando");
    el.innerHTML = texto
      .split(" ")
      .map(
        (palavra, i) =>
          `<span class="palavra" style="--i: ${i}"><span>${palavra}</span></span>`
      )
      .join("");

    // dois frames: o navegador precisa pintar o estado inicial
    // antes de a transição valer, senão as palavras já nascem no lugar
    requestAnimationFrame(() =>
      requestAnimationFrame(() => el.classList.add("entrando"))
    );
  }

  // O card ativo é o que cobre o meio da tela (o da frente na pilha)
  function atualizarAtivo() {
    const meio = window.innerHeight / 2;
    let indice = 0;

    projectCards.forEach((card, i) => {
      const area = card.getBoundingClientRect();
      if (area.top <= meio && area.bottom >= meio) indice = i;
    });

    mostrarProjeto(indice);
  }

  window.addEventListener("scroll", atualizarAtivo, { passive: true });
  window.addEventListener("resize", atualizarAtivo);

  // primeiro estado, sem animação de troca
  ativo = 0;
  itens[0].classList.add("is-active");
  painelLink.href = projectCards[0].dataset.link || "#";
  escreverPalavras(painelDesc, projectCards[0].dataset.desc || "");

  // usado pelo seletor de idioma: reescreve a descrição do projeto atual
  redesenharPainel = () => {
    escreverPalavras(painelDesc, projectCards[ativo].dataset.desc || "");
  };
}

// ===== Revelação dos elementos na rolagem =====
const reveals = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          obs.unobserve(entry.target); // anima uma vez só
        }
      });
    },
    // threshold 0 e sem margem negativa: elementos no fim da página
    // (como o rodapé) também são alcançados
    { threshold: 0 }
  );

  reveals.forEach((el) => revealObserver.observe(el));
} else {
  // Navegador sem suporte: mostra tudo, sem animação
  reveals.forEach((el) => el.classList.add("revealed"));
}

// ===== Rolagem suave com inércia (Lenis) =====
// Se o CDN não carregar, a página segue com a rolagem nativa normalmente.
if (window.Lenis && !semMovimento) {
  const lenis = new Lenis({
    autoRaf: true, // a própria Lenis cuida do requestAnimationFrame
    // lerp: a cada frame a página anda 7% do caminho que falta.
    // Dá o deslize contínuo; quanto menor, mais suave/arrastado (0.04 a 0.12)
    lerp: 0.07,
    wheelMultiplier: 0.9, // deixa o "empurrão" da rodinha menos brusco
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  // Links de âncora passam a usar a rolagem da Lenis
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href === "#") return;

      const alvo = document.querySelector(href);
      if (!alvo) return;

      e.preventDefault();
      lenis.scrollTo(alvo, { offset: -90 }); // desconta a navbar fixa
    });
  });
}

// ===== Efeito de "decodificação" no título (PROJECTS) =====
const SIMBOLOS = "!<>-_\\/[]{}=+*^?#%&$@";

function embaralhar(el) {
  const texto = el.dataset.texto;
  function sorteia() {
    return SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)];
  }

  const letras = texto.split("").map((char, i) => ({
    char,
    // cada letra assenta num momento diferente: da esquerda para a direita
    fim: 900 + i * 320 + Math.random() * 300,
  }));

  const inicio = performance.now();
  const atual = letras.map(() => sorteia());
  let ultimoRender = 0;

  function frame(agora) {
    const t = agora - inicio;

    // redesenha a cada 110ms (e não a cada frame): troca calma, sem piscar
    if (agora - ultimoRender >= 110) {
      ultimoRender = agora;

      let html = "";
      letras.forEach((letra, i) => {
        if (t >= letra.fim) {
          html += letra.char;
        } else {
          if (Math.random() < 0.6) atual[i] = sorteia();
          html += `<span class="scramble-char">${atual[i]}</span>`;
        }
      });

      el.innerHTML = html;
    }

    const terminou = t >= letras[letras.length - 1].fim;

    if (!terminou) {
      requestAnimationFrame(frame);
    } else {
      el.innerHTML = texto;
      el.dataset.rodando = "";
      // pausa com a palavra inteira legível antes de recomeçar
      setTimeout(() => rodarSeVisivel(el), 3000);
    }
  }

  requestAnimationFrame(frame);
}

function rodarSeVisivel(el) {
  if (el.dataset.visivel === "sim" && !el.dataset.rodando) {
    el.dataset.rodando = "sim";
    embaralhar(el);
  }
}

// Refaz a medida da largura (usada ao trocar de idioma)
function travarLargura(el) {
  el.style.minWidth = "";
  el.style.minWidth = `${Math.ceil(el.getBoundingClientRect().width)}px`;
}

document.querySelectorAll(".scramble").forEach((el) => {
  if (!el.dataset.texto) el.dataset.texto = el.textContent.trim();

  if (semMovimento) return; // sem animação: fica o texto normal

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      el.dataset.visivel = entry.isIntersecting ? "sim" : "nao";
      if (entry.isIntersecting) rodarSeVisivel(el);
    });
  });

  // mede a largura do texto final e só então libera a animação:
  // os símbolos são mais estreitos e fariam o bloco tremer a cada troca
  function iniciar() {
    travarLargura(el);
    observer.observe(el);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(iniciar);
  } else {
    iniciar();
  }
});

// ===== Bolinha rosa que segue o mouse =====
const podeUsarCursor =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches && !semMovimento;

if (podeUsarCursor) {
  const blob = document.createElement("div");
  blob.className = "cursor-blob";
  document.body.appendChild(blob);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let blobX = mouseX;
  let blobY = mouseY;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    blob.classList.add("is-active");
  });

  document.addEventListener("mouseleave", () => blob.classList.remove("is-active"));

  // Lerp: a bolinha "persegue" o cursor com um atraso suave
  function seguir() {
    blobX += (mouseX - blobX) * 0.14;
    blobY += (mouseY - blobY) * 0.14;
    blob.style.transform = `translate3d(${blobX}px, ${blobY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(seguir);
  }

  requestAnimationFrame(seguir);

  // Cresce sobre elementos interativos
  const alvos = document.querySelectorAll(
    "a, button, .project-card, .about-photo, .footer-social a"
  );

  alvos.forEach((alvo) => {
    alvo.addEventListener("mouseenter", () => blob.classList.add("is-hover"));
    alvo.addEventListener("mouseleave", () => blob.classList.remove("is-hover"));
  });
}

// Quebra os nomes da navbar em letras, para entrarem em cascata.
// A mascara (.roll, com overflow hidden) faz elas surgirem de baixo.
function separarLetrasDaNav() {
  let ordem = 0;

  document.querySelectorAll(".nav-link").forEach((link) => {
    const copias = link.querySelectorAll(".roll-inner > span");

    copias.forEach((copia) => {
      copia.innerHTML = [...copia.textContent]
        // o índice segue a ordem da esquerda para a direita na barra inteira
        .map((l, i) => `<span class="letra" style="--i: ${ordem + i}">${l}</span>`)
        .join("");
    });

    // só a primeira cópia conta: a segunda é a do hover, fica escondida
    ordem += copias[0] ? copias[0].textContent.length : 0;
  });
}

// ===== Idioma: PT / EN =====
// Cada texto traduzido tem data-pt no HTML; o original (ingles) fica em cache.
const langToggle = document.getElementById("lang-toggle");

function textoBase(el) {
  // em botoes com efeito de rolagem o texto aparece duplicado: pega so a 1a copia
  const copia = el.querySelector(".roll-inner > span");
  return (copia ? copia.textContent : el.textContent).trim();
}

function montarRoll(el, texto) {
  el.innerHTML =
    '<span class="roll"><span class="roll-inner">' +
    `<span>${texto}</span><span aria-hidden="true">${texto}</span>` +
    "</span></span>";
}

function aplicarIdioma(idioma) {
  document.documentElement.lang = idioma === "pt" ? "pt-BR" : "en";

  document.querySelectorAll("[data-pt]").forEach((el) => {
    if (!el.dataset.en) el.dataset.en = textoBase(el);
    const texto = idioma === "pt" ? el.dataset.pt : el.dataset.en;

    if (el.classList.contains("nav-link") || el.classList.contains("btn-roll")) {
      montarRoll(el, texto);
    } else if (el.classList.contains("scramble")) {
      el.dataset.texto = texto;
      el.textContent = texto;
      travarLargura(el);
    } else {
      el.textContent = texto;
    }
  });

  // descricoes dos projetos ficam em atributos no proprio card
  document.querySelectorAll(".project-card").forEach((card) => {
    if (!card.dataset.descEn) card.dataset.descEn = card.dataset.desc || "";
    card.dataset.desc =
      idioma === "pt" ? card.dataset.descPt || card.dataset.descEn : card.dataset.descEn;
  });

  if (redesenharPainel) redesenharPainel();

  // as letras da navbar foram refeitas: separa de novo
  separarLetrasDaNav();

  if (langToggle) {
    langToggle.querySelectorAll("span").forEach((s) => {
      s.classList.toggle("is-on", s.dataset.idioma === idioma);
    });
  }

  localStorage.setItem("idioma", idioma);
}

if (langToggle) {
  const salvo = localStorage.getItem("idioma");
  const doNavegador = (navigator.language || "").startsWith("pt") ? "pt" : "en";
  const inicial = salvo || doNavegador;

  langToggle.addEventListener("click", () => {
    const atual = document.documentElement.lang === "pt-BR" ? "pt" : "en";
    const novo = atual === "pt" ? "en" : "pt";

    if (semMovimento) {
      aplicarIdioma(novo);
      return;
    }

    // apaga o conteúdo, troca o texto e traz de volta
    document.body.classList.add("trocando-idioma");

    setTimeout(() => {
      aplicarIdioma(novo);
      document.body.classList.remove("trocando-idioma");

      // as letras da navbar entram de novo em cascata
      document.body.classList.add("letras-entrando");
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.body.classList.remove("letras-entrando")
        )
      );
    }, 260);
  });

  aplicarIdioma(inicial);
}

// ===== Transição entre páginas: o conteúdo entra e sai com fade =====
if (!semMovimento) {
  const corpo = document.body;

  separarLetrasDaNav();

  // Chegada: navbar e conteúdo nascem deslocados e entram em cascata
  corpo.classList.add("sem-transicao", "pagina-entrando");

  requestAnimationFrame(() => {
    corpo.classList.remove("sem-transicao");
    requestAnimationFrame(() => corpo.classList.remove("pagina-entrando"));
  });

  // Saída: intercepta só os links que trocam de página
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");

    const externo = link.target === "_blank";
    const naMesmaPagina =
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:");

    if (externo || naMesmaPagina || link.hasAttribute("download")) return;

    link.addEventListener("click", (e) => {
      // deixa passar ctrl/cmd/shift (abrir em nova aba)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      e.preventDefault();
      corpo.classList.add("pagina-saindo");

      setTimeout(() => {
        window.location.href = link.href;
      }, 520);
    });
  });

  // Voltar pelo navegador: o conteúdo não pode ficar preso invisível
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) corpo.classList.remove("pagina-saindo", "pagina-entrando");
  });
}
