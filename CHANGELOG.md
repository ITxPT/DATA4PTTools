## v0.3.2 [2022-05-09]


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
