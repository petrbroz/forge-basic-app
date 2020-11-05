# forge-basic-app

Sample application showing the basic usage of [Autodesk Forge](https://forge.autodesk.com).

![Screenshot](./screenshot.png)

## Development

### Prerequisites

- [Register a Forge application](https://forge.autodesk.com/en/docs/oauth/v2/tutorials/create-app)
- [Node.js](https://nodejs.org) (we recommend the Long Term Support version)
- Terminal (for example, [Windows Command Prompt](https://en.wikipedia.org/wiki/Cmd.exe)
or [macOS Terminal](https://support.apple.com/guide/terminal/welcome/mac))
- Push notification ([VAPID](https://tools.ietf.org/id/draft-ietf-webpush-vapid-03.html)) keys

> If you don't have any push notification keys, you can generate them using the _web-push_ Node.js module used in this code.
> After installing all the dependencies below (using `npm install`), just run the following command in the terminal:
> `./node_modules/.bin/web-push generate-vapid-keys`

### Setup & Run

- Clone the repository
- Install dependencies: `npm install`
- Setup environment variables:
  - `FORGE_CLIENT_ID` - your Forge application client ID
  - `FORGE_CLIENT_SECRET` - your Forge application client secret
  - `FORGE_BUCKET` (optional) - name of Forge bucket to store your designs
  - `VAPID_PUBLIC_KEY` - public VAPID key
  - `VAPID_PRIVATE_KEY` - private VAPID key
  - `VAPID_SUBJECT` - contact info for VAPID keys, must be a URL starting with `http:`, `https:`, or `mailto:`
- Run the server: `npm start`

> When using [Visual Studio Code](https://code.visualstudio.com),
you can specify the env. variables listed above in a _.env_ file in this
folder, and run & debug the application directly from the editor.

## Troubleshooting

- Service workers and related standards (e.g., Push APIs) not working
  - Make sure you are serving the web app via _https_, not _http_