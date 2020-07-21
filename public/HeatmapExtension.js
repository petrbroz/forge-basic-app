const HeatmapVertexShader = `
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HeatmapFragmentShader = `
// uniform float signal;
void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

class HeatmapExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                // signal: {
                //     type: 'f',
                //     value: 0.5
                // }
            },
            vertexShader: HeatmapVertexShader,
            fragmentShader: HeatmapFragmentShader
            // side: THREE.DoubleSide,
            // transparent: true
        });
        const materialManager = this.viewer.impl.matman();
        materialManager.addMaterial('heatmap', this.material, true);
    }

    load() {
        console.log('Heatmap extension loaded.');
        return true;
    }

    unload() {
        console.log('Heatmap extension unloaded.');
        return true;
    }

    updateHeatmap() {
        // this.material.uniforms.signal.value = Math.random();
        this.material.needsUpdate = true
    }

    setHeatmapMaterial(model, dbId) {
        const tree = model.getInstanceTree();
        const frags = model.getFragmentList();
        if (!tree || !frags) {
            console.warn('Instance tree or fragment list not available.');
            return;
        }
        tree.enumNodeFragments(dbId, (fragId) => {
            frags.setMaterial(fragId, this.material);
        });
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('HeatmapExtension', HeatmapExtension);
