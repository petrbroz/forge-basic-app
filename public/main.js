/// import * as Autodesk from "@types/forge-viewer";

Autodesk.Viewing.Initializer({ accessToken: '' }, async function () {
    const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('preview'));
    viewer.start();
    viewer.setTheme('light-theme');
    await viewer.loadExtension('Autodesk.glTF');
    //viewer.loadModel('models/rac_basic_sample_project/gltf/model.gltf');
    viewer.loadModel('models/Sponza/glTF/Sponza.gltf');
});