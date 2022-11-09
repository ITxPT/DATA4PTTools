## v0.4.3 [2022-11-09]

### Release notes
This update includes bug fixes and performance improvements.

### Bug Fixes
- Disable next telemetry collection ([0fabd48](../../commit/0fabd482bfe158d6dd0b3f9359f94c1429032041))
- Fixed load state on validation ([8f390c4](../../commit/8f390c4573f25f121a1430e8843e31f47aae35e0))
- Fixed js api typing ([e9c3844](../../commit/e9c3844d53129860a8cea72c85e4a325b0321a57))
- [[#48](../../issues/48)][[#51](../../issues/51)][[#52](../../issues/52)] Add missing return result ([ba2ac4e](../../commits/ba2ac4e1075bd770967c055666445a4349b1a84f), [4c940f8](../../commits/4c940f84b03d0304dab947f6d5d6638e7efbeb87), [3085395](../../commits/3085395226da47bc5c7e6f07fca8783c6a7df1ef))


### Performance
- Optimize docker build size ([6458b98](../../commit/6458b98d490382d5f95c4e57286f7656fad113d1))


## v0.4.2 [2022-09-12]

### Notable changes
- Rewritten JS API ([docs/definition](https://github.com/ITxPT/DATA4PTTools/blob/feature/lifecycle/builtin/index.d.ts))
  - Extended standard library with ability to query multiple files, added error types and predefined xpath paths for ease of use
  - Extended node API with shorthand methods for properties, attributes and values as well as added feature for method chaining
- Added support for script configuration (e.g. setting max distance between two stops)
- Added support for different NeTEx schema versions (1.01, 1.02, 1.03 and 1.2)
  - **known issue:** Legacy NeTEx versions is seemingly incompatible with _libxml2_ (or in general?)
- Replaced large part of the validation lifecycle with a event emitter, giving the user control of which information is consumed
- Squashed a bunch of bugs related to performance, validation result, memory security & errors

### Features
- [[#23](../../issues/23)] Remove telemetry collection ([3d9766e](../../commits/3d9766e3908c7b781537ec28e8550241aae2139b))
- Complete rewrite of js api ([ced019f](../../commit/ced019f66532d15b5a2f69f221cf81071c6bfffa))
- Add internal api ([e570fbd](../../commit/e570fbd8c63b5b779041d5f944d8a75dbdcf27b9))
- Add favicon ([5eec76e](../../commit/5eec76e541952ca644c629aa06b5ccb10c9e804b))
- Add more event types ([e7fe0cc](../../commit/e7fe0cc4be182881cc6e3d73a016ee5e25082922))
- Add cli only docker build ([e49cae9](../../commit/e49cae9c38dff96eb7a2953dddd6eaa60a22e88d))


### Bug Fixes
- Fix memory issue using setcontextnode ([79ba707](../../commit/79ba707782f3db62aaf28dfc85ae3a81332ce81b))
- Fix slow queries and type of response objects ([fa2439f](../../commit/fa2439ff91be3ad2e4e743d96d67a352ac36758b))


### Refactor
- Implmement new js api ([88cd811](../../commit/88cd8114bec1a18951adf1638145783de2bba4a6))
- Move cli-only relevant code to cmd and cleanup from js api ([51ee654](../../commit/51ee654cbeea2b166172d2dc0fa801209b535724))
- Minor refactor from prev api changes ([070e2b7](../../commit/070e2b7bad9c029780c5c9b48782482f1d3bc1ee))
- Add more types and update response struct ([2b54785](../../commit/2b547854234c276b39e9d367d777007984a39608))
- Update cli to new api ([8877b56](../../commit/8877b5620bd75301730e3f80980cd4455d437ca7))
- Update configuration and output ([c50afd0](../../commit/c50afd0ead9c02808e8691f5c12f846019e0250d))
- Remove unused code ([ec1999b](../../commit/ec1999b3a326307d8c87dfeac6bca32ab27a5b3c))


### Chore
- [[#22](../../issues/22)] Update dependencies ([fb4bfa2](../../commits/fb4bfa26e10b146632da70cc14f542fd69babaf3))
- Add diff netex versions ([85d6da9](../../commit/85d6da92eef4f6da5fd306e87e3ce48566ebcf40))
- Version xsd schemas ([d70f5ea](../../commit/d70f5eacfbd0378cdd8370cbe7a64822ff905d01))
- Clean up deps ([4769148](../../commit/4769148c3b19e00766158dd81b4db57f4db6c765))
- Fix build warnings ([ef45a4d](../../commit/ef45a4d01356b543fe709ea48a258c4832669490))
- Update dependencies ([012d283](../../commit/012d283277d7d0a56b2de59efd836018bc0b8b88))
- Update readme ([4e99a09](../../commit/4e99a09e0ee68454fcc1481864d3d4a72201ffcd))


## v0.3.4 [2022-05-30]

### Chore
- Update license and texts ([507890d](../../commit/507890d9fdf2211570cd637f297043b940b81c2f))
- Update rule texts ([a3a4462](../../commit/a3a44628c68cf7aaca4bd52fa494085ae39cbc14))
- Add note about limitations ([9175549](../../commit/917554959b42672b89fc8c6c04721683cc185bc4))


### Refactor
- Replace logger, update config and implement require model ([f3d1c54](../../commit/f3d1c54bbb4585d4dfd9a9a7b99dd9f0576400c9))
- Move file upload in prep for custom xsd ([51768ea](../../commit/51768ea60e9ad72bb0a7ecce62f12d883fdbad09))


### Features
- New rules and some cleanup ([1d496a4](../../commit/1d496a4fb6124bc6f742d5e1661a60af0b3147b1))
- Add additional rules to web gui ([ba98fdd](../../commit/ba98fdd686708408d09705ff2b23faa31a5ba4f3))

## v0.3.3 [2022-05-09]


### Features
- Add survey link to info alert ([0565fdf](../../commit/0565fdfc87edb722fe9ff61645a13550c1d2d44e))
- Add rule configuration ([80d9563](../../commit/80d95630d2c7c03df096f29d026858873e980dce))
- Add subsequent validation callback ([eb2c8da](../../commit/eb2c8daeee5f0b26058a9b4c732929a5aea49b46))
- Add docker callback in result ([67971c0](../../commit/67971c0799cec98fbe3e4d3bbd9c818b7da4c1e9))
- Add a text section about rules in config ([4324780](../../commit/4324780c92f14ed01dc5d203ade9aa6128510552))


### Bug Fixes
- Handle nextjs parameterized paths ([a2d57dc](../../commit/a2d57dcfb6536ed720df2da334adf7e3ec4cec44))


### Documentation
- Update readme ([38d5014](../../commit/38d5014b9a9000409061ed4938b93c8b332063b4))


### Chore
- Update xsd links ([2312ffc](../../commit/2312ffc96a2ba362c1547825d645a8817331437e))
- Remove confusing version ref ([d24ca41](../../commit/d24ca41dbd3c3dfea0dbd0676e54d0e754946505))


### Refactor
- Move static dir ([717e246](../../commit/717e2462210eec5ab20ec715bf83cc3f0847cf44))


## v0.3.1 [2022-04-10]

### Bug Fixes
- Handle ws ssl ([93281fc](../../commit/93281fcc792c2bc3203c6ebc54013c322bbafb0b))


## v0.3 [2022-04-10]

### Features
- Basic frontend to recv mqtt ([c813ac1](../../commit/c813ac12917352e9537cac00dd5dc3c7ccc3082a))
- Add mqtt broker fork ([3db8d00](../../commit/3db8d00d77d132ca7b96ee0e6e3dc8666fd9766c))
- Add mqtt broker ([e1619c7](../../commit/e1619c7b776555653814c797da8df3d2b5354bb8))
- Publish progress over mqtt ([32850b0](../../commit/32850b08fe288b0ef1e6d4db8419b34561cacca6))
- Remove old design ([b97ce2f](../../commit/b97ce2fe69ac893c8a293ba66d6fdb9b412b2723))
- Remove redundant terminal gui ([ca94127](../../commit/ca94127d1208eb117e7cae0638aaf72cea379be3))
- Add cap support and timings to concurrency ([2da0fcb](../../commit/2da0fcbaa788f820cf539175e58fc02a383fad24))
- Proxy mqtt and add report download ([ac93052](../../commit/ac930521b2c57b1e9ae7b0ebfff42ec2f5be6c5d))
- Re-enable a couple of rules ([7fe00cb](../../commit/7fe00cbf31f1c346d3c9eb20b920c0c4bb24eaa6))
- Copy, styling, report download and fixed ([7de8463](../../commit/7de8463296f05a708591c50502dedf34311ac4ac))
- Add web app build stage ([8779e34](../../commit/8779e34910e400ece69017735d0d9894501a16f2))


### Bug Fixes
- [[#7](../../issues/7)] Fix readme link and dirname ([e0c4669](../../commits/e0c4669b8d4bd499869beafe6ea00ffb03a9055b))
- [[#6](../../issues/6)] Make sure error count match with returned messages ([6ebdde7](../../commits/6ebdde73e797b955bff5939ff6d3ce7e86ccd2b7))
- Disable rules until they have been resolved ([e8dd51f](../../commit/e8dd51f05bff70deaac6f4beafa8cf95ddf93b4c))
- Add a stateless approach to file loading ([14c7936](../../commit/14c7936dc9022d8de45dc9abaa903a00a47f8739))


### Refactor
- Remove gfx terminal output ([fb98484](../../commit/fb984841552ac0494321d02cf4ae1ebb16296422))
- Add json output to terminal ([0d2b261](../../commit/0d2b2615634e437ebd6c47c6c0b7898ec390bb1f))


### Performance
- Only render when needed ([3084eb2](../../commit/3084eb28f5aad3c55df29367c0552cfd5214df5f))


### Chore
- Add dependencies ([0d662de](../../commit/0d662dea6b61bac5c2d718998ca3a4c6f3b9ebba))
- Add dependencies ([2ba0623](../../commit/2ba0623d53919ec71dd9246beb00458b6ee02027))
- Add epip schema ([a05e4c6](../../commit/a05e4c6f673dfcc7249774adeb645ae4a5c74462))
- Update README ([c3db938](../../commit/c3db938c4f6cfdf9f69a53380f7dd34fc7082808))


## v0.2 [2022-02-24]

### Chore
- Update netex xsd ([278ec3b](../../commit/278ec3bb2d3e07f2bcf0bfe2cd379885926e1857))


### Bug Fixes
- [[#1](../../issues/1)][[#10](../../issues/10)] Improve file loading ([ed87520](../../ed875201a3f898fea5678132e15baa47f9b39a1d))
- [[#12](../../issues/12)] Handle concurrent map rw ([fab876c](../../commit/fab876ce290cc7070f5329b01caafca70fc43df1))
- [[#6](../../issues/6)][[#14](../../issues/14)] Handle dereferenced messages and increase error limit ([0f136d6](../../commit/0f136d6eb9daf057df7f30e74176b6178907b4d3))
- Add max errors by validation rule/file ([0e59cd8](../../commit/0e59cd8ae9f8ef7c1bd7f304b4b6c8c8b499cff9))
- [[#7](../../issues/7)] Fix readme link and dirname ([c1cfca5](../../commits/c1cfca50e7bb602ec1a7cc2190053dbbf5a3aa28))
- Disable rules until they have been resolved ([e8dd51f](../../commit/e8dd51f05bff70deaac6f4beafa8cf95ddf93b4c))
