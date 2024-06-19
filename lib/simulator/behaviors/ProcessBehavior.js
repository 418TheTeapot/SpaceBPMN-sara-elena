export default function ProcessBehavior(
    simulator,
    scopeBehavior,
    activityBehavior
) {
  this._simulator = simulator;
  this._scopeBehavior = scopeBehavior;

  simulator.registerBehavior('bpmn:Process', this);
  simulator.registerBehavior('bpmn:Participant', this);
}

ProcessBehavior.prototype.signal = function(context) {
  const { startEvent, scope } = context;

  if (!startEvent) {
    throw new Error('Missing <startEvent> in context: ' + JSON.stringify(context));
  }

  this._simulator.signal({
    element: startEvent,
    parentScope: scope
  });


 // console.log('Scope of PARTICIPANT:', scope);
};

ProcessBehavior.prototype.exit = function(context) {
  const { scope, initiator } = context;

  // Ensure that all sub-scopes are destroyed
  this._scopeBehavior.destroyChildren(scope, initiator);
};

ProcessBehavior.$inject = [
  'simulator',
  'scopeBehavior',

];
