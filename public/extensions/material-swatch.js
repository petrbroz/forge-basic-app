class MaterialSwatchExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._swatch = null;
        this._urn = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6YnJvenAtZGVidWctcGVyc2lzdGVkL21hdGVyaWFscy12Nyhzb2xpZCUyMHdvb2RzKS5mM2Q'; // Use your own swatch model URN
    }

    load() {
        return true;
    }

    unload() {
        return true;
    }

    /**
     * Lists all available material presets.
     * @async
     * @returns {Map} Mapping of preset names to instances of THREE.Material.
     */
    async getPresets() {
        if (!this._swatch) {
            this._swatch = await this._loadSwatchModel(this._urn);
        }
        const presets = new Map();
        const tree = this._swatch.getInstanceTree();
        const frags = this._swatch.getFragmentList();
        tree.enumNodeChildren(tree.getRootId(), function (dbid) {
            if (tree.getChildCount(dbid) === 0) {
                const name = tree.getNodeName(dbid);
                tree.enumNodeFragments(dbid, function (fragid) {
                    if (!presets.has(name)) {
                        presets.set(name, frags.getMaterial(fragid));
                    }
                }, true);
            }
        }, true);
        return presets;
    }

    /**
     * Applies material preset to specific object.
     * @async
     * @param {string} name Material preset name.
     * @param {Autodesk.Viewing.Model} targetModel Model that contains the object to be modified.
     * @param {number} targetObjectId DbID of the object to be modified.
     */
    async applyPreset(name, targetModel, targetObjectId) {
        const presets = await this.getPresets();
        if (!presets.has(name)) {
            console.error('Material swatch not found', name);
            return;
        }
        const material = presets.get(name);
        const tree = targetModel.getInstanceTree();
        const frags = targetModel.getFragmentList();
        tree.enumNodeFragments(targetObjectId, function (fragid) {
            frags.setMaterial(fragid, material);
        }, true);
        targetModel.unconsolidate();
    }

    async _loadSwatchModel(urn) {
        const viewer = this.viewer;
        return new Promise(function (resolve, reject) {
            function onSuccess(doc) {
                const viewable = doc.getRoot().getDefaultGeometry();
                viewer.addEventListener(Autodesk.Viewing.TEXTURES_LOADED_EVENT, function (ev) {
                    if (ev.model._isSwatch) {
                        resolve(ev.model);
                    }
                });
                viewer.loadDocumentNode(doc, viewable, {
                    preserveView: true,
                    keepCurrentModels: true,
                    loadAsHidden: true // <-- I see what you did there <_<
                }).then(model => model._isSwatch = true);
            }
            function onError(code, msg) {
                reject(msg);
            };
            Autodesk.Viewing.Document.load('urn:' + urn, onSuccess, onError);
        });
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('MaterialSwatchExtension', MaterialSwatchExtension);