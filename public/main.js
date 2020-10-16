window.addEventListener('DOMContentLoaded', async function() {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('urn') || !params.get('guid')) {
        document.body.innerHTML = 'Provide the <em>urn</em> and <em>guid</em> of your design as URL parameters.';
        return;
    }

    const viewer = await initViewer();
    await loadModel(viewer, params.get('urn'), params.get('guid'));

    // Load custom markup code *after* the viewer (with the Markup extension) is initialized
    const script = document.createElement('script');
    script.setAttribute('src', '/smiley-markup.js');
    document.body.appendChild(script);
    document.getElementById('draw-smiley').addEventListener('click', async function () {
        const markupExt = viewer.getExtension('Autodesk.Viewing.MarkupsCore');
        markupExt.show();
        markupExt.enterEditMode();
        markupExt.changeEditMode(new EditModeSmiley(markupExt));
    });
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
                extensions: ['Autodesk.Viewing.MarkupsCore', 'Autodesk.Viewing.MarkupsGui']
            };
            const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('preview'), config);
            viewer.start();
            resolve(viewer);
        });
    });
}

async function loadModel(viewer, urn, guid) {
    return new Promise(function (resolve, reject) {
        function onDocumentLoadSuccess(doc) {
            viewer.loadDocumentNode(doc, doc.getRoot().findByGuid(guid));
            resolve();
        }
        function onDocumentLoadFailure(code, message) {
            console.error('Could not load document.', message); // TODO: handle situations when the model is not yet translated
            reject(message);
        }
        Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
    });
}
