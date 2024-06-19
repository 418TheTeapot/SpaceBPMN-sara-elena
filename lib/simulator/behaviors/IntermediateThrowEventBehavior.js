export default function IntermediateThrowEventBehavior(
    simulator,
    activityBehavior,
    eventBehaviors) {

  this._simulator = simulator;
  this._activityBehavior = activityBehavior;
  this._eventBehaviors = eventBehaviors;

  simulator.registerBehavior('bpmn:IntermediateThrowEvent', this);
  simulator.registerBehavior('bpmn:SendTask', this);
}

IntermediateThrowEventBehavior.prototype.enter = function(context) {
  const { element } = context;

  // console.log(`Entrando in IntermediateThrowEvent per l'elemento: ${element.businessObject.name}`);

  const eventBehavior = this._eventBehaviors.get(element);

  if (eventBehavior) {
    const event = eventBehavior(context);

    if (event) {
      context.body = element.businessObject.body;
      // console.log(`Contenuto del messaggio impostato per l'elemento ${element.businessObject.name}:`, context.body);
      return this._activityBehavior.signalOnEvent(context, event);
    }
  }

  this._activityBehavior.enter(context);
};

IntermediateThrowEventBehavior.prototype.signal = function(context) {
  this._activityBehavior.signal(context);
};

IntermediateThrowEventBehavior.prototype.exit = function(context) {
  this._activityBehavior.exit(context);
};

IntermediateThrowEventBehavior.$inject = [
  'simulator',
  'activityBehavior',
  'eventBehaviors'
];
