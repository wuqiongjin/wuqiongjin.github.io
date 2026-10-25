(function () {
  function isLocalHost () {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  }

  function fillLocalCounters () {
    if (!isLocalHost()) return
    ;['busuanzi_value_site_uv', 'busuanzi_value_site_pv', 'busuanzi_value_page_pv'].forEach(function (id) {
      var el = document.getElementById(id)
      if (el) el.textContent = '—'
    })
  }

  function setupCommentFallback () {
    var box = document.getElementById('lv-container')
    if (!box) return
    if (isLocalHost()) {
      box.innerHTML = '<p class="comment-offline-hint">本地预览不加载来必力评论。发布到 GitHub Pages 后会出现；若线上仍空白，请来必力后台把站点写成 https://wuqiongjin.github.io/。</p>'
      new MutationObserver(function () {
        Array.prototype.forEach.call(box.children, function (child) {
          if (!child.classList.contains('comment-offline-hint')) child.remove()
        })
      }).observe(box, { childList: true })
      return
    }
    window.setTimeout(function () {
      if (box.querySelector('iframe, .livere-comment')) return
      if (box.textContent.trim()) return
      box.innerHTML = '<p class="comment-offline-hint">评论没有加载出来。请来必力后台确认站点地址是 https://wuqiongjin.github.io/。</p>'
    }, 8000)
  }

  var TAB_ALIAS = {
    '1': 'hexo-douban-tab1',
    watching: 'hexo-douban-tab1',
    do: 'hexo-douban-tab1',
    '在看': 'hexo-douban-tab1',
    '2': 'hexo-douban-tab2',
    wish: 'hexo-douban-tab2',
    '想看': 'hexo-douban-tab2',
    '3': 'hexo-douban-tab3',
    collect: 'hexo-douban-tab3',
    done: 'hexo-douban-tab3',
    '已看': 'hexo-douban-tab3'
  }

  function currentTabId () {
    var active = document.querySelector('.hexo-douban-tab.hexo-douban-active')
    return active ? active.id.replace('hexo-douban-tab', '') : '3'
  }

  function pageParts (text) {
    var match = String(text || '').match(/(\d+)\s*\/\s*(\d+)/)
    return {
      current: match ? parseInt(match[1], 10) : 1,
      total: match ? parseInt(match[2], 10) : 1
    }
  }

  function currentPage (pagination) {
    var num = pagination.querySelector('.hexo-douban-pagenum')
    return pageParts(num && num.innerText).current
  }

  function visiblePagination () {
    var item = document.querySelector('.hexo-douban-show')
    return item ? item.querySelector('.hexo-douban-pagination') : document.querySelector('.hexo-douban-pagination')
  }

  function paintPageNum (label, current, total) {
    var cur = document.createElement('span')
    cur.className = 'hexo-douban-page-cur'
    cur.contentEditable = 'true'
    cur.spellcheck = false
    cur.title = '输入页码后回车'
    cur.textContent = String(current)
    label.textContent = ''
    label.appendChild(cur)
    label.appendChild(document.createTextNode(' / ' + total))
    cur.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        cur.blur()
      }
    })
    cur.addEventListener('blur', function () {
      var pagination = label.closest('.hexo-douban-pagination')
      jumpToPage(pagination, parseInt(cur.textContent, 10) || 1)
    })
  }

  function jumpToPage (pagination, page1) {
    if (!pagination || typeof displayPage !== 'function') return
    if (typeof pagination.siblings !== 'function') return
    var sibs = pagination.siblings()
    var total = Math.max(1, Math.ceil(sibs.length / 10))
    var idx = Math.min(Math.max(1, page1), total) - 1
    displayPage(sibs, idx)
    var label = pagination.getElementsByClassName('hexo-douban-pagenum')[0]
    if (label) paintPageNum(label, idx + 1, total)
    syncBangumiUrl()
  }

  function syncBangumiUrl () {
    if (!/\/bangumis\/?/.test(location.pathname)) return
    var pagination = visiblePagination()
    if (!pagination) return
    var params = new URLSearchParams(location.search)
    params.set('tab', currentTabId())
    params.set('page', String(currentPage(pagination)))
    var next = location.pathname + '?' + params.toString()
    if (next !== location.pathname + location.search) history.replaceState(null, '', next)
  }

  function restoreLabel (pagination) {
    var label = pagination.querySelector('.hexo-douban-pagenum')
    if (!label) return
    var parts = pageParts(label.innerText)
    paintPageNum(label, parts.current, parts.total)
  }

  function enhancePagination (pagination) {
    if (!pagination || pagination.dataset.gotoReady) return
    pagination.dataset.gotoReady = '1'
    restoreLabel(pagination)
    ;['hexo-douban-firstpage', 'hexo-douban-previouspage', 'hexo-douban-nextpage', 'hexo-douban-lastpage'].forEach(function (cls) {
      var el = pagination.querySelector('.' + cls)
      if (!el) return
      el.addEventListener('click', function () {
        window.setTimeout(function () { restoreLabel(pagination); syncBangumiUrl() }, 0)
      })
    })
  }

  function setupBangumiPager () {
    var pagers = document.getElementsByClassName('hexo-douban-pagination')
    if (!pagers.length) return
    var already = document.body.dataset.bangumiPager === '1'
    Array.prototype.forEach.call(pagers, enhancePagination)
    if (already) return
    document.body.dataset.bangumiPager = '1'
    Array.prototype.forEach.call(document.getElementsByClassName('hexo-douban-tab'), function (tab) {
      tab.addEventListener('click', function () {
        window.setTimeout(function () {
          var pagination = visiblePagination()
          if (pagination) restoreLabel(pagination)
          syncBangumiUrl()
        }, 0)
      })
    })
    var params = new URLSearchParams(location.search)
    var tabKey = params.get('tab')
    var page = parseInt(params.get('page'), 10)
    if (tabKey && TAB_ALIAS[tabKey]) {
      var tab = document.getElementById(TAB_ALIAS[tabKey])
      if (tab) tab.click()
    }
    window.setTimeout(function () {
      var pagination = visiblePagination()
      if (page) jumpToPage(pagination, page)
      else syncBangumiUrl()
    }, 0)
  }

  function init () {
    fillLocalCounters()
    window.setTimeout(fillLocalCounters, 4000)
    setupCommentFallback()
    setupBangumiPager()
  }

  init()
  document.addEventListener('pjax:complete', init)
})()
