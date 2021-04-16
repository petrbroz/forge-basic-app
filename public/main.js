/// import * as Autodesk from "@types/forge-viewer";

import { initializeViewer, loadModel } from './viewer.js';
import { initializeDashboard } from './dashboard.js';

window.addEventListener('DOMContentLoaded', async function () {
    const viewer = await initializeViewer(document.getElementById('preview'));
    const urn = window.location.hash ? window.location.hash.substr(1) : null;
    setupModelSelection(viewer, urn);
    setupModelUpload(viewer);
    initializeDashboard(viewer);
});

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
    models.onchange = () => {
        window.location.hash = models.value;
        loadModel(viewer, models.value);
    }
    if (!viewer.model && models.value) {
        window.location.hash = models.value;
        loadModel(viewer, models.value);
    }
}

/**
 * Initializes model upload UI.
 * @async
 * @param {GuiViewer3D} viewer Forge Viewer instance.
 */
async function setupModelUpload(viewer) {
    const button = document.getElementById('upload');
    const input = document.getElementById('input');
    button.addEventListener('click', async function () {
        input.click();
    });
    input.addEventListener('change', async function () {
        if (input.files.length !== 1) {
            return;
        }
        const file = input.files[0];
        let data = new FormData();
        data.append('model-name', file.name);
        data.append('model-file', file);
        // When uploading a zip file, ask for the main design file in the archive
        if (file.name.endsWith('.zip')) {
            const entrypoint = window.prompt('Please enter the filename of the main design inside the archive.');
            data.append('model-zip-entrypoint', entrypoint);
        }
        button.setAttribute('disabled', 'true');
        button.innerText = 'Uploading ...';
        const resp = await fetch('/api/models', { method: 'POST', body: data });
        if (resp.ok) {
            input.value = '';
            setupModelSelection(viewer);
        } else {
            alert('Could not upload model. See the console for more details.');
            console.error(await resp.text());
        }
        button.innerText = 'Upload';
        button.removeAttribute('disabled');
    });
}
