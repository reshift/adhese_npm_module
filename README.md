# npm_module
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

  let adheseConfig = {
    account: 'demo',
    cacheUrl: 'https://my_prebid_cache_server.net/cache',
    slot: 'example_video_slot'
  };
  let adheseProps = await getAdheseAds(adheseConfig);
  //add the returned props to path.to.your.advertising.config.freewheel.custom
  myFreewheelConfig = Object.assign(myFreewheelConfig, adheseProps);
  return { props: {myFreewheelConfig} }

}
```

The result of the custom Freewheel parameters can be treated like any Prebid Bid for FW. More on this here: https://docs.prebid.org/adops/setting-up-prebid-video-in-freewheel.html