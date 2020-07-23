/*
Forge Viewer extension for visualizing sensory data as a heatmap on selected objects.

After clicking this extension's button in the viewer toolbar, a custom shader material
is applied to all selected objects, showing a dynamic heatmap based on a hard-coded
number of sensors with changing world coordinates and "strengths" (values between 0.0 and 1.0).
After clicking the button again, the custom material is removed.
*/

// Number of sensors to compute the heatmap from
// (note that the number of WebGL inputs is limited: http://math.hws.edu/graphicsbook/demos/c6/webgl-limits.html)
const SensorCount = 16; 

const HeatmapVertexShader = `
varying vec4 vWorldPos;
void main() {
    vWorldPos = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HeatmapFragmentShader = `
uniform vec3 uSensorPositions[${SensorCount}];
uniform float uSensorValues[${SensorCount}];
varying vec4 vWorldPos;

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

vec3 val_to_heat(float val) {
    float r = min(2.0 * val, 1.0);
    float g = min(2.0 * (1.0 - val), 1.0);
    return vec3(r, g, 0.0);
}

void main() {
    float sum = 0.0;
    for (int i = 0; i < ${SensorCount}; i++) {
        sum += 15.0 * uSensorValues[i] / distance(vWorldPos.xyz, uSensorPositions[i]);
    }
    gl_FragColor = vec4(val_to_heat(clamp(sum, 0.0, 1.0)), 1.0);

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

class HeatmapExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._button = null; // button in the viewer toolbar for activating our extension
        this._material = null; // custom shader material
        this._timer = null; // ID of an `setInterval` updating the heatmap data
        this._fragMaterialCache = {}; // cache of original fragment materials replaced by our material
    }

    load() {
        if (this.viewer.toolbar && !this._button) {
            this._createUI();
        }
        this._initShaderMaterial();
        console.log('Heatmap extension loaded.');
        return true;
    }

    unload() {
        if (this._button) {
            this._removeUI();
        }
        if (this._timer) {
            this._deactivate();
        }
        console.log('Heatmap extension unloaded.');
        return true;
    }

    onToolbarCreated() {
        if (!this._button) {
            this._createUI();
        }
    }

    _createUI() {
        this._button = new Autodesk.Viewing.UI.Button('heatmapExtensionButton');
        this._button.onClick = (ev) => {
            if (!this._timer) {
                this._activate();
            } else {
                this._deactivate();
            }
        };
        this._button.setToolTip('Heatmap Extension');
        const group = this.viewer.toolbar.getControl('modelTools');
        group.addControl(this._button);
    }

    _removeUI() {
        const group = this.viewer.toolbar.getControl('modelTools');
        group.removeControl(this._button);
        this._button = null;
    }

    _activate() {
        const model = this.viewer.model;
        model.unconsolidate();
        this._resetHeatmapData(model.getBoundingBox());
        const tree = model.getInstanceTree();
        const frags = model.getFragmentList();
        const dbids = this.viewer.getSelection();
        for (const dbid of dbids) {
            tree.enumNodeFragments(dbid, (fragId) => {
                this._fragMaterialCache[fragId] = frags.getMaterial(fragId);
                frags.setMaterial(fragId, this._material);
            });
        }
        this.viewer.clearSelection();
        this._timer = setInterval(this._updateHeatmapData.bind(this), 500);
        this._button.addClass('active');
    }

    _deactivate() {
        const model = this.viewer.model;
        const frags = model.getFragmentList();
        for (const fragId of Object.keys(this._fragMaterialCache)) {
            frags.setMaterial(fragId, this._fragMaterialCache[fragId]);
        }
        this._fragMaterialCache = {};
        clearInterval(this._timer);
        this._timer = null;
        this._button.removeClass('active');
        this.viewer.impl.sceneUpdated();
    }

    // Initializes custom shader material.
    _initShaderMaterial() {
        const sensorPositions = [];
        const sensorValues = [];
        for (let i = 0; i < SensorCount; i++) {
            sensorPositions.push(new THREE.Vector3(0.0, 0.0, 0.0));
            sensorValues.push(0.0);
        }
        this._material = new THREE.ShaderMaterial({
            uniforms: {
                uSensorPositions: { type: 'v3v', value: sensorPositions },
                uSensorValues: { type: 'fv1', value: sensorValues }
            },
            vertexShader: HeatmapVertexShader,
            fragmentShader: HeatmapFragmentShader
        });
        this._material.supportsMrtNormals = true;
        this._material.side = THREE.DoubleSide;
        const materialManager = this.viewer.impl.matman();
        materialManager.addMaterial('heatmap', this._material, true);
    }

    // Regenerates random sensor positions and strengths based on model bounding box.
    _resetHeatmapData(bbox) {
        for (let i = 0; i < SensorCount; i++) {
            const pos = this._material.uniforms.uSensorPositions.value[i];
            pos.x = bbox.min.x + Math.random() * (bbox.max.x - bbox.min.x);
            pos.y = bbox.min.y + Math.random() * (bbox.max.y - bbox.min.y);
            pos.z = bbox.min.z + Math.random() * (bbox.max.z - bbox.min.z);
            this._material.uniforms.uSensorValues.value[i] = Math.random();
        }
        this.viewer.impl.sceneUpdated();
    }

    // Modifies sensor positions and strenghts by small random offsets.
    _updateHeatmapData() {
        for (let i = 0; i < SensorCount; i++) {
            const pos = this._material.uniforms.uSensorPositions.value[i];
            pos.x += 5.0 * (Math.random() - 0.5);
            pos.y += 5.0 * (Math.random() - 0.5);
            pos.z += 5.0 * (Math.random() - 0.5);
            this._material.uniforms.uSensorValues.value[i] += 0.1 * (Math.random() - 0.5);
        }
        this.viewer.impl.sceneUpdated();
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('HeatmapExtension', HeatmapExtension);
