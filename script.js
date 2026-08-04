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

// Revela o conteúdo de cada projeto quando o card entra na tela
const projectCards = document.querySelectorAll(".project-card");

const projectObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-visible", entry.isIntersecting);
    });
  },
  { threshold: 0.35 }
);

projectCards.forEach((card) => projectObserver.observe(card));

// Preferência do sistema por menos movimento
const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function embaralhar(el, texto) {
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
      setTimeout(() => rodarSeVisivel(el, texto), 3000);
    }
  }

  requestAnimationFrame(frame);
}

function rodarSeVisivel(el, texto) {
  if (el.dataset.visivel === "sim" && !el.dataset.rodando) {
    el.dataset.rodando = "sim";
    embaralhar(el, texto);
  }
}

document.querySelectorAll(".scramble").forEach((el) => {
  const texto = el.dataset.texto || el.textContent.trim();

  if (semMovimento) return; // sem animação: fica o texto normal

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      el.dataset.visivel = entry.isIntersecting ? "sim" : "nao";
      if (entry.isIntersecting) rodarSeVisivel(el, texto);
    });
  });

  observer.observe(el);
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
