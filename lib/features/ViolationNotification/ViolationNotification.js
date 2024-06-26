import { CONDITION_ACTIVATED_EVENT, GUARD_VIOLATION_EVENT, SYNTAX_VIOLATION_EVENT } from '../../util/EventHelper';
import { CheckCircleIcon, ExclamationTriangleIcon } from "../../icons";

export default function ViolationNotification(eventBus, simulator, elementNotifications) {
	eventBus.on(GUARD_VIOLATION_EVENT, event => {
		const { scope, element } = event;

		elementNotifications.addElementNotification(element, {
			type: 'warning',
			icon: ExclamationTriangleIcon(),
			text: 'Violated guard!',
			scope: scope,
		});
	});

	// Aggiungi il listener per CONDITION_ACTIVATED_EVENT
	eventBus.on(CONDITION_ACTIVATED_EVENT, event => {
		const { scope, element } = event;

		elementNotifications.addElementNotification(element, {
			type: 'info',
			icon: CheckCircleIcon(),
			text: 'Condition activated!',
			scope: scope,
			ttl: 2000
		});
	});

	// Aggiungi il listener per SYNTAX_VIOLATION_EVENT, se necessario
	eventBus.on(SYNTAX_VIOLATION_EVENT, event => {
		const { scope, element } = event;

		elementNotifications.addElementNotification(element, {
			type: 'error',
			icon: ExclamationTriangleIcon(),
			text: 'Syntax Violation!',
			scope: scope,
		});
	});
}

ViolationNotification.$inject = [
	'eventBus',
	'simulator',
	'elementNotifications' // Cambia da notifications a elementNotifications
];
