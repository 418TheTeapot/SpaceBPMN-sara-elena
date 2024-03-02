import {isEventSubProcess, isMessageFlow, isSequenceFlow,} from '../util/ModelUtil';

import {is} from "../../../example/lib/util/Util";
import WeightedGraph from '../util/WeightedGraph';
import TimeUtil from '../util/TimeUtil';
import {PLAY_SIMULATION_EVENT, TOGGLE_MODE_EVENT,} from '../../util/EventHelper';


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
  this._animation=animation;
  this._elementRegistry = elementRegistry;
  this._spaceModeler=spaceModeler;
  this._eventBus=eventBus;
  this._pauseSimulation=pauseSimulation;
  this._time= new TimeUtil(0);

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


ActivityBehavior.prototype.enter = function(context) {

  const {
    element
  } = context;

  const continueEvent = this.waitAtElement(element);

  console.log("continueEvent")

  if (continueEvent) {
    return this.signalOnEvent(context, continueEvent);
  }

  // trigger messages that are pending send
  const event = this._triggerMessages(context);

  if (event) {
    return this.signalOnEvent(context, event);
  }

  if ((element.businessObject.guard !== undefined) && (element.businessObject.guard !== "")){
    var placesAdmitted= this.getValidityGuard(context);
    console.log(placesAdmitted)
    var guard = false;
    console.log(element.businessObject.root)
    for(let i=0; i<placesAdmitted.length;i++){
      if(element.businessObject.root===placesAdmitted[i].id){
        guard=true;
      }
      else {
        i=i;
      }
    }
    if (guard!==false){
      this._simulator.exit(context)
    }
    else {
      alert ("The robot is in a wrong position to do the task")
    }
  }
  else {
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

ActivityBehavior.prototype.exit = function(context) {
  const {
    element,
    scope
  } = context;

  // Registra un listener per l'evento TOGGLE_MODE_EVENT
  this._eventBus.on(TOGGLE_MODE_EVENT, event => {
    const active = event.active;
    console.log("toggle")
    if (active) {
      this._time.reset();
      element.businessObject.$parent.executionTime = this._time;
    }
  });

  const parentScope = scope.parent;
  // TODO(nikku): if a outgoing flow is conditional,
  //              task has exclusive gateway semantics,
  //              else, task has parallel gateway semantics

  const complete = !scope.failed;
  // compensation is registered AFTER successful completion
  // of normal scope activities (non event sub-processes).
  //
  // we must register it now, not earlier

  console.log("è un sub event process")
  if (complete && !isEventSubProcess(element)) {
    this._transactionBehavior.registerCompensation(scope);
    // element.businessObject.root = getRoot(element, places);
    // console.log(element.businessObject.root)
  }

  // if exception flow is active,
  // do not activate any outgoing flows
  const activatedFlows = complete
      ? element.outgoing.filter(isSequenceFlow)
      : [];

  console.log(element)
  console.log("destination " + element.businessObject.destination)
  console.log("root " + element.businessObject.root) //restituisce undefined al primo play

// Se il task ha una destinazione
  if (element.businessObject.destination !== undefined && element.businessObject.destination !== "") {
    // e se ha anche una root
    if (element.parent.businessObject.root !== undefined && element.parent.businessObject.root !== "") {
      // e se la destinazione non è uguale alla root
      if (element.businessObject.destination === element.parent.businessObject.root) {
        console.log(element);
        console.log("destination " + element.businessObject.destination)
        console.log("root " + element.businessObject.root) //restituisce undefined dopo il primo play
        alert("The initial position must not be the destination");
      } else {
        // Calcola il percorso pesato nello spazio
        const flows = this.getSpaceWeighedPath(context);
        let timespace = this.getSpaceExecutionTime(context);

        if(element.businessObject.duration === undefined){
          element.businessObject.duration=0;
        }
        this._time.addTime(element.businessObject.duration);
        this._time.addTime(timespace)
        var timex= Object.values(this._time)

        element.businessObject.$parent.executionTime= timex[0]
        //element.businessObject.$parent.executionTime= this._time
        //If the path doesn't exist
        console.log(flows)
        if(flows.length===0){
          console.log("")
        }
        else {
          const connections = [];
          flows.forEach(
              element =>
                  connections.push(this._spaceModeler._canvaspace.canvas._elementRegistry._elements[element.id].element)
          )

          if (connections.length > 0){
            console.log(connections);
            const element = connections.shift()
            element['connections'] = connections
            element['activatedFlows'] = activatedFlows
            console.log(element)
            this._simulator.enter({
              element,
              scope: parentScope,
              parentScope : parentScope
            }) }
        }
      }
    }
    //if I have the destination but not the root
    else {
      alert("Please select an initial position for the Participant "+ element.businessObject.name)
    }
  }
  //if a task does not have a destination animate bpmn elements
  else{

    if(element.businessObject.duration === undefined){
      element.businessObject.duration =0;
    }
    console.log(element.businessObject.duration)
    console.log(this._time)
    this._time.addTime(element.businessObject.duration);
    var timex= Object.values(this._time)

    element.businessObject.$parent.executionTime= timex[0]

    /* modeling.updateProperties(element.businessObject.$parent, {
       executionTime: this._time
     });*/
    console.log(element.businessObject.$parent.executionTime)
    console.log(this._time)
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
//variabile globale per il tempo.
//legare informazione sul token.
//token crato ha una variabile time, e quando token va da stak all'altro, gli vado a modficare quella variabile.
  console.log(this._time)
};


ActivityBehavior.prototype.getSpaceWeighedPath = function (context) {
  const {element, scope} = context;

  var places = this._spaceModeler._places.get('Elements');
  var place = places.filter(e => is(e, 'space:Place'));
  var connections = places.filter(e => is(e, 'space:Transition'));

  var root = getRoot(element, places); // Ottieni la root corrente
  console.log("root " + root)
  var goal = getDestination(element, places); // Ottieni la destinazione
  console.log("goal " + goal)


  var rootName = getNameRoot(root, places);
  var destinationName = getNameDestination(goal, places);

  // if (root === goal) {
  //   alert("La destinazione è la stessa della posizione corrente. Scegliere una destinazione diversa.");
  //   return []; // Restituisce un array vuoto o un altro valore appropriato
  // }


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

  // for (let c of connections) {
  //   g.addEdge(c.sourcePlace.id, c.targetPlace.id, parseInt(c.name));
  // }


  for (let i = 0; i < connections.length; i++) {
    const weight = parseInt(connections[i].name);
    if (weight !== null && !isNaN(weight)) { // Verifica se il peso è diverso da null e se è un numero valido
      g.addEdge(connections[i].sourcePlace.id, connections[i].targetPlace.id, weight);
    } else {
      console.error(`Il peso della transizione ${connections[i].name} non è un numero valido.`);
      alert("Invalid weight on transition no. " + i)
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

    if (fullPath.length > 1) {
      element.businessObject.destination = fullPath[1].targetPlace.id;
    }
  } else {
    console.warn('Percorso completo non trovato.');
  }

  return fullPath; // Restituisci il percorso completo
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

/**
 * Returns an event to subscribe to if wait on element is configured.
 *
 * @param {Element} element
 *
 * @return {Object|null} event
 */
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

/**
 * @param {any} context
 *
 * @return {Object} event to subscribe to proceed
 */
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


// helpers //////////////////

function first(arr) {
  return arr && arr[0];
}

function last(arr) {
  return arr && arr[arr.length - 1];
}