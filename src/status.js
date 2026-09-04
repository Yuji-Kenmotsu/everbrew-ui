/* everbrew-ui : status.js
   進捗ダッシュボード(型E)の演出だけを担当する。依存ゼロ。
   DOM は render-status.mjs が完成状態で吐く。ここでは HTML を組み立てず、
   データの解釈もしない ― 既にある要素にクラスを足して動かすだけ。

   置き場所: <head> 内に置く(本文描画の前に :root.ebs-js を付けて FOUC を防ぐため)。

   扱う印: [data-reveal] カード / [data-countup] 数値 / [data-bar] バー / [data-ring] リング
   status.css の「アニメの初期状態」節と対になっている。片方だけ変えない。

   prefers-reduced-motion: reduce のときは ebs-js を付けない。
   = 初期状態(opacity:0 / width:0)自体が適用されず、常に最終状態で出る。 */
(function () {
  "use strict";

  var REVEAL_STAGGER = 40;   /* ms。カードを順に出す間隔 */
  var COUNT_DURATION = 600;  /* ms。--eb-motion の減速カーブに合わせる */

  var root = document.documentElement;
  var reduced = !!(window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* JS が動く環境でだけアニメの初期状態を有効にする。
     ここを本文より先に実行するので、一瞬見えてから消えることがない。 */
  if (!reduced) root.className += " ebs-js";

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* --- 数値のカウントアップ ------------------------------------------
     最終値はレンダラが書いた textContent が正。JS はそれを退避して 0 から戻すだけ。
     したがって JS 無効でも数字は最初から正しく出る。 */
  function fmt(n, decimals, grouped) {
    var s = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
    if (!grouped) return s;
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function countUp(el) {
    if (el.__ebCounted) return;
    el.__ebCounted = true;

    var raw = String(el.textContent || "").trim();
    var target = parseFloat(raw.replace(/,/g, ""));
    if (!isFinite(target)) return;

    var decimals = (raw.split(".")[1] || "").length;
    var grouped  = raw.indexOf(",") >= 0;
    var t0 = null;

    el.textContent = fmt(0, decimals, grouped);

    function step(now) {
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / COUNT_DURATION);
      var eased = 1 - Math.pow(1 - t, 3);   /* ease-out。バーの伸長と揃える */
      if (t < 1) {
        el.textContent = fmt(target * eased, decimals, grouped);
        requestAnimationFrame(step);
      } else {
        el.textContent = raw;               /* 最後は必ず元の文字列に戻す */
      }
    }
    requestAnimationFrame(step);
  }

  function finishCount(el) {
    if (el.__ebCounted && el.__ebRaw != null) el.textContent = el.__ebRaw;
    el.__ebCounted = true;                  /* 以後カウントアップさせない */
  }

  /* --- カード1枚を最終状態へ ------------------------------------------ */
  function activate(card) {
    if (card.__ebActive) return;
    card.__ebActive = true;

    card.classList.add("is-in");
    /* バーとリングは CSS 側で初期値(0)が入っている。クラスを足すと目標値へ遷移する。 */
    each(card.querySelectorAll("[data-bar], [data-ring]"), function (n) {
      n.classList.add("is-grown");
    });
    each(card.querySelectorAll("[data-countup]"), countUp);
  }

  /* --- 印刷・reduce 用: 全部を即座に最終状態にする -------------------- */
  function finishAll() {
    each(document.querySelectorAll("[data-reveal]"), function (n) {
      n.__ebActive = true;
      n.classList.add("is-in");
    });
    each(document.querySelectorAll("[data-bar], [data-ring]"), function (n) {
      n.classList.add("is-grown");
    });
    each(document.querySelectorAll("[data-countup]"), finishCount);
  }

  /* --- 印刷時は <details> を全て開く -----------------------------------
     開閉そのものはネイティブ任せ。ここは「紙に手順を落とさない」ためだけ。 */
  function openDetailsForPrint() {
    each(document.querySelectorAll("details"), function (d) {
      if (!d.open) { d.__ebWasClosed = true; d.open = true; }
    });
  }
  function restoreDetailsAfterPrint() {
    each(document.querySelectorAll("details"), function (d) {
      if (d.__ebWasClosed) { d.__ebWasClosed = false; d.open = false; }
    });
  }

  function wirePrint() {
    window.addEventListener("beforeprint", function () {
      finishAll();
      openDetailsForPrint();
    });
    window.addEventListener("afterprint", restoreDetailsAfterPrint);
  }

  ready(function () {
    /* 元の表示文字列を退避しておく(印刷が途中に割り込んでも戻せるように) */
    each(document.querySelectorAll("[data-countup]"), function (n) {
      n.__ebRaw = String(n.textContent || "").trim();
    });

    wirePrint();

    if (reduced) return;                    /* ebs-js が無いので既に最終状態 */

    var cards = document.querySelectorAll("[data-reveal]");
    if (!cards.length) return;

    if (!("IntersectionObserver" in window)) {
      finishAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      var shown = [];
      entries.forEach(function (en) {
        if (en.isIntersecting) { io.unobserve(en.target); shown.push(en.target); }
      });
      /* 同時に入ってきた分は DOM 順に並べ直して stagger させる */
      shown.sort(function (a, b) {
        return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
      });
      shown.forEach(function (card, i) {
        setTimeout(function () { activate(card); }, i * REVEAL_STAGGER);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.04 });

    each(cards, function (c) { io.observe(c); });
  });
})();
