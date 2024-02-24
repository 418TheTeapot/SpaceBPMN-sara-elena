import inherits from 'inherits';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { without } from 'min-dash';
import bpmnExtension from './moddle/bpmnextension.json';
import spacePropertiesProviderModule from '../bpmnmodeler/spacePropertiesPanel/spacePropertiesProvider/index.js'
import spaceModdleDescriptor from '../bpmnmodeler/spacePropertiesPanel/descriptors/space.json'
import { is } from 'bpmn-js/lib/util/ModelUtil';
//import executionTimeProvider from '../bpmnmodeler/exectionTime/executionTimeProvider/index.js'
import executionTimeDescriptor from '../bpmnmodeler/exectionTime/descriptors/time.json'
export default function BpmnSpaceModeler(options) {
//modeler for bpmn

const customModules = [
   // globalPositionProviderModule,
    spacePropertiesProviderModule,
    //executionTimeProvider,

        {
            spaceModeler: ['value', this]
        }

    ];
    options.additionalModules = [
        ...customModules,
        ...(options.additionalModules || [])
    ];

    options.moddleExtensions = {
        //global:globalModdleDescriptor,
        space: spaceModdleDescriptor,
        time: executionTimeDescriptor,
        JP: bpmnExtension
    };

    BpmnModeler.call(this, options);
    //Explicitely allow the copying of references (to objects outside the fragment modeler)
    // See https://github.com/bpmn-io/bpmn-js/blob/212af3bb51840465e5809345ea3bb3da86656be3/lib/features/copy-paste/ModdleCopy.js#L218
    this.get('eventBus').on('moddleCopy.canCopyProperty', function(context) {
        if (context.propertyName === 'JP:places' || context.propertyName === 'JP:shapes' ||context.propertyName === 'JP:canvaspace') {
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


