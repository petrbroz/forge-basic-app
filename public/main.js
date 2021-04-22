/// import * as Autodesk from "@types/forge-viewer";

Autodesk.Viewing.Initializer({ getAccessToken }, async function () {
    const resp = await fetch('/api/models');
    if (resp.ok) {
        const models = await resp.json();
        for (let i = 0; i < models.length && i < 4; i++) {
            const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById(`preview-${i + 1}`));
            viewer.start();
            viewer.setTheme('light-theme');
            loadModel(viewer, models[i].urn);
        }
    } else {
        alert('Could not list models. See the console for more details.');
        console.error(await resp.text());
    }
});

/**
 * Retrieves access token required for viewing models.
 * @async
 * @param {function} callback Callback function to be called with access token and expiration time (in seconds).
 */
async function getAccessToken(callback) {
    const resp = await fetch('/api/auth/token');
    if (resp.ok) {
        const { access_token, expires_in } = await resp.json();
        callback(access_token, expires_in);
    } else {
        alert('Could not obtain access token. See the console for more details.');
        console.error(await resp.text());
    }
}

/**
 * Loads specific model into the viewer.
 * @param {Autodesk.Viewing.GuiViewer3D} viewer Instance of the viewer to load the model into.
 * @param {string} urn URN (base64-encoded object ID) of the model to be loaded.
 */
function loadModel(viewer, urn) {
    function onDocumentLoadSuccess(doc) {
        viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
    }
    function onDocumentLoadFailure(code, message) {
        alert('Could not load model. See the console for more details.');
        console.error(message);
    }
    Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
}
