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
import {CONDITION_ACTIVATED_EVENT} from "../../util/EventHelper";

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

EventBehaviors.prototype.handleBoundaryEvents = function(context) {
  const { element, scope } = context;
  const conditionalEvent = this._findBoundaryEvent(element);

  if (conditionalEvent) {
    const condition = conditionalEvent.businessObject.eventDefinitions[0].condition.body;
    if (condition === 'destinationUnreachable') {
      this._activityBehavior.exit({
        element: conditionalEvent,
        scope: scope,
        isBoundaryEvent: true
      });

      // Emit the event after the behavior is successfully called
      const eventContext = { element: conditionalEvent, scope };
      console.log('Firing CONDITION_ACTIVATED_EVENT with context:', eventContext);
      this._activityBehavior._eventBus.fire(CONDITION_ACTIVATED_EVENT, eventContext);
      console.log('CONDITION_ACTIVATED_EVENT fired');

      return true;
    }
  }
  return false;
};

EventBehaviors.prototype.handleStartEventConditional = function(context) {
  const { element, scope } = context;

  // Verifica se l'evento è già stato attivato
  if (element.businessObject.eventDefinitions[0].hasBeenTriggered) {
    console.log('Start event already triggered:', element);
    return;
  }

  // Recupera la condizione dell'evento
  const condition = element.businessObject.eventDefinitions[0].condition.body;

  // Verifica se la condizione è vera
  if (condition) {
    console.log('Signaling simulator to start element:', element, 'with scope:', scope);
    this._simulator.signal({
      element: element,
      parentScope: scope
    });

    // Imposta il flag su true dopo che l'evento di start è stato attivato
    element.businessObject.eventDefinitions[0].hasBeenTriggered = true;

    const eventContext = { element, scope };
    console.log('Conditional start event activated with context:', eventContext);
  }
};

EventBehaviors.prototype._findBoundaryEvent = function(element) {
  return element.attachers.find(attacher =>
      attacher.businessObject.$type === 'bpmn:BoundaryEvent' &&
      attacher.businessObject.eventDefinitions[0].$type === 'bpmn:ConditionalEventDefinition' &&
      attacher.host.businessObject.$type === 'bpmn:Task'
  );
};

EventBehaviors.prototype.get = function(element) {
  const behaviors = {
    'bpmn:ConditionalEventDefinition': (context) => {
      if (is(element, 'bpmn:StartEvent')) {
        return this.handleStartEventConditional(context);
      } else {
        this._simulator.exit(context);
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

