window.addEventListener('DOMContentLoaded', async function() {
    const viewer = await initViewer();
    const models = await initModelDropdown();
    models.addEventListener('change', function () {
        window.location.hash = models.value;
        loadModel(viewer, models.value);
    });
    if (window.location.hash) {
        models.value = window.location.hash.substr(1);
    }
    if (models.value) {
        loadModel(viewer, models.value);
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
                alert('Could not obtain access token. See the console for more details.');
                console.error(await resp.text());
            }
        }
    };
    return new Promise(function (resolve, reject) {
        Autodesk.Viewing.Initializer(options, function () {
            const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('preview'));
            viewer.start();
            viewer.setTheme('light-theme');
            resolve(viewer);
        });
    });
}

async function initModelDropdown() {
    const models = document.getElementById('models');
    models.setAttribute('disabled', 'true');
    models.innerHTML = '';
    const resp = await fetch('/api/models');
    if (resp.ok) {
        const documents = await resp.json();
        for (const doc of documents) {
            const option = document.createElement('option');
            option.innerText = doc.name;
            option.setAttribute('value', doc.id);
            models.appendChild(option);
        }
    } else {
        alert('Could not list models. See the console for more details.');
        console.error(await resp.text());
    }
    models.removeAttribute('disabled');
    return models;
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
