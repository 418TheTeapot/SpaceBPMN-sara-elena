import OlcModeler from "../olcmodeler/OlcModeler";
import inherits from "inherits";
import {is} from "../util/Util";
import {without} from "min-dash";
import SpaceOlcPropertiesProvider
    from "./spaceOlcPropertiesPanel/spaceOlcProperteisProvider/SpaceOlcPropertiesProvider";

import spaceOlcModdleDescriptor from '../spacemodeler/spaceOlcPropertiesPanel/descriptors/olcSpace.json';
import olcExtension from '../spacemodeler/moddle/olcExtension.json';

export default function OlcSpaceModeler(options) {
    //modeler 4 OLC

    const customModules = [
        SpaceOlcPropertiesProvider,
        {
            olcModeler: ['value', this],
        }
    ];
    options.additionalModules = [
        ...customModules,
        ...(options.additionalModules || [])
    ];
    options.moddleExtensions = {
        olcspace: spaceOlcModdleDescriptor,
        SA: olcExtension
    };

    OlcModeler.call(this, options);

    this.get('eventBus').on('moddleCopy.canCopyProperty', function (context) {
        if (context.propertyName === 'SA:places' || context.propertyName === 'SA:shapes' || context.propertyName === 'SA:canvaspace') {
            console.log(context.property);
            return context.property;
        }
    });
}

inherits(OlcSpaceModeler, OlcModeler);


OlcSpaceModeler.prototype.handleOlcListChanged = function (places, dryRun=false) {
        this._places = places;

}
OlcSpaceModeler.prototype.handleShapeChanged = function (shapes1, dryRun=false) {
        this._shapes = shapes1;

}
OlcSpaceModeler.prototype.handleCanvaChanged = function (canvas1, dryRun=false) {
        this._canvaspace = canvas1;
}

OlcSpaceModeler.prototype.getDataObjectReferencesInState = function (olcState) {
        return this.get('elementRegistry').filter((element, gfx) =>
            is(element, 'space:Place') && is(element,'space:Transition') &&
            element.type !== 'label' &&
            element.businessObject.places
        );
}

OlcSpaceModeler.prototype.handleStateDeleted = function (olcPlaces) {
        this.getDataObjectReferencesInState(olcPlaces).forEach((element, gfx) => {
            element.businessObject.places = without(element.businessObject.places, olcPlaces);
            this.get('eventBus').fire('element.changed', {
                element
            });
        });
}

