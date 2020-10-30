window.addEventListener('DOMContentLoaded', async function() {
    const viewer = await initViewer();
    const params = new URLSearchParams(window.location.search);
    if (params.has('urn')) {
        loadModel(viewer, params.get(urn));
    } else {
        document.body.innerHTML = 'Provide a URN of a Forge model as a query parameter <code>urn</code>.';
    }
});

async function initViewer() {
    const options = {
        getAccessToken: async function (callback) {
            const resp = await fetch('/api/auth/token');
            if (resp.ok) {
                const token = await resp.json();
                callback(token.access_token, token.expires_in);
            } else {
                throw new Error(await resp.text());
            }
        }
    };
    return new Promise(function (resolve, reject) {
        Autodesk.Viewing.Initializer(options, function () {
            const config = {
                extensions: ['GyroscopeExtension']
            };
            const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('preview'), config);
            viewer.start();
            resolve(viewer);
        });
    });
}

async function loadModel(viewer, urn) {
    return new Promise(function (resolve, reject) {
        function onDocumentLoadSuccess(doc) {
            viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
            resolve();
        }
        function onDocumentLoadFailure(code, message) {
            reject(message);
        }
        Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
    });
}
