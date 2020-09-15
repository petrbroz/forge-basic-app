const DrawBoundsToolName = 'draw-bounds-tool';
const DrawBoundsOverlayName = 'draw-bounds-overlay';

class DrawBoundsTool extends Autodesk.Viewing.ToolInterface {
    constructor(viewer) {
        super();
        this.viewer = viewer;
        this.names = [DrawBoundsToolName];
        this.active = false;
        this.snapper = null;
        this.points = [];
        this.mesh = null;
        // Hack: delete functions defined on the *instance* of a ToolInterface (we want the tool controller to call our class methods instead)
        delete this.register;
        delete this.deregister;
        delete this.activate;
        delete this.deactivate;
        delete this.getPriority;
        delete this.handleMouseMove;
        delete this.handleSingleClick;
        delete this.handleKeyUp;
    }

    register() {
        this.snapper = new Autodesk.Viewing.Extensions.Snapping.Snapper(this.viewer, { renderSnappedGeometry: true, renderSnappedTopology: true });
        this.viewer.toolController.registerTool(this.snapper);
        this.viewer.toolController.activateTool(this.snapper.getName());
        console.log('DrawBoundsTool registered.');
    }

    deregister() {
        this.viewer.toolController.deactivateTool(this.snapper.getName());
        this.viewer.toolController.deregisterTool(this.snapper);
        this.snapper = null;
        console.log('DrawBoundsTool unregistered.');
    }

    activate(name, viewer) {
        if (!this.active) {
            this.viewer.overlays.addScene(DrawBoundsOverlayName);
            console.log('DrawBoundsTool activated.');
            this.active = true;
        }
    }

    deactivate(name) {
        if (this.active) {
            this.viewer.overlays.removeScene(DrawBoundsOverlayName);
            console.log('DrawBoundsTool deactivated.');
            this.active = false;
        }
    }

    getPriority() {
        return 42; // Feel free to use any number higher than 0 (which is the priority of all the default viewer tools)
    }

    handleMouseMove(event) {
        if (!this.active) {
            return false;
        }

        this.snapper.indicator.clearOverlays();
        if (this.snapper.isSnapped()) {
            const result = this.snapper.getSnapResult();
            const { SnapType } = Autodesk.Viewing.MeasureCommon;
            switch (result.geomType) {
                case SnapType.SNAP_VERTEX:
                case SnapType.SNAP_MIDPOINT:
                case SnapType.SNAP_INTERSECTION:
                case SnapType.SNAP_CIRCLE_CENTER:
                case SnapType.RASTER_PIXEL:
                    // console.log('Snapped to vertex', result.geomVertex);
                    this.snapper.indicator.render(); // Show indicator when snapped to a vertex
                    this._update(result.geomVertex);
                    break;
                case SnapType.SNAP_EDGE:
                case SnapType.SNAP_CIRCULARARC:
                case SnapType.SNAP_CURVEDEDGE:
                    // console.log('Snapped to edge', result.geomEdge);
                    break;
                case SnapType.SNAP_FACE:
                case SnapType.SNAP_CURVEDFACE:
                    // console.log('Snapped to face', result.geomFace);
                    break;
            }
        }
        return false;
    }

    handleSingleClick(event, button) {
        if (!this.active) {
            return false;
        }

        if (button === 0 && this.snapper.isSnapped()) {
            const result = this.snapper.getSnapResult();
            const { SnapType } = Autodesk.Viewing.MeasureCommon;
            switch (result.geomType) {
                case SnapType.SNAP_VERTEX:
                case SnapType.SNAP_MIDPOINT:
                case SnapType.SNAP_INTERSECTION:
                case SnapType.SNAP_CIRCLE_CENTER:
                case SnapType.RASTER_PIXEL:
                    this.points.push(result.geomVertex.clone());
                    this._update();
                    break;
                default:
                    // Do not snap to other types
                    break;
            }
            return true; // Stop the event from going to other tools in the stack
        }
        return false;
    }

    handleKeyUp(event, keyCode) {
        if (this.active) {
            if (keyCode === 27) {
                // Finalize the extrude mesh and initialie a new one
                this.points = [];
                this.mesh = null;
                return true;
            }
        }
        return false;
    }

    _update(intermediatePoint = null) {
        if ((this.points.length + (intermediatePoint ? 1 : 0)) > 2) {
            if (this.mesh) {
                this.viewer.overlays.removeMesh(this.mesh, DrawBoundsOverlayName);
            }
            let minZ = this.points[0].z, maxZ = this.points[0].z;
            let shape = new THREE.Shape();
            shape.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                shape.lineTo(this.points[i].x, this.points[i].y);
                minZ = Math.min(minZ, this.points[i].z);
                maxZ = Math.max(maxZ, this.points[i].z);
            }
            if (intermediatePoint) {
                shape.lineTo(intermediatePoint.x, intermediatePoint.y);
                minZ = Math.min(minZ, intermediatePoint.z);
                maxZ = Math.max(maxZ, intermediatePoint.z);
            }
            let geometry = new THREE.BufferGeometry().fromGeometry(new THREE.ExtrudeGeometry(shape, { steps: 1, amount: maxZ - minZ, bevelEnabled: false }));
            let material = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.z = minZ;
            this.viewer.overlays.addMesh(this.mesh, DrawBoundsOverlayName);
            this.viewer.impl.sceneUpdated(true);
        }
    }
}

class DrawBoundsToolExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this.tool = new DrawBoundsTool(viewer);
        this.button = null;
    }

    async load() {
        await this.viewer.loadExtension('Autodesk.Snapping');
        this.viewer.toolController.registerTool(this.tool);
        console.log('DrawBoundsToolExtension has been loaded.');
        return true;
    }

    async unload() {
        this.viewer.toolController.deregisterTool(this.tool);
        console.log('DrawBoundsToolExtension has been unloaded.');
        return true;
    }

    onToolbarCreated(toolbar) {
        const controller = this.viewer.toolController;
        this.button = new Autodesk.Viewing.UI.Button('draw-bounds-tool-button');
        this.button.onClick = (ev) => {
            if (controller.isToolActivated(DrawBoundsToolName)) {
                controller.deactivateTool(DrawBoundsToolName);
                this.button.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
            } else {
                controller.activateTool(DrawBoundsToolName);
                this.button.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
            }
        };
        this.button.setToolTip('Draw Bounds Tool');
        this.group = new Autodesk.Viewing.UI.ControlGroup('draw-tool-group');
        this.group.addControl(this.button);
        toolbar.addControl(this.group);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('DrawBoundsToolExtension', DrawBoundsToolExtension);