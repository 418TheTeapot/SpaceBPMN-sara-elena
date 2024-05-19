import inherits from 'inherits';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { without } from 'min-dash';
import bpmnExtension from './moddle/bpmnextension.json';
import spacePropertiesProviderModule from '../bpmnmodeler/spacePropertiesPanel/spacePropertiesProvider/index.js'
import spaceModdleDescriptor from '../bpmnmodeler/spacePropertiesPanel/descriptors/space.json'
import { is } from 'bpmn-js/lib/util/ModelUtil';
import executionTimeDescriptor from '../bpmnmodeler/exectionTime/descriptors/time.json'
import OlcElementFactory from "../olcmodeler/modeling/OlcElementFactory";
import OlcModdle from "../olcmodeler/moddle";

import olc from '../olcmodeler/moddle/olc.json'
import OlcModeler from "../olcmodeler/OlcModeler";



export default function BpmnSpaceModeler(options) {
//modeler for bpmn



const customModules = [
   // globalPositionProviderModule,
    spacePropertiesProviderModule,
    //executionTimeProvider,

        {
            'olcElementFactory': ['type', OlcElementFactory],
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
        SA:olc
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

// In BpmnSpaceModeler.js

BpmnSpaceModeler.prototype.createTransition = function(sourcePlaceId, targetPlaceId) {
  // Get the olcElementFactory from your OlcModeler
  const olcElementFactory = this.get('olcElementFactory');
  console.log("In bpmn olcElementFactory", olcElementFactory)

  // Get the source and target places from your list of places
  const sourcePlace = this.getStateById(sourcePlaceId);
  const targetPlace = this.getStateById(targetPlaceId);

  // Create a new space:Transition object
  const transition = olcElementFactory.createTransition(sourcePlace, targetPlace, this.get('olcUpdater').connectionWaypoints(sourcePlace, targetPlace));

  // Add the transition to the canvas
  this.get('canvas').addConnection(transition);

  return transition;
};


