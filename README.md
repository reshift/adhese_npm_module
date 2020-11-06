# adhese npm module
Adhese implementation as an NPM module for use in NextJS projects.

The module is intended to be used as part of a Server Side Rendered application. It fetches the advertisments that are planned for the content being consumed and makes them available as custom parameters for the Freewheel Ad Server. It uses a Prebid Cache Server to store VAST xml until Freewheel returns its decision.

Use of this module requires an active Adhese account. The current version is no more than a proof of concept and is not production ready.

## install
Execute the following command in the root of your ReactJS projects.
> npm install adhese

## usage
Add a call to Adhese in the getServerSideProps of your page.

```
export async function getServerSideProps() {  

  // create a configuration object that contains your Adhese account id
  let adheseConfig = {
    account: 'demo',
    cacheUrl: 'https://my_prebid_cache_server.net/cache',
    slot: 'example_video_slot'
  };
  
  // execute the request to Adhese and wait for the response
  let adheseProps = await getAdheseAds(adheseConfig);
  
  //add the returned object to your Freewheel configuration as part of the 'custom' attribute
  myFreewheelConfig = Object.assign(myFreewheelConfig, adheseProps);
  return { props: {myFreewheelConfig} }

}
```

Adhese returns an object with three parameters, that looks like this:

```
{
  "hb_pb_cat_dur": "12.00_30s",
  "hb_cache": "3a87aa93-b5f4-4fd1-b85b-8c40a9f35f16",
  "vastUrl": "https://prebid.adnxs.com/pbc/v1/cache?uuid=3a87aa93-b5f4-4fd1-b85b-8c40a9f35f16"
}
```

These parameters can be added to the Freewheel ad server configuration of for example JWPlayer:

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

The result of the custom Freewheel parameters can be treated like any Prebid Bid for FW. More on this here: https://docs.prebid.org/adops/setting-up-prebid-video-in-freewheel.html

