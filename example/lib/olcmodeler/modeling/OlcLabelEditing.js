import { is } from 'bpmn-js/lib/util/ModelUtil';
import {getExternalLabelMid} from 'bpmn-js/lib/util/LabelUtil';

export default function OlcLabelEditing(eventBus, canvas, directEditing, commandStack) {
    directEditing.registerProvider(this);
    this._commandStack = commandStack;
    this._canvas = canvas;


    eventBus.on('element.dblclick', function (event) {
        directEditing.activate(event.element);

    });

    // complete on followup canvas operation
    eventBus.on([
        'autoPlace.start',
        'canvas.viewbox.changing',
        'drag.init',
        'element.mousedown',
        'popupMenu.open'
    ], function (event) {
        if (directEditing.isActive()) {
            directEditing.complete();
        }
    });

    // cancel on command stack changes (= when some other action is done)
    eventBus.on(['commandStack.changed'], function (e) {
        if (directEditing.isActive()) {
            directEditing.cancel();
        }
    });
}

OlcLabelEditing.prototype.activate = function (element) {

    var text = element.businessObject.name || '';

    if (is(element.businessObject, 'space:Place')){
        var options = {
            centerVertically: true,
            autoResize: true
        };

        var canvas = this._canvas;
        var zoom = canvas.zoom();
        var target = element;
        var bbox = canvas.getAbsoluteBBox(target);

        var mid = {
            x: bbox.x + bbox.width / 2,
            y: bbox.y + bbox.height / 2
        };

        var width = 90 * zoom,
            paddingTop = 7 * zoom,
            paddingBottom = 4 * zoom;

        var bounds = {
            width: width,
            height: bbox.height + paddingTop + paddingBottom,
            x: mid.x - width / 2,
            y: bbox.y - paddingTop
        };

        var style = {
            // TODO make look nice
        };

        var context = {
            text: text,
            options: options,
            bounds: bounds,
            style: style
        };
        return context;}

    if (is(element.businessObject, 'space:Transition')){

        var options = {
            centerVertically: true,
            autoResize: true
        };

        var canvas = this._canvas;
        var zoom = canvas.zoom();
        var target = element;
        // var bbox = canvas.getBBox(target);

        //var externalFontSize = externalStyle.fontSize * zoom;
        var externalLabelMid = getExternalLabelMid(element);

        var absoluteBBox = canvas.getAbsoluteBBox({
            x: externalLabelMid.x,
            y: externalLabelMid.y,
        });

        var height = 15*zoom;
        //var height = externalFontSize + paddingTop + paddingBottom;
        var width = 50 * zoom,
            paddingTop = 7 * zoom,
            paddingBottom = 4 * zoom;

        var bounds = {
            width: width,
            height: height,
            x: absoluteBBox.x - width / 2,
            y: absoluteBBox.y - height / 2
        };


        var style = {
            // TODO make look nice
        };

        var context = {
            text: text,
            options: options,
            bounds: bounds,
            style: style
        };
        console.log(context)
        return context;}

};




OlcLabelEditing.prototype.update = function (element, newLabel) {
    this._commandStack.execute('element.updateLabel', {
        element: element,
        newLabel: newLabel
    });
};


/////labeutil

OlcLabelEditing.prototype.getLabel = function (element) {
    var semantic = element.businessObject,
        attr = this.getLabelAttr(semantic);

    if (attr) {
        if (attr === 'categoryValueRef') {
            return this.getCategoryValue(semantic);
        }
        return semantic[attr] || '';
    }
};

OlcLabelEditing.prototype.getLabelAttr = function (semantic) {
    if (
        is(semantic, 'space:Place') ||
        is(semantic, 'space:Transition')
    ) {
        return 'name';
    }

};

OlcLabelEditing.prototype.getCategoryValue = function (semantic) {
    var categoryValueRef = semantic['categoryValueRef'];

    if (!categoryValueRef) {
        return '';
    }

    return categoryValueRef.value || '';
};




OlcLabelEditing.$inject = [
    'eventBus',
    'canvas',
    'directEditing',
    'commandStack'
];