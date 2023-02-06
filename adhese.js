async function getAdheseAds(context, config) {
  if (!config || !config.account || (!config.slot && !config.slots)) {
    console.error("ADHESE: Config misses obligatory attributes, at least account and (slot or slots) are required.");
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
  const googleAdManagerTag = config.googleAdManagerTag ? config.googleAdManagerTag : "";
  const vi = config.videoId ? config.videoId : "unknown";
  const ui = config.userId ? config.userId : "unknown";
  const maxCpm = config.maxCpm ? config.maxCpm : 50;

  // checken of slots uniek zijn, anders return error
  let slots = [];
  if (config.slots) {
    slots = config.slots.map(slot => ({ slotname: slot }));
  }
  if (config.slot) {
    slots.push({ slotname: config.slot });
  }
  if (slots.length == 0) return {};

  const requestOptions = {
    method: 'POST',
    credentials: 'include',
    cache: 'no-cache',
    headers: headers,
    referrer: referrer,
    body: JSON.stringify({
      "slots": slots,
      vastContentAsUrl: true,
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

  let adheseProps = {};

  var userSync = getUserSyncMarkup(config);
  adheseProps = Object.assign(adheseProps, { ['user_sync_iframe']: userSync });
  
  const res = await fetch('https://content1.' + config.account + '/json/', requestOptions)
  const data = await res.json()
  const vastPathRegex = /:\/\/(?:www\.)?.[^/]+\/(.*)/;

  adheseProps = Object.assign(adheseProps, { ['adh']: (data.length != 0 ? "bid" : "no-bid") });
  if (data.length == 0) {
    if (config.debug) {
      console.debug("ADHESE: no ads");
    }
    adheseProps = Object.assign(adheseProps, { ['ads']: [] });    
    adheseProps = Object.assign(adheseProps, { ['google_ad_manager_tag']: '' });
    adheseProps = Object.assign(adheseProps, { ['freewheel_config']: {} });
    return adheseProps;
  }

  let returnedAds = [];

  data.filter(isValidBid).forEach(function (ad, index) {
    if (config.debug) {
      console.debug("ADHESE: ad received from ", ad.origin + (ad.originInstance ? "-" + ad.originInstance : ""));
    }
    
    let vastUrl = "";
    let vastPath = "";
    let durationInSec = 30;
    if (ad.cachedBodyUrl && ad.cachedBodyUrl != "") {
      vastUrl = ad.cachedBodyUrl;
      const matches = ad.cachedBodyUrl.match(vastPathRegex);
      vastPath = matches[1];      
    }

    let adheseSlot = {};
    adheseSlot = Object.assign(adheseSlot, { ['adh_vast_url']: vastUrl });
    adheseSlot = Object.assign(adheseSlot, { ['adh_vast_path']: vastPath });
    adheseSlot = Object.assign(adheseSlot, { ['adh_origin']: ad.origin + (ad.originInstance ? "-" + ad.originInstance : "") });
    if (ad.origin == "JERLICIA") {
      adheseSlot = Object.assign(adheseSlot, { ['adh_campaign']: ad.orderName });
    } else if (ad.origin == "DALE") {
      adheseSlot = Object.assign(adheseSlot, { ['adh_campaign']: ad.originData.seatbid[0].bid[0].ext.adhese.orderId });
    } else {
      adheseSlot = Object.assign(adheseSlot, { ['adh_campaign']: "unknown" });
    }
    
    let cpm = 0;
    let currency = '';
    if (ad.extension.prebid != undefined) {
      cpm = ad.extension.prebid.cpm.amount;
      currency = ad.extension.prebid.cpm.currency;
    }
    adheseSlot = Object.assign(adheseSlot, { ['adh_cpm']: cpm });
    adheseSlot = Object.assign(adheseSlot, { ['adh_cpm_currency']: currency });
    adheseSlot = Object.assign(adheseSlot, { ['adh_duration']: durationInSec });
    adheseSlot = Object.assign(adheseSlot, { ['adh_as_li_target']: Math.round(cpm > maxCpm ? maxCpm : cpm) + '.00_' + durationInSec + 's' });
    adheseSlot = Object.assign(adheseSlot, { ['adh_slot']: ad.slotName });

    returnedAds.push(adheseSlot);
    
  });
  adheseProps = Object.assign(adheseProps, { ['ads']: returnedAds });

  let gamUrl = addCustomParamsToGAMURL(googleAdManagerTag, returnedAds);
  adheseProps = Object.assign(adheseProps, { ['google_ad_manager_tag']: gamUrl });

  let freewheelProps = getFreeWheelProps(returnedAds);
  adheseProps = Object.assign(adheseProps, { ['freewheel_config']: freewheelProps });

  if (config.debug) {
    console.log(adheseProps);
  }
  return adheseProps;
}

function isValidBid(ad) {
  return (ad.cachedBodyUrl && ad.cachedBodyUrl!="") || (ad.body && ad.body != "") || (ad.tag && ad.tag != "")
}

function getDurationFromVastXml(markup, ad) {
  if (markup.indexOf('<Wrapper>') == -1) {
    const regexDuration = /<Duration>(\d\d):(\d\d):(\d\d)<\/Duration>/;
    if (regexDuration.test(markup)) {
      let match = markup.match(regexDuration);
      let hour = parseInt(match[1]);
      let min = parseInt(match[2]);
      let sec = parseInt(match[3]);
      return (hour * 3600) + (min * 60) + sec;
    }
  }
  return 30;
}

function getUserSyncMarkup(config) {
  return "https://user-sync.adhese.com/iframe/user_sync.html?account=" + config.account + "&gdpr=1&consentString=" + config.consentString;
}

function addCustomParamsToGAMURL(gamUrl, ads) {
  let str = gamUrl.split("cust_params=");
  if (str.length==1) {
    // add cust_params
    return str[0] + "&cust_params=" + createEscapedKeyValueString(ads);
  } else {
    // append cust_params
    return str[0] + "cust_params=" + createEscapedKeyValueString(ads) + "%26" + str[1];
  }
}

function createEscapedKeyValueString(ads) {
  var out = "";
  ads.forEach((ad, index) => {
    out += (index>0?"%26":"") + ad["adh_slot"] + "%3D" + ad["adh_as_li_target"]
  });
  return out;
}

function getFreeWheelProps(ads) {
  var out = {};
  ads.forEach((ad) => {
    out[ad["adh_slot"]] = ad["adh_as_li_target"];
    out[ad["adh_slot"]+"_url"] = ad["adh_vast_path"];
    out[ad["adh_slot"]+"_origin"] = ad["adh_origin"];
  });
  return out;
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