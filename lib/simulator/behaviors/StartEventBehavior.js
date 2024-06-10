export default function StartEventBehavior(
    simulator,
    activityBehavior,
    eventBehaviors
) {
  this._simulator = simulator;
  this._activityBehavior = activityBehavior;
  this._eventBehaviors = eventBehaviors;

  simulator.registerBehavior('bpmn:StartEvent', this);
  simulator.registerBehavior('space:Place', this);
}

StartEventBehavior.prototype.enter = function(context) {
  this.signal(context);
};

StartEventBehavior.prototype.signal = function(context) {
  if (this.shouldTriggerConditionalEvent(context)) {
    return this.conditionalSignal(context);
  }
  this._simulator.exit(context);
};

StartEventBehavior.prototype.shouldTriggerConditionalEvent = function(context) {
  // Aggiungi la tua condizione qui
  return context.element.businessObject.condition === 'updateAssignment';
};

StartEventBehavior.prototype.conditionalSignal = function(context) {
  this._eventBehaviors.handleConditionalEvent(context);
};

StartEventBehavior.prototype.exit = function(context) {
  this._activityBehavior.exit(context);
};

StartEventBehavior.$inject = [
  'simulator',
  'activityBehavior',
  'eventBehaviors'
];
