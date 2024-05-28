import BpmnModeler from 'bpmn-js/lib/Modeler';
import {assign, without} from 'min-dash';
import bpmnExtension from './moddle/bpmnextension.json';
import spacePropertiesProviderModule from '../bpmnmodeler/spacePropertiesPanel/spacePropertiesProvider/index.js';
import spaceModdleDescriptor from '../bpmnmodeler/spacePropertiesPanel/descriptors/space.json';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import executionTimeDescriptor from '../bpmnmodeler/exectionTime/descriptors/time.json';
import OlcElementFactory from "../olcmodeler/modeling/OlcElementFactory";
import OlcUpdater from "../olcmodeler/modeling/OlcUpdater";
import olcModdleDescriptor from '../olcmodeler/moddle/olc.json';

import OlcRenderer from "../olcmodeler/draw/OlcRenderer";
import inherits from 'inherits';
import OlcModdle from "../olcmodeler/moddle/OlcModdle";



import OlcDescriptors from '../olcmodeler/moddle/olc.json';

console.log('Inizializzazione OlcModdle', { olc: olcModdleDescriptor });
const olcModdle = new OlcModdle({ olc: olcModdleDescriptor });
const olcElementFactory = new OlcElementFactory(olcModdle);
console.log('OlcElementFactory inizializzato:', olcElementFactory);
console.log('OlcModdle inizializzato:', olcModdle);

export default function BpmnSpaceModeler(options) {
    const customModules = [
        spacePropertiesProviderModule,
        {
            'olcElementFactory': ['value', olcElementFactory],
            'olcUpdater': ['type', OlcUpdater],
            'olcRenderer': ['type', OlcRenderer],
            'olcModdle': ['value', olcModdle],
            spaceModeler: ['value', this]
        }
    ];
    options.additionalModules = [
        ...customModules,
        ...(options.additionalModules || [])
    ];

    options.moddleExtensions = {
        space: spaceModdleDescriptor,
        time: executionTimeDescriptor,
        JP: bpmnExtension
    };

    BpmnModeler.call(this, options);



    this.get('eventBus').on('moddleCopy.canCopyProperty', function(context) {
        if (context.propertyName === 'JP:places' || context.propertyName === 'JP:shapes' || context.propertyName === 'JP:canvaspace') {
            console.log(context.property);
            return context.property;
        }
    });
}

inherits(BpmnSpaceModeler, BpmnModeler);

BpmnSpaceModeler.prototype.handleOlcListChanged = function (places, dryRun = false) {
    this._places = places;
}

BpmnSpaceModeler.prototype.handleShapeChanged = function (shapes1, dryRun = false) {
    this._shapes = shapes1;
}

BpmnSpaceModeler.prototype.handleCanvaChanged = function (canvas1, dryRun = false) {
    this._canvaspace = canvas1;
}

BpmnSpaceModeler.prototype.getDataObjectReferencesInState = function (olcState) {
    return this.get('elementRegistry').filter((element, gfx) =>
        is(element, 'bpmn:Task') && is(element, 'bpmn:Participant') &&
        element.type !== 'label' &&
        element.businessObject.places
    );
}

BpmnSpaceModeler.prototype.handleStateDeleted = function (olcPlaces) {
    this.getDataObjectReferencesInState(olcPlaces).forEach((element, gfx) => {
        element.businessObject.places = without(element.businessObject.places, olcPlaces);
        this.get('eventBus').fire('element.changed', {
            element
        });
    });
}



