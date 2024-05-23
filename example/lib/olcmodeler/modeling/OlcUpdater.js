import inherits from 'inherits';
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { remove as collectionRemove } from 'diagram-js/lib/util/Collections';
import { getBusinessObject } from "../../util/Util";

export default function OlcUpdater(eventBus, connectionDocking) {
    CommandInterceptor.call(this, eventBus);
    this._connectionDocking = connectionDocking;
    const self = this;

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

    this.reverted(['connection.layout'], function(e) {
        delete e.context.cropped;
    });

    this.executed([
        'shape.create',
        'connection.create'
    ], (event) => {
        var context = event.context,
            element = context.shape || context.connection;

        linkToBusinessObjectParent(element);
    });

    this.executed([
        'shape.delete',
        'connection.delete'
    ], (event) => {
        var context = event.context,
            element = context.shape || context.connection;

        removeFromBusinessObjectParent(element);
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

    this.executed(['property.update'], (event) => {
        const { element, properties } = event.context;
        for (const propName in properties) {
            // Ensure to fire an 'element.changed' event whenever a property is updated
            eventBus.fire('element.changed', {
                element: element,
                properties: propName
            });
        }
    });
}

inherits(OlcUpdater, CommandInterceptor);

OlcUpdater.$inject = [
    'eventBus',
    'connectionDocking'
];

function linkToBusinessObjectParent(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = element.parent.businessObject;

    if (!parentBusinessObject.get('Elements')) {
        parentBusinessObject.set('Elements', []);
    }
    parentBusinessObject.get('Elements').push(businessObject);
    businessObject.$parent = parentBusinessObject;
}

function removeFromBusinessObjectParent(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = businessObject.$parent;

    if (parentBusinessObject && parentBusinessObject.get('Elements')) {
        collectionRemove(parentBusinessObject.get('Elements'), businessObject);
        businessObject.$parent = undefined;
    }
}

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

// Helper function to get the center of a shape
function center(shape) {
    return {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2
    };
}

OlcUpdater.prototype.connectionWaypoints = function(source, target) {
    var connection = { source, target };
    if (connection.source === connection.target) {
        connection.waypoints = reflectiveEdge(connection.source);
    } else {
        connection.waypoints = [center(connection.source), center(connection.target)];
    }
    connection.waypoints = this._connectionDocking.getCroppedWaypoints(connection);
    return connection.waypoints;
};

// OlcUpdater.prototype.linkToBusinessObjectParent = function(element) {
//     var businessObject = element.businessObject,
//         parentBusinessObject = element.parent.businessObject;
//
//     if (!parentBusinessObject.get('Elements')) {
//         parentBusinessObject.set('Elements', []);
//     }
//     parentBusinessObject.get('Elements').push(businessObject);
//     businessObject.$parent = parentBusinessObject;
// };

OlcUpdater.prototype.linkToBusinessObjectParent = function(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = element.parent.businessObject;

    console.log(businessObject);

    // Check if 'Elements' exists and is an array
    if (Array.isArray(parentBusinessObject.get('Elements'))) {
        parentBusinessObject.get('Elements').push(businessObject);
    } else {
        // If 'Elements' does not exist or is not an array, create it
        parentBusinessObject.set('Elements', [businessObject]);
    }

    businessObject.$parent = parentBusinessObject;
}
