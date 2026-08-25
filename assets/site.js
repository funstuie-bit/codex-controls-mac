const nav = document.querySelector(".section-nav");
const sidebar = document.querySelector(".sidebar");
const toggle = document.querySelector(".nav-toggle");
const sections = [...document.querySelectorAll("main h2")].filter((heading) =>
  /^\d+\.\s/.test(heading.textContent.trim()),
);

for (const heading of sections) {
  const link = document.createElement("a");
  link.href = `#${heading.id}`;
  link.textContent = heading.textContent.trim();
  nav.append(link);
}

const links = [...nav.querySelectorAll("a")];
const linkById = new Map(links.map((link) => [link.hash.slice(1), link]));
const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!visible) return;
    links.forEach((link) => link.classList.remove("active"));
    linkById.get(visible.target.id)?.classList.add("active");
  },
  { rootMargin: "-15% 0px -75% 0px" },
);

sections.forEach((section) => observer.observe(section));

toggle.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});

nav.addEventListener("click", () => {
  sidebar.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
});
