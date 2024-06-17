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

  eventBus.on(SYNTAX_VIOLATION_EVENT, context => {
    const { element, error } = context;
    console.log('Handling SYNTAX_VIOLATION_EVENT:', context);
    notifySyntaxViolation(element, error);
  });

  const notifyGuardViolation = (element) => {
    console.log('notifyGuardViolation called for element:', element);
    if (typeof this._log.log !== 'function') {
      throw new TypeError('this._log.log is not a function');
    }
    this._log.log('violates activity guard!', 'warning', 'fa-exclamation-circle');

    elementNotifications.addElementNotification(element, {
      type: 'warning',
      icon: 'fa-exclamation-circle',
      text: 'violated guard!',
    });

    // ELEMENT COLOR FOR GUARD VIOLATION
    var modeling = this._canvas.get('modeling');
    modeling.setColor([element], {
      stroke: 'red',
      fill: '#ffa5a5'
    });
    console.log('Element color set for guard violation');
  };

  const notifySyntaxViolation = (element, error) => {
    console.log('notifySyntaxViolation called for element:', element, 'with error:', error);
    if (typeof this._log.log !== 'function') {
      throw new TypeError('this._log.log is not a function');
    }
    this._log.log('syntax error!', 'warning', 'fa-exclamation-circle');

    elementNotifications.addElementNotification(element, {
      type: 'warning',
      icon: 'fa-exclamation-circle',
      text: 'syntax error!',
    });

    // ELEMENT COLOR FOR SYNTAX VIOLATION
    var modeling = this._canvas.get('modeling');
    modeling.setColor([element], {
      stroke: 'red',
      fill: '#ffa5a5'
    });
    console.log('Element color set for syntax violation');
  };
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
