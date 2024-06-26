import {
  SCOPE_DESTROYED_EVENT,
  CONDITION_ACTIVATED_EVENT // Importa il nuovo evento
} from '../../util/EventHelper';

import {
  CheckCircleIcon
} from '../../icons';

export default function SimulationState(
    eventBus,
    simulator,
    elementNotifications) {

  eventBus.on(SCOPE_DESTROYED_EVENT, event => {
    const {
      scope
    } = event;

    const {
      destroyInitiator,
      element: scopeElement
    } = scope;

    if (!scope.completed || !destroyInitiator) {
      return;
    }

    const processScopes = [
      'bpmn:Process',
      'bpmn:Participant'
    ];

    if (!processScopes.includes(scopeElement.type)) {
      return;
    }

    elementNotifications.addElementNotification(destroyInitiator.element, {
      type: 'success',
      icon: CheckCircleIcon(),
      text: 'Finished',
      scope
    });
  });

  // // Aggiungi il listener per CONDITION_ACTIVATED_EVENT
  // eventBus.on(CONDITION_ACTIVATED_EVENT, event => {
  //   const { scope, element } = event;
  //   elementNotifications.addElementNotification(element, {
  //     type: 'info',
  //     icon: CheckCircleIcon(),
  //     text: 'CONDITION ACTIVATED',
  //     scope: scope
  //   });
  // });
}

SimulationState.$inject = [
  'eventBus',
  'simulator',
  'elementNotifications'
];
