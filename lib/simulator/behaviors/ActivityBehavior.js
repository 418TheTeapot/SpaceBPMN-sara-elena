import {isEventSubProcess, isMessageFlow, isSequenceFlow} from '../util/ModelUtil';
import {is} from "../../../example/lib/util/Util";
import WeightedGraph from '../util/WeightedGraph';
import TimeUtil from '../util/TimeUtil';
import {PAUSE_SIMULATION_EVENT, RESET_SIMULATION_EVENT, TOGGLE_MODE_EVENT} from '../../util/EventHelper';
import {AssignmentUtil} from "../util/AssignmentUtil";

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

  const elements = [
    'bpmn:BusinessRuleTask',
    'bpmn:CallActivity',
    'bpmn:ManualTask',
    'bpmn:ScriptTask',
    'bpmn:ServiceTask',
    'bpmn:Task',
    'bpmn:UserTask',
    'space:Transition',
    'space:Place',
  ];

  for (const element of elements) {
    simulator.registerBehavior(element, this);
    simulator.registerBehavior("space:Transition", this);
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
  const event = this._triggerMessages(context);
  if (event) {
    return this.signalOnEvent(context, event);
  }
  this._simulator.exit(context);
};

ActivityBehavior.prototype.removePlaceByName = function(placeName) {
  const places = this._spaceModeler._places.get('Elements');
  const placeToRemove = places.find(place => is(place, 'space:Place') && place.name === placeName);
  const canvas = this._spaceModeler._canvaspace.canvas;

  if (placeToRemove) {
    canvas.removeShape(placeToRemove);
    canvas._elementRegistry.remove(placeToRemove);
    console.log(`Removed place with name: ${placeName}`);
  } else {
    console.log(`No place found with name: ${placeName}`);
  }
};

ActivityBehavior.prototype.removeTransitionByName = function(transitionName) {
  const transitions = this._spaceModeler._places.get('Elements').filter(e => is(e, 'space:Transition'));
  const transitionToRemove = transitions.find(transition => transition.name === transitionName);
  const canvas = this._spaceModeler._canvaspace.canvas;

  if (transitionToRemove) {
    canvas.removeConnection(transitionToRemove);
    canvas.removeShape(transitionToRemove.targetPlace);
    canvas._elementRegistry.remove(transitionToRemove);
    console.log(`Removed transition with name: ${transitionName}`);
  } else {
    console.log(`No transition found with name: ${transitionName}`);
  }
};

ActivityBehavior.prototype.getAssignment = function(context) {
  const { element } = context;
  const assignmentObj = AssignmentUtil.parseElementAssignment(element.businessObject.assignment);
  console.log('Parsed assignment:', assignmentObj);

  if (assignmentObj["delete"]) {
    const deleteValue = assignmentObj["delete"];
    const connectionToDelete = AssignmentUtil.findTransitionByName(deleteValue, this._spaceModeler);

    if (connectionToDelete) {
      const canvas = this._spaceModeler._canvaspace.canvas;
      canvas.removeConnection(connectionToDelete);
      canvas._elementRegistry.remove(connectionToDelete);
      console.log(`Deleted transition: ${deleteValue}`);
    } else {
      console.warn(`Transition not found: ${deleteValue}`);
    }
  }

  if (element && element.businessObject) {
    const assignment = {
      id: element.businessObject.id,
      name: element.businessObject.name,
      assignment: assignmentObj
    };
    console.log('Assignment:', assignment);
    return assignment;
  } else {
    const assignment = {
      id: element ? element.businessObject.id : 'Unknown ID',
      name: element ? element.businessObject.name : 'Unknown Element',
      assignment: assignmentObj
    };
    console.log('Assignment:', assignment);
    return assignment;
  }
};

ActivityBehavior.prototype.enter = function(context) {
  const { element } = context;
  const continueEvent = this.waitAtElement(element);

  this.getAssignment(context);
  this.getAssignmentOlc(context);
  this.updateAssignments(context);

  this.checkAssignmentsAgainstPlaces(context);

  if (continueEvent) {
    return this.signalOnEvent(context, continueEvent);
  }

  const event = this._triggerMessages(context);

  if (event) {
    return this.signalOnEvent(context, event);
  }

  if ((element.businessObject.guard !== undefined) && (element.businessObject.guard !== "")){
    var placesAdmitted = this.getValidityGuard(context);
    var guard = false;
    for (let i = 0; i < placesAdmitted.length; i++) {
      if (element.businessObject.root === placesAdmitted[i].id) {
        guard = true;
      }
    }
    if (guard !== false) {
      this._simulator.exit(context);
    } else {
      alert ("The robot is in a wrong position to do the task");
    }
  } else {
    this._simulator.exit(context);
  }
};

ActivityBehavior.prototype.checkAssignmentsAgainstPlaces = function(context) {
  const { element } = context;
  const places = this._spaceModeler._places.get('Elements');
  const placeNames = places.map(place => place.name);

  if (element.businessObject && element.businessObject.assignment) {
    const assignmentObj = AssignmentUtil.parseElementAssignment(element.businessObject.assignment);
    Object.keys(assignmentObj).forEach(placeName => {
      if (placeNames.includes(placeName)) {
        console.log(`The name of the place is in the assignments: ${placeName}`);
        alert(`The name of the place in question is: ${placeName}`);
      }
    });
  }
};

ActivityBehavior.prototype.getAssignmentOlc = function(context) {
  const places = this._spaceModeler._places.get('Elements');
  const filteredPlaces = places.filter(element => is(element, 'space:Place'));

  var assignmentsOlc = filteredPlaces.map(place => {
    const assignmentObj = AssignmentUtil.parseAssignmentOlc(place.assignmentOlc);
    if (place && place.businessObject) {
      return {
        id: place.id,
        name: place.name,
        assignmentOlc: assignmentObj
      };
    } else {
      return {
        id: place ? place.id : 'Unknown ID',
        name: place ? place.name : 'Unknown Place',
        assignmentOlc: assignmentObj
      };
    }
  });

  assignmentsOlc.forEach(place => {
    if (place.assignmentOlc['lux'] === 'on') {
      alert(`Alert: Lux is set to ON at place: ${place.name}`);
    }
  });
};

ActivityBehavior.prototype.updateAssignments = function(context) {
  const { element } = context;
  const places = this._spaceModeler._places.get('Elements').filter(el => is(el, 'space:Place'));

  places.forEach(place => {
    AssignmentUtil.updatePlaceAssignmentWithElement(element, place, this._spaceModeler);
  });
};

ActivityBehavior.prototype.getValidityGuard = function(context) {
  const { element, scope } = context;
  const places = this._spaceModeler._places.get('Elements');
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
          placesAdmitted.splice(index, 1);
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
        }
      }
    }
    return placesAdmitted;
  }
};

var rootArray = [];

ActivityBehavior.prototype.exit = function(context) {
  const { element, scope } = context;
  this._eventBus.on(TOGGLE_MODE_EVENT, event => {
    const active = event.active;
    if (active) {
      this._time.reset();
      element.businessObject.$parent.executionTime = this._time;
    }
  });

  this._eventBus.on(PAUSE_SIMULATION_EVENT, event => {
    const active = event.active;
    if (!active) {
      element.parent.businessObject.root = rootArray[0];
    }
  });

  this._eventBus.on(RESET_SIMULATION_EVENT, event => {
    const active = event.active;
    if (!active) {
      element.parent.businessObject.root = rootArray[0];
    }
  });

  const parentScope = scope.parent;
  const complete = !scope.failed;

  if (complete && !isEventSubProcess(element)) {
    this._transactionBehavior.registerCompensation(scope);
  }

  const activatedFlows = complete ? element.outgoing.filter(isSequenceFlow) : [];

  if (element.businessObject.destination !== undefined && element.businessObject.destination !== "") {
    if (element.parent.businessObject.root !== undefined && element.parent.businessObject.root !== "") {
      if (element.businessObject.destination === element.parent.businessObject.root) {
        alert("The initial position must not be the destination");
      } else {
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
        } else {
          const connections = [];
          flows.forEach(element => connections.push(this._spaceModeler._canvaspace.canvas._elementRegistry._elements[element.id].element));

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

    activatedFlows.forEach(element => this._simulator.enter({
      element,
      scope: parentScope
    }));

    if (activatedFlows.length === 0) {
      this._scopeBehavior.tryExit(parentScope, scope);
    }
  }
};

ActivityBehavior.prototype.getSpaceWeighedPath = function(context) {
  const { element, scope } = context;
  var places = this._spaceModeler._places.get('Elements');
  var place = places.filter(e => is(e, 'space:Place'));
  var connections = places.filter(e => is(e, 'space:Transition'));

  var root = getRoot(element, places);
  rootArray.push(root);
  var goal = getDestination(element, places);

  var rootName = getNameRoot(root, places);
  var destinationName = getNameDestination(goal, places);

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

  const g = new WeightedGraph();
  for (let p of place) {
    g.addVertex(p.id);
  }

  for (let i = 0; i < connections.length; i++) {
    const weight = parseInt(connections[i].name);
    if (weight !== null) {
      g.addEdge(connections[i].sourcePlace.id, connections[i].targetPlace.id, weight);
    } else {
      alert("Invalid weight on transition no. " + i);
    }
  }

  var shortestpath = g.Dijkstra(root, goal);
  var fullPath = [];

  for (let i = 0; i < shortestpath.length - 1; i++) {
    let connection = connections.find(c => c.sourcePlace.id === shortestpath[i] && c.targetPlace.id === shortestpath[i + 1]);
    if (connection) {
      fullPath.push(connection);
    } else {
      console.warn('Connessione non trovata per il percorso più breve:', shortestpath[i], shortestpath[i + 1]);
    }
  }

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
  const { element, scope } = context;
  const flows = this.getSpaceWeighedPath(context);
  var totDist = 0;
  for (let i = 0; i < flows.length; i++) {
    totDist += parseInt(flows[i].name);
  }
  var velocity = element.businessObject.velocity;
  var spaceTemp = totDist / velocity;
  return spaceTemp;
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

function first(arr) {
  return arr && arr[0];
}

function last(arr) {
  return arr && arr[arr.length - 1];
}
