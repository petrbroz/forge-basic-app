# forge-basic-app

Sample application showing the basic usage of [Autodesk Forge](https://forge.autodesk.com).

## Getting Started

- clone this repository
- install dependencies: `npm install` or `yarn install`
- setup environment variables
  - on macOS/linux:
    ```
    export FORGE_CLIENT_ID=<your client id>
    export FORGE_CLIENT_SECRET=<your client secret>
    ```
  - on Windows:
    ```
    set FORGE_CLIENT_ID=<your client id>
    set FORGE_CLIENT_SECRET=<your client secret>
    ```
- run the server: `node server.js`
- go to `http://localhost:<your port>`, and provide the URN of one of your Forge models
as a `urn` query parameter, for example:

http://localhost:3000?urn=dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cGV0cmJyb3otc2FtcGxlcy9yYWNfYmFzaWNfc2FtcGxlX3Byb2plY3QucnZ0.

If you're using [Visual Studio Code](https://code.visualstudio.com),
you can setup a launch task with all env. variables preconfigured:

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Local Server",
            "program": "${workspaceFolder}/server.js",
            "env": {
                "FORGE_CLIENT_ID": "<your client id>",
                "FORGE_CLIENT_SECRET": "<your client secret>"
            }
        }
    ]
}
```

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
