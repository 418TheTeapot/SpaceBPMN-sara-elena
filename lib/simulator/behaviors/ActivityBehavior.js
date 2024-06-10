import { is } from "../../../example/lib/util/Util";
import WeightedGraph from '../util/WeightedGraph';
import TimeUtil from '../util/TimeUtil';
import { PAUSE_SIMULATION_EVENT, RESET_SIMULATION_EVENT, TOGGLE_MODE_EVENT } from '../../util/EventHelper';
import { AssignmentUtil } from "../util/AssignmentUtil";
import { isBoundaryEvent, isEventSubProcess, isMessageFlow, isSequenceFlow } from "../util/ModelUtil";
import EventBehaviors from './EventBehaviors';

const HIGH_PRIORITY = 1500;
var rootArray = []; // array di root che si aggiorna in getSpaceWeighedPath

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

  this._assignmentUpdateCondition = false;

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

  for (const element of elements) {
    simulator.registerBehavior(element, this);
  }

  const boundaryEvents = [
    'bpmn:BoundaryEvent',
    'bpmn:IntermediateCatchEvent',
    'bpmn:ConditionalEventDefinition'
  ];

  for (const element of boundaryEvents) {
    simulator.registerBehavior(element, this);
    console.log('Boundary event registered:', element);
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
  'olcModdle'
];

ActivityBehavior.prototype.enter = function(context) {
  const { element, scope } = context;
  console.log('Entering element:', element);

  const eventBehavior = this._eventBehaviors.get(element);
  if (eventBehavior) {
    return eventBehavior.call(this, context);
  }

  this._getBoundaryEvents(element).forEach(attacher => {
    this.enter({
      element: attacher,
      scope: context.scope
    });
  });

  const continueEvent = this.waitAtElement(element);
  if (continueEvent) {
    return this.signalOnEvent(context, continueEvent);
  }

  this.processAssignments(context);
  this.checkAndTriggerConditionalStartEvent(context);

  const event = this._triggerMessages(context);
  if (event) {
    return this.signalOnEvent(context, event);
  }

  if (element.businessObject.guard !== undefined && element.businessObject.guard !== "") {
    const placesAdmitted = this.getValidityGuard(context);
    let guard = false;
    for (let i = 0; i < placesAdmitted.length; i++) {
      if (element.businessObject.root === placesAdmitted[i].id) {
        guard = true;
      }
    }
    if (guard !== false) {
      this._simulator.exit(context);
    } else {
      console.log("The robot is in a wrong position to do the task");
    }
  } else {
    this._simulator.exit(context);
  }
};

ActivityBehavior.prototype.checkAndTriggerConditionalStartEvent = function(context) {
  const { element } = context;

  if (this._assignmentUpdateCondition === "updateAssignment" && !this._conditionalStartTriggered) {
    const allElements = this._elementRegistry.getAll();
    const startEventConditionals = allElements.filter(e =>
        e.type === 'bpmn:StartEvent' &&
        e.businessObject.eventDefinitions &&
        e.businessObject.eventDefinitions.some(ed => ed.$type === 'bpmn:ConditionalEventDefinition')
    );

    startEventConditionals.forEach(startEventConditional => {
      if (startEventConditional._conditionTriggered) {
        console.log(`L'evento di avvio condizionale è già stato attivato per l'elemento ${startEventConditional.id}. Ignorando.`);
        return;
      }

      console.log('Trovato evento di avvio condizionale:', startEventConditional);

      const newScope = this._simulator.createScope({
        element: startEventConditional,
        parentScope: null
      });

      console.log('Nuovo scope creato:', newScope);

      this._simulator.enter({
        element: startEventConditional,
        scope: newScope
      });

      startEventConditional._conditionTriggered = true;
    });

    // Imposta la variabile per indicare che l'evento di avvio condizionale è stato attivato
    this._conditionalStartTriggered = true;
  }
};

ActivityBehavior.prototype.processAssignments = function(context) {
  const { element } = context;
  const assignmentObj = AssignmentUtil.parseElementAssignment(element.businessObject.assignment);

  // Variabile per tracciare se l'assegnamento è stato modificato per la prima volta
  if (!this._firstModification) {
    this._firstModification = false;
  }

  let assignmentModified = false;

  if (assignmentObj.add && Array.isArray(assignmentObj.add)) {
    assignmentObj.add.forEach(addAssignment => {
      if (typeof addAssignment === 'string') {
        addAssignment = addAssignment.split('.');
      }
      this.addPlacesAndTransition({ add: addAssignment });
    });
    assignmentModified = true;
  }

  if (assignmentObj.delete && Array.isArray(assignmentObj.delete)) {
    assignmentObj.delete.forEach(deleteAssignment => {
      const connectionToDelete = AssignmentUtil.findTransitionByName(deleteAssignment, this._spaceModeler);
      if (connectionToDelete) {
        const canvas = this._spaceModeler._canvaspace.canvas;
        canvas.removeConnection(connectionToDelete);
        canvas._elementRegistry.remove(connectionToDelete);
        assignmentModified = true;
      }
    });
  }

  const places = this._spaceModeler._places.get('Elements');
  const placeNames = places.map(place => place.name);

  Object.keys(assignmentObj).forEach(placeName => {
    if (placeNames.includes(placeName)) {
      const placeAssignments = assignmentObj[placeName];
      Object.keys(placeAssignments).forEach(key => {
        const alertKey = `${placeName}-${key}`;
        if (!this._alertsShown[alertKey]) {
          alert(`Il luogo ${placeName} ha l'assegnamento ${key} impostato su ${placeAssignments[key]}`);
          this._alertsShown[alertKey] = true;
          assignmentModified = true;
        }
      });
    }
  });

  const filteredPlaces = places.filter(element => is(element, 'space:Place'));

  filteredPlaces.forEach(place => {
    const assignmentOlcObj = AssignmentUtil.parseAssignmentOlc(place.assignmentOlc);
    Object.keys(assignmentOlcObj).forEach(key => {
      const alertKey = `${place.name}-${key}`;
      if (!this._alertsShown[alertKey]) {
        alert(`Avviso: ${key} è impostato su ${assignmentOlcObj[key]} al luogo: ${place.name}`);
        this._alertsShown[alertKey] = true;
        assignmentModified = true;
      }
    });
    AssignmentUtil.updatePlaceAssignmentWithElement(element, place, this._spaceModeler);
  });

  if (assignmentModified && !this._firstModification) {
    this._firstModification = true;
    this._assignmentUpdateCondition = "updateAssignment";
    this._conditionalStartTriggered = false; // Resetta il trigger per l'evento condizionale
  }

  this.checkAndTriggerConditionalStartEvent(context);

  return {
    id: element.businessObject.id,
    name: element.businessObject.name,
    assignment: assignmentObj
  };
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

ActivityBehavior.prototype._getBoundaryEvents = function(element) {
  return element.attachers.filter(attacher => isBoundaryEvent(attacher));
};


// ActivityBehavior.js

ActivityBehavior.prototype.exit = function(context) {
  const { element, scope } = context;
  const parentScope = scope.parent;
  const complete = !scope.failed;

  // Gestione degli eventi del bus
  this._handleEventBus(element);

  // Registrazione della compensazione se il processo è completo
  if (complete && !isEventSubProcess(element)) {
    this._transactionBehavior.registerCompensation(scope);
  }

  // Flussi attivati se il processo è completo
  const activatedFlows = complete ? element.outgoing.filter(isSequenceFlow) : [];

  // Gestione della destinazione dell'elemento
  this._handleDestination(context, element, activatedFlows, parentScope, scope);

  // Se non c'è destinazione, aggiungi il tempo di esecuzione e attiva i flussi
  if (!element.businessObject.destination || element.businessObject.destination === "") {
    this._addExecutionTime(element);
    this._activateFlows(activatedFlows, parentScope, scope);
  }
};


ActivityBehavior.prototype.addPlacesAndTransition = function(assignmentObj) {
  const olcElementFactory = this._spaceModeler.get('olcElementFactory');
  const olcUpdater = this._spaceModeler.get('olcUpdater');
  const canvas = this._spaceModeler._canvaspace.canvas;
  const olcModdle = this._olcModdle;

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
      //qua devo trovare un modo per farli proender olcmoodle altrimnenti non posso creare il business object


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
      const connectionBusinessObject =olcElementFactory.createBusinessObject('space:Transition', { name: '1' });
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


// Funzione per gestire la destinazione
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

// Funzione per processare la destinazione
// ActivityBehavior.js

ActivityBehavior.prototype._processDestination = function(context, element, activatedFlows, parentScope, scope) {
  const flows = this.getSpaceWeighedPath(context);
  let timespace = this.getSpaceExecutionTime(context);

  if (!element.businessObject.duration) {
    element.businessObject.duration = 0;
  }

  this._time.addTime(element.businessObject.duration);
  this._time.addTime(timespace);
  var timex = Object.values(this._time);

  element.businessObject.$parent.executionTime = timex[0];

  if (flows.length === 0) {
    console.warn('Destination not reachable');
    alert("Destination not reachable");

    const conditionalEvent = element.attachers.find(attacher =>
        attacher.businessObject.$type === 'bpmn:BoundaryEvent' &&
        attacher.businessObject.eventDefinitions[0].$type === 'bpmn:ConditionalEventDefinition' &&
        attacher.host.businessObject.$type === 'bpmn:Task' // Check if the attacher is attached to a task
    );

    if (conditionalEvent) {
      conditionalEvent.businessObject.condition = 'destinationUnreachable';
      const eventContext = {
        element: conditionalEvent,
        scope: scope
      };
      const eventBehavior = this._eventBehaviors.get(conditionalEvent);
      if (eventBehavior) {
        return eventBehavior.call(this, eventContext);
      } else {
        console.warn('No behavior found for conditional event');
      }
    }

    this._simulator.exit(context);
    alert("Ending current process due to unreachable destination.");
  } else {
    this._handleConnections(flows, activatedFlows, parentScope);
  }
};


// Funzione per gestire le connessioni
ActivityBehavior.prototype._handleConnections = function(flows, activatedFlows, parentScope) {
  const connections = flows.map(flow => {
    const element = this._spaceModeler._canvaspace.canvas._elementRegistry._elements[flow.id];
    if (!element || !element.element) {
      console.warn('Element not found for flow:', flow.id);
      return null;
    }
    return element.element;
  }).filter(Boolean); // Filtra gli elementi nulli o non definiti

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

// Funzione per aggiungere il tempo di esecuzione
ActivityBehavior.prototype._addExecutionTime = function(element) {
  if (!element.businessObject.duration) {
    element.businessObject.duration = 0;
  }
  this._time.addTime(element.businessObject.duration);
  var timex = Object.values(this._time);
  element.businessObject.$parent.executionTime = timex[0];
};



// Funzione per attivare i flussi
ActivityBehavior.prototype._activateFlows = function(activatedFlows, parentScope, scope) {
  activatedFlows.forEach(flowElement => this._simulator.enter({
    element: flowElement,
    scope: parentScope
  }));

  if (activatedFlows.length === 0) {
    this._scopeBehavior.tryExit(parentScope, scope);
  }
};




ActivityBehavior.prototype.getValidityGuard= function(context) {

  const {
    element,
    scope
  } = context;

  var places = this._spaceModeler._places.get('Elements');
  var place = places.filter(element => is(element, 'space:Place'));
  var placesAdmitted =[];
  var guardNot, guard;
  var guardLength= element.businessObject.guard.length;

  if (element.businessObject.guard.startsWith("not in"))
  {
    guardNot= element.businessObject.guard.slice(7,guardLength-1);
    var guardArrayNot = guardNot.split(",");
    placesAdmitted=place;
    for(let i=0; i<guardArrayNot.length; i++){
      for(let j=0; j<place.length; j++){
        if(guardArrayNot[i] === place[j].name){
          var index = placesAdmitted.indexOf(place[j]);
          console.log(index)
          placesAdmitted.splice(index, 1);
        }
        else{
          j=j;
        }
      }
    }

    return placesAdmitted;
  }
  else {
    guard= element.businessObject.guard.slice(3,guardLength-1);
    var guardArray=guard.split(",")
    for(let i=0; i<guardArray.length; i++){
      for(let j=0; j<place.length; j++){
        if(guardArray[i] === place[j].name){
          placesAdmitted.push(place[j])
        }
        else{
          j=j;
        }
      }
    }

    return placesAdmitted;
  }

};


ActivityBehavior.prototype.getSpaceWeighedPath = function (context) {
  const {element, scope} = context;

  var places = this._spaceModeler._places.get('Elements');
  var place = places.filter(e => is(e, 'space:Place'));
  var connections = places.filter(e => is(e, 'space:Transition'));


  var root = getRoot(element, places); // Ottieni la root corrente
  rootArray.push(root);
  var goal = getDestination(element, places); // Ottieni la destinazione


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
    if (weight !== null) { // Verifica se il peso è diverso da null
      g.addEdge(connections[i].sourcePlace.id, connections[i].targetPlace.id, weight);
    } else {
      console.error(`Il peso della transizione ${connections[i].name} non è un numero valido.`);
      alert("Invalid weight on transition no. " + i)
    }
  }
  var shortestpath = g.Dijkstra(root, goal);
  var fullPath = []; // Inizializza l'array per il percorso completo

  if (connections.length === 0) {
    return [];
  } else {



    for (let i = 0; i < shortestpath.length - 1; i++) {
      let connection = connections.find(c => c.sourcePlace.id === shortestpath[i] && c.targetPlace.id === shortestpath[i + 1]);
      if (connection) {
        fullPath.push(connection); // Aggiungi la connessione al percorso completo
      } else {
        //console.warn('Connessione non trovata per il percorso più breve:', shortestpath[i], shortestpath[i + 1]);
      }
    }
    // Aggiorna la radice e la destinazione solo se il percorso completo è stato trovato correttamente
    if (fullPath.length > 0) {
      element.parent.businessObject.root = fullPath[fullPath.length - 1].targetPlace.id;
      if (fullPath.length > 1) {
        element.businessObject.destination = fullPath[1].targetPlace.id;
      }
    } else {
      console.warn('Percorso completo non trovato.');
    }

    return fullPath; // Restituisci il percorso completo
  }
}

ActivityBehavior.prototype.getSpaceExecutionTime = function(context) {

  const {
    element,
    scope
  } = context;

  const flows = this.getSpaceWeighedPath(context);
  var totDist =0;
  for(let i=0; i<flows.length; i++){
    totDist+=parseInt(flows[i].name);
  }
  var velocity= element.businessObject.velocity;
  var spaceTemp= totDist/velocity;
  return spaceTemp;
}


ActivityBehavior.prototype.signalOnEvent = function(context, event) {

  const {
    scope,
    element
  } = context;
  console.log(context)
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

  console.log("Message contex",messageContexts); // Stampa i messageContexts sulla console
  return messageContexts; // Ritorna i messageContexts dalla funzione
};


ActivityBehavior.prototype._triggerMessages = function(context) {

  // check for the next message flows to either
  // trigger or wait for; this implements intuitive,
  // as-you-would expect message flow execution in modeling
  // direction (left-to-right).

  const {
    element,
    initiator,
    scope
  } = context;

  let messageContexts = scope.messageContexts;

  if (!messageContexts) {
    messageContexts = scope.messageContexts = this._getMessageContexts(element);
  }

  const initiatingFlow = initiator && initiator.element;

  if (isMessageFlow(initiatingFlow)) {

    // ignore out of bounds messages received;
    // user may manually advance and force send all outgoing
    // messages
    if (scope.expectedIncoming !== initiatingFlow) {
      console.debug('Simulator :: ActivityBehavior :: ignoring out-of-bounds message');

      return;
    }
  }

  while (messageContexts.length) {
    const {
      incoming,
      outgoing
    } = messageContexts.shift();

    if (incoming) {

      // force sending of all remaining messages,
      // as the user triggered the task manually (for demonstration
      // purposes
      if (!initiator) {
        continue;
      }

      // remember expected incoming for future use
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


// Funzione per gestire gli eventi del bus
ActivityBehavior.prototype._handleEventBus = function(element) {
  this._eventBus.on(TOGGLE_MODE_EVENT, event => {
    if (event.active) {
      this._time.reset();
      element.businessObject.$parent.executionTime = this._time;
    }
  });

  this._eventBus.on(PAUSE_SIMULATION_EVENT, event => {
    if (!event.active) {
      element.parent.businessObject.root = rootArray[0];
    }
  });

  this._eventBus.on(RESET_SIMULATION_EVENT, event => {
    if (!event.active) {
      element.parent.businessObject.root = rootArray[0]; // prendi la prima root ossia la initial position
    }
  });
};



// helpers //////////////////

function first(arr) {
  return arr && arr[0];
}

function last(arr) {
  return arr && arr[arr.length - 1];
}