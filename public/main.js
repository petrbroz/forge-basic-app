/// import * as Autodesk from "@types/forge-viewer";

const options = {
    env: 'MD20ProdUS',
    api: 'D3S',
    getAccessToken
};

// Override `PropDbLoader#load` so that the svf1/svf2 dbid mapping is always loaded.
const _load = Autodesk.Viewing.Private.PropDbLoader.prototype.load;
Autodesk.Viewing.Private.PropDbLoader.prototype.load = function (result) {
    this.needsDbIdRemap = true;
    _load.call(this, result);
}

// Override `PropDbLoader#processLoadResult` so that the dbid mapping is stored within all models (by default it is only stored in 2D models).
const _processLoadResult = Autodesk.Viewing.Private.PropDbLoader.prototype.processLoadResult;
Autodesk.Viewing.Private.PropDbLoader.prototype.processLoadResult = function (result) {
    _processLoadResult.call(this, result);
    this.model.idRemap = result.dbidOldToNew;
}

Autodesk.Viewing.Initializer(options, async function () {
    // Get the input model from the query parameter "urn"
    const params = new URLSearchParams(window.location.search);
    const urn = params.get('urn');
    if (!urn) {
        alert('Missing query parameter: "urn"');
        return;
    }

    const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('preview'));
    viewer.start();
    loadModel(viewer, urn);
    viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function (ev) {
        const selected = viewer.getSelection();
        if (selected.length === 1) {
            const dbid = selected[0];
            console.log('New dbid of the selected object is', dbid);
            const oldDbID = viewer.model.reverseMapDbId(dbid);
            console.log('Old dbid of the selected object is', oldDbID);
            const newDbID = viewer.model.remapDbId(oldDbID);
            console.log('Old dbid mapped to new dbid is', newDbID);
        }
    });
});

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
