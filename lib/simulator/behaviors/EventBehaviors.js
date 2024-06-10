// EventBehaviors.js
import {
  getEventDefinition,
  isTypedEvent
} from '../../util/ElementHelper';

import {
  ScopeTraits
} from '../ScopeTraits';

import {
  isEventSubProcess,
  isLinkCatch
} from '../util/ModelUtil';

export default function EventBehaviors(
    simulator,
    elementRegistry,
    scopeBehavior,
    activityBehavior
) {
  this._simulator = simulator;
  this._elementRegistry = elementRegistry;
  this._scopeBehavior = scopeBehavior;
  this._activityBehavior = activityBehavior;
}

EventBehaviors.$inject = [
  'simulator',
  'elementRegistry',
  'scopeBehavior',
  'activityBehavior'
];

EventBehaviors.prototype.get = function(element) {
  const behaviors = {
    'bpmn:ConditionalEventDefinition': this.handleConditionalEvent.bind(this),
    'bpmn:LinkEventDefinition': this.handleLinkEvent.bind(this),
    'bpmn:SignalEventDefinition': this.handleSignalEvent.bind(this),
    'bpmn:EscalationEventDefinition': this.handleEscalationEvent.bind(this),
    'bpmn:ErrorEventDefinition': this.handleErrorEvent.bind(this),
    'bpmn:TerminateEventDefinition': this.handleTerminateEvent.bind(this),
    'bpmn:CancelEventDefinition': this.handleCancelEvent.bind(this),
    'bpmn:CompensateEventDefinition': this.handleCompensateEvent.bind(this)
  };

  const entry = Object.entries(behaviors).find(
      entry => isTypedEvent(element, entry[0])
  );

  return entry && entry[1];
};

// Helper functions for specific event handling
EventBehaviors.prototype.handleConditionalEvent = function(context) {
  const { element, scope } = context;
  const condition = element.businessObject.condition;

  if (condition === 'destinationUnreachable') {
    console.log('ConditionalEventDefinition triggered: Destination unreachable.');
    this._activityBehavior.exit(context);
  } else if (condition === 'updateAssignment') {
    console.log('ConditionalEventDefinition triggered: Update assignments.');
    this._conditionalStartEventBehavior(context);
  } else {
    console.log('ConditionalEventDefinition not triggered: Condition not met.');
  }
};


function getLinkDefinition(element) {
  return getEventDefinition(element, 'bpmn:LinkEventDefinition');
}

function findSubscriptionScope(scope) {
  while (isEventSubProcess(scope.parent.element)) {
    scope = scope.parent;
  }
  return scope.parent;
}

// Add other event handling methods (handleLinkEvent, handleSignalEvent, etc.)
EventBehaviors.prototype.handleLinkEvent = function(context) {
  const { element, scope } = context;
  const link = getLinkDefinition(element);
  const parentScope = scope.parent;
  const parentElement = parentScope.element;

  const linkTargets = parentElement.children.filter(element =>
      isLinkCatch(element) &&
      getLinkDefinition(element).name === link.name
  );

  for (const linkTarget of linkTargets) {
    this._simulator.signal({
      element: linkTarget,
      parentScope,
      initiator: scope
    });
  }
};

EventBehaviors.prototype.handleSignalEvent = function(context) {
  const { element, scope } = context;
  const subscriptions = this._simulator.findSubscriptions({ event: element });
  const signaledScopes = new Set();

  for (const subscription of subscriptions) {
    const signaledScope = subscription.scope;

    if (signaledScopes.has(signaledScope)) {
      continue;
    }

    signaledScopes.add(signaledScope);

    this._simulator.trigger({
      event: element,
      scope: signaledScope,
      initiator: scope
    });
  }
};

EventBehaviors.prototype.handleEscalationEvent = function(context) {
  const { element, scope } = context;
  const scopes = this._simulator.findScopes({
    subscribedTo: { event: element },
    trait: ScopeTraits.ACTIVE
  });

  let triggerScope = scope;

  while ((triggerScope = triggerScope.parent)) {
    if (scopes.includes(triggerScope)) {
      this._simulator.trigger({
        event: element,
        scope: triggerScope,
        initiator: scope
      });
      break;
    }
  }
};

EventBehaviors.prototype.handleErrorEvent = function(context) {
  const { element, scope } = context;
  this._simulator.trigger({
    event: element,
    initiator: scope,
    scope: findSubscriptionScope(scope)
  });
};

EventBehaviors.prototype.handleTerminateEvent = function(context) {
  const { scope } = context;
  this._scopeBehavior.terminate(scope.parent, scope);
};

EventBehaviors.prototype.handleCancelEvent = function(context) {
  const { scope, element } = context;
  this._simulator.trigger({
    event: element,
    initiator: scope,
    scope: findSubscriptionScope(scope)
  });
};

EventBehaviors.prototype.handleCompensateEvent = function(context) {
  const { scope, element } = context;
  return this._simulator.waitForScopes(
      scope,
      this._simulator.trigger({
        event: element,
        scope: findSubscriptionScope(scope)
      })
  );
};
