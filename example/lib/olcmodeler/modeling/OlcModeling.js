import inherits from 'inherits';

import BaseModeling from 'diagram-js/lib/features/modeling/Modeling';
import OlcUpdatePropertiesHandler from "./cmd/OlcUpdatePropertiesHandler";
import OlcUpdateModdlePropertiesHandler from "./cmd/OlcUpdateModdlePropertiesHandler";
import OlcUpdateLabelHandler from "./cmd/OlcUpdateLabelHandler";
import OlcUpdateCanvasRootHandler from "./cmd/OlcUpdateCanvasRootHandler";
import {assign} from "min-dash";

export default function OlcModeling(eventBus, elementFactory, commandStack) {
    BaseModeling.call(this, eventBus, elementFactory, commandStack);

    eventBus.on('copyPaste.copyElement', function(context) {
        context.descriptor.copiedBusinessObject = context.element.businessObject;
        context.descriptor.type = context.descriptor.copiedBusinessObject.$type;
    });

    eventBus.on('copyPaste.pasteElement', function(context) {
        const {copiedBusinessObject} = context.descriptor;
        const newAttrs = {
            name : copiedBusinessObject.name
        }
        context.descriptor.businessObject = elementFactory.createBusinessObject(copiedBusinessObject.$type, newAttrs);
    });
}

inherits(OlcModeling, BaseModeling);

OlcModeling.$inject = [
    'eventBus',
    'elementFactory',
    'commandStack',
];


OlcModeling.prototype.getHandlers=function (){
    var handlers = BaseModeling.prototype.getHandlers.call(this);
    handlers['element.updateLabel'] = OlcUpdateLabelHandler;
    handlers['element.updateProperties'] = OlcUpdatePropertiesHandler;
    handlers['element.updateModdleProperties'] = OlcUpdateModdlePropertiesHandler;
    handlers['canvas.updateRoot'] = OlcUpdateCanvasRootHandler;
    return handlers;

}


OlcModeling.prototype.updateLabel = function (element, newLabel, newBounds, hints) {
    this._commandStack.execute('element.updateLabel', {
        element: element,
        newLabel: newLabel,
        newBounds: newBounds,
        hints: hints || {}
    });
};

OlcModeling.prototype.updateModdleProperties = function(element, moddleElement, properties) {
    this._commandStack.execute('element.updateModdleProperties', {
        element: element,
        moddleElement: moddleElement,
        properties: properties
    });

}



OlcModeling.prototype.updateProperties = function(element, newProperties) {
    // Here, extend the logic to handle previously undefined properties
    Object.keys(newProperties).forEach(prop => {
        if (typeof element.businessObject[prop] === 'undefined') {
            // If the property does not exist, initialize it
            element.businessObject[prop] = newProperties[prop];
        }
    });

    this._commandStack.execute('element.updateProperties', {
        element: element,
        newProperties: newProperties
    });
};

OlcModeling.prototype.updateCanvasRoot = function(newRoot) {
    this._commandStack.execute('canvas.updateRoot', {
        newRoot: newRoot
    });
};










