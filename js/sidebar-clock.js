function mountSidebarClock() {
  var parent = document.getElementsByClassName('sticky_layout')[0]
  if (!parent || document.getElementById('hexo_electric_clock')) return
  var wrap = document.createElement('div')
  wrap.className = 'card-widget card-clock'
  wrap.innerHTML = '<div class="card-glass"><div class="card-background"><div class="card-content"><div id="hexo_electric_clock"><div id="card-clock-loading">加载天气中...</div></div></div></div></div>'
  parent.insertBefore(wrap, parent.firstChild)
}

function clockWeatherColor(icon) {
  switch (icon) {
    case '100':
      return '#fdcc45'
    case '101':
      return '#fe6976'
    case '102':
    case '103':
      return '#fe7f5b'
    case '104':
    case '150':
    case '151':
    case '152':
    case '153':
    case '154':
    case '800':
    case '801':
    case '802':
    case '803':
    case '804':
    case '805':
    case '806':
    case '807':
      return '#2152d1'
    case '300':
    case '301':
    case '305':
    case '306':
    case '307':
    case '308':
    case '309':
    case '310':
    case '311':
    case '312':
    case '313':
    case '314':
    case '315':
    case '316':
    case '317':
    case '318':
    case '350':
    case '351':
    case '399':
      return '#49b1f5'
    case '302':
    case '303':
    case '304':
      return '#fdcc46'
    case '400':
    case '401':
    case '402':
    case '403':
    case '404':
    case '405':
    case '406':
    case '407':
    case '408':
    case '409':
    case '410':
    case '456':
    case '457':
    case '499':
      return '#a3c2dc'
    case '500':
    case '501':
    case '502':
    case '503':
    case '504':
    case '507':
    case '508':
    case '509':
    case '510':
    case '511':
    case '512':
    case '513':
    case '514':
    case '515':
      return '#97acba'
    case '900':
    case '999':
      return 'red'
    case '901':
      return '#179fff'
    default:
      return '#000'
  }
}

function clockUpdateTime(info, city) {
  var clockBox = document.getElementById('hexo_electric_clock')
  if (!clockBox || !info || !info.now) return

  var currentColor = clockWeatherColor(info.now.icon)
  clockBox.innerHTML =
    '<div class="clock-row">' +
    '<span id="card-clock-clockdate" class="card-clock-clockdate"></span>' +
    '<span class="card-clock-weather"><i class="qi-' + info.now.icon + '-fill" style="color: ' + currentColor + '"></i> ' +
    info.now.text + ' <span>' + info.now.temp + '</span> ℃</span>' +
    '<span class="card-clock-humidity">💧 ' + info.now.humidity + '%</span>' +
    '</div>' +
    '<div class="clock-row"><span id="card-clock-time" class="card-clock-time"></span></div>' +
    '<div class="clock-row">' +
    '<span class="card-clock-windDir"><i class="qi-gale"></i> ' + info.now.windDir + '</span>' +
    '<span class="card-clock-location">' + city + '</span>' +
    '<span id="card-clock-dackorlight" class="card-clock-dackorlight"></span>' +
    '</div>'

  var loading = document.getElementById('card-clock-loading')
  if (loading) loading.innerHTML = ''

  var week = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  function zeroPadding(num, digit) {
    var zero = ''
    for (var i = 0; i < digit; i++) zero += '0'
    return (zero + num).slice(-digit)
  }
  function updateTime() {
    var cd = new Date()
    var timeDom = document.getElementById('card-clock-time')
    var dateDom = document.getElementById('card-clock-clockdate')
    var ampmDom = document.getElementById('card-clock-dackorlight')
    if (!timeDom) return
    timeDom.innerHTML =
      zeroPadding(cd.getHours(), 2) + ':' + zeroPadding(cd.getMinutes(), 2) + ':' + zeroPadding(cd.getSeconds(), 2)
    dateDom.innerHTML =
      zeroPadding(cd.getFullYear(), 4) +
      '-' +
      zeroPadding(cd.getMonth() + 1, 2) +
      '-' +
      zeroPadding(cd.getDate(), 2) +
      ' ' +
      week[cd.getDay()]
    ampmDom.innerHTML = cd.getHours() >= 12 ? ' P M' : ' A M'
  }
  updateTime()
  setInterval(updateTime, 1000)
}

function fetchWeather(location, city) {
  return fetch('https://api.qweather.com/v7/weather/now?location=' + location + '&key=' + qweather_key)
    .then(function (res) { return res.json() })
    .then(function (data) {
      if (data && data.code === '200') clockUpdateTime(data, city)
    })
}

function cityFromRegeo(regeoData, fallback) {
  if (!(regeoData && regeoData.status === '1' && regeoData.regeocode)) return fallback
  var addressComponent = regeoData.regeocode.addressComponent
  return Array.isArray(addressComponent.city) ? addressComponent.province : addressComponent.city
}

function getIpInfo() {
  var defaultCity = typeof clock_default_city !== 'undefined' ? clock_default_city : '长沙市'

  function fallbackWeather() {
    fetch('https://restapi.amap.com/v3/geocode/regeo?key=' + gaud_map_key + '&location=' + clock_rectangle)
      .then(function (res) { return res.json() })
      .then(function (regeoData) {
        return fetchWeather(clock_rectangle, cityFromRegeo(regeoData, defaultCity))
      })
      .catch(function () { return fetchWeather(clock_rectangle, defaultCity) })
  }

  if (typeof clock_default_rectangle_enable !== 'undefined' && clock_default_rectangle_enable === 'true') {
    fallbackWeather()
    return
  }

  fetch('https://restapi.amap.com/v3/ip?key=' + gaud_map_key)
    .then(function (res) { return res.json() })
    .then(function (data) {
      if (!data || data.status !== '1' || Array.isArray(data.rectangle) || !data.rectangle) {
        fallbackWeather()
        return
      }
      var location = data.rectangle.split(';')[0]
      var city = Array.isArray(data.city) ? defaultCity : data.city
      return fetchWeather(location, city)
    })
    .catch(fallbackWeather)
}

mountSidebarClock()
getIpInfo()
