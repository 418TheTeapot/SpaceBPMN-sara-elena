import { MESSAGE_RECEIVED } from '../../util/EventHelper';

export default function IntermediateCatchEventBehavior(
    simulator,
    activityBehavior,
    eventBus) {

  this._activityBehavior = activityBehavior;
  this._simulator = simulator;
  this._eventBus = eventBus;

  simulator.registerBehavior('bpmn:IntermediateCatchEvent', this);
  simulator.registerBehavior('bpmn:ReceiveTask', this);
}

IntermediateCatchEventBehavior.$inject = [
  'simulator',
  'activityBehavior',
  'eventBus'
];

IntermediateCatchEventBehavior.prototype.signal = function(context) {
  return this._simulator.exit(context);
};

IntermediateCatchEventBehavior.prototype.enter = function(context) {
  const { element, body } = context;
  element.businessObject.body = body;

  return this._activityBehavior.signalOnEvent(context, element);
};

IntermediateCatchEventBehavior.prototype.exit = function(context) {
  this._activityBehavior.exit(context);
};
