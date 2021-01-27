/// import * as Autodesk from "@types/forge-viewer";

Autodesk.Viewing.Initializer({ env: 'Local' }, async function () {
    const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('preview'));
    viewer.start();
    viewer.setTheme('light-theme');
    viewer.loadExtension('Autodesk.PDF').then(() => {
        viewer.loadModel('/22_modena_2020.pdf');
    });
});