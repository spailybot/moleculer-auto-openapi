This is an example project

It's currently in progress .

To start :
```
npm start
```

it will start an web UI on http://localhost:3000 (can change depending on your configuration)

Feel free to navigate on the openapi ui : http://localhost:3000/openapi/ui
and check the linked code


Here are some things you can see on this example :
 - `hidden.secret` is a hidden action that will not be included in the openapi (`openapi:false`) but available on moleculer-web : `curl --location "http://localhost:3000/hidden/secret?name=toto"`
 - `users.upload_avatar` is an example of stream upload
 - `pets.upload_image` is an example of multipart upload with params
 - `pets.update/get/list/create/delete` is an example of crud "manual"
 - `users.update/get/list/create/delete` is an example of crud "automatic" with `REST users`
 - `api` service hold the configuration with an authorization example based on the security needed by the openapi
 - `oauth2` server to show how the Oauth2 works on openapi
 - `admin` service endpoint are filtered if you don't add ?admin at the end of the openapi.json . To demonstrate how you can filter aliases depending on your conditions
 - `pets.group` allow to define a custom params validator `even` . The


## OAuth2 service
the OAuth2 service is the service that will handle the OAuth2.0 process .

It will also try to generate rsa keys to sign the JWS, with a public key to check the signature .
```mermaid
sequenceDiagram
    participant User as User
    participant Swagger_UI as Swagger UI
    participant OAuth_Service as oauth2.service
    participant A as api.service
    participant US as users.service

    User->>Swagger_UI: Click "Authorize"
    Swagger_UI->>OAuth_Service: open a tab to /authorize
    OAuth_Service->>OAuth_Service: Check Authorization
    OAuth_Service->>Swagger_UI: Redirect with an authorization_code
    Swagger_UI->>OAuth_Service: Call /token to exchange authorization_code with a JWS Access Token
    OAuth_Service->>Swagger_UI: Return Access Token

    Note over User,A: Possible future action
    User->>Swagger_UI: Request to GET /users/me
    Swagger_UI->>A: GET /users/me with token
    A->>A: Check if the token is authorized
    A->>US: call users.me
    US->>User: Return about the user
```


## Adding a custom validator

As described in fastest-validator, you can [add custom validator](https://github.com/icebob/fastest-validator?tab=readme-ov-file#custom-validator), also, moleculer allow to set [customRules to fastest-validator](https://moleculer.services/docs/0.14/validating.html#Fastest-Validator) (you can pass options, that can contains customRules) .

1. this example create a custom rules `even` in [moleculer.config.ts](./moleculer.config.ts)
2. create a custom mapper to handle `even` rule in [openapi.service.ts](./services/openapi.service.ts)
3. use the custom rule in [pets.service.ts](./services/pets.service.ts)
