export default function OlcUpdatePropertiesHandler() {
}

OlcUpdatePropertiesHandler.prototype.execute = function (context) {
    var { element, newProperties } = context;

    // Store the old properties so we can revert back if necessary
    context.oldProperties = { ...element.businessObject };

    // Update the properties
    Object.assign(element.businessObject, newProperties);

    return element;
}

OlcUpdatePropertiesHandler.prototype.revert = function (context) {
    var { element, oldProperties } = context;

    // Revert the properties back to the old properties
    Object.assign(element.businessObject, oldProperties);

    return element;
}