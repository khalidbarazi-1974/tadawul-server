(function () {
  'use strict';

  var CSS = `
.ss-native { display: none !important; }
.ss-wrap { position: relative; display: inline-block; width: 100%; font: inherit; }
.ss-btn {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 0.45rem 0.75rem; cursor: pointer;
  background: #fff; border: 1px solid #d1d5db; border-radius: 0.375rem;
  font: inherit; color: #111827;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  box-sizing: border-box; user-select: none;
}
.ss-btn:focus { outline: 2px solid #3b82f6; outline-offset: 1px; }
.ss-label { flex: 1; overflow: hidden; text-overflow: ellipsis; text-align: right; }
.ss-arrow { margin-inline-start: 0.5rem; font-size: 0.7em; opacity: 0.6; flex-shrink: 0; }
.ss-drop {
  display: none; position: absolute; z-index: 9999;
  top: calc(100% + 2px); right: 0; left: 0; min-width: 100%;
  background: #fff; border: 1px solid #d1d5db; border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12); overflow: hidden;
}
.ss-drop.open { display: block; }
.ss-search-row { padding: 0.4rem 0.5rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
.ss-search-inp {
  width: 100%; box-sizing: border-box; padding: 0.35rem 0.6rem;
  border: 1px solid #d1d5db; border-radius: 0.25rem;
  font: inherit; font-size: 0.875em; direction: rtl;
  background: #fff; color: #111827;
}
.ss-search-inp:focus { outline: 2px solid #3b82f6; outline-offset: 0; }
.ss-opts { max-height: 220px; overflow-y: auto; }
.ss-opt {
  padding: 0.45rem 0.75rem; cursor: pointer; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; direction: rtl;
  font: inherit; font-size: 0.9em; color: #111827;
}
.ss-opt:hover { background: #f3f4f6; }
.ss-opt.active { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
.ss-opt.disabled { color: #9ca3af; cursor: default; pointer-events: none; }
.ss-empty { padding: 0.5rem 0.75rem; color: #9ca3af; font-size: 0.85em; direction: rtl; }
`;

  function injectCSS() {
    if (document.getElementById('ss-styles')) return;
    var s = document.createElement('style');
    s.id = 'ss-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function getLabel(select) {
    var opt = select.options[select.selectedIndex];
    return opt ? opt.text : '';
  }

  function buildOpts(select, search) {
    var list = select.querySelectorAll ? null : null;
    var opts = Array.from(select.options);
    return opts.filter(function (o) {
      if (!search) return true;
      return o.text.includes(search);
    });
  }

  function init(select) {
    if (select.__ssInit) return;
    select.__ssInit = true;

    var cs = window.getComputedStyle(select);

    var wrap = document.createElement('div');
    wrap.className = 'ss-wrap';
    wrap.setAttribute('dir', 'rtl');
    wrap.style.fontSize = cs.fontSize;
    wrap.style.fontFamily = cs.fontFamily;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ss-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.style.paddingTop = cs.paddingTop;
    btn.style.paddingBottom = cs.paddingBottom;
    btn.style.paddingInlineStart = cs.paddingInlineStart;
    btn.style.paddingInlineEnd = cs.paddingInlineEnd;
    btn.style.borderRadius = cs.borderRadius;

    var label = document.createElement('span');
    label.className = 'ss-label';
    label.textContent = getLabel(select);

    var arrow = document.createElement('span');
    arrow.className = 'ss-arrow';
    arrow.textContent = '▼';

    btn.appendChild(label);
    btn.appendChild(arrow);

    var drop = document.createElement('div');
    drop.className = 'ss-drop';

    var searchRow = document.createElement('div');
    searchRow.className = 'ss-search-row';

    var searchInp = document.createElement('input');
    searchInp.type = 'text';
    searchInp.className = 'ss-search-inp';
    searchInp.placeholder = 'بحث...';
    searchInp.autocomplete = 'off';

    searchRow.appendChild(searchInp);

    var optsDiv = document.createElement('div');
    optsDiv.className = 'ss-opts';

    drop.appendChild(searchRow);
    drop.appendChild(optsDiv);

    wrap.appendChild(btn);
    wrap.appendChild(drop);

    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('ss-native');

    function renderOpts(filter) {
      optsDiv.innerHTML = '';
      var opts = buildOpts(select, filter);
      if (!opts.length) {
        var empty = document.createElement('div');
        empty.className = 'ss-empty';
        empty.textContent = 'لا توجد نتائج';
        optsDiv.appendChild(empty);
        return;
      }
      opts.forEach(function (o) {
        var div = document.createElement('div');
        div.className = 'ss-opt' + (o.disabled ? ' disabled' : '') + (o.selected ? ' active' : '');
        div.textContent = o.text;
        div.dataset.value = o.value;
        div.addEventListener('mousedown', function (e) {
          e.preventDefault();
          select.value = o.value;
          label.textContent = o.text;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          closeDropdown();
        });
        optsDiv.appendChild(div);
      });
    }

    function openDropdown() {
      searchInp.value = '';
      renderOpts('');
      drop.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      searchInp.focus();
    }

    function closeDropdown() {
      drop.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (drop.classList.contains('open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    searchInp.addEventListener('input', function () {
      renderOpts(searchInp.value.trim());
    });

    searchInp.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    drop.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    document.addEventListener('click', function (e) {
      if (!e.composedPath().includes(wrap)) {
        closeDropdown();
      }
    });

    // Sync label when native select value changes programmatically
    select.addEventListener('change', function () {
      label.textContent = getLabel(select);
    });

    // Rebuild options list when select's children change
    var childObs = new MutationObserver(function () {
      label.textContent = getLabel(select);
      if (drop.classList.contains('open')) {
        renderOpts(searchInp.value.trim());
      }
    });
    childObs.observe(select, { childList: true, subtree: true });

    // Sync wrapper display with native select's inline style display
    var styleObs = new MutationObserver(function () {
      var hidden = select.style.display === 'none';
      wrap.style.display = hidden ? 'none' : '';
    });
    styleObs.observe(select, { attributes: true, attributeFilter: ['style'] });

    // Match initial visibility
    if (select.style.display === 'none') {
      wrap.style.display = 'none';
    }
  }

  function initAll() {
    injectCSS();
    var selects = document.querySelectorAll('select:not([data-no-ss])');
    selects.forEach(init);
  }

  window.initSearchableSelect = function (select) {
    injectCSS();
    init(select);
  };

  window.initAllSearchableSelects = initAll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
