class GyroscopeExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._button = null;
        this._group = null;
        this._active = false;
        this._initialCameraPosition = null;
        this._initialCameraDirection = null;
        this._initialCameraUp = null;
        this._onOrientationChangeBound = this._onOrientationChange.bind(this);
    }

    load() {
        console.log('GyroscopeExtension has been loaded.');
        return true;
    }

    unload() {
        console.log('GyroscopeExtension has been unloaded.');
        return true;
    }

    onToolbarCreated(toolbar) {
        this._button = new Autodesk.Viewing.UI.Button('gyroscope');
        this._button.onClick = (ev) => {
            if (!this._active) {
                this._activate();
                this._active = true;
            } else {
                this._deactivate();
                this._active = false;
            }
        };
        this._button.setToolTip('Gyroscope');
        this._group = new Autodesk.Viewing.UI.ControlGroup('gyroscope-group');
        this._group.addControl(this._button);
        toolbar.addControl(this._group);
    }

    async _activate() {
        this._initialCameraPosition = this.viewer.navigation.getPosition();
        this._initialCameraDirection = this.viewer.navigation.getTarget().sub(this._initialCameraPosition);
        this._initialCameraUp = this.viewer.navigation.getCameraUpVector();
        if (DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', this._onOrientationChangeBound, true);
                } else {
                    alert('Access to Device Orientation not granted.');
                }
            } catch (err) {
                alert('Error when requesting permission for access to Device Orientation: ' + err);
            }
        } else {
            window.addEventListener('deviceorientation', this._onOrientationChangeBound, true);
        }
    }

    _deactivate() {
        window.removeEventListener('deviceorientation', this._onOrientationChangeBound);
        this._initialCameraPosition = null;
        this._initialCameraTarget = null;
        this._initialCameraUp = null;
    }

    _onOrientationChange(ev) {
        if (!this._active) {
            return; // For some reason the event keeps getting triggered in Safari for iOS even after we remove the listener
        }

        let { alpha, beta, gamma } = ev;
        document.getElementById('alpha').innerText = `α: ${alpha.toFixed(2)}`;
        document.getElementById('beta').innerText = `β: ${beta.toFixed(2)}`;
        document.getElementById('gamma').innerText = `γ: ${gamma.toFixed(2)}`;

        const deg2rad = (deg) => Math.PI * deg / 180.0;
        let newCameraDirection = this._updateCameraDirectionV3(this._initialCameraDirection, deg2rad(alpha), deg2rad(beta), deg2rad(gamma));
        this.viewer.navigation.setTarget(newCameraDirection.add(this._initialCameraPosition));
    }

    _updateCameraDirectionV1(initialCameraDir, alpha, beta, gamma) {
        return initialCameraDir.clone().applyAxisAngle(this._initialCameraUp, alpha);
    }

    _updateCameraDirectionV2(initialCameraDir, alpha, beta, gamma) {
        return initialCameraDir.clone().applyEuler(alpha, beta, gamma, 'YXZ');
    }

    _updateCameraDirectionV3(initialCameraDir, alpha, beta, gamma) {
        let euler = new THREE.Euler();
        euler.set(beta, alpha, -gamma, 'YXZ');
        let q = new THREE.Quaternion();
        q.setFromEuler(euler);
        return initialCameraDir.clone().applyQuaternion(q);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('GyroscopeExtension', GyroscopeExtension);