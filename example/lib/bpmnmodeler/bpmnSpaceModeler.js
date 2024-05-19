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

export default function BpmnSpaceModeler(options) {
    const customModules = [
        spacePropertiesProviderModule,
        {
            'olcElementFactory': ['type', OlcElementFactory],
            'olcUpdater': ['type', OlcUpdater],
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

// Funzione per creare un place e una transizione tra due places
/**
 * NON SERVE AD UN CAZZO!
 * @param sourcePlaceData
 * @param targetPlaceData
 * @param transitionData
 */
BpmnSpaceModeler.prototype.createPlaceAndTransition = function(sourcePlaceData, targetPlaceData, transitionData) {
    const olcElementFactory = this.get('olcElementFactory');
    const olcUpdater = this.get('olcUpdater');
    // const canvas = this.get('canvas');
    const canvas = this._spaceModeler._canvaspace.canvas.get(canvas); // Ottieni correttamente il canvas

    console.log('Creating places and transition... in canvas:', canvas);

    function createPlace(placeData) {
        const placeBusinessObject = olcElementFactory.createBusinessObject('space:Place', {
            name: placeData.name,
            x: placeData.x,
            y: placeData.y
        });

        return olcElementFactory.createShape({
            type: 'space:Place',
            businessObject: placeBusinessObject,
            id: placeBusinessObject.id,
            width: placeData.width || 100,
            height: placeData.height || 100,
            parent: canvas.getRootElement() // Specifica l'elemento genitore
        });
    }

    function createTransition(sourcePlace, targetPlace, transitionData) {
        const waypoints = olcUpdater.connectionWaypoints(sourcePlace, targetPlace);

        const transitionBusinessObject = olcElementFactory.createBusinessObject('space:Transition', {
            sourceRef: sourcePlace.businessObject,
            targetRef: targetPlace.businessObject,
            waypoints: waypoints,
            name: transitionData.name
        });

        return olcElementFactory.createTransition(sourcePlace, targetPlace, waypoints);
    }

    const sourcePlace = createPlace(sourcePlaceData);
    const targetPlace = createPlace(targetPlaceData);

    canvas.addShape(sourcePlace);
    canvas.addShape(targetPlace);

    const transition = createTransition(sourcePlace, targetPlace, transitionData);

    canvas.addConnection(transition);

    console.log('Created places and transition:');
    console.log('Source Place:', sourcePlace);
    console.log('Target Place:', targetPlace);
    console.log('Transition:', transition);
}
