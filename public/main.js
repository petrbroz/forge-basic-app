/** @type {Autodesk.Viewing.GuiViewer3D} */
let thumbnailViewer;

Autodesk.Viewing.Initializer({ getAccessToken }, async function () {
    const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('preview'));
    viewer.start();
    viewer.setTheme('light-theme');

    thumbnailViewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('thumbnail-viewer'));
    thumbnailViewer.start();
    thumbnailViewer.setTheme('light-theme');

    const urn = window.location.hash ? window.location.hash.substr(1) : null;
    setupModelSelection(viewer, urn);

    document.getElementById('take-screenshot').addEventListener('click', async function () {
        const ids = viewer.getSelection();
        const blob = await takeScreenshot(window.location.hash.substr(1), ids);
        window.open(blob, '_blank');
    });
});

function takeScreenshot(urn, ids) {
    return new Promise(function (resolve, reject) {
        function onDocumentLoadSuccess(doc) {
            thumbnailViewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry(), { ids });
            thumbnailViewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function () {
                thumbnailViewer.fitToView(ids, null, true);
                thumbnailViewer.getScreenShot(400, 400, blob => {
                    resolve(blob);
                });
            });
        }
        function onDocumentLoadError(err) {
            reject(err);
        }
        Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadError);
    });
}

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
 * Initializes model selection UI. Can be called repeatedly to refresh the selection.
 * @async
 * @param {GuiViewer3D} viewer Forge Viewer instance.
 * @param {string} [selectedUrn] Optional model URN to mark as selected.
 */
async function setupModelSelection(viewer, selectedUrn) {
    const models = document.getElementById('models');
    models.setAttribute('disabled', 'true');
    models.innerHTML = '';
    const resp = await fetch('/api/models');
    if (resp.ok) {
        for (const model of await resp.json()) {
            const option = document.createElement('option');
            option.innerText = model.name;
            option.setAttribute('value', model.urn);
            if (model.urn === selectedUrn) {
                option.setAttribute('selected', 'true');
            }
            models.appendChild(option);
        }
    } else {
        alert('Could not list models. See the console for more details.');
        console.error(await resp.text());
    }
    models.removeAttribute('disabled');
    models.onchange = () => loadModel(viewer, models.value);
    if (!viewer.model && models.value) {
        loadModel(viewer, models.value);
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
    window.location.hash = urn;
    Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
}
