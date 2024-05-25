import inherits from 'inherits';
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { remove as collectionRemove } from 'diagram-js/lib/util/Collections';
import { getBusinessObject } from "../../util/Util";

export default function OlcUpdater(eventBus, connectionDocking) {
    CommandInterceptor.call(this, eventBus);
    this._connectionDocking = connectionDocking;
    const self = this;

    this.executed(['connection.layout', 'connection.create'], this.cropConnection.bind(this));
    this.reverted(['connection.layout'], this.revertCrop.bind(this));
    this.executed(['shape.create', 'connection.create'], this.linkToParent.bind(this));
    this.executed(['shape.delete', 'connection.delete'], this.removeFromParent.bind(this));
    this.executed(['connection.create'], this.setConnectionPlaces.bind(this));
    this.executed(['shape.create', 'shape.move'], this.updateShapeCoordinates.bind(this));
}

inherits(OlcUpdater, CommandInterceptor);

OlcUpdater.$inject = [
    'eventBus',
    'connectionDocking'
];

OlcUpdater.prototype.cropConnection = function(e) {
    var context = e.context,
        hints = context.hints || {},
        connection = context.connection;

    if (!context.cropped && hints.createElementsBehavior !== false) {
        console.log('Taglio della connessione:', connection);
        connection.waypoints = this.connectionWaypoints(connection.source, connection.target);
        console.log('Waypoints dopo il taglio:', connection.waypoints);
        context.cropped = true;
    }
};

OlcUpdater.prototype.revertCrop = function(e) {
    delete e.context.cropped;
};

OlcUpdater.prototype.linkToParent = function(event) {
    var context = event.context,
        element = context.shape || context.connection;

    console.log('Collegamento al business object parent per l\'elemento:', element);
    this.linkToBusinessObjectParent(element);
};

OlcUpdater.prototype.removeFromParent = function(event) {
    var context = event.context,
        element = context.shape || context.connection;

    console.log('Rimozione dal business object parent per l\'elemento:', element);
    this.removeFromBusinessObjectParent(element);
};

OlcUpdater.prototype.setConnectionPlaces = function(event) {
    var context = event.context,
        element = context.connection;

    console.log('Impostazione dei place di origine e destinazione per la connessione:', element);
    element.businessObject.sourcePlace = element.source.businessObject;
    element.businessObject.targetPlace = element.target.businessObject;
};

OlcUpdater.prototype.updateShapeCoordinates = function(event) {
    var element = event.context.shape;
    var { x, y } = element;
    var businessObject = element.businessObject;

    console.log('Aggiornamento delle coordinate per la shape:', element);
    businessObject.set('x', x);
    businessObject.set('y', y);
};

// Funzione helper per ottenere il centro di una forma
function center(shape) {
    return {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2
    };
}

OlcUpdater.prototype.connectionWaypoints = function(source, target) {
    var connection = { source, target };

    console.log('Calcolo dei waypoints per la connessione:', connection);

    if (connection.source === connection.target) {
        connection.waypoints = reflectiveEdge(connection.source);
    } else {
        connection.waypoints = [center(connection.source), center(connection.target)];
    }

    console.log('Waypoints prima del taglio:', connection.waypoints);

    connection.waypoints = this._connectionDocking.getCroppedWaypoints(connection);

    console.log('Waypoints dopo il taglio:', connection.waypoints);

    return connection.waypoints;
};

OlcUpdater.prototype.linkToBusinessObjectParent = function(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = element.parent.businessObject;

    console.log('Collegamento dell\'elemento al business object parent:', element, parentBusinessObject);
    parentBusinessObject.get('Elements').push(businessObject);
    businessObject.$parent = parentBusinessObject;
};

OlcUpdater.prototype.removeFromBusinessObjectParent = function(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = businessObject.$parent;

    console.log('Rimozione dell\'elemento dal business object parent:', element, parentBusinessObject);
    collectionRemove(parentBusinessObject.get('Elements'), businessObject);
    businessObject.$parent = undefined;
};

function reflectiveEdge(element) {
    var { x, y, width, height } = element;
    var centerP = center(element);
    var topRight = { x: x + width, y: y };
    var dx = width / 10, dy = height / 10;
    return [
        { x: centerP.x - dx, y: centerP.y - dy },
        { x: topRight.x - dx, y: topRight.y - dy },
        { x: topRight.x + dx, y: topRight.y + dy },
        { x: centerP.x + dx, y: centerP.y + dy }
    ];
}
