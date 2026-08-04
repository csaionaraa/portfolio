// Sombra na navbar ao rolar a página
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 20) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// ===== Tema claro / escuro =====
const themeToggle = document.getElementById("theme-toggle");
const raiz = document.documentElement;

// Preferência salva > preferência do sistema > escuro
const temaSalvo = localStorage.getItem("tema");
const sistemaClaro = window.matchMedia("(prefers-color-scheme: light)").matches;
const temaInicial = temaSalvo || (sistemaClaro ? "light" : "dark");

function aplicarTema(tema) {
  raiz.setAttribute("data-theme", tema);
  themeToggle.setAttribute("aria-pressed", tema === "light");
}

aplicarTema(temaInicial);

themeToggle.addEventListener("click", () => {
  const novo = raiz.getAttribute("data-theme") === "light" ? "dark" : "light";
  aplicarTema(novo);
  localStorage.setItem("tema", novo);
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
    "a, button, .project-card, .about-photo, .teaser, .footer-social a"
  );

  alvos.forEach((alvo) => {
    alvo.addEventListener("mouseenter", () => blob.classList.add("is-hover"));
    alvo.addEventListener("mouseleave", () => blob.classList.remove("is-hover"));
  });
}
