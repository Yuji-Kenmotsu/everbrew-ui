/* everbrew-ui : shell.js
   <eb-shell> カスタム要素(light DOM)。共通の chrome を描画し、
   既存の子要素(<div slot="content">)を content 領域へ移す。
   Shadow DOM を使わないので everbrew.css がそのまま効く。

   属性:
     active-app  … 現在のアプリ id(サイドバーで強調)
     title       … トップバー見出し(既定は active-app)
     apps        … スイート横断のサイドバー項目 JSON [{id,label,href,icon}]
     tabs        … アプリ内タブ JSON [{id,label}]
     brand       … サイドバーのロゴ文字(既定 "EVER BREW")
     user        … トップバー右のアカウント表示。文字列 or {"name","initial"}。未指定なら非表示
     mobile-nav  … "auto"(既定) | "bar" | "drawer"
                    auto: サイドバー項目 5個以下→下部タブバー / 6個以上→ドロワー */
(function () {
  "use strict";

  var ICON = {
    // SVG ライン アイコン(絵文字は使わない)。
    label:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M3 12h18M3 17h12"/></svg>',
    menu:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>',
    stock:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/></svg>',
    invoice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6z"/><path d="M9 12h6M9 16h6"/></svg>',
    seal:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M9 12l2 2 4-4"/></svg>',
    image:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/></svg>',
    master:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M4 12h7M4 18h13"/><circle cx="18" cy="6" r="2"/><circle cx="15" cy="12" r="2"/></svg>',
    dot:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/></svg>'
  };
  var LOGO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>';
  var BURGER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

  function parseJSON(attr, fallback) {
    if (!attr) return fallback;
    try { return JSON.parse(attr); } catch (e) { return fallback; }
  }
  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function firstChar(s) {
    var arr = Array.from(String(s || "").trim());
    return arr.length ? arr[0] : "";
  }

  class EBShell extends HTMLElement {
    connectedCallback() {
      if (this._mounted) return;
      this._mounted = true;

      var activeApp = this.getAttribute("active-app") || "";
      var title     = this.getAttribute("title") || activeApp;
      var brand     = this.getAttribute("brand");
      if (brand == null || brand === "") brand = "EVER BREW";
      var apps  = parseJSON(this.getAttribute("apps"), []);
      var tabs  = parseJSON(this.getAttribute("tabs"), []);

      // user: 文字列 or {name, initial}
      var userAttr = this.getAttribute("user");
      var user = null;
      if (userAttr != null && userAttr.trim() !== "") {
        var t = userAttr.trim();
        if (t.charAt(0) === "{") {
          var o = parseJSON(t, null);
          if (o && o.name) user = { name: o.name, initial: o.initial || firstChar(o.name) };
        }
        if (!user) user = { name: t, initial: firstChar(t) };
      }

      // mobile-nav の解決(auto は項目数で分岐)
      var mnav = (this.getAttribute("mobile-nav") || "auto").toLowerCase();
      if (mnav !== "bar" && mnav !== "drawer") {
        mnav = apps.length >= 6 ? "drawer" : "bar";
      }

      // 既存の中身を退避(slot=content を優先、無ければ全子要素)
      var slotted = this.querySelectorAll('[slot="content"]');
      var content = slotted.length ? Array.prototype.slice.call(slotted)
                                   : Array.prototype.slice.call(this.childNodes);

      var shell = el('<div class="eb-shell"></div>');
      shell.setAttribute("data-mnav", mnav);

      // ---- sidebar ----
      var side = el('<nav class="eb-side" aria-label="アプリ"></nav>');
      var logo = el('<div class="eb-logo"></div>');
      logo.appendChild(el('<span class="eb-mark">' + LOGO + '</span>'));
      logo.appendChild(el('<span class="eb-brand-name">' + esc(brand) + '</span>'));
      side.appendChild(logo);
      apps.forEach(function (a) {
        var icon = ICON[a.icon] || ICON.dot;
        var item = el('<a class="eb-nav-item" href="' + esc(a.href || "#") + '">' +
                      icon + '<span>' + esc(a.label || a.id) + '</span></a>');
        if (a.id === activeApp) item.setAttribute("aria-current", "page");
        side.appendChild(item);
      });
      side.appendChild(el('<div class="eb-nav-spacer"></div>'));
      shell.appendChild(side);

      // ---- topbar ----
      var top = el('<header class="eb-top"></header>');
      var burger = el('<button class="eb-burger" type="button" aria-label="メニューを開く" ' +
                      'aria-expanded="false">' + BURGER + '</button>');
      top.appendChild(burger);
      top.appendChild(el('<div class="eb-top-title">' + esc(title) + '</div>'));
      top.appendChild(el('<div class="eb-top-spacer"></div>'));
      if (user) {
        var u = el('<div class="eb-user"></div>');
        u.appendChild(el('<span class="eb-avatar" aria-hidden="true">' + esc(user.initial) + '</span>'));
        u.appendChild(el('<span class="eb-user-name">' + esc(user.name) + '</span>'));
        top.appendChild(u);
      }
      shell.appendChild(top);

      // ---- main = (tabbar?) + content ----
      var main = el('<main class="eb-main"></main>');
      if (tabs.length) {
        var bar = el('<div class="eb-tabbar" role="tablist"></div>');
        tabs.forEach(function (t, i) {
          var tab = el('<button class="eb-tab" role="tab">' + esc(t.label || t.id) + '</button>');
          tab.setAttribute("aria-selected", i === 0 ? "true" : "false");
          tab.dataset.tab = t.id;
          bar.appendChild(tab);
        });
        bar.addEventListener("click", function (e) {
          var b = e.target.closest(".eb-tab"); if (!b) return;
          bar.querySelectorAll(".eb-tab").forEach(function (x) {
            x.setAttribute("aria-selected", x === b ? "true" : "false");
          });
          this.dispatchEvent(new CustomEvent("eb:tab", { detail: b.dataset.tab, bubbles: true }));
        }.bind(this));
        main.appendChild(bar);
      }
      var contentWrap = el('<div class="eb-content"></div>');
      content.forEach(function (n) { contentWrap.appendChild(n); });
      main.appendChild(contentWrap);
      shell.appendChild(main);

      // ---- drawer overlay ----
      var scrim = el('<div class="eb-scrim" hidden></div>');
      shell.appendChild(scrim);

      this.appendChild(shell);

      // ---- drawer の挙動(モバイル drawer 時のみ意味を持つ) ----
      this._setupDrawer(shell, side, burger, scrim);
    }

    _setupDrawer(shell, side, burger, scrim) {
      var self = this;
      var lastFocus = null;

      function focusables() {
        return Array.prototype.slice.call(
          side.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')
        ).filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
      }
      function open() {
        if (shell.classList.contains("eb-nav-open")) return;
        lastFocus = document.activeElement;
        shell.classList.add("eb-nav-open");
        burger.setAttribute("aria-expanded", "true");
        scrim.hidden = false;
        var f = focusables();
        if (f.length) f[0].focus();
        document.addEventListener("keydown", onKey, true);
      }
      function close() {
        if (!shell.classList.contains("eb-nav-open")) return;
        shell.classList.remove("eb-nav-open");
        burger.setAttribute("aria-expanded", "false");
        scrim.hidden = true;
        document.removeEventListener("keydown", onKey, true);
        if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
      }
      function onKey(e) {
        if (e.key === "Escape") { e.preventDefault(); close(); return; }
        if (e.key === "Tab") {
          var f = focusables(); if (!f.length) return;
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }

      burger.addEventListener("click", function () {
        if (shell.classList.contains("eb-nav-open")) close(); else open();
      });
      scrim.addEventListener("click", close);
      // ドロワー内のリンクを押したら閉じる(画面遷移を妨げない)
      side.addEventListener("click", function (e) {
        if (e.target.closest(".eb-nav-item")) close();
      });
      // PC 幅へ広げたら状態をリセット
      window.addEventListener("resize", function () {
        if (window.innerWidth > 768) close();
      });

      this._ebDrawer = { open: open, close: close };
      void self;
    }
  }

  if (!customElements.get("eb-shell")) customElements.define("eb-shell", EBShell);
  // 手続き的に使いたい場合のエントリも公開
  window.EBShell = { version: "1.0.0" };
})();
