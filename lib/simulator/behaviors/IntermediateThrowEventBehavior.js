import { MESSAGE_SENT } from '../../util/EventHelper';

export default function IntermediateThrowEventBehavior(
    simulator,
    activityBehavior,
    eventBus,
    eventBehaviors) {

  this._simulator = simulator;
  this._activityBehavior = activityBehavior;
  this._eventBus = eventBus;
  this._eventBehaviors = eventBehaviors;

  simulator.registerBehavior('bpmn:IntermediateThrowEvent', this);
  simulator.registerBehavior('bpmn:SendTask', this);
}

IntermediateThrowEventBehavior.$inject = [
  'simulator',
  'activityBehavior',
  'eventBus',
  'eventBehaviors'
];

IntermediateThrowEventBehavior.prototype.enter = function(context) {
  const { element } = context;
  const eventBehavior = this._eventBehaviors.get(element);

  if (eventBehavior) {
    const event = eventBehavior(context);

    if (event) {
      context.body = element.businessObject.body;
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
