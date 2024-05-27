import inherits from 'inherits';
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { remove as collectionRemove } from 'diagram-js/lib/util/Collections';
import { getBusinessObject } from "../../util/Util";

export default function OlcUpdater(eventBus, connectionDocking) {
    CommandInterceptor.call(this, eventBus);
    this._connectionDocking = connectionDocking;
    self = this;

    // connection cropping //////////////////////
    // crop connection ends during create/update
    function cropConnection(e) {
        var context = e.context,
            hints = context.hints || {},
            connection = context.connection;

        if (!context.cropped && hints.createElementsBehavior !== false) {
            connection.waypoints = self.connectionWaypoints(connection.source, connection.target);
            context.cropped = true;
        }
    }

    this.executed([
        'connection.layout',
        'connection.create'
    ], cropConnection);

    this.reverted(['connection.layout'], function (e) {
        delete e.context.cropped;
    });

    this.executed([
        'shape.create',
        'connection.create'
    ], (event) => {
        var context = event.context,
            element = context.shape || context.connection;

        self.linkToBusinessObjectParent(element);  // Usa il metodo del prototipo
    });

    this.executed([
        'shape.delete',
        'connection.delete'
    ], (event) => {
        var context = event.context,
            element = context.shape || context.connection;

        self.removeFromBusinessObjectParent(element);  // Usa il metodo del prototipo
    });

    this.executed([
        'connection.create'
    ], (event) => {
        var context = event.context,
            element = context.connection;

        element.businessObject.sourcePlace = element.source.businessObject;
        element.businessObject.targetPlace = element.target.businessObject;
    });

    this.executed([
        'shape.create',
        'shape.move'
    ], event => {
        var element = event.context.shape;
        var { x, y } = element;
        var businessObject = element.businessObject;
        businessObject.set('x', x);
        businessObject.set('y', y);
    });
}

inherits(OlcUpdater, CommandInterceptor);

OlcUpdater.$inject = [
    'eventBus',
    'connectionDocking'
];

OlcUpdater.prototype.linkToBusinessObjectParent = function(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = element.parent.businessObject;
    console.log(businessObject);
    parentBusinessObject.get('Elements').push(businessObject);
    businessObject.$parent = parentBusinessObject;
};

OlcUpdater.prototype.removeFromBusinessObjectParent = function(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = businessObject.$parent;

    collectionRemove(parentBusinessObject.get('Elements'), businessObject);
    businessObject.$parent = undefined;
};

//TODO move to common utils
function center(shape) {
    console.log('Calculating center for shape:', shape);
    // Handle NaN values
    var x = isNaN(shape.x) ? 0 : shape.x;
    var y = isNaN(shape.y) ? 0 : shape.y;
    return {
        x: x + shape.width / 2,
        y: y + shape.height / 2
    };
}

OlcUpdater.prototype.connectionWaypoints = function(source, target) {
    console.log('Calculating waypoints for source:', source, 'and target:', target);

    // Check if source and target have valid coordinates
    if (isNaN(source.x) || isNaN(source.y) || isNaN(target.x) || isNaN(target.y)) {
        console.error('Invalid coordinates for source or target:', source, target);
        return [];  // Return an empty array if coordinates are invalid
    }

    // Handle NaN values
    source.x = isNaN(source.x) ? 0 : source.x;
    source.y = isNaN(source.y) ? 0 : source.y;
    target.x = isNaN(target.x) ? 0 : target.x;
    target.y = isNaN(target.y) ? 0 : target.y;

    var connection = {source, target};
    if (connection.source === connection.target) {
        console.log('Creating reflective edge');
        connection.waypoints = reflectiveEdge(connection.source);
    } else {
        console.log('Creating direct waypoints');
        console.log('Source coordinates:', source.x, source.y);
        console.log('Target coordinates:', target.x, target.y);
        connection.waypoints = [center(connection.source), center(connection.target)];
    }

    console.log('Raw waypoints:', connection.waypoints);

    connection.waypoints = this._connectionDocking.getCroppedWaypoints(connection);
    console.log('Cropped waypoints:', connection.waypoints);

    return connection.waypoints;
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

export function linkToBusinessObjectParent(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = element.parent.businessObject;
    console.log(businessObject);
    parentBusinessObject.get('Elements').push(businessObject);
    businessObject.$parent = parentBusinessObject;
}

export function removeFromBusinessObjectParent(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = businessObject.$parent;

    collectionRemove(parentBusinessObject.get('Elements'), businessObject);
    businessObject.$parent = undefined;
}
