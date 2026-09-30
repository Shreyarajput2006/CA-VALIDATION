// ===================== MOBILE HAMBURGER MENU =====================
// Mobile (<= 480px) par sidebar band rehti hai. Hamburger (3 lines) dabane par khulti hai.
// Kisi validation type par click karne par, backdrop par click karne par ya Esc dabane par band ho jati hai.

(function () {
  const toggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebarMenu");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (!toggle || !sidebar || !backdrop) return;

  const icon = toggle.querySelector("i");
  const mobileQuery = window.matchMedia("(max-width: 1100px)");

  function setOpen(open) {
    sidebar.classList.toggle("open", open);
    backdrop.classList.toggle("show", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (icon) {
      icon.classList.toggle("fa-bars", !open);
      icon.classList.toggle("fa-xmark", open);
    }
  }

  toggle.addEventListener("click", function () {
    setOpen(!sidebar.classList.contains("open"));
  });

  backdrop.addEventListener("click", function () {
    setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });

  // Validation type chunne ke baad menu band karo aur input box tak scroll karo
  sidebar.querySelectorAll(".menu-item").forEach(function (item) {
    item.addEventListener("click", function () {
      if (!mobileQuery.matches) return;
      setOpen(false);
      const target = document.querySelector(".input-section");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Screen bada ho jaye (rotate / resize) to menu ki open state reset kar do
  mobileQuery.addEventListener("change", function (e) {
    if (!e.matches) setOpen(false);
  });
})();