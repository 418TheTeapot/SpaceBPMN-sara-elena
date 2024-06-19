import { isCatchEvent } from '../util/ModelUtil';

export default function MessageFlowBehavior(simulator) {
  this._simulator = simulator;

  simulator.registerBehavior('bpmn:MessageFlow', this);
}

MessageFlowBehavior.$inject = ['simulator'];

MessageFlowBehavior.prototype.signal = function(context) {
  this._simulator.exit(context);
};

MessageFlowBehavior.prototype.exit = function(context) {
  const { element, scope: initiator } = context;
  const target = element.target;
  const source = element.source;

  // corpo del messaggio dall'elemento source
  const body = source.businessObject.body;

  // console.log('Nome dell\'elemento Source:', source.businessObject.name);
  // console.log('Nome dell\'elemento Target:', target.businessObject.name);
  // console.log('Uscita da MessageFlow per l\'elemento:', element);
  // console.log('Contenuto del messaggio dal Source:', body);

  const event = isCatchEvent(target) ? target : {
    type: 'message',
    element,
    name: element.id,
    body: body //bisogna includere il corpo del messaggio?mesa di si
  };
  console.log('Evento creato:', event);

  const subscription = this._simulator.findSubscription({
    event,
    elements: [target, target.parent]
  });


  if (subscription) {
    // console.log('Attivazione dell\'evento con il contenuto del messaggio:', body);
    this._simulator.trigger({
      event,
      initiator,
      scope: subscription.scope,
      body: body
    });
    target.businessObject.body = body;
  } else {
    // console.log('Nessuna sottoscrizione trovata per l\'evento');
  }
};
