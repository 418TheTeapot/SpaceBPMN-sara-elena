import {
    reduce,
    keys,
    forEach
} from 'min-dash';
import {getBusinessObject, is} from "../../../util/Util";




export default function OlcUpdateModdlePropertiesHandler(elementRegistry, commandStack, olcModdle) {
    this._elementRegistry = elementRegistry;
    this._commandStack = commandStack;
    this._olcModdle = olcModdle;  // Store the OlcModdle instance

    console.log('OlcMoodle Attuale:',olcModdle);

}


OlcUpdateModdlePropertiesHandler.$inject = [ 'elementRegistry', 'commandStack' ];

OlcUpdateModdlePropertiesHandler.prototype.execute = function(context) {

    var element = context.element,
        moddleElement = context.moddleElement,
        properties = context.properties;

    if (!moddleElement) {
        throw new Error('<moddleElement> required');
    }

    // TODO(nikku): we need to ensure that ID properties
    // are properly registered / unregistered via
    // this._moddle.ids.assigned(id)
    var changed = context.changed || this._getVisualReferences(moddleElement).concat(element);
    var oldProperties = context.oldProperties || getModdleProperties(moddleElement, keys(properties));

    setModdleProperties(moddleElement, properties);

    context.oldProperties = oldProperties;
    context.changed = changed;

    return changed;
};




OlcUpdateModdlePropertiesHandler.prototype.revert = function(context) {
    var oldProperties = context.oldProperties,
        moddleElement = context.moddleElement,
        changed = context.changed;

    setModdleProperties(moddleElement, oldProperties);

    return changed;
};




OlcUpdateModdlePropertiesHandler.prototype._getVisualReferences = function(moddleElement) {

    var elementRegistry = this._elementRegistry;

    if (is(moddleElement, 'space:DataObject')) {
        return getAllDataObjectReferences(moddleElement, elementRegistry);
    }

    return [];
};


// helpers /////////////////

function getModdleProperties(moddleElement, propertyNames) {
    return reduce(propertyNames, function(result, key) {
        result[key] = moddleElement.get(key);
        return result;
    }, {});
}

function setModdleProperties(moddleElement, properties) {
    forEach(properties, function(value, key) {
        // Se stai cercando di aggiornare l'ID dell'attributo
        if (key === 'id') {
            // Aggiorna l'ID nell'oggetto moddleElement
            moddleElement.$attrs[key] = value;
        } else {
            moddleElement.set(key, value);
        }
    });

    // Serializza l'oggetto Moddle aggiornato in una stringa XML
    this._olcModdle.toXML(moddleElement).then(xmlStr => {
        // console.log('Updated XML:', xmlStr);
    });
}

function getAllDataObjectReferences(dataObject, elementRegistry) {
    return elementRegistry.filter(function(element) {
        return (
            is(element, 'space:DataObjectReference') &&
            getBusinessObject(element).dataObjectRef === dataObject
        );
    });
}