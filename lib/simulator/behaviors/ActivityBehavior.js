import {
  isEventSubProcess,
  isMessageFlow,
  isSequenceFlow,
} from '../util/ModelUtil';

import { is } from "../../../example/lib/util/Util";
import WeightedGraph from '../util/WeightedGraph';
import TimeUtil from '../util/TimeUtil';
import {
  TOGGLE_MODE_EVENT,
} from '../../util/EventHelper';


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

  // trigger messages that are pending send
  const event = this._triggerMessages(context);

  if (event) {
    return this.signalOnEvent(context, event);
  }

  this._simulator.exit(context);
};

ActivityBehavior.prototype.enter = function(context) {

  const {
    element
  } = context;

  const continueEvent = this.waitAtElement(element);

  console.log(continueEvent);

  if (continueEvent) {
    return this.signalOnEvent(context, continueEvent);
  }

  // trigger messages that are pending send
  const event = this._triggerMessages(context);

  if (event) {
    return this.signalOnEvent(context, event);
  }

  //esempio con assignment ...poi veder come definirli ? saranno attibuti di diverso tipo
  //percio capire la logica nel flow

  if ((element.businessObject.assignment !== undefined) && (element.businessObject.assignment !== "")) {
    alert('Allarme attivato!');
  } else if (element.businessObject.assignment && element.businessObject.assignment.toUpperCase() === 'ALARM') {
    alert("Non hai scritto nulla di valido!")
  }


  console.log("assignments assegnato all'id :" + element.businessObject.id)


  //Assolutamtne da rivedere ! Fa schifo

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

  // Gestione dell'evento di cambio modalità
  this._eventBus.on(TOGGLE_MODE_EVENT, event => {
    const active = event.active;

    // Resetta il tempo se attivo
    if (active) {
      this._time.reset();
      element.businessObject.$parent.executionTime = this._time;
    }
  });

  const parentScope = scope.parent;

  // Controllo se l'esecuzione è completata senza errori
  const complete = !scope.failed;

  // Registra la compensazione dopo il completamento con successo
  if (complete && !isEventSubProcess(element)) {
    this._transactionBehavior.registerCompensation(scope);
  }

  // Determina i flussi attivati
  const activatedFlows = complete
      ? element.outgoing.filter(isSequenceFlow)
      : [];

  // Se l'attività ha una destinazione
  if (element.businessObject.destination) {
    // Ottieni l'ID della root del genitore
    const parentRootId = this.getRoot(element);

    // Confronta la destinazione con la root del genitore
    if (element.businessObject.destination === parentRootId) {
      alert("The current position must not be the destination.");
    } else {
      // Altrimenti, esegui l'animazione degli elementi spaziali
      const flows = this.getSpaceWeighedPath(context);
      let timespace = this.getSpaceExecutionTime(context);
      element.businessObject.duration = element.businessObject.duration || 0;
      this._time.addTime(element.businessObject.duration);
      this._time.addTime(timespace);

      var timex = Object.values(this._time);
      element.businessObject.$parent.executionTime = timex[0];

      if (flows.length > 0) {
        const connections = flows.map(el =>
            this._spaceModeler._canvaspace.canvas._elementRegistry._elements[el.id].element
        );

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
  } else if (element.businessObject.root) {
    alert("Please select a destination for the Task " + element.businessObject.name);
  } else {
    // Se non c'è né destinazione né root, anima gli elementi BPMN
    element.businessObject.duration = element.businessObject.duration || 0;
    this._time.addTime(element.businessObject.duration);
    var timex = Object.values(this._time);
    element.businessObject.$parent.executionTime = timex[0];

    activatedFlows.forEach(flowElement => {
      this._simulator.enter({
        element: flowElement,
        scope: parentScope
      });
    });

    // Gestione dei token
    if (activatedFlows.length === 0) {
      this._scopeBehavior.tryExit(parentScope, scope);
    }
  }

  // Gestione del tempo e del token
  console.log(this._time);
};


ActivityBehavior.prototype.getRoot = function (element) {
  var place = this._spaceModeler._places.get('Elements').filter(element => is(element, 'space:Place'));
  var root;
  if (element.parent && element.parent.businessObject.root) {
    for (let i = 0; i < place.length; i++) {
      if (place[i].id === element.parent.businessObject.root) {
        root = place[i].id;
        return root;
      }
    }
  } else {
    // Gestione del caso in cui la root non è definita
    alert("Scegliere una Current Position!");
  }
};


ActivityBehavior.prototype.getSpaceWeighedPath = function (context) {
  const {
    element,
    scope
  } = context;

  var places = this._spaceModeler._places.get('Elements');
  var place = places.filter(element => is(element, 'space:Place'));
  var connections = places.filter(element => is(element, 'space:Transition'));
  var root; // id della place root
  var goal; // id della place di destinazione
  var shortestpathConnection = [];

  var rootId = this.getRoot(element); // Utilizza la nuova funzione getRoot

  function getRoot() {
    if (element.parent && element.parent.businessObject.root) {
      console.log(element.parent.businessObject.root)
      for (let i = 0; i < place.length; i++) {
        if (place[i].id === element.parent.businessObject.root) {
          root = place[i].id;
          return root;
        } else {
          alert("Scegliere una Current Position !")
        }
      }
    }
  }

  function getDestination() {
    for (let i = 0; i < place.length; i++) {
      if (place[i].id === element.businessObject.destination) {
        goal = place[i].id;
        return goal;
      } else {
        i = i;
      }
    }
  }

  function getNameRoot() { // name of root place
    for (let i = 0; i < place.length; i++) {
      if (place[i].id === element.businessObject.root) {
        root = place[i].name;
        return root;
      } else {
        i = i;
      }
    }
  }

  function getNameDestination() {
    for (let i = 0; i < place.length; i++) {
      if (place[i].id === element.businessObject.destination) {
        goal = place[i].name;
        return goal;
      } else {
        i = i;
      }
    }
  }

  const g = new WeightedGraph();

  for (let i = 0; i < place.length; i++) {
    g.addVertex(place[i].id);
  }

  for (let i = 0; i < connections.length; i++) {
    g.addEdge(connections[i].sourcePlace.id, connections[i].targetPlace.id, parseInt(connections[i].name))
  }
  // array ordinato che contiene le place per arrivare dalla root a destinazione con il percorso più breve
  var shortestpath = g.Dijkstra(getRoot(), getDestination());

  console.log(shortestpath)
  // array contiene le transition dello shortest path ordinate
  for (let i = 0; i < shortestpath.length; i++) {
    for (let j = 0; j < connections.length; j++) {
      if (shortestpath[i] === connections[j].sourcePlace.id &&
          shortestpath[i + 1] === connections[j].targetPlace.id) {
        console.log(connections[j])
        shortestpathConnection.push(connections[j])
      }
    }
  }

  console.log(shortestpathConnection)
  console.log(shortestpath.length)
  console.log(shortestpathConnection.length)

  if (shortestpathConnection.length === 0) {
    alert("The destination " + getNameDestination() + " is unreachable from current position " +
        getNameRoot() + ", please choose another destination")
    console.log(shortestpath)
    console.log(shortestpathConnection)
    return shortestpathConnection;
  }
  console.log(shortestpathConnection)
  return shortestpathConnection;
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