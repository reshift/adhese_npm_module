# adhese npm module
Adhese implementation as an NPM module for use in NextJS projects.

The module is intended to be used as part of a Server Side Rendered application. It fetches the advertisments that are planned for the content being consumed and makes them available as custom parameters for the Freewheel Ad Server. It uses a Prebid Cache Server to store VAST xml until Freewheel returns its decision.

Use of this module requires an active Adhese account.

## install
Execute the following command in the root of your ReactJS projects.
```
npm install adhese
```
## usage
Import the Adhese function
```
import { getAdheseAds } from 'adhese';
```
Add a call to Adhese in the getServerSideProps of your page.

```
export async function getServerSideProps(context) {  

  // create a configuration object that contains your Adhese account id
  let adheseConfig = {
    account: 'demo',
    cacheUrl: 'https://my_prebid_cache.net/pbc/v1/cache',
    slot: 'example_video_slot'
  };
  
  // execute the request to Adhese and wait for the response
  let adheseProps = await getAdheseAds(context, adheseConfig);
  
  //add the returned object to your Freewheel configuration as part of the 'custom' attribute
  myFreewheelConfig.custom = Object.assign(myFreewheelConfig.custom, adheseProps);
  return { props: {myFreewheelConfig} }

}
```

Adhese returns an object with three parameters, that looks like this:

```
{
  "hb_pb_cat_dur": "12.00_30s",
  "hb_cache": "3a87aa93-b5f4-4fd1-b85b-8c40a9f35f16",
  "vastUrl": "https://my_prebid_cache.net/pbc/v1/cache?uuid=3a87aa93-b5f4-4fd1-b85b-8c40a9f35f16"
}
```

By calling Object.assign on your own player/freewheel configuration custom attribute, you will add the Adhese parameters as key/value pairs to the Freewheel Ad Server Request.  
The result looks like this:

```
jwplayer: {
    config: {
        advertising: {
            admessage: "",
            client: "freewheel",
            cuetext: "Advertisement",
            vpaidcontrols: true,
            freewheel: {
                serverid: "https://1234.v.fwmrm.net/ad/g/1",
                sectionid: "some_section_id",
                adManagerURL: "https://mssl.fwmrm.net/p/path_to_your/AdManager.js",
                networkid: 1234567,
                profileid: "1234567:some_identifier",
                custom: {
                    hb_pb_cat_dur: "12.00_30s",
                    hb_cache: "3a87aa93-b5f4-4fd1-b85b-8c40a9f35f16"
                }
            }
        }
    }


```

To deal with these key/value pairs, you can find more info here: https://docs.prebid.org/adops/setting-up-prebid-video-in-freewheel.html

## configuration options

You can pass several options in the adhese config, all of them explained below.

```
adheseConfig = {  
  // to be obtained from your Adhese account, obligatory  
  account: 'adhese_acount_id',  

  //url of the xml cache where returned ads will be stored temporarily, obligatory
  cacheUrl: 'https://my_prebid_cache.net/pbc/v1/cache',  

  // array of slots for which you want to request ads
  slots: ['myslot_1','myslot_2'],  

  // slot and slots can be combined, at least one of the two is obligatory
  slot: 'myslot_3',

  // content identifier (video/media) for contextual lookups, optional
  videoId: 'mediaId', 

  // user id for dmp matching, optional
  userId: 'authenticatedUserId', 

  // desktop, mobile, tablet, tv - optional
  deviceType: 'desktop', 

  // optional consent string
  consentString: 'IABConsentString', 

  // if no IAB string available, indicate consent through one of these two values: all, none - optional (defaults to 'none')
  binaryConsent: 'none', 

  // the time to keep the cached VAST xml in the cache server, defaults to 360 seconds
  cacheTTLInSeconds: 120,

  // optional, defaults to false - not to be used in a production environment
  // when set to true, a cookie with value debugKey=npm_module is added to each request
  // allowing you to use the Debug Tool in your Adhese account
  debug: false 
}
```  
