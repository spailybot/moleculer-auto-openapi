<div align="center">

[![Moleculer logo](http://moleculer.services/images/banner.png)](https://github.com/moleculerjs/moleculer)
<h2>moleculer-auto-openapi</h2>

<p align="center">
<img src="https://img.shields.io/badge/Moleculer-3CAFCE.svg?style=flat-square&logo=Moleculer&logoColor=white" alt="Moleculer" />
<img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat-square&logo=TypeScript&logoColor=white" alt="TypeScript" />
<a href="https://www.typescriptlang.org/tsconfig#strict"><img src="https://img.shields.io/badge/TypeScript-Strict%20Mode-blue" alt="TypeScript Strict Mode"></a>
</p>
<img src="https://img.shields.io/npm/dw/%40spailybot%2Fmoleculer-auto-openapi" alt="GitHub license" />
<img src="https://img.shields.io/github/license/spailybot/moleculer-auto-openapi?style=flat-square&color=5D6D7E" alt="GitHub license" />
<a href="https://github.com/spailybot/moleculer-auto-openapi/graphs/contributors"><img src="https://img.shields.io/github/contributors/spailybot/moleculer-auto-openapi" alt="contributors" /></a>
<img src="https://img.shields.io/github/languages/top/spailybot/moleculer-auto-openapi?style=flat-square&color=5D6D7E" alt="GitHub top language" />
<a href="https://snyk.io/test/github/spailybot/moleculer-auto-openapi"><img alt="Known Vulnerabilities" src="https://snyk.io/test/github/spailybot/moleculer-auto-openapi/badge.svg" /></a>
<a href="https://www.npmjs.com/package/@spailybot/moleculer-auto-openapi"><img alt="npm package Vulnerabilities" src="https://img.shields.io/npm/v/@spailybot/moleculer-auto-openapi.svg" /></a>
<a href="https://github.com/spailybot/moleculer-auto-openapi/actions/workflows/CI.yml"><img src="https://github.com/spailybot/moleculer-auto-openapi/actions/workflows/CI.yml/badge.svg" alt="CI"></a>
<a href="https://bundlephobia.com/package/@spailybot/moleculer-auto-openapi"><img src="https://badgen.net/bundlephobia/tree-shaking/@spailybot/moleculer-auto-openapi" alt="tree shaking supported"></a>
<img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/min/%40spailybot/moleculer-auto-openapi">
<a href="https://github.com/spailybot/moleculer-auto-openapi/stargazers/"><img src="https://img.shields.io/github/stars/spailybot/moleculer-auto-openapi.svg?style=social&label=Star" alt="GitHub stars"></a>
<img src="https://img.shields.io/badge/module%20type-cjs%2Besm%2Btypes-brightgreen" alt="Module type: CJS+ESM+Types" />


</div>

---

>**Why Use OpenAPI:**
>
> OpenAPI standardizes and documents RESTful APIs, streamlines development, improves team communication, and automates testing. Moreover, it can be used to generate client SDKs. It allows for a focus on business logic, making it a valuable tool in a microservices environment.


This project is a fork of [moleculer-auto-openapi](https://github.com/grinat/moleculer-auto-openapi) by [grinat](https://github.com/grinat).

Big thanks to [grinat](https://github.com/grinat) for the original work, and also to [everyone who has contributed](https://github.com/grinat/moleculer-auto-openapi/graphs/contributors) to it!


## 🌟 Features

- Supports multiple Moleculer-Web servers, allowing API separation
- `Fastest-Validator` support for direct OpenAPI generation from parameters, complete with examples
- OpenAPI 3.1 compatibility
- Cached OpenAPI with efficient regeneration when needed
- Granular and reusable configuration
- TypeScript exports of mixin settings and OpenAPI parameters
- Get your first openapi in less a minute

## 🚀 Getting Started

### 📦 Prerequisites

To use this library, you must have the [Moleculer](https://github.com/moleculerjs/moleculer) framework installed along with the [Moleculer-Web](https://github.com/moleculerjs/moleculer-web) module. Additionally, the `listAliases` action must be available (which is the default setting).

### 🔧 Installation

Install the package using your preferred package manager:
```
npm install @spailybot/moleculer-auto-openapi
```

#### Optional

If you wish to use a local instance of Swagger UI, install it like this:
```
npm install swagger-ui-dist@^5
```

For the full TypeScript autocompletion experience, install the `openapi-types` package in addition to the above:
```
npm install --save-dev openapi-types
```

---

### 📁 Setting Up Your Service

> **Note:** The following examples use the ESM syntax.
>
> Depending on your environment and requirements, you may need to adapt these examples, possibly to the CommonJS (CJS) syntax, or to your specific coding standard.

<br>

#### Create an OpenApi service

<details open>
    <summary>Typescript</summary>

```typescript
import { OpenApiMixin, type OpenApiMixinSettings, type MoleculerWebTypes } from '@spailybot/moleculer-auto-openapi';
import { Service, type ServiceBroker } from 'moleculer';

/**
 * MoleculerWebTypes are typings created from moleculer-web to enhance included typings; their use is totally optional.
 */

export default class OpenApiService extends Service<OpenApiMixinSettings & MoleculerWebTypes.RestServiceSettings> {
    public constructor(public broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            // Choose your preferred name
            name: 'openapi',
            mixins: [mixin],
            settings: {
                // Set the path as you prefer
                rest: '/openapi',

                // will set
                // - ui at /openapi/ui
                // - json at /openapi/openapi.json
                // - assets at /openapi/assets/*
                // - oauth2redirection at /openapi/oauth2-redirect
                openApiPaths: "/openapi",
                // you cal also do it manually
                /**
                 openApiPaths: {
                 schemaPath: "/openapi/openapi.json"
                 uiPath: "/openapi/ui"
                 oauth2RedirectPath: "/openapi/oauth2-redirect"
                 assetsPath: "/openapi/assets"
                 }
                 */

                // This will be the root of your document
                // use it to define some default informations
                openapi: {
                    info: {
                        title: "My API",
                        version: "0.0.1"
                    }
                }
            }
        });
    }
}
```
<details>
<summary>Typescript without using class</summary>

```typescript
import { OpenApiMixin, type OpenApiMixinSettings, type MoleculerWebTypes } from '@spailybot/moleculer-auto-openapi';
import { Service, type ServiceBroker } from 'moleculer';

const OpenApiService: ServiceSchema<OpenApiMixinSettings & MoleculerWebTypes.RestServiceSettings> = {
    // Choose your preferred name
    name: 'openapi',
    mixins: [mixin],
    settings: {
        // Set the path as you prefer
        rest: '/openapi',

        // will set
        // - ui at /openapi/ui
        // - json at /openapi/openapi.json
        // - assets at /openapi/assets/*
        // - oauth2redirection at /openapi/oauth2-redirect
        openApiPaths: "/openapi",
        // you cal also do it manually
        /**
         openApiPaths: {
         schemaPath: "/openapi/openapi.json"
         uiPath: "/openapi/ui"
         oauth2RedirectPath: "/openapi/oauth2-redirect"
         assetsPath: "/openapi/assets"
         }
         */

        // This will be the root of your document
        // use it to define some default informations
        openapi: {
            info: {
                title: "My API",
                version: "0.0.1"
            }
        }
    }
};
export default OpenApiService;
```
</details>

</details>
<details>
    <summary>Javascript</summary>

```javascript
import { OpenApiMixin } from '@spailybot/moleculer-auto-openapi';
import { Service } from 'moleculer';

export default class OpenApiService extends Service {
    public constructor(broker) {
        super(broker);

        this.parseServiceSchema({
            // Choose your preferred name
            name: 'openapi',
            mixins: [OpenApiMixin],
            settings: {
                // Set the path as you prefer
                rest: '/openapi',

                // will set
                // - ui at /openapi/ui
                // - json at /openapi/openapi.json
                // - assets at /openapi/assets/*
                // - oauth2redirection at /openapi/oauth2-redirect
                openApiPaths: "/openapi",
                // you cal also do it manually
                /**
                openApiPaths: {
                    schemaPath: "/openapi/openapi.json"
                    uiPath: "/openapi/ui"
                    oauth2RedirectPath: "/openapi/oauth2-redirect"
                    assetsPath: "/openapi/assets"
                }
                */

                // This will be the root of your document
                // use it to define some default informations
                openapi: {
                    info: {
                        title: "My API",
                        version: "0.0.1"
                    }
                }
            }
        });
    }
}
```
<details>
    <summary>Javascript without using class</summary>

````javascript
import { OpenApiMixin } from '@spailybot/moleculer-auto-openapi';

const OpenApiService = {
  // Choose your preferred name
  name: 'openapi',
  mixins: [OpenApiMixin],
  settings: {
        // Set the path as you prefer
        rest: '/openapi',

        // will set
        // - ui at /openapi/ui
        // - json at /openapi/openapi.json
        // - assets at /openapi/assets/*
        // - oauth2redirection at /openapi/oauth2-redirect
        openApiPaths: "/openapi",
        // you cal also do it manually
        /**
         openApiPaths: {
         schemaPath: "/openapi/openapi.json"
         uiPath: "/openapi/ui"
         oauth2RedirectPath: "/openapi/oauth2-redirect"
         assetsPath: "/openapi/assets"
         }
         */

        // This will be the root of your document
        // use it to define some default informations
        openapi: {
            info: {
                title: "My API",
                version: "0.0.1"
            }
        }
}
};
export default OpenApiService;
````
</details>
<details>
    <summary>Javascript using CJS</summary>

````javascript
const OpenApiMixin = require('@spailybot/moleculer-auto-openapi');
// or
// const { OpenApiMixin } = require('@spailybot/moleculer-auto-openapi');

module.exports = {
    // Choose your preferred name
    name: "openapi",
    mixins: [OpenApiMixin],
    settings: {
        // Set the path as you prefer
        rest: '/openapi',

        // will set
        // - ui at /openapi/ui
        // - json at /openapi/openapi.json
        // - assets at /openapi/assets/*
        // - oauth2redirection at /openapi/oauth2-redirect
        openApiPaths: "/openapi",
        // you cal also do it manually
        /**
         openApiPaths: {
         schemaPath: "/openapi/openapi.json"
         uiPath: "/openapi/ui"
         oauth2RedirectPath: "/openapi/oauth2-redirect"
         assetsPath: "/openapi/assets"
         }
         */

        // This will be the root of your document
        // use it to define some default informations
        openapi: {
            info: {
                title: "My API",
                version: "0.0.1"
            }
        }
    }
};

````
</details>
</details>

You can find detailed information about all the settings of the mixin in the [technical documentation](https://spailybot.github.io/moleculer-auto-openapi/types/index.OpenApiMixinSettings.html).

#### Update your moleculer-web service

<details open>
    <summary>Typescript</summary>

```typescript
import type { ApiSettingsSchemaOpenApi } from '@spailybot/moleculer-auto-openapi';
import ApiGateway from "moleculer-web";
import { Service, type ServiceBroker } from 'moleculer';

/**
 * Note that ApiSettingsSchemaOpenApi is a re-export of ApiSettingsSchema because moleculer-web doesn't allow to extend it.
 */

export default class WebApiService extends Service<ApiSettingsSchemaOpenApi> {
    public constructor(public broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: "api",
            mixins: [mixin],
            settings: {
                // Place other settings here
                openapi: {
                    // Define an OpenAPI specification that will be applied to all routes of this api
                },
                routes: [
                    // Place additional route configurations here
                    {
                        openapi: {
                            // Define an OpenAPI specification that will apply to all aliases within this route
                        },
                        path: '/openapi',
                        aliases: {
                            'GET /openapi.json': 'openapi.generateDocs',
                            'GET /ui': 'openapi.ui',
                            'GET /assets/:file': 'openapi.assets',
                            'GET /oauth2-redirect': 'openapi.oauth2Redirect',
                        },
                    },
                    // To use autoAliases, refer to the following configuration
                    // {
                    //     path: '/openapi',
                    //     whitelist: ['openapi.*'],
                    //     autoAliases: true
                    // }

                ]
                // Insert other settings here
            }
        });
    }
}
```
</details>
<details>
    <summary>Javascript</summary>

```javascript
import ApiGateway from "moleculer-web";
import { Service } from 'moleculer';

export default class WebApiService extends Service {
    public constructor(broker) {
        super(broker);

        this.parseServiceSchema({
            name: "api",
            mixins: [mixin],
            settings: {
                // Place other settings here
                openapi: {
                    // Define an OpenAPI specification that will be applied to all routes of this api
                },
                routes: [
                    // Place additional route configurations here
                    {
                        openapi: {
                            // Define an OpenAPI specification that will apply to all aliases within this route
                        },
                        path: '/openapi',
                        aliases: {
                            'GET /openapi.json': 'openapi.generateDocs',
                            'GET /ui': 'openapi.ui',
                            'GET /assets/:file': 'openapi.assets',
                            'GET /oauth2-redirect': 'openapi.oauth2Redirect',
                        },
                    },
                    // To use autoAliases, refer to the following configuration
                    // {
                    //     path: '/openapi',
                    //     whitelist: ['openapi.*'],
                    //     autoAliases: true
                    // }

                ]
                // Insert other settings here
            }
        });
    }
}
```
</details>

#### Launch Your Project

Your setup is now complete.

To view your API documentation via Swagger UI, you can navigate to `http://127.0.0.1/openapi/ui` in your web browser (adjust the URL according to your configuration).

#### What's Next?

With your project now up and running, there are several resources available to help you develop further:

1. **Examples:** Check out the examples in the [examples](https://github.com/spailybot/moleculer-auto-openapi/tree/main/examples) folder. These provide practical code snippets and usage scenarios that can help you understand how to leverage this tool in various situations.
2. **Wiki:** Visit our [Wiki](https://github.com/spailybot/moleculer-auto-openapi/wiki) for a comprehensive guide on different features, advanced topics, and best practices.
3. **FAQs:** The [Frequently Asked Questions](https://github.com/spailybot/moleculer-auto-openapi/wiki/FAQ) section can provide quick answers to common queries and issues others have encountered.

Remember, the journey of mastering any tool involves experimentation, learning from examples, reading documentation, and continuous practice. Happy coding!

### 📝 TODO

- $$oa
  - allow to define a ref, and use the ref instead of creating a new one
  - allow to define a "to ref", and create the ref with this name
  - allow to define examples
- investigate the needs of requestBodyAndResponseBodyAreSameOnMethods / requestBodyAndResponseBodyAreSameDescription
- support multiple openapi version on generator ? (will need converters)

### ⚠️ Known Limitations
- Functions used directly in parameters (e.g., dynamic `default`) might not execute reliably or as expected, and will be called without arguments.

## 📄 License

This project is protected under the [MIT](https://choosealicense.com/licenses/mit/) License. For more details, refer to the [LICENSE](https://github.com/spailybot/moleculer-auto-openapi/blob/main/LICENSE) file.
