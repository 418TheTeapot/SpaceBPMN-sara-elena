

import {is} from "../../../example/lib/util/Util";
import WeightedGraph from '../util/WeightedGraph';
import TimeUtil from '../util/TimeUtil';
import {PAUSE_SIMULATION_EVENT, RESET_SIMULATION_EVENT, TOGGLE_MODE_EVENT} from '../../util/EventHelper';
import {AssignmentUtil} from "../util/AssignmentUtil";
import {isEventSubProcess, isSequenceFlow,isMessageFlow} from "../util/ModelUtil";


export default function ActivityBehavior(
    simulator,
    scopeBehavior,
    transactionBehavior,
    animation,
    elementRegistry,
    spaceModeler,
    eventBus,
    pauseSimulation,
    olcModdle // Aggiungi olcModdle qui
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
  this._olcModdle = olcModdle; // Assegna olcModdle a una proprietà della classe

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
  'olcModdle' // Aggiungi olcModdle qui
];

const HIGH_PRIORITY = 1500;

ActivityBehavior.prototype.signal = function(context) {

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
  const olcModdle = this._olcModdle;

  console.log(assignmentObj)

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

      console.log('Creating connection:', connection);
      canvas.addConnection(connection);
      console.log('Connection added to canvas:', connection);

      connection.businessObject.sourcePlace = previousPlace.businessObject;
      connection.businessObject.targetPlace = place.businessObject;
      olcUpdater.linkToBusinessObjectParent(connection);
      console.log('Connection drawn:', connection);
    }

    previousPlace = place;
  });
};


ActivityBehavior.prototype.processAssignments = function(context) {
  const { element } = context;
  const assignmentObj = AssignmentUtil.parseElementAssignment(element.businessObject.assignment);
  console.log('Parsed assignment:', assignmentObj);

  if (assignmentObj.add) {
    console.log(assignmentObj)
    assignmentObj.add.forEach(value => {
      console.log(value);
      assignmentObj.add = value.toString().split('.');
      console.log(assignmentObj.add)
      this.addPlacesAndTransition(assignmentObj);
    });
  }

  if (assignmentObj.delete) {
    assignmentObj.delete.forEach(value => {
      //console.log(value);
      //const deleteValue = assignmentObj.delete;
      const connectionToDelete = AssignmentUtil.findTransitionByName(value, this._spaceModeler);


      if (connectionToDelete) {
        const canvas = this._spaceModeler._canvaspace.canvas;
        canvas.removeConnection(connectionToDelete);
        canvas._elementRegistry.remove(connectionToDelete);

        //console.log("Canvas element registry after removal:", canvas._elementRegistry);
        console.log(`Deleted transition: ${value}`);
      } else {
        console.warn(`Transition not found: ${value}`);
      }
    });

  }

  const places = this._spaceModeler._places.get('Elements');
  const placeNames = places.map(place => place.name);

  console.log("places: ", places)
  console.log("places names: ", placeNames)

  Object.keys(assignmentObj).forEach(placeName => {
    if (placeNames.includes(placeName)) {
      //console.log(`The name of the place is in the assignments: ${placeName}`);
      alert(`The name of the place in question is: ${placeName}`);
    }
  });

  const filteredPlaces = places.filter(element => is(element, 'space:Place'));

  console.log("filteredPlaces: ", filteredPlaces)

  const assignmentsOlc = filteredPlaces.map(place => { //TODO sistemare gestione assignment vuoti
      const assignmentOlcObj = AssignmentUtil.parseAssignmentOlc(place.assignmentOlc);
      return {
        id: place.id,
        name: place.name,
        assignmentOlc: assignmentOlcObj
      };
  });

  console.log("assignmentsOlc", assignmentsOlc)

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

  //console.log("continueEvent");

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


var rootArray = []; //array di root che si aggiorna in getSpaceWeighedPath

ActivityBehavior.prototype.exit = function(context) {
  const {
    element,
    scope
  } = context;

  // Registra un listener per l'evento TOGGLE_MODE_EVENT
  this._eventBus.on(TOGGLE_MODE_EVENT, event => {
    const active = event.active;
    //console.log("toggle")
    if (active) {
      this._time.reset();
      element.businessObject.$parent.executionTime = this._time;
    }
  });

  /*
  reimposta initial position alla posizione originaria e registra i nuovi log aggiungendoli ai vecchi
  funziona solo se si mette in pausa il play in alto a sx
   */
  this._eventBus.on(PAUSE_SIMULATION_EVENT, event => {
    const active = event.active;
    //console.log("pause")
    if(!active) {
      element.parent.businessObject.root = rootArray[0]; //prendo la prima root ossia la initial position
      console.log("pause event root " + element.parent.businessObject.root)
    }
  })

  //reimposta initial position alla posizione originaria e pulisce i log
  this._eventBus.on(RESET_SIMULATION_EVENT, event => {
    const active = event.active;
    //console.log("reset")
    if(!active) {
      element.parent.businessObject.root = rootArray[0]; //prendo la prima root ossia la initial position
      console.log("reset event root " + element.parent.businessObject.root)
    }
  })

  const parentScope = scope.parent;
  const complete = !scope.failed;
  const activatedFlows = complete ? element.outgoing.filter(isSequenceFlow) : [];

  if (complete && !isEventSubProcess(element)) {
    this._transactionBehavior.registerCompensation(scope);
  }

  if (element.businessObject.destination !== undefined && element.businessObject.destination !== "") {
    if (element.parent.businessObject.root !== undefined && element.parent.businessObject.root !== "") {
      if (element.businessObject.destination === element.parent.businessObject.root) {
        alert("The initial position must not be the destination");
      } else {
        const flows = this.getSpaceWeighedPath(context);
        if (element.businessObject.duration === undefined) {
          element.businessObject.duration = 0;
        }
        this._time.addTime(element.businessObject.duration);
        element.businessObject.$parent.executionTime = Object.values(this._time)[0];
        if (flows.length === 0) {
          alert("Destinazione non raggiungibile");
          this._shouldEndSimulation = true; // Set the flag to end the simulation
          this._simulator.exit(context);
          this._simulator.reset();
        } else {
          const connections = flows.map(flow => this._spaceModeler._canvaspace.canvas._elementRegistry._elements[flow.id].element);
          if (connections.length > 0) {
            const element = connections.shift();
            element['connections'] = connections;
            element['activatedFlows'] = activatedFlows;
            this._simulator.enter({ element, scope: parentScope, parentScope });
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
    element.businessObject.$parent.executionTime = Object.values(this._time)[0];
    activatedFlows.forEach(element => this._simulator.enter({ element, scope: parentScope }));
    if (activatedFlows.length === 0) {
      this._scopeBehavior.tryExit(parentScope, scope);
    }
  }
  if (this._shouldEndSimulation) {
    // Perform any additional cleanup or final steps here if necessary
    console.log('Simulation ended.');
  }
};

ActivityBehavior.prototype.getSpaceWeighedPath = function (context) {
  const {element, scope} = context;

  var places = this._spaceModeler._places.get('Elements');
  var place = places.filter(e => is(e, 'space:Place'));
  var connections = places.filter(e => is(e, 'space:Transition'));


  var root = getRoot(element, places); // Ottieni la root corrente
  console.log("root " + root)
  rootArray.push(root);
  console.log("root array [0] " + rootArray[0])
  var goal = getDestination(element, places); // Ottieni la destinazione
  console.log("goal " + goal)


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


  const findConnections = (root, goal, visited = new Set()) => {
    const rootConns = [];
    const result = [];

    // Trova tutte le connessioni dal root
    for (let i = 0; i < connections.length; i++) {
      if (connections[i].sourcePlace.id === root) {
        rootConns.push(connections[i]);
      }
    }

    for (let i = 0; i < rootConns.length; i++) {
      const connection = rootConns[i];
      const target = connection.targetPlace.id;

      if (target === goal) {
        result.push([connection]);
      } else if (!visited.has(target)) {
        visited.add(target); // Evita i cicli
        const subResults = findConnections(target, goal, visited);

        for (const subPath of subResults) {
          result.push([connection, ...subPath]);
        }

        visited.delete(target); // Rimuove il target dai visitati per altre possibili strade
      }
    }

    return result;
  };


  const availablePaths = findConnections(root, goal); //possibili percorsi in array distinti
  console.log(availablePaths)

  const [firstPath = [], secondPath = []] = availablePaths;

  const paths = [...firstPath, ...secondPath]; //array di tutte le connection che rappresentano un possibile percorso

  for (let i = 0; i < paths.length; i++) {
    const weight = parseInt(paths[i].name);
    if (!isNaN(weight)) { // Verifica se il peso è diverso da null
      g.addEdge(paths[i].sourcePlace.id, paths[i].targetPlace.id, weight);
    } else {
      alert("Invalid weight on transition from " + paths[i].sourcePlace.name + " to " + paths[i].targetPlace.name)
      console.error(`Il peso della transizione ${paths[i].name} non è un numero valido.`);
    }
  }

  var shortestpath = g.Dijkstra(root, goal);
  var fullPath = []; // Inizializza l'array per il percorso completo

  for (let i = 0; i < shortestpath.length - 1; i++) {
    let connection = connections.find(c => c.sourcePlace.id === shortestpath[i] && c.targetPlace.id === shortestpath[i + 1]);
    if (connection) {
      fullPath.push(connection); // Aggiungi la connessione al percorso completo
    } else {
      console.warn('Connessione non trovata per il percorso più breve:', shortestpath[i], shortestpath[i + 1]);
    }
  }

  // Aggiorna la radice e la destinazione solo se il percorso completo è stato trovato correttamente
  if (fullPath.length > 0) {
    element.parent.businessObject.root = fullPath[fullPath.length - 1].targetPlace.id;
    console.log("full path root " + element.parent.businessObject.root)
    if (fullPath.length > 1) {
      element.businessObject.destination = fullPath[1].targetPlace.id;
      console.log("full path destination " + element.businessObject.destination)
    }
  } else {
   console.error('Percorso più breve non trovato.');
  }

  return fullPath; // Restituisci il percorso completo
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

  return messageContexts; // Ritorna i messageContexts dalla funzione
};


ActivityBehavior.prototype._triggerMessages = function(context) {



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


// helpers //////////////////

function first(arr) {
  return arr && arr[0];
}

function last(arr) {
  return arr && arr[arr.length - 1];
}