class MaterialSwatchExtensionUI extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
        this._panel = null;
        this._materialSwatchExt = null;
    }

    async load() {
        this._materialSwatchExt = await this.viewer.loadExtension('MaterialSwatchExtension');
        return true;
    }

    unload() {
        this._removeUI();
        return true;
    }

    onToolbarCreated() {
        this._createUI();
    }

    _createUI() {
        this._button = new Autodesk.Viewing.UI.Button('material-swatch-button');
        this._button.onClick = (ev) => {
            if (!this._panel) {
                this._panel = new MaterialSwatchPanel(this._materialSwatchExt);
            }
            if (this._button.getState() !== Autodesk.Viewing.UI.Button.State.ACTIVE) {
                this._button.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
                this._panel.setVisible(true);
            } else {
                this._button.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
                this._panel.setVisible(false);
            }
        };
        this._button.setToolTip('Material Swatch');
        this._group = new Autodesk.Viewing.UI.ControlGroup('material-swatch-group');
        this._group.addControl(this._button);
        this.viewer.toolbar.addControl(this._group);
    }

    _removeUI() {
        if (this._panel) {
            this._panel.setVisible(false);
            this._panel = null;
        }
        if (this._group) {
            this.viewer.toolbar.removeControl(this._group);
            this._group = null;
            this._button = null;
        }
    }
}

class MaterialSwatchPanel extends Autodesk.Viewing.UI.PropertyPanel {
    constructor(ext) {
        super(ext.viewer.container, 'material-swatch-panel', 'Material Swatch');
        this._materialSwatchExt = ext;
    }

    setVisible(show) {
        super.setVisible(show);
        if (show) {
            this.addProperty('Loading', '...', 'Materials');
            this._materialSwatchExt.getSwatches()
                .then(swatches => {
                    this.removeAllProperties();
                    for (const key of swatches.keys()) {
                        this.addProperty(key, 'Apply to selection', 'Materials');
                    }
                })
                .catch(err => this.addProperty('Error', err, 'Materials'));
        }
    }

    async onPropertyClick(prop) {
        const swatches = await this._materialSwatchExt.getSwatches();
        if (!swatches.has(prop.name)) {
            console.error('Material swatch not found', prop.name);
            return;
        }
        const selections = this._materialSwatchExt.viewer.getAggregateSelection();
        for (const group of selections) {
            for (const dbid of group.selection) {
                this._materialSwatchExt.applySwatch(prop.name, group.model, dbid);
            }
        }
        this._materialSwatchExt.viewer.clearSelection();
        this._materialSwatchExt.viewer.impl.invalidate(true, true, true);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('MaterialSwatchExtensionUI', MaterialSwatchExtensionUI);