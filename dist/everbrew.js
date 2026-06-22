/* everbrew-ui : shell.js
   <eb-shell> カスタム要素(light DOM)。共通の chrome を描画し、
   既存の子要素(<div slot="content">)を content 領域へ移す。
   Shadow DOM を使わないので everbrew.css がそのまま効く。 */
(function () {
  "use strict";

  var ICON = {
    // SVG ライン アイコン(絵文字は使わない)。最小限のプレースホルダ。
    label:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h18M3 12h18M3 17h12"/></svg>',
    menu:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>',
    stock:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7l9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/></svg>',
    invoice:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2h9l5 5v15H6z"/><path d="M9 12h6M9 16h6"/></svg>',
    dot:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/></svg>'
  };
  var LOGO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3h11l3 3v15H5z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>';

  function parseJSON(attr, fallback) {
    if (!attr) return fallback;
    try { return JSON.parse(attr); } catch (e) { return fallback; }
  }
  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  class EBShell extends HTMLElement {
    connectedCallback() {
      if (this._mounted) return;
      this._mounted = true;

      var activeApp = this.getAttribute("active-app") || "";
      var title     = this.getAttribute("title") || activeApp;
      // apps: スイート横断のサイドバー項目 [{id,label,href,icon}]
      var apps  = parseJSON(this.getAttribute("apps"), []);
      // tabs: アプリ内タブ [{id,label}]
      var tabs  = parseJSON(this.getAttribute("tabs"), []);

      // 既存の中身を退避(slot=content を優先、無ければ全子要素)
      var slotted = this.querySelectorAll('[slot="content"]');
      var content = slotted.length ? Array.prototype.slice.call(slotted)
                                   : Array.prototype.slice.call(this.childNodes);

      var shell = el('<div class="eb-shell"></div>');

      // sidebar
      var side = el('<nav class="eb-side" aria-label="アプリ"></nav>');
      side.appendChild(el('<div class="eb-logo">' + LOGO + '<span>EVER BREW</span></div>'));
      apps.forEach(function (a) {
        var icon = ICON[a.icon] || ICON.dot;
        var item = el('<a class="eb-nav-item" href="' + (a.href || "#") + '">' +
                      icon + '<span>' + (a.label || a.id) + '</span></a>');
        if (a.id === activeApp) item.setAttribute("aria-current", "page");
        side.appendChild(item);
      });
      shell.appendChild(side);

      // topbar
      var top = el('<header class="eb-top"></header>');
      top.appendChild(el('<div class="eb-top-title">' + title + '</div>'));
      top.appendChild(el('<div class="eb-top-spacer"></div>'));
      shell.appendChild(top);

      // main = (tabbar?) + content
      var main = el('<main class="eb-main"></main>');
      if (tabs.length) {
        var bar = el('<div class="eb-tabbar" role="tablist"></div>');
        tabs.forEach(function (t, i) {
          var tab = el('<button class="eb-tab" role="tab">' + (t.label || t.id) + '</button>');
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

      this.appendChild(shell);
    }
  }

  if (!customElements.get("eb-shell")) customElements.define("eb-shell", EBShell);
  // 手続き的に使いたい場合のエントリも公開
  window.EBShell = { version: "0.1.0" };
})();
