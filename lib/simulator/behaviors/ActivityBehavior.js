import { is } from "../../../example/lib/util/Util";
import WeightedGraph from '../util/WeightedGraph';
import TimeUtil from '../util/TimeUtil';
import AssignmentUtil from "../util/AssignmentUtil";
import { isEventSubProcess, isMessageFlow, isSequenceFlow } from "../util/ModelUtil";
import EventBehaviors from './EventBehaviors';



const HIGH_PRIORITY = 1500;
let rootArray = [];
let updateAssignmentTriggered = false;  // Flag to track if updateAssignment has been set

export default function ActivityBehavior(
    simulator,
    scopeBehavior,
    transactionBehavior,
    animation,
    elementRegistry,
    spaceModeler,
    eventBus,
    pauseSimulation,
    olcModdle
) {
  this._simulator = simulator;
  this._scopeBehavior = scopeBehavior;
  this._transactionBehavior = transactionBehavior;
  this._animation = animation;
  this._elementRegistry = elementRegistry;
  this._spaceModeler = spaceModeler;
  this._eventBus = eventBus;
  this._pauseSimulation = pauseSimulation;
  this._time = new TimeUtil(0);
  this._olcModdle = olcModdle;

  this._eventBehaviors = new EventBehaviors(simulator, elementRegistry, scopeBehavior, this);

  this._alertsShown = {};

  this._registerBehaviors(simulator);

  // Register resetSimulation event listener
  this._eventBus.on('animation.end', () => {
    this.resetSimulation();
  });
}

ActivityBehavior.$inject = [
  'simulator',
  'scopeBehavior',
  'transactionBehavior',
  'animation',
  'elementRegistry',
  'spaceModeler',
  'eventBus',
  'pauseSimulation',
  'olcModdle'
];

ActivityBehavior.prototype._registerBehaviors = function(simulator) {
  const elements = [
    'bpmn:BusinessRuleTask',
    'bpmn:CallActivity',
    'bpmn:ManualTask',
    'bpmn:ScriptTask',
    'bpmn:ServiceTask',
    'bpmn:Task',
    'bpmn:UserTask',
    'space:Transition'
  ];

  elements.forEach(element => simulator.registerBehavior(element, this));

  const boundaryEvents = [
    'bpmn:BoundaryEvent',
    'bpmn:IntermediateCatchEvent',
    'bpmn:ConditionalEventDefinition'
  ];

  boundaryEvents.forEach(element => {
    simulator.registerBehavior(element, this);
    console.log('Boundary event registered:', element);
  });
};

ActivityBehavior.prototype.processAssignments = function(context) {
  const { element } = context;
  const assignmentObj = AssignmentUtil.parseElementAssignment(element.businessObject.assignment);

  if (assignmentObj.add && Array.isArray(assignmentObj.add)) {
    assignmentObj.add.forEach(addAssignment => {
      if (typeof addAssignment === 'string') {
        addAssignment = addAssignment.split('.');
      }
      this.addPlacesAndTransition({ add: addAssignment });
    });
  }

  if (assignmentObj.delete && Array.isArray(assignmentObj.delete)) {
    assignmentObj.delete.forEach(deleteAssignment => {
      const connectionToDelete = AssignmentUtil.findTransitionByName(deleteAssignment, this._spaceModeler);
      if (connectionToDelete) {
        const canvas = this._spaceModeler._canvaspace.canvas;
        canvas.removeConnection(connectionToDelete);
        canvas._elementRegistry.remove(connectionToDelete);
      }
    });
  }

  const updated = this._updatePlaceAssignments(assignmentObj, element);

  // Nuova logica per impostare la condizione nello start event di un altro processo
  if (updated && !updateAssignmentTriggered) {  // Imposta la condizione solo se c'è stato un aggiornamento
    const conditionalStartEvents = this.findConditionalStartEventInOtherProcesses();
    conditionalStartEvents.forEach(event => {
      const startEventConditional = this._elementRegistry.get(event.element.id);
      if (startEventConditional) {
        startEventConditional.businessObject.eventDefinitions[0].condition = 'updateAssignment';
        updateAssignmentTriggered = true;  // Imposta il flag per indicare che la condizione è stata attivata
        const eventContext = {
          element: startEventConditional,
          scope: this._simulator.findScope({ element: event.parent })
        };
        console.log('Event context:', eventContext);
        const eventBehavior = this._eventBehaviors.get(startEventConditional);
        if (eventBehavior) {
          return eventBehavior.call(this, eventContext);
        } else {
          console.warn('No behavior found for conditional start event');
        }
      }
    });
  }
};

ActivityBehavior.prototype._updatePlaceAssignments = function(assignmentObj, element) {
  console.log('Starting _updatePlaceAssignments');
  const places = this._spaceModeler._places.get('Elements');
  const placeNames = places.map(place => place.name);
  let updated = false;

  Object.keys(assignmentObj).forEach(placeName => {
    if (placeNames.includes(placeName)) {
      const placeAssignments = assignmentObj[placeName];
      Object.keys(placeAssignments).forEach(key => {
        const alertKey = `${placeName}-${key}`;
        if (!this._alertsShown[alertKey]) {
          alert(`Il luogo ${placeName} ha l'assegnamento ${key} impostato su ${placeAssignments[key]}`);
          this._alertsShown[alertKey] = true;
          updated = true;  // Set the updated flag to true
        } else {
          console.log('Alert already shown for', alertKey);
        }
      });
    } else {
      console.log('Place name not found in places:', placeName);
    }
  });

  return updated;
};

ActivityBehavior.prototype.findConditionalStartEventInOtherProcesses = function() {
  console.log('Finding conditional start events in other processes');

  // Trova tutti gli elementi nei processi
  const elements = this._elementRegistry.getAll();
  console.log('All elements:', elements);

  // Filtra solo gli start event condizionali
  const conditionalStartEvents = elements.filter(element => {
    return element.type === 'bpmn:StartEvent' && this.isConditionalStartEvent(element);
  });
  console.log('Conditional start events found:', conditionalStartEvents);

  return conditionalStartEvents.map(event => {
    const condition = this.getConditionalStartEventCondition(event);
    console.log('Event condition:', event.businessObject.eventDefinitions[0].condition);
    return { element: event, condition };
  });
};

ActivityBehavior.prototype.isConditionalStartEvent = function(element) {
  return element.businessObject.eventDefinitions &&
      element.businessObject.eventDefinitions.some(eventDefinition =>
          eventDefinition.$type === 'bpmn:ConditionalEventDefinition');
};

ActivityBehavior.prototype.getConditionalStartEventCondition = function(element) {
  const conditionalEventDefinition = element.businessObject.eventDefinitions.find(eventDefinition => eventDefinition.$type === 'bpmn:ConditionalEventDefinition');

  console.log('Conditional Event Definition:', conditionalEventDefinition);
  console.log("Name", element.businessObject.name);

  if (element.businessObject.eventDefinitions[0].condition && element.businessObject.eventDefinitions[0].condition) {
    console.log('Condition:', element.businessObject.eventDefinitions[0].condition);
    return element.businessObject.eventDefinitions[0].condition;
  } else {
    console.log('Condition is undefined');
    return null;
  }
};




ActivityBehavior.prototype.enter = function(context) {
  const { element } = context;
  console.log('Entering element:', element);

  const eventBehavior = this._eventBehaviors.get(element);
  if (eventBehavior) {
    return eventBehavior.call(this, context);
  }

  const continueEvent = this.waitAtElement(element);
  if (continueEvent) {
    return this.signalOnEvent(context, continueEvent);
  }

  this.processAssignments(context);

  const event = this._triggerMessages(context);
  if (event) {
    return this.signalOnEvent(context, event);
  }

  this._handleGuard(context);
};












ActivityBehavior.prototype._handleGuard = function(context) {
  const { element } = context;
  if (element.businessObject.guard !== undefined && element.businessObject.guard !== "") {
    const placesAdmitted = AssignmentUtil.getValidityGuard(element, this._spaceModeler._places.get('Elements'));
    let guard = false;
    for (let i = 0; i < placesAdmitted.length; i++) {
      if (element.businessObject.root === placesAdmitted[i].id) {
        guard = true;
      }
    }
    if (guard !== false) {
      this._simulator.exit(context);
    } else {
      alert("The robot is in a wrong position to do the task");
    }
  } else {
    this._simulator.exit(context);
  }
};





ActivityBehavior.prototype.signal = function(context) {
  const { element } = context;

  const eventBehavior = this._eventBehaviors.get(element);
  if (eventBehavior) {
    return eventBehavior.call(this, context);
  }
  const event = this._triggerMessages(context);
  if (event) {
    return this.signalOnEvent(context, event);
  }
  this._simulator.exit(context);
};

ActivityBehavior.prototype.addPlacesAndTransition = function(assignmentObj) {
  const olcElementFactory = this._spaceModeler.get('olcElementFactory');
  const olcUpdater = this._spaceModeler.get('olcUpdater');
  const canvas = this._spaceModeler._canvaspace.canvas;

  if (!assignmentObj.add || !Array.isArray(assignmentObj.add) || assignmentObj.add.length < 2) {
    console.error('Please provide an array with at least two place names in the add assignment.');
    return;
  }

  let previousPlace = null;
  const rootElement = canvas.getRootElement();

  assignmentObj.add.forEach((placeName, index) => {
    let place = AssignmentUtil.findPlaceByName(placeName, this._spaceModeler);

    if (!place) {
      const placeBusinessObject = olcElementFactory.createBusinessObject('space:Place', { 'name': placeName });

      place = olcElementFactory.createShape({
        type: 'space:Place',
        businessObject: placeBusinessObject,
        id: placeBusinessObject.id,
        x: 100 + index * 200,
        y: 100,
      });

      console.log('Creating place:', place);
      canvas.addShape(place, rootElement);

      // Link place to its parent business object
      olcUpdater.linkToBusinessObjectParent(place);
      console.log('Place added to canvas:', place);
    } else {
      console.log(`Place ${placeName} already exists:`, place);
    }

    if (previousPlace) {
      const connectionBusinessObject = olcElementFactory.createBusinessObject('space:Transition', { name: '1' });
      const connection = olcElementFactory.createConnection({
        type: 'space:Transition',
        businessObject: connectionBusinessObject,
        id: connectionBusinessObject.id,
        source: previousPlace,
        target: place,
        waypoints: olcUpdater.connectionWaypoints(previousPlace, place)
      });
      canvas.addConnection(connection);

      connection.businessObject.sourcePlace = previousPlace.businessObject;
      connection.businessObject.targetPlace = place.businessObject;
      olcUpdater.linkToBusinessObjectParent(connection);
    }

    previousPlace = place;
  });
};

ActivityBehavior.prototype._handleDestination = function(context, element, activatedFlows, parentScope, scope) {
  if (element.businessObject.destination) {
    if (element.parent.businessObject.root) {
      if (element.businessObject.destination === element.parent.businessObject.root) {
        alert("The initial position must not be the destination");
      } else {
        this._processDestination(context, element, activatedFlows, parentScope, scope);
      }
    } else {
      alert("Please select an initial position for the Participant " + element.parent.businessObject.name);
    }
  }
};


ActivityBehavior.prototype._handleBoundaryEvents = function(element, context, scope) {
  const conditionalEvent = this._findBoundaryEvent(element);

  if (conditionalEvent) {
    console.log('Conditional boundary event trovato:', conditionalEvent);
    console.log('Condizione corrente dell\'evento:', conditionalEvent.businessObject.eventDefinitions[0].condition);

    const eventContext = {
      element: conditionalEvent,
      scope: scope
    };

    const eventBehavior = this._eventBehaviors.get(conditionalEvent);
    if (eventBehavior) {
      console.log('Attivazione del comportamento dell\'evento condizionale');
      return eventBehavior.call(this, eventContext);
    } else {
      console.warn('No behavior found for conditional event');
    }
  }
  return false;
};

ActivityBehavior.prototype._processDestination = function(context, element, activatedFlows, parentScope, scope) {
  const flows = this.getSpaceWeighedPath(context);
  let timespace = this.getSpaceExecutionTime(context);

  if (!element.businessObject.duration) {
    element.businessObject.duration = 0;
  }

  this._time.addTime(element.businessObject.duration);
  this._time.addTime(timespace);
  const timex = Object.values(this._time);

  element.businessObject.$parent.executionTime = timex[0];

  // Verifica sempre gli eventi di boundary condizionali
  const handled = this._handleBoundaryEvents(element, context, scope);
  if (handled) {
    return;
  }

  if (flows.length === 0) {
    console.warn('Destination not reachable');
    alert("Destination not reachable");
    this._simulator.exit(context);
    alert("FINISH EVERYTHING");
  } else {
    this._handleConnections(flows, activatedFlows, parentScope);
  }
};

ActivityBehavior.prototype.exit = function(context) {
  const { element, scope } = context;
  const parentScope = scope.parent;
  const complete = !scope.failed;

  // Verifica gli eventi di boundary condizionali prima di uscire
  const handled = this._handleBoundaryEvents(element, context, scope);
  if (handled) {
    return;
  }

  if (complete && !isEventSubProcess(element)) {
    this._transactionBehavior.registerCompensation(scope);
  }

  const activatedFlows = complete ? element.outgoing.filter(isSequenceFlow) : [];

  this._handleDestination(context, element, activatedFlows, parentScope, scope);

  if (!element.businessObject.destination || element.businessObject.destination === "") {
    this._addExecutionTime(element);
    this._activateFlows(activatedFlows, parentScope, scope);
  }
};

ActivityBehavior.prototype._findBoundaryEvent = function(element) {
  return element.attachers.find(attacher =>
      attacher.businessObject.$type === 'bpmn:BoundaryEvent' &&
      attacher.businessObject.eventDefinitions[0].$type === 'bpmn:ConditionalEventDefinition' &&
      attacher.host.businessObject.$type === 'bpmn:Task'
  );
};




ActivityBehavior.prototype._handleConnections = function(flows, activatedFlows, parentScope) {
  const connections = flows.map(flow => {
    const element = this._spaceModeler._canvaspace.canvas._elementRegistry._elements[flow.id];
    if (!element || !element.element) {
      console.warn('Element not found for flow:', flow.id);
      return null;
    }
    return element.element;
  }).filter(Boolean);

  if (connections.length > 0) {
    const element = connections.shift();
    element['connections'] = connections;
    element['activatedFlows'] = activatedFlows;

    this._simulator.enter({
      element,
      scope: parentScope,
      parentScope: parentScope
    });
  }
};

ActivityBehavior.prototype._addExecutionTime = function(element) {
  if (!element.businessObject.duration) {
    element.businessObject.duration = 0;
  }
  this._time.addTime(element.businessObject.duration);
  const timex = Object.values(this._time);
  element.businessObject.$parent.executionTime = timex[0];
};

ActivityBehavior.prototype._activateFlows = function(activatedFlows, parentScope, scope) {
  activatedFlows.forEach(flowElement => this._simulator.enter({
    element: flowElement,
    scope: parentScope
  }));

  if (activatedFlows.length === 0) {
    this._scopeBehavior.tryExit(parentScope, scope);
  }
};

ActivityBehavior.prototype.getSpaceWeighedPath = function(context) {
  const { element } = context;

  const places = this._spaceModeler._places.get('Elements');
  const place = places.filter(e => is(e, 'space:Place'));
  const connections = places.filter(e => is(e, 'space:Transition'));

  const root = getRoot(element, places);
  rootArray.push(root);
  const goal = getDestination(element, places);

  const g = new WeightedGraph();
  place.forEach(p => g.addVertex(p.id));
  connections.forEach(conn => {
    const weight = parseInt(conn.name);
    if (!isNaN(weight)) {
      g.addEdge(conn.sourcePlace.id, conn.targetPlace.id, weight);
    } else {
      console.error(`Il peso della transizione ${conn.name} non è un numero valido.`);
      alert(`Invalid weight on transition ${conn.name}`);
    }
  });

  const shortestPath = g.Dijkstra(root, goal);
  const fullPath = shortestPath.slice(1).map((id, index) => {
    const connection = connections.find(c => c.sourcePlace.id === shortestPath[index] && c.targetPlace.id === id);
    if (!connection) {
      console.warn('Connessione non trovata per il percorso più breve:', shortestPath[index], id);
      return null;
    }
    return connection;
  }).filter(Boolean);

  if (fullPath.length > 0) {
    element.parent.businessObject.root = fullPath[fullPath.length - 1].targetPlace.id;
    if (fullPath.length > 1) {
      element.businessObject.destination = fullPath[1].targetPlace.id;
    }
  } else {
    console.warn('Percorso completo non trovato.');
  }

  return fullPath;
};

ActivityBehavior.prototype.getSpaceExecutionTime = function(context) {
  const { element } = context;
  const flows = this.getSpaceWeighedPath(context);
  const totalDistance = flows.reduce((sum, flow) => sum + parseInt(flow.name), 0);
  const velocity = element.businessObject.velocity || 1;
  return totalDistance / velocity;
};

ActivityBehavior.prototype.signalOnEvent = function(context, event) {
  const { scope, element } = context;
  console.log(context);
  const subscription = this._simulator.subscribe(scope, event, initiator => {
    console.log(subscription);

    subscription.remove();

    return this._simulator.signal({
      scope,
      element,
      initiator
    });
  });
};

ActivityBehavior.prototype.waitAtElement = function(element) {
  const wait = this._simulator.getConfig(element).wait;
  return wait && {
    element,
    type: 'continue',
    interrupting: false,
    boundary: false
  };
};

ActivityBehavior.prototype._getMessageContexts = function(element, after = null) {
  const filterAfter = after ? ctx => ctx.referencePoint.x > after.x : () => true;
  const sortByReference = (a, b) => a.referencePoint.x - b.referencePoint.x;

  return [
    ...element.incoming.filter(isMessageFlow).map(flow => ({
      incoming: flow,
      referencePoint: last(flow.waypoints)
    })),
    ...element.outgoing.filter(isMessageFlow).map(flow => ({
      outgoing: flow,
      referencePoint: first(flow.waypoints)
    }))
  ].sort(sortByReference).filter(filterAfter);
};

ActivityBehavior.prototype._triggerMessages = function(context) {
  const { element, initiator, scope } = context;

  let messageContexts = scope.messageContexts;

  if (!messageContexts) {
    messageContexts = scope.messageContexts = this._getMessageContexts(element);
  }

  const initiatingFlow = initiator && initiator.element;

  if (isMessageFlow(initiatingFlow)) {
    if (scope.expectedIncoming !== initiatingFlow) {
      console.debug('Simulator :: ActivityBehavior :: ignoring out-of-bounds message');
      return;
    }
  }

  while (messageContexts.length) {
    const { incoming, outgoing } = messageContexts.shift();

    if (incoming) {
      if (!initiator) {
        continue;
      }
      scope.expectedIncoming = incoming;
      return {
        element,
        type: 'message',
        name: incoming.id,
        interrupting: false,
        boundary: false
      };
    }

    this._simulator.signal({
      element: outgoing
    });
  }
};


//Helpersss
function first(arr) {
  return arr && arr[0];
}

function last(arr) {
  return arr && arr[arr.length - 1];
}
function getRoot(element, places) {
  if (element && element.parent && element.parent.businessObject) {
    const rootId = element.parent.businessObject.root;
    const rootPlace = places.find(place => place.id === rootId);
    return rootPlace ? rootPlace.id : null;
  } else {
    return null;
  }
}

function getDestination(element, places) {
  if (element && element.businessObject) {
    const destinationId = element.businessObject.destination;
    const destinationPlace = places.find(place => place.id === destinationId);
    return destinationPlace ? destinationPlace.id : null;
  } else {
    return null;
  }
}

function getNameRoot(rootId, places) {
  const rootPlace = places.find(place => place.id === rootId);
  return rootPlace ? rootPlace.name : 'Nome sconosciuto';
}

function getNameDestination(destinationId, places) {
  const destinationPlace = places.find(place => place.id === destinationId);
  return destinationPlace ? destinationPlace.name : 'Nome sconosciuto';
}