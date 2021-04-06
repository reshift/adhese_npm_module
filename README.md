# adhese npm module
Adhese implementation as an NPM module for use in NextJS projects.

The module is intended to be used as part of a Server Side Rendered application. It fetches the advertisments that are planned for the content being consumed and makes them available as custom parameters for the Freewheel Ad Server or Google ad Manager.

Use of this module requires an active Adhese account.

## install
Execute the following command in the root of your NextJS project.
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
  // this a minimal configuration, for more options see further in this document
  let adheseConfig = {
    account: 'demo',
    slots: [
      'demo_pre-previd30',
      'demo_mid1-previd30'
    ]
  };
  
  // execute the request to Adhese and wait for the response
  let adheseProps = await getAdheseAds(context, adheseConfig);
  
  //add the returned object to your Freewheel configuration as part of the 'custom' attribute
  myFreewheelConfig.custom = Object.assign(myFreewheelConfig.custom, adheseProps["freewheel_config]);
  return { props: {myFreewheelConfig} }

}
```
You can request multiple placements at once by passing an array of slots.
```
let adheseConfig = {
    account: 'demo',
    slots: [
      'demo_pre-previd30',
      'demo_mid1-previd30'
    ]
  };
```
Adhese returns an object with five attributes, listed below.
- user_sync_iframe: contains a url that can be used to construct an iframe on the client. The result of a call to the url will be a numberof syncing pixels as configured in your Adhese accoiunt and depending on the IAB TCF2 consent string you pass in the request.
- adh: string indicating the presence of at least one bid (legacy)
- ads: an array with the returned ads, max. one item in the array per requested slot, each item belongs to one slot as indicated by its adh_slot attribute. Can be empty when there are no bids.
- freewheel_config: an object to be passed to your Freewheel custom targeting object.
- google_ad_manager_tag: The custom parameters (or complete url when passed at config) for passing the ads to your GAM account

Each items in the ads array contains the following attributes:
- adh_slot: the slot to which this bid belongs
- adh_vast_url: the url to the VAST xml content of this specific bid, will be used by the player wgen rendering the ad
- adh_origin: the Gateway market sending in this bid
- adh_campaign: the campaign, if known, to which this bid belongs (currently for Adhese campaigns only)
- adh_cpm: the net CPM value for this bid in the currency of your account
- adh_cpm_currency: the currency of the cpm bid value
- adh_duration: the duration in seconds of the video/audio file included in the bid
- adh_as_li_target: Ad server line item target value. The value that will be used for targeting a specific header bidding line item in your ad server. A combination of the cpm value and the duration.
```
{
  user_sync_iframe: 'https://user-sync.adhese.com/iframe/user_sync.html?account=demo&gdpr=1&consentString=CO-a1S7O-a1S7AHABBENBECgAP_AAE_AAAAAHKtf_X_fb3_j-_59_9t0eY1f9_7_v20zjgeds-8Nyd_X_L8X...',
  adh: 'bid',
  ads: [
    {
      adh_vast_url: 'https://ads-demo.adhese.com/content/5c37ca3c-7589-442c-b72e-1f9215fb11ba',
      adh_origin: 'JERLICIA',
      adh_campaign: 'Multiple Ad Breaks - Demo Campaign',
      adh_cpm: '6.0',
      adh_cpm_currency: 'EUR',
      adh_duration: 30,
      adh_as_li_target: '6.00_30s',
      adh_slot: 'demo_pre-previd30'
    },
    {
      adh_vast_url: 'https://ads-demo.adhese.com/content/e056b3e5-0d2e-4e62-b0c7-e4246b8c34fa',
      adh_origin: 'DALE-demo',
      adh_campaign: '1',
      adh_cpm: '1.5',
      adh_cpm_currency: 'EUR',
      adh_duration: 30,
      adh_as_li_target: '2.00_30s',
      adh_slot: 'demo_mid1-previd30'
    }
  ],
  freewheel_config: {
    'demo_pre-previd30': '6.00_30s',
    'demo_pre-previd30_url': 'https://ads-demo.adhese.com/content/5c37ca3c-7589-442c-b72e-1f9215fb11ba',
    'demo_mid1-previd30': '2.00_30s',
    'demo_mid1-previd30_url': 'https://ads-demo.adhese.com/content/e056b3e5-0d2e-4e62-b0c7-e4246b8c34fa'
  },
  google_ad_manager_tag: '&cust_params=demo_pre-previd30%3D6.00_30s%26demo_mid1-previd30%3D2.00_30s'  
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
                    demo_pre-previd30: "6.00_30s",
                    demo_pre-previd30_url: "https://ads-demo.adhese.com/content/5c37ca3c-7589-442c-b72e-1f9215fb11ba",
                    demo_mid1-previd30: "2.00_30s",
                    demo_mid1-previd30_url: "https://ads-demo.adhese.com/content/e056b3e5-0d2e-4e62-b0c7-e4246b8c34fa"
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

  // array of slots for which you want to request ads
  slots: ['myslot_1','myslot_2'],  

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

  // Maximum CPM if you want to cap line items towards your ad server. Bids higher than this value will be rounded to max cpm befpre being added to the ad server target
  maxCpm: 40,

  // optional, defaults to false - not to be used in a production environment
  // when set to true, a cookie with value debugKey=npm_module is added to each request
  // allowing you to use the Debug Tool in your Adhese account
  debug: false 
}
```  
