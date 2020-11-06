async function getAdheseAds(config) {
    if (!config || !config.account) return {};
    
    const res = await fetch('https://ads-' + config.account + '.adhese.com/json/sl' + config.slot)
    const data = await res.json()
  
    // add vast xml to cache server
    const regexII = /^.*II([^\/]+).*/;
    let cacheKey = data[0].tracker.match(regexII)[1];
    addToVASTCache(config.cacheUrl, cacheKey, data[0].tag);
  
    let adheseProps = {};
    // freewheel hb parameters
    adheseProps.hb_pb_cat_dur = Math.round(data[0].extension.prebid.cpm.amount) + '.00_' + (data[0].adDuration2nd-1) + 's';
    adheseProps.hb_cache = cacheKey;
    // vastUrl to cache
    adheseProps.vastUrl = config.cacheUrl + '?uuid=' + cacheKey;
    
    return adheseProps;
  }
  
function addToVASTCache(cacheUrl, cacheKey, vastXML) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "puts": [
            {
              "type": "xml",
              "ttlseconds": 60,
              "value": vastXML,
              "key": cacheKey
            }
          ]
        })
    };
    fetch(cacheUrl, requestOptions);
  }

exports.getAdheseAds = getAdheseAds;