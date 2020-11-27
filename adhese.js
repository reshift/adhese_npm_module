async function getAdheseAds(context, config) {
  if (!config || !config.account || !config.cacheUrl || (!config.slot && !config.slots)) {
    console.error("ADHESE: Config misses obligatory attributes, at least account, cacheUrl and (slot or slots) are required.");
    return {};
  }
  
  let headers = {
    'content-type': 'application/json'    
  };
  if (context && context.req.headers['user-agent']) {
    headers['User-Agent'] = context.req.headers['user-agent']
  }
  if (config.debug) {
    headers['Cookie'] = 'debugKey=npm_module';
  }
  
  let referrer = "";  
  let xf = "";
  if (context && context.req.headers.referer) {
    xf = base64urlEncode(context.req.headers.referer);
    referrer = context.req.headers.referer;
  }
  const dt = config.deviceType ? config.deviceType : "unknown";
  const tl = config.binaryConsent ? config.binaryConsent : "none";
  const xt = config.consentString ? config.consentString : "";
  const vi = config.videoId ? config.videoId : "unknown";
  const ui = config.userId ? config.userId : "unknown";
  const ttlInSec = config.cacheTTLInSeconds ? config.cacheTTLInSeconds : 360;

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
  
  const res = await fetch('https://ads-' + config.account + '.adhese.com/json/', requestOptions)
  const data = await res.json()
  
  if (data.length== 0) {
    if (config.debug) {
      console.debug("ADHESE: no ads");
    }
    return {};
  }

  let adheseProps = {};
  data.forEach(function (ad, index) {
    if (config.debug) {
      console.debug("ADHESE: ad received from ", ad.origin + (ad.originInstance ? "-" + ad.originInstance : ""));
    }
    
    let markup = "";
    if (ad.origin == "JERLICIA") {
      markup = ad.tag;
    } else {
      markup = ad.body;
    }
    
    if (markup && markup != "") {
      let cacheKey = uuid();
      let vastUrl = addToVASTCache(config.cacheUrl, cacheKey, markup, ttlInSec);
      adheseProps = Object.assign(adheseProps, {['adh_vast_url'+(index>0?'_'+(index+1):'')]:vastUrl});
      
      let durationInSec = getDurationFromVastXml(markup);
      adheseProps = Object.assign(adheseProps, 
        getFreewheelParams(index,{
          cpm: ad.extension.prebid.cpm.amount, 
          durationInSec: durationInSec, 
          cacheKey: cacheKey
        })
      );    
    }
  });
  return adheseProps;
}

function getFreewheelParams(index, values) {
  return {
    ['hb_cache'+(index>0?'_'+(index+1):'')]: values.cacheKey,
    ['hb_pb_cat_dur'+(index>0?'_'+(index+1):'')]: Math.round(values.cpm) + '.00_' + values.durationInSec + 's'
  };
}

function getDurationFromVastXml(markup) {
  const regexDuration = /<Duration>(\d\d):(\d\d):(\d\d)<\/Duration>/;
  if (regexDuration.test(markup)) {
    let hour = parseInt(markup.match(regexDuration)[1]);
    let min = parseInt(markup.match(regexDuration)[2]);
    let sec = parseInt(markup.match(regexDuration)[3]);
    return (hour*3600) + (min*60) + sec;
  }
  return 0;
}

function addToVASTCache(cacheUrl, cacheKey, vastXML, ttlInSec) {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "puts": [{
        "type": "xml",
        "ttlseconds": ttlInSec,
        "value": vastXML,
        "key": cacheKey
      }]
    })
  };
  fetch(cacheUrl, requestOptions);
  return cacheUrl + '?uuid=' + cacheKey;
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

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

exports.getAdheseAds = getAdheseAds;