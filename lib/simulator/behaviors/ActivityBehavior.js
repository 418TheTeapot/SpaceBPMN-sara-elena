import { is } from "../../../example/lib/util/Util";
import WeightedGraph from '../util/WeightedGraph';
import TimeUtil from '../util/TimeUtil';
import { PAUSE_SIMULATION_EVENT, RESET_SIMULATION_EVENT, TOGGLE_MODE_EVENT } from '../../util/EventHelper';
import { AssignmentUtil } from "../util/AssignmentUtil";
import { isEventSubProcess, isSequenceFlow, isMessageFlow } from "../util/ModelUtil";

export default function ActivityBehavior(
    simulator,
    scopeBehavior,
    transactionBehavior,
    animation,
    elementRegistry,
    spaceModeler,
    eventBus,
    pauseSimulation,
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
  this.graph = new WeightedGraph(); // Inizializza il grafo

  const elements = [
    'bpmn:BusinessRuleTask',
    'bpmn:CallActivity',
    'bpmn:ManualTask',
    'bpmn:ScriptTask',
    'bpmn:ServiceTask',
    'bpmn:Task',
    'bpmn:UserTask',
    'space:Place',
    'space:Transition'
  ];

  for (const element of elements) {
    simulator.registerBehavior(element, this);
  }
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
];

const HIGH_PRIORITY = 1500;

ActivityBehavior.prototype.signal = function(context) {
  console.log("Inizio della funzione signal");

  // trigger messages that are pending send
  const event = this._triggerMessages(context);

  if (event) {
    console.log("Event trovato, richiamo signalOnEvent con l'evento", event);
    return this.signalOnEvent(context, event);
  }

  console.log("Nessun evento trovato, procedo con l'uscita dal simulatore");
  this._simulator.exit(context);

  console.log("Fine della funzione signal");
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
        x: 100 + index * 200,
        y: 100,
      });

      console.log('Creating place:', place);
      canvas.addShape(place, rootElement);
      console.log('Place added to canvas:', place);

      // Aggiungi il nuovo posto al grafico
      this.graph.addVertex(place.id);
      console.log(`Added vertex: ${place.name} (${place.id})`);
    } else {
      console.log(`Place ${placeName} already exists:`, place);
    }

    if (previousPlace) {
      const connectionBusinessObject = olcElementFactory.createBusinessObject('space:Transition', { name: '1' });
      const connection = olcElementFactory.create('connection', {
        type: 'space:Transition',
        businessObject: connectionBusinessObject,
        source: previousPlace,
        target: place,
        waypoints: olcUpdater.connectionWaypoints(previousPlace, place)
      });

      console.log('Creating connection:', connection);
      canvas.addConnection(connection);
      console.log('Connection added to canvas:', connection);

      connection.businessObject.sourcePlace = previousPlace.businessObject;
      connection.businessObject.targetPlace = place.businessObject;
      olcUpdater.linkToBusinessObjectParent(connection);

      // Aggiorna il grafo con il nuovo collegamento
      this.graph.addEdge(previousPlace.id, place.id, 1);
      console.log(`Added edge: ${previousPlace.name} -> ${place.name} with weight 1`);
    }

    previousPlace = place;
  });
};

ActivityBehavior.prototype.deleteTransition = function(transitionNames) {
  const canvas = this._spaceModeler._canvaspace.canvas;

  if (!transitionNames || !Array.isArray(transitionNames)) {
    console.error('Please provide an array with transition names in the delete assignment.');
    return;
  }

  transitionNames.forEach((transitionName) => {
    const connectionToDelete = AssignmentUtil.findTransitionByName(transitionName, this._spaceModeler);

    if (connectionToDelete) {
      if (connectionToDelete.source && connectionToDelete.target) {
        // Rimuovi il collegamento dal grafo
        this.graph.removeEdge(connectionToDelete.source.id, connectionToDelete.target.id);
        console.log(`Removed edge: ${connectionToDelete.source.id} -> ${connectionToDelete.target.id}`);
      } else {
        console.warn(`Source or target is undefined for transition: ${transitionName}`);
      }

      canvas.removeConnection(connectionToDelete);
      canvas._elementRegistry.remove(connectionToDelete);

      console.log("Canvas element registry after removal:", canvas._elementRegistry);
      console.log(`Deleted transition: ${transitionName}`);
    } else {
      console.warn(`Transition not found: ${transitionName}`);
    }
  });
};

ActivityBehavior.prototype.processAssignments = function(context) {
  const { element } = context;
  const assignmentObj = AssignmentUtil.parseElementAssignment(element.businessObject.assignment);
  console.log('Parsed assignment:', assignmentObj);

  if (assignmentObj.add) {
    if (typeof assignmentObj.add === 'string') {
      assignmentObj.add = assignmentObj.add.split('.');
    }
    this.addPlacesAndTransition(assignmentObj);
  }

  if (assignmentObj.delete) {
    if (typeof assignmentObj.delete === 'string') {
      assignmentObj.delete = assignmentObj.delete.split(';'); // Use a different separator if needed
    }
    this.deleteTransition(assignmentObj.delete);
  }

  const places = this._spaceModeler._places.get('Elements');
  const placeNames = places.map(place => place.name);

  Object.keys(assignmentObj).forEach(placeName => {
    if (placeNames.includes(placeName)) {
      console.log(`The name of the place is in the assignments: ${placeName}`);
      alert(`The name of the place in question is: ${placeName}`);
    }
  });

  const filteredPlaces = places.filter(element => is(element, 'space:Place'));

  var assignmentsOlc = filteredPlaces.map(place => {
    const assignmentOlcObj = AssignmentUtil.parseAssignmentOlc(place.assignmentOlc);
    return {
      id: place.id,
      name: place.name,
      assignmentOlc: assignmentOlcObj
    };
  });

  assignmentsOlc.forEach(place => {
    for (let key in place.assignmentOlc) {
      alert(`Alert: ${key} is set to ${place.assignmentOlc[key]} at place: ${place.name}`);
    }
  });

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

  console.log('Assignment:', assignment);
  return assignment;
};

ActivityBehavior.prototype.enter = function(context) {
  const { element } = context;

  const continueEvent = this.waitAtElement(element);

  console.log("continueEvent");

  if (continueEvent) {
    return this.signalOnEvent(context, continueEvent);
  }

  this.processAssignments(context);

  // trigger messages that are pending send
  const event = this._triggerMessages(context);

  if (event) {
    return this.signalOnEvent(context, event);
  }

  if (element.businessObject.guard !== undefined && element.businessObject.guard !== "") {
    const placesAdmitted = this.getValidityGuard(context);
    console.log(placesAdmitted);
    let guard = false;
    console.log(element.businessObject.root);
    for (let i = 0; i < placesAdmitted.length; i++) {
      if (element.businessObject.root === placesAdmitted[i].id) {
        guard = true;
      } else {
        i = i;
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

ActivityBehavior.prototype.getValidityGuard = function(context) {
  const { element } = context;

  var places = this._spaceModeler._places.get('Elements');
  var place = places.filter(element => is(element, 'space:Place'));
  var placesAdmitted = [];
  var guardNot, guard;
  var guardLength = element.businessObject.guard.length;

  if (element.businessObject.guard.startsWith("not in")) {
    guardNot = element.businessObject.guard.slice(7, guardLength - 1);
    var guardArrayNot = guardNot.split(",");
    placesAdmitted = place;
    for (let i = 0; i < guardArrayNot.length; i++) {
      for (let j = 0; j < place.length; j++) {
        if (guardArrayNot[i] === place[j].name) {
          var index = placesAdmitted.indexOf(place[j]);
          console.log(index);
          placesAdmitted.splice(index, 1);
        } else {
          j = j;
        }
      }
    }
    return placesAdmitted;
  } else {
    guard = element.businessObject.guard.slice(3, guardLength - 1);
    var guardArray = guard.split(",");
    for (let i = 0; i < guardArray.length; i++) {
      for (let j = 0; j < place.length; j++) {
        if (guardArray[i] === place[j].name) {
          placesAdmitted.push(place[j]);
        } else {
          j = j;
        }
      }
    }
    return placesAdmitted;
  }
};

ActivityBehavior.prototype.exit = function(context) {
  const { element, scope } = context;

  // Registra un listener per l'evento TOGGLE_MODE_EVENT
  this._eventBus.on(TOGGLE_MODE_EVENT, event => {
    const active = event.active;
    console.log("toggle");
    if (active) {
      this._time.reset();
      element.businessObject.$parent.executionTime = this._time;
    }
  });

  // Reimposta initial position alla posizione originaria e registra i nuovi log aggiungendoli ai vecchi
  this._eventBus.on(PAUSE_SIMULATION_EVENT, event => {
    const active = event.active;
    console.log("pause");
    if (!active) {
      element.parent.businessObject.root = rootArray[0]; //prendo la prima root ossia la initial position
    }
  });

  // Reimposta initial position alla posizione originaria e pulisce i log
  this._eventBus.on(RESET_SIMULATION_EVENT, event => {
    const active = event.active;
    console.log("reset");
    if (!active) {
      element.parent.businessObject.root = rootArray[0]; //prendo la prima root ossia la initial position
    }
  });

  const parentScope = scope.parent;
  const complete = !scope.failed;

  // compensation is registered AFTER successful completion of normal scope activities (non event sub-processes)
  if (complete && !isEventSubProcess(element)) {
    this._transactionBehavior.registerCompensation(scope);
  }

  // if exception flow is active, do not activate any outgoing flows
  const activatedFlows = complete ? element.outgoing.filter(isSequenceFlow) : [];

  // Se il task ha una destinazione
  if (element.businessObject.destination !== undefined && element.businessObject.destination !== "") {
    // e se ha anche una root
    if (element.parent.businessObject.root !== undefined && element.parent.businessObject.root !== "") {
      // e se la destinazione non è uguale alla root
      if (element.businessObject.destination === element.parent.businessObject.root) {
        alert("The initial position must not be the destination");
      } else {
        // Calcola il percorso pesato nello spazio
        const flows = this.getSpaceWeighedPath(context);
        let timespace = this.getSpaceExecutionTime(context);

        if (element.businessObject.duration === undefined) {
          element.businessObject.duration = 0;
        }
        this._time.addTime(element.businessObject.duration);
        this._time.addTime(timespace);
        var timex = Object.values(this._time);

        element.businessObject.$parent.executionTime = timex[0];

        if (flows.length === 0) {
          console.log("");
        } else {
          const connections = [];
          flows.forEach(
              element =>
                  connections.push(this._spaceModeler._canvaspace.canvas._elementRegistry._elements[element.id].element)
          );

          if (connections.length > 0) {
            const element = connections.shift();
            element['connections'] = connections;
            element['activatedFlows'] = activatedFlows;
            this._simulator.enter({
              element,
              scope: parentScope,
              parentScope : parentScope
            });
          }
        }
      }
    } else {
      alert("Please select an initial position for the Participant " + element.businessObject.name);
    }
  } else {
    if (element.businessObject.duration === undefined) {
      element.businessObject.duration = 0;
    }
    this._time.addTime(element.businessObject.duration);
    var timex = Object.values(this._time);

    element.businessObject.$parent.executionTime = timex[0];

    activatedFlows.forEach(
        element => this._simulator.enter({
          element,
          scope: parentScope
        })
    );

    // element has token sink semantics
    if (activatedFlows.length === 0) {
      this._scopeBehavior.tryExit(parentScope, scope);
    }
  }

  console.log(this._time);
};

ActivityBehavior.prototype.getSpaceWeighedPath = function (context) {
  const { element } = context;

  var places = this._spaceModeler._places.get('Elements');
  var place = places.filter(e => is(e, 'space:Place'));
  var connections = places.filter(e => is(e, 'space:Transition'));

  var root = getRoot(element, places);
  var goal = getDestination(element, places);

  console.log("Root: " + (root ? root.name : 'undefined'));
  console.log("Goal: " + (goal ? goal.name : 'undefined'));

  if (!root || !goal) {
    console.warn('Root or Goal not found');
    return [];
  }

  const g = new WeightedGraph();
  for (let p of place) {
    g.addVertex(p.id);
    console.log(`Added vertex: ${p.name} (${p.id})`);
  }

  for (let i = 0; i < connections.length; i++) {
    const weight = parseInt(connections[i].name);
    if (!isNaN(weight)) {
      g.addEdge(connections[i].sourcePlace.id, connections[i].targetPlace.id, weight);
      console.log(`Added edge: ${connections[i].sourcePlace.name} -> ${connections[i].targetPlace.name} with weight ${weight}`);
    } else {
      console.error(`Invalid weight on transition: ${connections[i].name}`);
      alert("Invalid weight on transition no. " + i);
    }
  }

  var shortestpath = g.Dijkstra(root.id, goal.id);
  var fullPath = [];

  console.log("Shortest path:", shortestpath);

  for (let i = 0; i < shortestpath.length - 1; i++) {
    let connection = connections.find(c => c.sourcePlace.id === shortestpath[i] && c.targetPlace.id === shortestpath[i + 1]);
    if (connection) {
      fullPath.push(connection);
      console.log(`Connection found: ${connection.sourcePlace.name} -> ${connection.targetPlace.name}`);
    } else {
      console.warn(`Connection not found for shortest path: ${shortestpath[i]} -> ${shortestpath[i + 1]}`);
      connections.forEach(c => {
        console.log(`Existing connection: ${c.sourcePlace.name} -> ${c.targetPlace.name}`);
        console.log(`Connection details:`, c);
      });
    }
  }

  if (fullPath.length > 0) {
    element.parent.businessObject.root = fullPath[fullPath.length - 1].targetPlace.id;
    console.log("Full path root: " + fullPath[fullPath.length - 1].targetPlace.name);
    if (fullPath.length > 1) {
      element.businessObject.destination = fullPath[1].targetPlace.id;
      console.log("Full path destination: " + fullPath[1].targetPlace.name);
    }
  } else {
    console.warn('Complete path not found.');
  }

  return fullPath;
}

function getRoot(element, places) {
  if (element && element.parent && element.parent.businessObject) {
    const rootId = element.parent.businessObject.root;
    const rootPlace = places.find(place => place.id === rootId);
    if (!rootPlace) {
      console.warn(`Root place not found for id: ${rootId}`);
    }
    return rootPlace;
  } else {
    return null;
  }
}

function getDestination(element, places) {
  if (element && element.businessObject) {
    const destinationId = element.businessObject.destination;
    const destinationPlace = places.find(place => place.id === destinationId);
    if (!destinationPlace) {
      console.warn(`Destination place not found for id: ${destinationId}`);
    }
    return destinationPlace;
  } else {
    return null;
  }
}

ActivityBehavior.prototype.getSpaceExecutionTime = function(context) {
  const { element } = context;

  const flows = this.getSpaceWeighedPath(context);
  var totDist = 0;
  for (let i = 0; i < flows.length; i++) {
    totDist += parseInt(flows[i].name);
  }
  var velocity = element.businessObject.velocity;
  var spaceTemp = totDist / velocity;
  return spaceTemp;
}

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

  const messageContexts = [
    ...element.incoming.filter(isMessageFlow).map(flow => ({
      incoming: flow,
      referencePoint: last(flow.waypoints)
    })),
    ...element.outgoing.filter(isMessageFlow).map(flow => ({
      outgoing: flow,
      referencePoint: first(flow.waypoints)
    }))
  ].sort(sortByReference).filter(filterAfter);

  console.log("Message contex", messageContexts);
  return messageContexts;
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

    this._simulator.signal({ element: outgoing });
  }
};

function first(arr) {
  return arr && arr[0];
}

function last(arr) {
  return arr && arr[arr.length - 1];
}


