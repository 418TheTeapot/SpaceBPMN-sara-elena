import {
    add as collectionAdd,
    remove as collectionRemove
} from 'diagram-js/lib/util/Collections';

export default function OlcUpdateCanvasRootHandler(canvas, modeling) {
    this._canvas = canvas;
    this._modeling = modeling;
}

OlcUpdateCanvasRootHandler.$inject = [
    'canvas',
    'modeling'
];

OlcUpdateCanvasRootHandler.prototype.execute = function(context) {
    var canvas = this._canvas;

    var newRoot = context.newRoot,
        newRootBusinessObject = newRoot.businessObject,
        oldRoot = canvas.getRootElement(),
        oldRootBusinessObject = oldRoot.businessObject,
        olcDefinitions = oldRootBusinessObject.$parent;

    canvas.setRootElement(newRoot);
    canvas.removeRootElement(oldRoot);

    collectionAdd(olcDefinitions.rootElements, newRootBusinessObject);
    newRootBusinessObject.$parent = olcDefinitions;

    collectionRemove(olcDefinitions.rootElements, oldRootBusinessObject);
    oldRootBusinessObject.$parent = null;

    context.oldRoot = oldRoot;

    return [];
};

OlcUpdateCanvasRootHandler.prototype.revert = function(context) {
    var canvas = this._canvas;

    var newRoot = context.newRoot,
        newRootBusinessObject = newRoot.businessObject,
        oldRoot = context.oldRoot,
        oldRootBusinessObject = oldRoot.businessObject,
        olcDefinitions = newRootBusinessObject.$parent;

    canvas.setRootElement(oldRoot);
    canvas.removeRootElement(newRoot);

    collectionRemove(olcDefinitions.rootElements, newRootBusinessObject);
    newRootBusinessObject.$parent = null;

    collectionAdd(olcDefinitions.rootElements, oldRootBusinessObject);
    oldRootBusinessObject.$parent = olcDefinitions;

    return [];
};