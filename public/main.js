/// import * as Autodesk from "@types/forge-viewer";

Autodesk.Viewing.Initializer({ getAccessToken }, async function () {
    const container = document.getElementById('preview');
    const config = { extensions: ['Autodesk.DataVisualization'] };
    const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
    viewer.start();

    const params = new URLSearchParams(window.location.search);
    const urn = params.get('urn');
    const guid = params.get('guid');
    if (urn && guid) {
        loadModel(viewer, urn, guid);
        viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function (ev) {
            setupHeatmaps(viewer, ev.model);
        });
    } else {
        container.innerText = `
            <h1>Missing URN</h1>
            <p>
                Provide the URN of one of your models as the <code>urn</code> query parameter,
                and the GUID of a specific viewable as the <code>guid</code> query parameter.
            </p>
        `;
    }
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

function loadModel(viewer, urn, guid) {
    return new Promise(function (resolve, reject) {
        function onDocumentLoadSuccess(doc) {
            viewer.loadDocumentNode(doc, doc.getRoot().findByGuid(guid))
                .then(model => resolve(model));
        }
        function onDocumentLoadFailure(code, message) {
            reject(message);
        }
        Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
    });
}

async function setupHeatmaps(viewer, model) {
    const dataVizExt = viewer.getExtension('Autodesk.DataVisualization');
    const devices = [
        {
            id: 'Sala de Reuniones',
            position: { x: -21.6, y: -15.5, z: 0.3 },
            sensorTypes: ['temperature', 'humidity'],
        },
        {
            id: 'Oficina',
            position: { x: -26.7, y: 2.0, z: 0.3 },
            sensorTypes: ['temperature', 'humidity'],
        },
    ];
    const sensorColors = [0x0000ff, 0x00ff00, 0xffff00, 0xff0000];
    const sensorType = 'temperature';

    const structureInfo = new Autodesk.DataVisualization.Core.ModelStructureInfo(model); // Obtain room info from the model
    const shadingData = await structureInfo.generateSurfaceShadingData(devices); // Map devices to rooms
    await dataVizExt.setupSurfaceShading(model, shadingData); // Build heatmaps for rooms with at least one device in them
    dataVizExt.registerSurfaceShadingColors(sensorType, sensorColors);

    function getSensorValue(surfaceShadingPoint, sensorType) {
        console.log('Reading sensor value for', surfaceShadingPoint, sensorType);
        return Math.random();
    }

    setInterval(function () {
        const floorName = 'A1_Level 1';
        dataVizExt.renderSurfaceShading(floorName, sensorType, getSensorValue);
    }, 1000);
}

function getObjectBounds(model, dbid) {
    const tree = model.getInstanceTree();
    const frags = model.getFragmentList();
    let bounds = new THREE.Box3();
    tree.enumNodeFragments(dbid, function (fragid) {
        let _bounds = new THREE.Box3();
        frags.getWorldBounds(fragid, _bounds);
        bounds.union(_bounds);
    }, true);
    return bounds;
}
