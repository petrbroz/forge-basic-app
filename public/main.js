DEBUG_SHADERS = true;

window.addEventListener('DOMContentLoaded', async function() {
    const [viewer, ...rest] = await Promise.all([initViewer(), initSelectUI(), initUploadUI()]);
    const designs = document.getElementById('designs');
    designs.addEventListener('change', function () {
        loadModel(viewer, designs.value);
    });
    loadModel(viewer, designs.value);
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
                extensions: ['HeatmapExtension']
            };
            const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('preview'), config);
            viewer.start(undefined, undefined, undefined, undefined, {
                webglInitParams: {
                    useWebGL2: false
                }
            });
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
            console.error('Could not load document.', message); // TODO: handle situations when the model is not yet translated
            reject(message);
        }
        Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
    });
}

async function initSelectUI() {
    const designs = document.getElementById('designs');
    designs.setAttribute('disabled', 'true');
    designs.innerHTML = '';
    const resp = await fetch('/api/models');
    if (resp.ok) {
        const documents = await resp.json();
        for (const doc of documents) {
            const option = document.createElement('option');
            option.innerText = doc.name;
            option.setAttribute('value', doc.id);
            designs.appendChild(option);
        }
    } else {
        console.error(await resp.text());
    }
    designs.removeAttribute('disabled');
}

async function initUploadUI() {
    const input = document.getElementById('input');
    const btn = document.getElementById('upload');
    btn.addEventListener('click', async function () {
        if (input.files.length > 0) {
            const file = input.files[0];
            let data = new FormData();
            data.append('file', file);
            if (file.name.endsWith('.zip')) {
                const entrypoint = window.prompt('Please enter the name of the entry filename inside the ZIP archive.');
                data.append('entrypoint-in-zip', entrypoint);
            }
            const resp = await fetch('/api/models', { method: 'POST', body: data });
            if (resp.ok) {
                initSelectUI();
            } else {
                console.error(await resp.text());
            }
        }
    });
}
