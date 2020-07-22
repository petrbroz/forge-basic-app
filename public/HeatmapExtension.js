const SensorCount = 25;
const AreaScale = 500.0;

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

vec3 val_to_heat(float val) {
    float r = min(2.0 * val, 1.0);
    float g = min(2.0 * (1.0 - val), 1.0);
    return vec3(r, g, 0.0);
}

void main() {
    float sum = 0.0;
    for (int i = 0; i < ${SensorCount}; i++) {
        sum += 5.0 * uSensorValues[i] / distance(vWorldPos.xyz, uSensorPositions[i]);
    }
    gl_FragColor = vec4(val_to_heat(clamp(sum, 0.0, 1.0)), 1.0);
}
`;

class HeatmapExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
    }

    load() {
        this.initMaterial();
        this.timer = setInterval(this.updateMaterial.bind(this), 500);
        console.log('Heatmap extension loaded.');
        return true;
    }

    unload() {
        clearInterval(this.timer);
        console.log('Heatmap extension unloaded.');
        return true;
    }

    initMaterial() {
        this.sensorPositions = [];
        this.sensorValues = [];
        for (let i = 0; i < SensorCount; i++) {
            this.sensorPositions.push(new THREE.Vector3(Math.random() * AreaScale, Math.random() * AreaScale, 0.0));
            this.sensorValues.push(Math.random());
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uSensorPositions: { type: 'v3v', value: this.sensorPositions },
                uSensorValues: { type: 'fv1', value: this.sensorValues }
            },
            vertexShader: HeatmapVertexShader,
            fragmentShader: HeatmapFragmentShader
        });
        const materialManager = this.viewer.impl.matman();
        materialManager.addMaterial('heatmap', this.material, true);
    }

    updateMaterial() {
        for (let i = 0; i < SensorCount; i++) {
            const pos = this.material.uniforms.uSensorPositions.value[i];
            pos.x += 5.0 * (Math.random() - 0.5);
            pos.y += 5.0 * (Math.random() - 0.5);
            pos.z += 5.0 * (Math.random() - 0.5);
            this.material.uniforms.uSensorValues.value[i] += 0.1 * (Math.random() - 0.5);
        }
        this.material.needsUpdate = true;
        this.viewer.impl.sceneUpdated();
    }

    onClick() {
        const model = this.viewer.model;
        if (model) {
            model.unconsolidate();
            const tree = model.getInstanceTree();
            const frags = model.getFragmentList();
            const dbids = this.viewer.getSelection();
            this.viewer.clearSelection();
            for (const dbid of dbids) {
                tree.enumNodeFragments(dbid, (fragId) => {
                    frags.setMaterial(fragId, this.material);
                });
            }
        }
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('HeatmapExtension', HeatmapExtension);
