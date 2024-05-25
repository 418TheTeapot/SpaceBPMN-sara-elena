import inherits from 'inherits';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {without} from 'min-dash';
import bpmnExtension from './moddle/bpmnextension.json';
import spacePropertiesProviderModule from '../bpmnmodeler/spacePropertiesPanel/spacePropertiesProvider/index.js';
import spaceModdleDescriptor from '../bpmnmodeler/spacePropertiesPanel/descriptors/space.json';
import {is} from 'bpmn-js/lib/util/ModelUtil';
import executionTimeDescriptor from '../bpmnmodeler/exectionTime/descriptors/time.json';
import OlcElementFactory from "../olcmodeler/modeling/OlcElementFactory";
import olc from '../olcmodeler/moddle/olc.json';
import OlcUpdater from "../olcmodeler/modeling/OlcUpdater";
import OlcModeling from "../olcmodeler/modeling/OlcModeling";
import OlcRenderer from "../olcmodeler/draw/OlcRenderer";

export default function BpmnSpaceModeler(options) {
    const customModules = [
        spacePropertiesProviderModule,
        {
            'olcElementFactory': ['type', OlcElementFactory],
            'olcUpdater': ['type', OlcUpdater],
            'olcModeling': ['type', OlcModeling],
            'olcRenderer': ['type', OlcRenderer], // Corrected here
            spaceModeler: ['value', this],
        }
    ];


    options.additionalModules = [
        ...customModules,
        ...(options.additionalModules || [])
    ];

    options.moddleExtensions = {
        space: spaceModdleDescriptor,
        time: executionTimeDescriptor,
        JP: bpmnExtension,
        SA: olc
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

// Metodi della classe BpmnSpaceModeler
BpmnSpaceModeler.prototype.handleOlcListChanged = function (places, dryRun=false) {
    this._places = places;
}



BpmnSpaceModeler.prototype.handleShapeChanged = function (shapes1, dryRun=false) {
    this._shapes = shapes1;
}

BpmnSpaceModeler.prototype.handleCanvaChanged = function (canvas1, dryRun=false) {
    this._canvaspace = canvas1;
}

BpmnSpaceModeler.prototype.getDataObjectReferencesInState = function (olcState) {
    return this.get('elementRegistry').filter((element, gfx) =>
        is(element, 'bpmn:Task') && is(element,'bpmn:Participant') &&
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

