import {
  GUARD_VIOLATION_EVENT,
  SYNTAX_VIOLATION_EVENT,
  SCOPE_DESTROYED_EVENT
} from '../../util/EventHelper';

import {
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '../../icons';

export default function SimulationState(
    eventBus,
    simulator,
    elementNotifications,
    animation,
    elementRegistry,
    log,
    canvas) {

  this._animation = animation;
  this._elementRegistry = elementRegistry;
  this._elementNotifications = elementNotifications;
  this._log = log;
  this._canvas = canvas;
  this._eventBus = eventBus;

  const processScopes = [
    'bpmn:Process',
    'bpmn:Participant',
    //'bpmn:Task',
  ];

  eventBus.on(SCOPE_DESTROYED_EVENT, event => {
    const { scope } = event;
    const { destroyInitiator, element: scopeElement } = scope;

    if (!scope.completed || !destroyInitiator || !processScopes.includes(scopeElement.type)) {
      return;
    }

    elementNotifications.addElementNotification(destroyInitiator.element, {
      type: 'success',
      icon: CheckCircleIcon(),
      text: 'Finished',
      scope
    });
    console.log('Notification added for scope finished');
  });

  eventBus.on(GUARD_VIOLATION_EVENT, context => {
    const { element } = context;
    console.log('Handling GUARD_VIOLATION_EVENT:', context);

    elementNotifications.addElementNotification(element, {
        type: 'warning',
        icon: ExclamationTriangleIcon(),
        text: 'violated guard!',
        });
    });
  console.log('Notification added for guard violation');

}

SimulationState.$inject = [
  'eventBus',
  'simulator',
  'elementNotifications',
  'animation',
  'elementRegistry',
  'log',
  'canvas'
];
