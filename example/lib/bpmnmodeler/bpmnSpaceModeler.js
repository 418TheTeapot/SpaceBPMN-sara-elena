import BpmnModeler from 'bpmn-js/lib/Modeler';
import { without } from 'min-dash';
import bpmnExtension from './moddle/bpmnextension.json';
import spacePropertiesProviderModule from '../bpmnmodeler/spacePropertiesPanel/spacePropertiesProvider/index.js';
import spaceModdleDescriptor from '../bpmnmodeler/spacePropertiesPanel/descriptors/space.json';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import executionTimeDescriptor from '../bpmnmodeler/exectionTime/descriptors/time.json';
import OlcElementFactory from "../olcmodeler/modeling/OlcElementFactory";
import OlcUpdater from "../olcmodeler/modeling/OlcUpdater";
import olc from '../olcmodeler/moddle/olc.json';

import OlcRenderer from "../olcmodeler/draw/OlcRenderer";
import inherits from 'inherits';

export default function BpmnSpaceModeler(options) {
    const customModules = [
        spacePropertiesProviderModule,
        {
            'olcElementFactory': ['type', OlcElementFactory],
            'olcUpdater': ['type', OlcUpdater],
            'olcRenderer': ['type', OlcRenderer],

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
        JP: bpmnExtension,
        SA:olc
    };

    BpmnModeler.call(this, options);

    // Inizializzazione delle componenti per Olc
    // const moddle = this.get('moddle');
    // const elementRegistry = this.get('elementRegistry');
    // const eventBus = this.get('eventBus');
    // const connectionDocking = this.get('connectionDocking');
    // this._canvaspace = {
    //     canvas: this.get('canvas')
    // };
    // const canvas = this._canvaspace.canvas;
    //
    // this._elementFactory = new OlcElementFactory(moddle, elementRegistry);
    // this._updater = new OlcUpdater(eventBus, connectionDocking);
    // this._renderer = new OlcRenderer(eventBus, {}, canvas, 1000);

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



// Nuova funzione per aggiungere una connessione tra due Places
// BpmnSpaceModeler.prototype.addConnectionBetweenPlaces = function(place1Id, place2Id) {
//     const place1 = this.get('elementRegistry').get(place1Id);
//     const place2 = this.get('elementRegistry').get(place2Id);
//
//     const canvas = this._canvaspace.canvas;
//
//     if (!place1 || !place2) {
//         throw new Error('Una o entrambe le Place specificate non esistono.');
//     }
//
//     const connectionBusinessObject = this._elementFactory.createBusinessObject('space:Transition', { name: 'Connection' });
//
//     const connection = this._elementFactory.create('connection', {
//         type: 'space:Transition',
//         businessObject: connectionBusinessObject,
//         source: place1,
//         target: place2,
//         waypoints: this._updater.connectionWaypoints(place1, place2),
//     });
//
//     canvas.addConnection(connection);
//
//     connection.businessObject.sourcePlace = place1.businessObject;
//     connection.businessObject.targetPlace = place2.businessObject;
//     this._updater.linkToBusinessObjectParent(connection);
//
//     this._renderer.drawConnection(canvas.getGraphics(connection), connection);
// };
