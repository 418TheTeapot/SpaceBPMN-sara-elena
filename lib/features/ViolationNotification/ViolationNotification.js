import { GUARD_VIOLATION_EVENT, SYNTAX_VIOLATION_EVENT } from '../../util/EventHelper';
import { ExclamationTriangleIcon } from "../../icons";

export default function ViolationNotification(eventBus, simulator, elementNotifications) {
	eventBus.on(GUARD_VIOLATION_EVENT, event => {
		const { scope, element } = event;

		//console.log('Handling GUARD_VIOLATION_EVENT:', event);

		elementNotifications.addElementNotification(element, {
			type: 'warning',
			icon: ExclamationTriangleIcon(),
			text: 'Violated guard!',
			scope: scope
		});

		//console.log('Notification added for guard violation');
	});
}

ViolationNotification.$inject = [
	'eventBus',
	'simulator',
	'elementNotifications'
];
