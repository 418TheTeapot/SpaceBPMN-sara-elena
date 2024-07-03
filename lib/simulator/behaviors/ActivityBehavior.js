// File: /mnt/data/ActivityBehavior.js

import { is } from "../../../example/lib/util/Util";
import WeightedGraph from '../util/WeightedGraph';
import TimeUtil from '../util/TimeUtil';
import AssignmentUtil from "../util/AssignmentUtil";
import { isEventSubProcess, isMessageFlow, isSequenceFlow } from "../util/ModelUtil";
import EventBehaviors from './EventBehaviors';
import { GUARD_VIOLATION_EVENT } from "../../util/EventHelper";

const HIGH_PRIORITY = 1500;

export default function ActivityBehavior(
    simulator,
    scopeBehavior,
    transactionBehavior,
    animation,
    elementRegistry,
    spaceModeler,
    eventBus,
    pauseSimulation,
    olcModdle,
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
  this._graph = new WeightedGraph();

  this._registerBehaviors(simulator);
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
  'olcModdle',
];

ActivityBehavior.prototype.addPlacesAndTransition = function (assignmentObj) {
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

      olcUpdater.linkToBusinessObjectParent(place);
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

      this._graph.addEdge(previousPlace.id, place.id, 1); // Assuming weight is 1 for simplicity
    }

    previousPlace = place;
  });

  this._updateGraph(); // Update the graph after adding new nodes and edges
};

ActivityBehavior.prototype._updateGraph = function () {
  const places = this._spaceModeler._places.get('Elements').filter(e => is(e, 'space:Place'));
  const connections = this._spaceModeler._places.get('Elements').filter(e => is(e, 'space:Transition'));

  const g = new WeightedGraph();
  places.forEach(p => g.addVertex(p.id));

  connections.forEach(conn => {
    if (conn.name !== undefined) {
      const weightStr = conn.name.trim();
      if (/^\d+$/.test(weightStr)) {
        const weight = parseInt(weightStr);
        g.addEdge(conn.sourcePlace.id, conn.targetPlace.id, weight);
      } else {
        console.error(`Il peso della transizione '${weightStr}' non è un numero valido.`);
        alert(`Invalid weight on transition ${weightStr}`);
      }
    }
  });

  this._graph = g;
  console.log("Graph updated:", g);
};

ActivityBehavior.prototype.getSpaceWeighedPath = function(context) {
  const { element } = context;

  const places = this._spaceModeler._places.get('Elements');
  const place = places.filter(e => is(e, 'space:Place'));
  const connections = places.filter(e => is(e, 'space:Transition'));

  const rootId = getRoot(element, places);
  const goalId = getDestination(element, places);

  // Ottieni i nomi della root e della destinazione
  const rootName = getNameRoot(rootId, places);
  const goalName = getNameDestination(goalId, places);

  // Log per il nome della root e della destinazione
  console.log(`Nome della root: ${rootName}`);
  console.log(`Nome della destinazione: ${goalName}`);

  // Identifica il partecipante/processo corrente
  const participantId = element.parent.businessObject.id;

  // Salva la prima root incontrata per questo partecipante/processo
  if (!initialRoots[participantId]) {
    initialRoots[participantId] = rootId;
    console.log(`Prima root salvata per ${participantId}: ${rootName}`);
  }

  const g = new WeightedGraph();
  place.forEach(p => g.addVertex(p.id));

  connections.forEach(conn => {
    if (conn.name !== undefined) {
      const weightStr = conn.name.trim();
      if (/^\d+$/.test(weightStr)) {
        const weight = parseInt(weightStr);
        g.addEdge(conn.sourcePlace.id, conn.targetPlace.id, weight);
      } else {
        console.error(`Il peso della transizione '${weightStr}' non è un numero valido.`);
        alert(`Invalid weight on transition ${weightStr}`);
      }
    }
  });

  const shortestPath = g.Dijkstra(rootId, goalId);
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
ActivityBehavior.prototype.processAssignments = function (context) {
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
        if (this._graph) {
          this._graph.removeEdge(connectionToDelete.sourcePlace.id, connectionToDelete.targetPlace.id);
        }
        console.log(`Deleting transition: ${deleteAssignment}`);
        canvas.removeConnection(connectionToDelete);
        canvas._elementRegistry.remove(connectionToDelete);
        console.log(`Deleted transition: ${deleteAssignment}`);
      } else {
        console.warn(`Transition not found: ${deleteAssignment}`);
      }
    });
  }

  this._updateGraph();

  const places = this._spaceModeler._places.get('Elements');
  const placeNames = places.map(place => place.name);

  Object.keys(assignmentObj).forEach(placeName => {
    if (placeNames.includes(placeName)) {
      const placeAssignments = assignmentObj[placeName];
      Object.keys(placeAssignments).forEach(key => {
        const alertKey = `${placeName}-${key}`;
        if (!this._alertsShown[alertKey]) {
          alert(`The place ${placeName} has the assignment ${key} set to ${placeAssignments[key]}`);
          this._alertsShown[alertKey] = true;
        }

        this._checkConditionalStartEvents(placeName, key, placeAssignments[key]);
      });
    }
  });

  const previousAttributes = this._previousAttributes || {};
  const changeAlertsShown = this._changeAlertsShown || new Set();

  const assignmentsOlc = places.filter(element => is(element, 'space:Place')).map(place => {
    const assignmentOlcObj = AssignmentUtil.parseAssignmentOlc(place.assignmentOlc);
    return {
      id: place.id,
      name: place.name,
      assignmentOlc: assignmentOlcObj
    };
  });

  assignmentsOlc.forEach(place => {
    for (let key in place.assignmentOlc) {
      const alertKey = `${place.name}-${key}`;
      const newValue = place.assignmentOlc[key];
      const oldValue = previousAttributes[alertKey];

      if (oldValue !== undefined && oldValue !== newValue && !changeAlertsShown.has(alertKey)) {
        changeAlertsShown.add(alertKey);
      }

      previousAttributes[alertKey] = newValue;

      if (!this._alertsShown[alertKey]) {
        this._alertsShown[alertKey] = true;
      }

      this._checkConditionalStartEvents(place.name, key, newValue);
    }
  });

  this._previousAttributes = previousAttributes;
  this._changeAlertsShown = changeAlertsShown;

  places.filter(el => is(el, 'space:Place')).forEach(place => {
    AssignmentUtil.updatePlaceAssignmentWithElement(element, place, this._spaceModeler);
  });

  const assignment = element && element.businessObject
      ? {
        id: element.businessObject.id,
        name: element.businessObject.name,
        assignment: assignmentObj
      }
      : {
        id: element ? element.businessObject.id : 'Unknown ID',
        name: element ? element.businessObject.name : 'Unknown Element',
        assignment: assignmentObj
      };

  return assignment;
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

  if (flows.length === 0) {
    console.warn('Destination not reachable');
    alert("Destination not reachable");
    if (this._eventBehaviors.handleBoundaryEvents({ element, scope })) {
      console.log("Boundary event triggered due to unreachable destination");
      return;
    }
    console.warn('Deadlock detected, no alternative flows available');
    alert("Ending current process due to unreachable destination.");
    } else {
      this._handleConnections(flows, activatedFlows, parentScope);
    }
};

ActivityBehavior.prototype._handleConnections = function(flows, activatedFlows, parentScope) {
  const connections = flows.map(flow => {
    const element = this._spaceModeler._canvaspace.canvas._elementRegistry._elements[flow.id];
    if (!element || !element.element) {
      console.warn('Transition not found for flow:', flow.id);
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








ActivityBehavior.prototype._handleDestination = function(context, element, activatedFlows, parentScope, scope) {
  if (element.businessObject.destination) {
    if (element.parent.businessObject.root) {
      const rootId = element.parent.businessObject.root;
      const destinationId = element.businessObject.destination;

      const rootName = getNameRoot(rootId, this._spaceModeler._places.get('Elements'));
      const destinationName = getNameDestination(destinationId, this._spaceModeler._places.get('Elements'));

      console.log(`Nome della root: ${rootName}`);
      console.log(`Nome della destinazione: ${destinationName}`);

      if (element.businessObject.destination === element.parent.businessObject.root) {
        const participantId = element.parent.businessObject.id;
        const initialRootId = initialRoots[participantId];

        if (initialRootId) {
          element.parent.businessObject.root = initialRootId;
          console.log(`Root reimpostata alla prima root salvata per ${participantId}: ${getNameRoot(initialRootId, this._spaceModeler._places.get('Elements'))}`);
          element.businessObject.destination = null;
        }
      } else {
        this._processDestination(context, element, activatedFlows, parentScope, scope);
      }
    } else {
      alert("Please select an initial position for the Participant " + element.parent.businessObject.name);
    }
  }
};


ActivityBehavior.prototype._activateFlows = function(activatedFlows, parentScope, scope) {
  if (activatedFlows.length === 0) {
    // Se non ci sono flussi attivati, esci dal contesto corrente
    this._scopeBehavior.tryExit(parentScope, scope);
    return;
  }

  // Altrimenti, continua con i flussi attivati
  activatedFlows.forEach(flowElement => this._simulator.enter({
    element: flowElement,
    scope: parentScope
  }));
};




ActivityBehavior.prototype.getValidityGuard = function(context) {
  const { element } = context;

  var places = this._spaceModeler._places.get('Elements');
  var place = places.filter(element => is(element, 'space:Place'));
  var placesAdmitted = [];
  var guardNot, guard;
  var guardLength = element.businessObject.guard.length;

  console.log('Guard:', element.businessObject.guard);

  if (element.businessObject.guard.startsWith("not in")) {
    guardNot = element.businessObject.guard.slice(7, guardLength - 1).replace(/[{}]/g, '');
    var guardArrayNot = guardNot.split(",").map(item => item.trim());
    console.log('Guard NOT array:', guardArrayNot);

    placesAdmitted = place;
    for (let i = 0; i < guardArrayNot.length; i++) {
      for (let j = 0; j < place.length; j++) {
        if (guardArrayNot[i] === place[j].name) {
          // Verifica se il place è una root
          const rootId = element.parent.businessObject.root;
          if (rootId === place[j].id) {
            var index = placesAdmitted.indexOf(place[j]);
            console.log(`Excluding place: ${place[j].name} (index: ${index})`);
            placesAdmitted.splice(index, 1);
          } else {
            console.log(`Place ${place[j].name} is not the root, not excluding.`);
          }
        }
      }
    }

    console.log('Places admitted after NOT guard:', placesAdmitted);
    return placesAdmitted;
  } else {
    guard = element.businessObject.guard.slice(3, guardLength - 1).replace(/[{}]/g, '');
    var guardArray = guard.split(",").map(item => item.trim());
    console.log('Guard array:', guardArray);

    for (let i = 0; i < guardArray.length; i++) {
      for (let j = 0; j < place.length; j++) {
        if (guardArray[i] === place[j].name) {
          console.log(`Including place: ${place[j].name}`);
          placesAdmitted.push(place[j]);
        }
      }
    }

    console.log('Places admitted after guard:', placesAdmitted);
    return placesAdmitted;
  }
};

ActivityBehavior.prototype.enter = function(context) {
  const { element, scope } = context;
  console.log('Entering element:', element.businessObject.name);

  const parentScopes = getParentScopes(scope);

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

  if ((element.businessObject.guard !== undefined) && (element.businessObject.guard !== "")) {
    const placesAdmitted = this.getValidityGuard(context);
    let guard = false;

    console.log('Root:', element.parent.businessObject.root);  // Log della root
    console.log('Places admitted:', placesAdmitted);  // Log dei places ammessi per il confronto con la root

    for (let i = 0; i < placesAdmitted.length; i++) {
      if (element.parent.businessObject.root === placesAdmitted[i].id) {
        guard = true;
        break;
      }
    }

    if (guard) {
     // console.log('Guard condition passed. Exiting...');
      this._simulator.exit(context);
    } else {
      console.log('Guard condition failed. Triggering guard violation.');
      alert("The robot is in a wrong position to do the task");

      const fullContext = { element, scope, parentScopes, type: 'warning' };
      console.log('Firing GUARD_VIOLATION_EVENT with context:', fullContext);
      this._eventBus.fire(GUARD_VIOLATION_EVENT, fullContext);
      console.log('GUARD_VIOLATION_EVENT fired');

      const modeling = this._spaceModeler.get('modeling');
      modeling.setColor([element], {
        stroke: 'red',
        fill: '#ffa5a5'
      });
    }
  } else {
    this._simulator.exit(context);
  }
};


const initialRoots = {};





ActivityBehavior.prototype.exit = function(context) {
  const { element, scope, isBoundaryEvent } = context;  // Aggiungi isBoundaryEvent al contesto
  const parentScope = scope.parent;
  const complete = !scope.failed;

  if (complete && !isEventSubProcess(element)) {
    this._transactionBehavior.registerCompensation(scope);
  }

  const activatedFlows = complete ? element.outgoing.filter(isSequenceFlow) : [];

  if (isBoundaryEvent) {
    // Gestione dell'uscita per boundary event
    this._handleBoundaryEventExit(context, element, activatedFlows, parentScope, scope);
  } else {
    // Gestione dell'uscita per attività normale
    this._handleDestination(context, element, activatedFlows, parentScope, scope);

    if (!element.businessObject.destination || element.businessObject.destination === "") {
      this._addExecutionTime(element);
      this._activateFlows(activatedFlows, parentScope, scope);
    }
  }
};
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
    // console.log('Boundary event registered:', element);
  });
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
ActivityBehavior.prototype.signalOnEvent = function(context, event) {
  const { scope, element } = context;
  const subscription = this._simulator.subscribe(scope, event, initiator => {
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
      console.debug('Simulator :: ActivityBehavior :: ignorando messaggio fuori contesto');
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
        boundary: false,
        body: context.body //boh lo metto anche qua per sicurezza
      };
    }

    console.log('Segnalazione del messaggio in uscita:', outgoing);
    this._simulator.signal({
      element: outgoing,
      body: context.body
    });
  }
};




ActivityBehavior.prototype._scopeCache = new Map();
ActivityBehavior.prototype._findOrCreateScope = function(element) {
  let scope = this._scopeCache.get(element.id);
  if (!scope) {
    scope = this._simulator.createScope({ element });
    this._scopeCache.set(element.id, scope);
  }
  return scope;
};

ActivityBehavior.prototype._findParentParticipant = function(element) {
  while (element && !is(element, 'bpmn:Process') && !is(element, 'bpmn:Participant')) {
    element = element.parent;
  }
  return element && is(element, 'bpmn:Participant') ? element : null;
};

ActivityBehavior.prototype._checkConditionalStartEvents = function(placeName, key, value) {
  const assignmentCondition = `${placeName}.${key}=${value}`;
  this._elementRegistry.getAll().forEach(element => {
    if (is(element, 'bpmn:StartEvent') && element.businessObject.eventDefinitions) {
      const eventDefinition = element.businessObject.eventDefinitions[0];
      if (eventDefinition.$type === 'bpmn:ConditionalEventDefinition' && eventDefinition.condition.body === assignmentCondition) {
        const parentParticipant = this._findParentParticipant(element);
        if (parentParticipant) {
          const scope = this._findOrCreateScope(parentParticipant);
          const eventContext = { element: element, scope: scope };
          const eventBehavior = this._eventBehaviors.get(element);
          if (eventBehavior) {
            return eventBehavior.call(this, eventContext);
          }
        }
      }
    }
  });
};



ActivityBehavior.prototype._handleBoundaryEventExit = function(context, element, activatedFlows, parentScope, scope) {
  console.log('Handling exit for boundary event:', element);

  // Logica specifica per gestire l'uscita dal boundary event
  if (activatedFlows.length === 0) {
    this._scopeBehavior.tryExit(parentScope, scope);
    return;
  }

  activatedFlows.forEach(flowElement => this._simulator.enter({
    element: flowElement,
    scope: parentScope
  }));
};







ActivityBehavior.prototype._addExecutionTime = function(element) {
  if (!element.businessObject.duration) {
    element.businessObject.duration = 0;
  }
  this._time.addTime(element.businessObject.duration);
  const timex = Object.values(this._time);
  element.businessObject.$parent.executionTime = timex[0];
};
ActivityBehavior.prototype.getSpaceExecutionTime = function(context) {
  const { element } = context;
  const flows = this.getSpaceWeighedPath(context);
  const totalDistance = flows.reduce((sum, flow) => sum + parseInt(flow.name), 0);
  const velocity = element.businessObject.velocity || 1;
  return totalDistance / velocity;
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
function getParentScopes(scope) {
  const parentScopes = [];
  let currentScope = scope.parent;

  while (currentScope) {
    parentScopes.push(currentScope);
    currentScope = currentScope.parent;
  }

  return parentScopes;
}

function getNameRoot(rootId, places) {
  const rootPlace = places.find(place => place.id === rootId);
  return rootPlace ? rootPlace.name : 'Nome sconosciuto';
}

function getNameDestination(destinationId, places) {
  const destinationPlace = places.find(place => place.id === destinationId);
  return destinationPlace ? destinationPlace.name : 'Nome sconosciuto';
}
