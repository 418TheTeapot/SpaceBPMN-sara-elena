import { isCatchEvent, isStartEvent } from '../util/ModelUtil';
import { MESSAGE_RECEIVED, MESSAGE_SENT } from "../../util/EventHelper";

export default function MessageFlowBehavior(simulator, eventBus) {
  this._simulator = simulator;
  this._eventBus = eventBus;

  simulator.registerBehavior('bpmn:MessageFlow', this);
}

MessageFlowBehavior.$inject = ['simulator', 'eventBus'];

MessageFlowBehavior.prototype.signal = function(context) {
  this._simulator.exit(context);
};

MessageFlowBehavior.prototype.exit = function(context) {
  const { element, scope: initiator } = context;
  const target = element.target;
  const source = element.source;

  // Message body from the source element
  const body = source.businessObject.body;

  // Fire the MESSAGE_SENT event
  this._eventBus.fire(MESSAGE_SENT, {
    element,
    scope: initiator,
    initiator: initiator
  });

  const isCatchOrStartEvent = isCatchEvent(target) || isStartEvent(target);
  let event = isCatchOrStartEvent ? target : {
    type: 'message',
    element,
    name: element.id,
    body: body
  };

  console.log('Event created:', event);

  const subscription = this._simulator.findSubscription({
    event,
    elements: [target, target.parent]
  });

  if (subscription) {
    console.log('Triggering event with message content:', body);
    this._simulator.trigger({
      event,
      initiator,
      scope: subscription.scope,
      body: body
    });
    target.businessObject.body = body;

    // Fire the MESSAGE_RECEIVED event
    this._eventBus.fire(MESSAGE_RECEIVED, {
      element: target,
      scope: subscription.scope,
      initiator: initiator
    });
  } else if (isStartEvent(target)) {
    console.log('Triggering start event with message content:', body);
    // Handle specific logic for StartEvent
    this._simulator.trigger({
      event,
      initiator,
      scope: null, // No subscription scope for start events
      body: body
    });
    target.businessObject.body = body;

    // Fire the MESSAGE_RECEIVED event
    this._eventBus.fire(MESSAGE_RECEIVED, {
      element: target,
      scope: null,
      initiator: initiator
    });
  } else {
    console.log('No subscription found for the event');
  }
};
