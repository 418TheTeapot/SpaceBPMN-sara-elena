import inherits from 'inherits';
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { remove as collectionRemove } from 'diagram-js/lib/util/Collections';
import { getBusinessObject } from "../../util/Util";

export default function OlcUpdater(eventBus, connectionDocking) {
    CommandInterceptor.call(this, eventBus);
    this._connectionDocking = connectionDocking;
    const self = this;

    // connection cropping
    function cropConnection(e) {
        var context = e.context,
            hints = context.hints || {},
            connection = context.connection;

        if (!context.cropped && hints.createElementsBehavior !== false) {
            console.log('Taglio della connessione:', connection);
            connection.waypoints = self.connectionWaypoints(connection.source, connection.target);
            console.log('Waypoints dopo il taglio:', connection.waypoints);
            context.cropped = true;
        }
    }

    this.executed(['connection.layout', 'connection.create'], cropConnection);

    this.reverted(['connection.layout'], function (e) {
        delete e.context.cropped;
    });

    this.executed(['shape.create', 'connection.create'], (event) => {
        var context = event.context,
            element = context.shape || context.connection;

        console.log('Collegamento al business object parent per l\'elemento:', element);
        linkToBusinessObjectParent(element);
    });

    this.executed(['shape.delete', 'connection.delete'], (event) => {
        var context = event.context,
            element = context.shape || context.connection;

        console.log('Rimozione dal business object parent per l\'elemento:', element);
        removeFromBusinessObjectParent(element);
    });

    this.executed(['connection.create'], (event) => {
        var context = event.context,
            element = context.connection;

        console.log('Impostazione dei place di origine e destinazione per la connessione:', element);
        element.businessObject.sourcePlace = element.source.businessObject;
        element.businessObject.targetPlace = element.target.businessObject;
    });

    this.executed(['shape.create', 'shape.move'], event => {
        var element = event.context.shape;
        var { x, y } = element;
        var businessObject = element.businessObject;

        console.log('Aggiornamento delle coordinate per la shape:', element);
        businessObject.set('x', x);
        businessObject.set('y', y);
    });
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

function linkToBusinessObjectParent(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = element.parent.businessObject;

    console.log('Collegamento dell\'elemento al business object parent:', element, parentBusinessObject);
    parentBusinessObject.get('Elements').push(businessObject);
    businessObject.$parent = parentBusinessObject;
}

function removeFromBusinessObjectParent(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = businessObject.$parent;

    console.log('Rimozione dell\'elemento dal business object parent:', element, parentBusinessObject);
    collectionRemove(parentBusinessObject.get('Elements'), businessObject);
    businessObject.$parent = undefined;
}

inherits(OlcUpdater, CommandInterceptor);

OlcUpdater.$inject = [
    'eventBus',
    'connectionDocking'
];

// Helper function to get the center of a shape
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

OlcUpdater.prototype.updateElementName = function(element, newName) {
    var businessObject = getBusinessObject(element);
    if (businessObject) {
        console.log('Aggiornamento del nome dell\'elemento:', element, newName);
        businessObject.name = newName;
    }
};

OlcUpdater.prototype.updatePlaceProps = function(element, props) {
    var businessObject = getBusinessObject(element);
    if (businessObject) {
        console.log('Aggiornamento delle proprietà del place:', element, props);
        businessObject.placeProperties = props;
    }
};

// Metodo create
OlcUpdater.prototype.create = function(elements) {
    elements.forEach(element => {
        if (element.type === 'shape') {
            this.createShape(element);
        } else if (element.type === 'connection') {
            this.createConnection(element);
        }
    });
    console.log('Elementi creati:', elements);
};

OlcUpdater.prototype.createShape = function(attrs) {
    console.log('Creazione di una shape con attributi:', attrs);
    var shape = {
        type: 'shape',
        x: attrs.x,
        y: attrs.y,
        width: attrs.width,
        height: attrs.height,
        businessObject: this.createBusinessObject(attrs)
    };
    this._eventBus.fire('shape.create', { shape: shape });
};

OlcUpdater.prototype.createConnection = function(attrs) {
    console.log('Creazione di una connessione con attributi:', attrs);
    var connection = {
        type: 'connection',
        source: attrs.source,
        target: attrs.target,
        waypoints: this.connectionWaypoints(attrs.source, attrs.target),
        businessObject: this.createBusinessObject(attrs)
    };
    this._eventBus.fire('connection.create', { connection: connection });
};

OlcUpdater.prototype.createBusinessObject = function(attrs) {
    console.log('Creazione di un business object con attributi:', attrs);
    var businessObject = this._moddle.create(attrs.type, attrs);
    businessObject.id = businessObject.id || this._ids.next();
    return businessObject;
};


/*
* const updater = new OlcUpdater(eventBus, connectionDocking);
const elements = [
    { type: 'shape', x: 100, y: 100, width: 50, height: 50, name: 'Shape 1' },
    { type: 'shape', x: 200, y: 200, width: 50, height: 50, name: 'Shape 2' },
    { type: 'connection', source: sourceShape, target: targetShape, name: 'Connection 1' }
];
updater.create(elements);

* */