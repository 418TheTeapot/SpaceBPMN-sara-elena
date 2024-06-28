import {
	CONDITION_ACTIVATED_EVENT,
	GUARD_VIOLATION_EVENT,
	SYNTAX_VIOLATION_EVENT,
	MESSAGE_SENT,
	MESSAGE_RECEIVED
} from '../../util/EventHelper';
import { CheckCircleIcon, ExclamationTriangleIcon, MailIcon } from "../../icons";

export default function ViolationNotification(eventBus, simulator, elementNotifications) {
	// Listener for GUARD_VIOLATION_EVENT
	eventBus.on(GUARD_VIOLATION_EVENT, event => {
		const { scope, element } = event;

		elementNotifications.addElementNotification(element, {
			type: 'warning',
			icon: ExclamationTriangleIcon(),
			text: 'Violated guard!',
			scope: scope,
		});
	});

	// Listener for CONDITION_ACTIVATED_EVENT
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

	// Listener for SYNTAX_VIOLATION_EVENT
	eventBus.on(SYNTAX_VIOLATION_EVENT, event => {
		const { scope, element } = event;

		elementNotifications.addElementNotification(element, {
			type: 'error',
			icon: ExclamationTriangleIcon(),
			text: 'Syntax Violation!',
			scope: scope,
		});
	});

	// Listener for MESSAGE_SENT
	eventBus.on(MESSAGE_SENT, event => {
		const { scope, element } = event;

		elementNotifications.addElementNotification(element, {
			type: 'info',
			icon: CheckCircleIcon(),
			text: 'Message sent!',
			scope: scope,
			ttl: 2000
		});
	});

	// Listener for MESSAGE_RECEIVED
	eventBus.on(MESSAGE_RECEIVED, event => {
		const { scope, element } = event;

		elementNotifications.addElementNotification(element, {
			type: 'success',
			icon: CheckCircleIcon(),
			text: 'Message received!',
			scope: scope,
			ttl: 2000
		});
	});
}

ViolationNotification.$inject = [
	'eventBus',
	'simulator',
	'elementNotifications'
];
