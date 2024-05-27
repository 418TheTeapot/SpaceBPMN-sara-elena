


export default function OlcUpdateLabelHandler() {
}

OlcUpdateLabelHandler.prototype.execute = function (context) {
    var { element, newLabel } = context;
    element.businessObject.name = newLabel;
    return element;
}

OlcUpdateLabelHandler.prototype.revert = function (context) {
    //TODO implement at some point
}