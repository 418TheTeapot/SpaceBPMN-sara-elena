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
      'bpmn:Participant',
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


  //  metodo che prende un context come argomento.
  ActivityBehavior.prototype.enter = function(context) {
    // Estrazione dell'Elemento dal Contesto:

    const {
      element
    } = context;


    // Verifica se l'elemento ha ereditato correttamente la posizione corrente (root)
    if (element.businessObject.root) {
      console.log("Posizione corrente (root) ereditata correttamente:", element.businessObject.root);
    } else {
      console.warn("Posizione corrente (root) non ereditata");
    }

// Verifica se l'elemento ha ereditato correttamente la destinazione
    if (element.businessObject.destination) {
      console.log("Destinazione ereditata correttamente:", element.businessObject.destination);
    } else {
      console.warn("Destinazione non ereditata");
    }




    // Viene chiamata la funzione waitAtElement passandole l' element. '
    // 'Questo potrebbe essere utilizzato per controllare se c'è un evento di attesa associato all'elemento. ' +
    // 'Il risultato viene poi stampato per il debugging.

    const continueEvent = this.waitAtElement(element);

    // console.log(continueEvent);

    // Se continueEvent è vero (esiste un evento), la funzione signalOnEvent viene chiamata,
    // passando il context e l'continueEvent.
    // Ciò potrebbe essere usato per procedere con il flusso del processo se un certo evento di attesa è stato soddisfatto.

    if (continueEvent) {
      return this.signalOnEvent(context, continueEvent);
    }


    // Viene chiamata una funzione interna _triggerMessages, che potrebbe gestire i messaggi in attesa.
    //     Se questa funzione ritorna un event, viene nuovamente chiamata signalOnEvent.

    // trigger messages that are pending send
    const event = this._triggerMessages(context);

    if (event) {
      return this.signalOnEvent(context, event);
    }


    //Controllo Guardia

    // Questa parte controlla se la proprietà guard dell'oggetto di business dell'elemento è definita e non vuota.

    if ((element.businessObject.guard !== undefined) && (element.businessObject.guard !== "")){
      //Ottenere le Posizioni Ammesse
      //Viene chiamata la funzione getValidityGuard, passando il context,
      // per ottenere le posizioni ammesse in base alla guardia. Questo risultato viene poi stampato per il debugging.
      var placesAdmitted= this.getValidityGuard(context);
      console.log(placesAdmitted)

      //Verifica del Rispetto della Guardia
      //Questo ciclo controlla se la posizione corrente dell'elemento (element.businessObject.root) è una delle posizioni ammesse (placesAdmitted).
      // Se è così, la variabile guard viene impostata su true.

      var guard = false;
      // console.log(element.businessObject.root)
      for(let i=0; i<placesAdmitted.length;i++){
        if(element.businessObject.root===placesAdmitted[i].id){
         guard=true;
        }
        else {
          i=i;
        }
      }

//Gestione del Risultato della Guardia:
//Se la guardia è vera, la funzione esce usando this._simulator.exit(context).
//Altrimenti, viene mostrato un messaggio di allerta indicando che il robot si trova in una posizione errata per eseguire l'attività.

      if (guard!==false){
        this._simulator.exit(context)
      }
      else {
        alert ("The robot is in a wrong position to do the task")
      }
  }
    //Se la guardia non è definita, la funzione termina l'esecuzione dell'attività e esce.

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
            // console.log(index)
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

    this._eventBus.on(TOGGLE_MODE_EVENT, event => {
      const active = event.active;
      
      if (active) {
        this._time.reset();
        //console.log(this._time)
       
        element.businessObject.$parent.executionTime= this._time;
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

    // console.log(!isEventSubProcess(element))
    if (complete && !isEventSubProcess(element)) {
      this._transactionBehavior.registerCompensation(scope);
    }

    // if exception flow is active,
    // do not activate any outgoing flows
    const activatedFlows = complete
      ? element.outgoing.filter(isSequenceFlow)
      : [];
  
      // console.log(element)

     //If task has a destination
     if((element.businessObject.destination !== undefined) && (element.businessObject.destination !== "")){
      //And if a task has a root
      if((element.businessObject.root !== undefined) && (element.businessObject.root !== "")){
        //and if the destination is not equal to the root
        if (element.businessObject.destination === element.businessObject.root){
         /* this._eventBus.fire(SYNTAX_VIOLATION_EVENT, {
            element : element,
            error : "error"
          });*/
          // console.log(element);
          alert("The current position must not be the destination.")
         }
         //animate space elements
        else {
        const flows = this.getSpaceWeighedPath(context); 
        // console.log(flows)
       let timespace= this.getSpaceExecutionTime(context);
       if(element.businessObject.duration === undefined){
        element.businessObject.duration=0;
       }
       this._time.addTime(element.businessObject.duration);
        this._time.addTime(timespace)
        var timex= Object.values(this._time)

       element.businessObject.$parent.executionTime= timex[0]
        //element.businessObject.$parent.executionTime= this._time
        //If the path doesn't exist
        // console.log(flows)
        if(flows.length===0){
          // console.log("")
        }
        else {
          const connections = [];
          flows.forEach(
            element =>
                connections.push(this._spaceModeler._canvaspace.canvas._elementRegistry._elements[element.id].element)
          )
    
          if (connections.length > 0){
            // console.log(connections);
            const element = connections.shift()
            element['connections'] = connections
            element['activatedFlows'] = activatedFlows
            // console.log(element)
            this._simulator.enter({
              element,
              scope: parentScope,
              parentScope : parentScope
              }) }
        } 
      }
    }





      //si ma da rivedere perchè fare in modo che destinatione root , nel moemnto siano intercambiabili
    //if I have the destination but not the root
      else {
        alert("Please select a current position for the Task "+ element.businessObject.name)
        }
      }
      //if a task does not have a destination animate bpmn elements
      else{

        if(element.businessObject.duration === undefined){
          element.businessObject.duration =0;
        }
        // console.log(element.businessObject.duration)
        // console.log(this._time)
        this._time.addTime(element.businessObject.duration);
        var timex= Object.values(this._time)

       element.businessObject.$parent.executionTime= timex[0]
       
       /* modeling.updateProperties(element.businessObject.$parent, {
          executionTime: this._time
        });*/
        // console.log(element.businessObject.$parent.executionTime)
        // console.log(this._time)
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
//         console.log(this._time)
  };


  ActivityBehavior.prototype.getSpaceWeighedPath = function (context){
    const {
      element,
      scope
    } = context;
  
    var places = this._spaceModeler._places.get('Elements');
    var place = places.filter(element => is(element, 'space:Place'));
    var connections= places.filter(element => is(element, 'space:Transition'));
    var root; //id della place root
    var goal; //id della place di destinazione 
    var shortestpathConnection =[];
  
    // function getRoot(){
    //   for(let i=0; i<place.length; i++){
    //     if(place[i].id===element.businessObject.root){
    //       root=place[i].id;
    //       return root;
    //     }
    //     else{
    //       i=i;
    //     }
    //   }
    // }

    function getRoot() {
      for (let i = 0; i < place.length; i++) {
        if (place[i].id === element.businessObject.root) {
          return place[i].id;
        }
      }
      return null; // Restituisce null se la radice non è stata trovata
    }

    function getDestination() {
      for (let i = 0; i < place.length; i++) {
        if (place[i].id === element.businessObject.destination) {
          return place[i].id;
        }
      }
      return null; // Restituisce null se la destinazione non è stata trovata
    }


    function getNameDestination() {
      for(let i=0; i<place.length; i++){
        if(place[i].id===element.businessObject.destination){
          goal=place[i].name;
          return goal;
        }
        else{
          i=i;
        }
      }
    }
  
    const g = new WeightedGraph();

    for(let i=0; i<place.length; i++){
      g.addVertex(place[i].id);
    }

    for(let i=0; i<connections.length; i++){
      g.addEdge(connections[i].sourcePlace.id,connections[i].targetPlace.id, parseInt(connections[i].name))
    }
    //array ordinato che contiene le place per arrivare dalla root a destinazione con il percorso più breve
    //mi serve però anche l'elenco degli archi non solo delle place, mi serve un sottografo
    var shortestpath= g.Dijkstra(getRoot(), getDestination());

    // console.log(shortestpath)
    //array contiene le transition dello shortest path ordinate
    for(let i=0; i<shortestpath.length; i++){
      for(let j=0; j<connections.length; j++){
        if(shortestpath[i]===connections[j].sourcePlace.id &&
            shortestpath[i+1]===connections[j].targetPlace.id){
              // console.log(connections[j])
          shortestpathConnection.push(connections[j])
        }
      }
    }
  // console.log(shortestpathConnection)
  //   console.log(shortestpath.length)
  //   console.log(shortestpathConnection.length)
    
    if(shortestpathConnection.length===0){
     alert("The destination " +getNameDestination()+ " is unreachable from current position " 
     + getNameRoot()+", please choose another destination")
      // console.log(shortestpath)
      // console.log(shortestpathConnection)
      return shortestpathConnection;
    }
    // console.log(shortestpathConnection)
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
  // console.log(context)
    const subscription = this._simulator.subscribe(scope, event, initiator => {
  // console.log(subscription);

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