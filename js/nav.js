(function () {
  var NAV_MENU = [
    { type: 'item', label: '홈', icon: '🏠', href: 'index.html' },
    { type: 'item', label: '원고 작성', icon: '📝', href: 'index.html' },
    { type: 'divider' },
    { type: 'group', label: '숏폼', icon: '📚', children: [
      { label: '강의', icon: '📖', href: 'guide.html' },
      { label: '제작', icon: '🎬', href: null, disabled: true, badge: '준비중' }
    ]},
    { type: 'divider' },
    { type: 'item', label: '썸네일 창고', icon: '📦', href: 'warehouse.html' }
  ];

  function currentPage() {
    var path = location.pathname;
    var file = path.split('/').pop();
    if (!file || file === '') return 'index.html';
    return file;
  }

  function isActive(href) {
    if (!href) return false;
    return currentPage() === href;
  }

  function buildItem(item, isChild) {
    var active = isActive(item.href);
    var classes = ['nav-item'];
    if (isChild) classes.push('nav-item-child');
    if (active) classes.push('active');
    if (item.disabled) classes.push('disabled');

    var el = document.createElement('a');
    el.className = classes.join(' ');
    if (item.href && !item.disabled) {
      el.href = item.href;
    } else {
      el.href = '#';
      el.setAttribute('role', 'button');
    }

    var iconSpan = document.createElement('span');
    iconSpan.className = 'nav-item-icon';
    iconSpan.textContent = item.icon;
    el.appendChild(iconSpan);

    var labelSpan = document.createElement('span');
    labelSpan.textContent = item.label;
    el.appendChild(labelSpan);

    if (item.badge) {
      var badge = document.createElement('span');
      badge.className = 'nav-item-badge';
      badge.textContent = item.badge;
      el.appendChild(badge);
    }

    el.addEventListener('click', function (e) {
      if (item.disabled) { e.preventDefault(); return; }
      if (item.href && item.href !== currentPage()) return;
      e.preventDefault();
      closeDrawer();
    });

    return el;
  }

  function buildMenu() {
    var ul = document.createElement('nav');
    ul.className = 'nav-menu';

    NAV_MENU.forEach(function (entry) {
      if (entry.type === 'divider') {
        var hr = document.createElement('div');
        hr.className = 'nav-divider';
        ul.appendChild(hr);
      } else if (entry.type === 'group') {
        var header = document.createElement('div');
        header.className = 'nav-group-header';
        header.textContent = entry.icon + ' ' + entry.label;
        ul.appendChild(header);
        entry.children.forEach(function (child) {
          ul.appendChild(buildItem(child, true));
        });
      } else {
        ul.appendChild(buildItem(entry, false));
      }
    });

    return ul;
  }

  function openDrawer() {
    document.getElementById('navDrawer').classList.add('open');
    document.getElementById('navOverlay').classList.add('open');
  }

  function closeDrawer() {
    document.getElementById('navDrawer').classList.remove('open');
    document.getElementById('navOverlay').classList.remove('open');
  }

  function inject() {
    if (document.body.hasAttribute('data-no-nav') || document.body.classList.contains('no-nav')) return;

    var header = document.querySelector('.header');
    if (!header) return;

    var hamburger = document.createElement('button');
    hamburger.className = 'nav-hamburger';
    hamburger.id = 'navHamburger';
    hamburger.title = '메뉴';
    hamburger.innerHTML = '&#9776;';
    hamburger.addEventListener('click', openDrawer);
    header.insertBefore(hamburger, header.firstChild);

    var overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.id = 'navOverlay';
    overlay.addEventListener('click', closeDrawer);

    var drawer = document.createElement('aside');
    drawer.className = 'nav-drawer';
    drawer.id = 'navDrawer';

    var drawerHeader = document.createElement('div');
    drawerHeader.className = 'nav-drawer-header';

    var brand = document.createElement('span');
    brand.className = 'nav-brand';
    brand.textContent = 'youbox';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'btn-icon nav-close-btn';
    closeBtn.title = '닫기';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeDrawer);

    drawerHeader.appendChild(brand);
    drawerHeader.appendChild(closeBtn);
    drawer.appendChild(drawerHeader);
    drawer.appendChild(buildMenu());

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDrawer(); return; }
      var isMac = navigator.platform.toUpperCase().indexOf('MAC') !== -1;
      var mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'b') {
        e.preventDefault();
        var drawer = document.getElementById('navDrawer');
        if (drawer.classList.contains('open')) closeDrawer(); else openDrawer();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
