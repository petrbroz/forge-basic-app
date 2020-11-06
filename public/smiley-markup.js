const avemc = Autodesk.Viewing.Extensions.Markups.Core;
const avemcu = avemc.Utils;

class MarkupSmiley extends avemc.Markup {
    constructor(id, editor) {
        super(id, editor, ['stroke-width', 'stroke-color', 'stroke-opacity', 'fill-color', 'fill-opacity']);
        this.type = 'smiley';
        this.addMarkupMetadata = avemcu.addMarkupMetadata.bind(this);
        this.shape = avemcu.createMarkupPathSvg();
        this.bindDomEvents();
    }

    // Get a new edit mode object for this markup type.
    getEditMode() {
        return new EditModeSmiley(this.editor);
    }

    // Compute SVG path based on the markup's parameters.
    getPath() {
        const { size } = this;
        if (size.x === 1 || size.y === 1) {
            return [''];
        }

        const strokeWidth = this.style['stroke-width'];
        const width = size.x - strokeWidth;
        const height = size.y - strokeWidth;
        const radius = 0.5 * Math.min(width, height);
        const path = [
            // Head
            'M', -radius, 0,
            'A', radius, radius, 0, 0, 1, radius, 0,
            'A', radius, radius, 0, 0, 1, -radius, 0,

            // Mouth
            'M', -0.5 * radius, -0.5 * radius,
            'A', radius, radius, 0, 0, 1, 0.5 * radius, -0.5 * radius,

            // Left eye (closed)
            'M', -0.5 * radius, 0.5 * radius,
            'A', radius, radius, 0, 0, 1, -0.1 * radius, 0.5 * radius,

            // Right eye (closed)
            'M', 0.1 * radius, 0.5 * radius,
            'A', radius, radius, 0, 0, 1, 0.5 * radius, 0.5 * radius,
        ];
        return path;
    }

    // Update the markup's transform properties.
    set(position, size) {
        this.setSize(position, size.x, size.y);
    }

    // Update the markup's SVG shape based on its style and transform properties.
    updateStyle() {
        const { style, shape } = this;
        const path = this.getPath().join(' ');

        const strokeWidth = this.style['stroke-width'];
        const strokeColor = this.highlighted ? this.highlightColor : avemcu.composeRGBAString(style['stroke-color'], style['stroke-opacity']);
        const fillColor = avemcu.composeRGBAString(style['fill-color'], style['fill-opacity']);
        const transform = this.getTransform();

        avemcu.setAttributeToMarkupSvg(shape, 'd', path);
        avemcu.setAttributeToMarkupSvg(shape, 'stroke-width', strokeWidth);
        avemcu.setAttributeToMarkupSvg(shape, 'stroke', strokeColor);
        avemcu.setAttributeToMarkupSvg(shape, 'fill', fillColor);
        avemcu.setAttributeToMarkupSvg(shape, 'transform', transform);
        avemcu.updateMarkupPathSvgHitarea(shape, this.editor);
    }

    // Store the markup's type, transforms, and styles in its SVG shape.
    setMetadata() {
        const metadata = avemcu.cloneStyle(this.style);
        metadata.type = this.type;
        metadata.position = [this.position.x, this.position.y].join(' ');
        metadata.size = [this.size.x, this.size.y].join(' ');
        metadata.rotation = String(this.rotation);
        return this.addMarkupMetadata(this.shape, metadata);
    }
}

class EditModeSmiley extends avemc.EditMode {
    constructor(editor) {
        super(editor, 'smiley', ['stroke-width', 'stroke-color', 'stroke-opacity', 'fill-color', 'fill-opacity']);
    }

    deleteMarkup(markup, cantUndo) {
        markup = markup || this.selectedMarkup;
        if (markup && markup.type == this.type) {
            const action = new SmileyDeleteAction(this.editor, markup);
            action.addToHistory = !cantUndo;
            action.execute();
            return true;
        }
        return false;
    }

    onMouseMove(event) {
        super.onMouseMove(event);

        const { selectedMarkup, editor } = this;
        if (!selectedMarkup || !this.creating) {
            return;
        }

        let final = this.getFinalMouseDraggingPosition();
        final = editor.clientToMarkups(final.x, final.y);
        let position = {
            x: (this.firstPosition.x + final.x) * 0.5,
            y: (this.firstPosition.y + final.y) * 0.5
        };
        let size = this.size = {
            x:  Math.abs(this.firstPosition.x - final.x),
            y: Math.abs(this.firstPosition.y - final.y)
        };
        const action = new SmileyUpdateAction(editor, selectedMarkup, position, size);
        action.execute();
    }

    onMouseDown() {
        super.onMouseDown();
        const { selectedMarkup, editor } = this;
        if (selectedMarkup) {
            return;
        }

        // Calculate center and size.
        let mousePosition = editor.getMousePosition();
        this.initialX = mousePosition.x;
        this.initialY = mousePosition.y;
        let position = this.firstPosition = editor.clientToMarkups(this.initialX, this.initialY);
        let size = this.size = editor.sizeFromClientToMarkups(1, 1);

        editor.beginActionGroup();
        const markupId = editor.getId();
        const action = new SmileyCreateAction(editor, markupId, position, size, 0, this.style);
        action.execute();

        this.selectedMarkup = editor.getMarkup(markupId);
        this.creationBegin();
    }
}

class SmileyCreateAction extends avemc.EditAction {
    constructor(editor, id, position, size, rotation, style) {
        super(editor, 'CREATE-SMILEY', id);
        this.selectOnExecution = false;
        this.position = { x: position.x, y: position.y };
        this.size = { x: size.x, y: size.y };
        this.rotation = rotation;
        this.style = avemcu.cloneStyle(style);
    }

    redo() {
        const editor = this.editor;
        const smiley = new MarkupSmiley(this.targetId, editor);
        editor.addMarkup(smiley);
        smiley.setSize(this.position, this.size.x, this.size.y);
        smiley.setRotation(this.rotation);
        smiley.setStyle(this.style);
    }

    undo() {
        const markup = this.editor.getMarkup(this.targetId);
        markup && this.editor.removeMarkup(markup);
    }
}

class SmileyUpdateAction extends avemc.EditAction {
    constructor(editor, smiley, position, size) {
        super(editor, 'UPDATE-SMILEY', smiley.id);
        this.newPosition = { x: position.x, y: position.y };
        this.newSize = { x: size.x, y: size.y };
        this.oldPosition = { x: smiley.position.x, y: smiley.position.y };
        this.oldSize = { x: smiley.size.x, y: smiley.size.y };
    }

    redo() {
        this.applyState(this.targetId, this.newPosition, this.newSize);
    }

    undo() {
        this.applyState(this.targetId, this.oldPosition, this.oldSize);
    }

    merge(action) {
        if (this.targetId === action.targetId && this.type === action.type) {
            this.newPosition = action.newPosition;
            this.newSize = action.newSize;
            return true;
        }
        return false;
    }

    applyState(targetId, position, size) {
        const smiley = this.editor.getMarkup(targetId);
        if(!smiley) {
            return;
        }

        // Different stroke widths make positions differ at sub-pixel level.
        const epsilon = 0.0001;
        if (Math.abs(smiley.position.x - position.x) > epsilon || Math.abs(smiley.size.y - size.y) > epsilon ||
            Math.abs(smiley.position.y - position.y) > epsilon || Math.abs(smiley.size.y - size.y) > epsilon) {
            smiley.set(position, size);
        }
    }

    isIdentity() {
        return (
            this.newPosition.x === this.oldPosition.x &&
            this.newPosition.y === this.oldPosition.y &&
            this.newSize.x === this.oldSize.x &&
            this.newSize.y === this.oldSize.y
        );
    }
}

class SmileyDeleteAction extends avemc.EditAction {
    constructor(editor, smiley) {
        super(editor, 'DELETE-SMILEY', smiley.id);
        this.createSmiley = new SmileyCreateAction(
            editor,
            smiley.id,
            smiley.position,
            smiley.size,
            smiley.rotation,
            smiley.getStyle()
        );
    }

    redo() {
        this.createSmiley.undo();
    }

    undo() {
        this.createSmiley.redo();
    }
}