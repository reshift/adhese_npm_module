async function getAdheseAds(config) {
  return getAdheseAds(undefined, config)
}

async function getAdheseAds(context, config) {
  if (!config || !config.account) return {};
  
  let headers = {
    'content-type': 'application/json',
    'user-agent': context.req.headers['user-agent']    
  };
  if (config.debug) {
    headers['Cookie'] = 'debugKey=npm_module';
  }
  let referrer = context.req.headers.referer;
  
  let xf = "";
  if (context && context.req.headers.referer) {
    xf = base64urlEncode(context.req.headers.referer);
  }
  let dt = config.deviceType ? config.deviceType : "unknown";
  let tl = config.binaryConsent ? config.binaryConsent : "none";
  let xt = config.consentString ? config.consentString : "";
  let vi = config.videoId ? config.videoId : "unknown";
  let ui = config.userId ? config.userId : "unknown";
  
  let slots = [];
  if (config.slots) {
    slots = config.slots.map(slot => ({ slotname: slot }));
  }
  if(config.slot) {
    slots.push({slotname:config.slot});
  }
  if (slots.length==0) return {};

  const requestOptions = {
    method: 'POST',
    credentials: 'include',
    cache: 'no-cache',
    headers: headers,
    referrer: referrer,
    body: JSON.stringify({
      "slots": slots,
      "parameters": {
        "dt": [dt],
        "tl": [tl],
        "xt": [xt],
        "xf": [xf],
        "vi": [vi],
        "ui": [ui]
      }
    })
  };
  
  console.log(requestOptions);
  const res = await fetch('https://ads-' + config.account + '.adhese.com/json/', requestOptions)
  const data = await res.json()
  
  try {
    // add vast xml to cache server
    const regexII = /^.*II([^\/]+).*/;
    let cacheKey = data[0].tracker.match(regexII)[1];
    addToVASTCache(config.cacheUrl, cacheKey, data[0].tag);

    let adheseProps = {};
    // freewheel hb parameters
    adheseProps.hb_pb_cat_dur = Math.round(data[0].extension.prebid.cpm.amount) + '.00_' + (data[0].adDuration2nd - 1) + 's';
    adheseProps.hb_cache = cacheKey;
    // vastUrl to cache
    adheseProps.vastUrl = config.cacheUrl + '?uuid=' + cacheKey;

    return adheseProps;
  } catch(e) {}

  return {};
}

function addToVASTCache(cacheUrl, cacheKey, vastXML) {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "puts": [{
        "type": "xml",
        "ttlseconds": 360,
        "value": vastXML,
        "key": cacheKey
      }]
    })
  };
  fetch(cacheUrl, requestOptions);
}

function base64urlEncode(s) {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function btoa(str) {
  var buffer;

  if (str instanceof Buffer) {
    buffer = str;
  } else {
    buffer = Buffer.from(str.toString(), 'binary');
  }

  return buffer.toString('base64');
}

exports.getAdheseAds = getAdheseAds;