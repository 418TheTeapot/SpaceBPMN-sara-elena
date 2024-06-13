// File path: /mnt/data/EventBehaviors.js

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
import {is} from "bpmn-js/lib/util/ModelUtil";

export default function EventBehaviors(
    simulator,
    elementRegistry,
    scopeBehavior,
    activityBehavior,
    processBehavior
) {
  this._simulator = simulator;
  this._elementRegistry = elementRegistry;
  this._scopeBehavior = scopeBehavior;
  this._activityBehavior = activityBehavior;
  this._processBehavior = processBehavior;
}

EventBehaviors.$inject = [
  'simulator',
  'elementRegistry',
  'scopeBehavior',
  'activityBehavior',
  'processBehavior'
];

EventBehaviors.prototype.handleConditionalEvent = function(context) {
  const { element, scope } = context;
  if (element.businessObject.condition && element.businessObject.condition === 'destinationUnreachable') {
    console.log('ConditionalEventDefinition attivata: la destinazione è irraggiungibile.');
    console.log('Condition:', element.businessObject.condition);
    this._activityBehavior.exit(context);
  } else {
    console.log('ConditionalEventDefinition non attivata: la destinazione è raggiungibile.');
    console.log('Condition:', element.businessObject.condition);
  }
};

EventBehaviors.prototype.handleStartEventConditional = function(context) {
  const { element, scope } = context;

  // Check if the start event has already been triggered
  if (element.businessObject.eventDefinitions[0].hasBeenTriggered) {
    console.log('ConditionalStartEventDefinition has already been triggered.');
    return;
  }

  if (element.businessObject.eventDefinitions[0].condition === 'updateAssignment') {
    console.log('ConditionalStartEventDefinition activated: trigger.');
    alert("Conditional event triggered");

    this._simulator.signal({
      element: element,
      parentScope: scope
    });

    // Set the flag to true after the start event has been triggered
    element.businessObject.eventDefinitions[0].hasBeenTriggered = true;
  } else {
    console.log('ConditionalStartEventDefinition not activated.');
  }
};

EventBehaviors.prototype.get = function(element) {
  const behaviors = {
    'bpmn:ConditionalEventDefinition': (context) => {
      if (is(element, 'bpmn:StartEvent')) {
        return this.handleStartEventConditional(context);
      } else {
        return this.handleConditionalEvent(context);
      }
    },
    'bpmn:LinkEventDefinition': (context) => {
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
    },
    'bpmn:SignalEventDefinition': (context) => {
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
    },
    'bpmn:EscalationEventDefinition': (context) => {
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
    },
    'bpmn:ErrorEventDefinition': (context) => {
      const { element, scope } = context;
      this._simulator.trigger({
        event: element,
        initiator: scope,
        scope: findSubscriptionScope(scope)
      });
    },
    'bpmn:TerminateEventDefinition': (context) => {
      const { scope } = context;
      this._scopeBehavior.terminate(scope.parent, scope);
    },
    'bpmn:CancelEventDefinition': (context) => {
      const { scope, element } = context;
      this._simulator.trigger({
        event: element,
        initiator: scope,
        scope: findSubscriptionScope(scope)
      });
    },
    'bpmn:CompensateEventDefinition': (context) => {
      const { scope, element } = context;
      return this._simulator.waitForScopes(
          scope,
          this._simulator.trigger({
            event: element,
            scope: findSubscriptionScope(scope)
          })
      );
    }
  };

  const entry = Object.entries(behaviors).find(
      entry => isTypedEvent(element, entry[0])
  );

  return entry && entry[1];
};

// helpers
function getLinkDefinition(element) {
  return getEventDefinition(element, 'bpmn:LinkEventDefinition');
}

function findSubscriptionScope(scope) {
  while (isEventSubProcess(scope.parent.element)) {
    scope = scope.parent;
  }
  return scope.parent;
}
