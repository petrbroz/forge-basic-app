const PlanarMappingVertexShader = `
uniform vec3 uScale;
uniform vec3 uOffset;
varying vec2 vCustomUV;

void main() {
    vec4 vWorldPos = modelMatrix * vec4(position, 1.0);
    vec3 v = uScale * vWorldPos.xyz + uOffset;
    vCustomUV = v.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SphericalMappingVertexShader = `
uniform vec3 uScale;
uniform vec3 uOffset;
varying vec2 vCustomUV;

void main() {
    vec4 vWorldPos = modelMatrix * vec4(position, 1.0);
    vec3 v = uScale * vWorldPos.xyz + uOffset;
    vCustomUV.x = atan(v.y / v.x);
    vCustomUV.y = atan(sqrt(v.x * v.x + v.y * v.y) / v.z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FragmentShader = `
uniform sampler2D uTexture;
varying vec2 vCustomUV;

#ifdef _LMVWEBGL2_
    #if defined(MRT_NORMALS)
        layout(location = 1) out vec4 outNormal;

        #if defined(MRT_ID_BUFFER)
            layout(location = 2) out vec4 outId;
            #if defined(MODEL_COLOR)
                layout(location = 3) out vec4 outModelId;
            #endif
        #endif
    #elif defined(MRT_ID_BUFFER)
        layout(location = 1) out vec4 outId;
        #if defined(MODEL_COLOR)
            layout(location = 2) out vec4 outModelId;
        #endif
    #endif
#else
    #define gl_FragColor gl_FragData[0]
    #if defined(MRT_NORMALS)
        #define outNormal gl_FragData[1]

        #if defined(MRT_ID_BUFFER)
            #define outId gl_FragData[2]
            #if defined(MODEL_COLOR)
                #define outModelId gl_FragData[3]
            #endif
        #endif
    #elif defined(MRT_ID_BUFFER)
        #define outId gl_FragData[1]
        #if defined(MODEL_COLOR)
            #define outModelId gl_FragData[2]
        #endif
    #endif
#endif

void main() {
    gl_FragColor = texture(uTexture, fract(vCustomUV));

    #ifdef MRT_ID_BUFFER
        outId = vec4(0.0);
    #endif
    #ifdef MODEL_COLOR
        outModelId = vec4(0.0);
    #endif
    #ifdef MRT_NORMALS
        outNormal = vec4(0.0);
    #endif
}
`;

class CustomTextureExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._active = false;
        this._planarMappingButton = null;
        this._planarMappingMaterial = null;
        this._sphericalMappingButton = null;
        this._sphericalMappingMaterial = null;
        this._fragMaterialCache = {}; // cache of original fragment materials replaced by our material
    }

    load() {
        if (this.viewer.toolbar && !this._planarMappingButton) {
            this._createUI();
        }
        this._initPlanarMappingMaterial();
        this._initSphericalMappingMaterial();
        console.log('Custom texture extension loaded.');
        return true;
    }

    unload() {
        if (this._planarMappingButton) {
            this._removeUI();
        }
        this._deactivate();
        console.log('Custom texture extension unloaded.');
        return true;
    }

    onToolbarCreated() {
        if (!this._planarMappingButton) {
            this._createUI();
        }
    }

    _createUI() {
        const group = this.viewer.toolbar.getControl('modelTools');

        this._planarMappingButton = new Autodesk.Viewing.UI.Button('plannarMappingTextureButton');
        this._planarMappingButton.onClick = (ev) => {
            this._deactivate();
            this._activate(this._planarMappingMaterial);
            this._planarMappingButton.addClass('active');
        };
        this._planarMappingButton.setToolTip('Apply Texture with Plannar Mapping');
        group.addControl(this._planarMappingButton);

        this._sphericalMappingButton = new Autodesk.Viewing.UI.Button('sphericalMappingTextureButton');
        this._sphericalMappingButton.onClick = (ev) => {
            this._deactivate();
            this._activate(this._sphericalMappingMaterial);
            this._sphericalMappingButton.addClass('active');
        };
        this._sphericalMappingButton.setToolTip('Apply Texture with Spherical Mapping');
        group.addControl(this._sphericalMappingButton);
    }

    _removeUI() {
        const group = this.viewer.toolbar.getControl('modelTools');
        group.removeControl(this._planarMappingButton);
        group.removeControl(this._sphericalMappingButton);
        this._planarMappingButton = null;
        this._sphericalMappingButton = null;
    }

    _activate(material) {
        const model = this.viewer.model;
        model.unconsolidate();
        const tree = model.getInstanceTree();
        const frags = model.getFragmentList();
        const dbids = this.viewer.getSelection();
        for (const dbid of dbids) {
            tree.enumNodeFragments(dbid, (fragId) => {
                this._fragMaterialCache[fragId] = frags.getMaterial(fragId);
                frags.setMaterial(fragId, material);
            });
        }
        this.viewer.clearSelection();
        this._active = true;
    }

    _deactivate() {
        const model = this.viewer.model;
        const frags = model.getFragmentList();
        for (const fragId of Object.keys(this._fragMaterialCache)) {
            frags.setMaterial(fragId, this._fragMaterialCache[fragId]);
        }
        this._fragMaterialCache = {};
        this._planarMappingButton.removeClass('active');
        this._sphericalMappingButton.removeClass('active');
        this.viewer.impl.sceneUpdated();
        this._active = false;
    }

    _initPlanarMappingMaterial() {
        this._planarMappingMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uScale: {
                    value: new THREE.Vector3(0.001, 0.001, 0.001),
                    type: 'v3'
                },
                uOffset: {
                    value: new THREE.Vector3(0.5, 0.5, 0.5),
                    type: 'v3'
                },
                uTexture: {
                    value: THREE.ImageUtils.loadTexture('/doge.jpg'),
                    type: 't'
                }
            },
            vertexShader: PlanarMappingVertexShader,
            fragmentShader: FragmentShader
        });
        this._planarMappingMaterial.supportsMrtNormals = true;
        this._planarMappingMaterial.side = THREE.DoubleSide;
        const materialManager = this.viewer.impl.matman();
        materialManager.addMaterial('planar-mapping-material', this._planarMappingMaterial, true);
    }

    _initSphericalMappingMaterial() {
        this._sphericalMappingMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uScale: {
                    value: new THREE.Vector3(0.1, 0.1, -0.1),
                    type: 'v3'
                },
                uOffset: {
                    value: new THREE.Vector3(0.0, 0.0, 0.0),
                    type: 'v3'
                },
                uTexture: {
                    value: THREE.ImageUtils.loadTexture('/doge.jpg'),
                    type: 't'
                }
            },
            vertexShader: SphericalMappingVertexShader,
            fragmentShader: FragmentShader
        });
        this._sphericalMappingMaterial.supportsMrtNormals = true;
        this._sphericalMappingMaterial.side = THREE.DoubleSide;
        const materialManager = this.viewer.impl.matman();
        materialManager.addMaterial('spherical-mapping-material', this._sphericalMappingMaterial, true);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('CustomTextureExtension', CustomTextureExtension);