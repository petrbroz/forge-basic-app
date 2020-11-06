class SmileyExtension extends Autodesk.Viewing.Extension {
    async load() {
        await this.viewer.loadExtension('Autodesk.Viewing.MarkupsCore');
        await this.loadScript('/smiley-markup.js');
        return true;
    }

    unload() {
        return true;
    }

    loadScript(url) {
        return new Promise(function (resolve, reject) {
            const script = document.createElement('script');
            script.setAttribute('src', url);
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    startDrawing() {
        const markupExt = this.viewer.getExtension('Autodesk.Viewing.MarkupsCore');
        markupExt.show();
        markupExt.enterEditMode();
        markupExt.changeEditMode(new EditModeSmiley(markupExt));
    }

    stopDrawing() {
        const markupExt = this.viewer.getExtension('Autodesk.Viewing.MarkupsCore');
        markupExt.leaveEditMode();
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('SmileyExtension', SmileyExtension);