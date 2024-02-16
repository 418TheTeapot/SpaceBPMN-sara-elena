import { GUARD_VIOLATION_EVENT, SYNTAX_VIOLATION_EVENT } from '../../util/EventHelper';


export default function ViolationNotification(eventBus, animation, elementRegistry, log, elementNotifications,
		canvas) {
	
	this._animation = animation;
	this._elementRegistry = elementRegistry;
	this._log = log;
	this._elementNotifications = elementNotifications;
	this._canvas = canvas;
	this._eventBus = eventBus;
    var self = this;

	this._eventBus.on(GUARD_VIOLATION_EVENT, function(context) {
		self.notifyGuardViolation(context.element);
	});
	this._eventBus.on(SYNTAX_VIOLATION_EVENT, function(context) {
		self.notifySyntaxViolation(context.element, context.error);
	});
}

ViolationNotification.prototype.notifyGuardViolation = function(element){
	this._log.log('violates activity guard!', 'warning', 'fa-exclamation-circle');

	this._elementNotifications.addElementNotification(element, {
		type: 'warning',
		icon: 'fa-exclamation-circle',
		text: 'violated guard!',
		});

		//ELEMENT COLOR FOR GUARD VIOLATION
		var modeling = modeler.get('modeling');
		modeling.setColor([element], {
  		stroke: 'red',
  		fill: '#ffa5a5'
		});
}

ViolationNotification.prototype.notifySyntaxViolation = function(element, error){
	this._log.log('syntax error!', 'warning', 'fa-exclamation-circle');

	this._elementNotifications.addElementNotification(element, {
		type: 'warning',
		icon: 'fa-exclamation-circle',
		text: ' syntax error!',
		});

		//ELEMENT COLOR FOR GUARD VIOLATION
        console.log(modeler)
		var modeling = modeler.get('modeling');
        console.log("errore")
		modeling.setColor([element], {
  		stroke: 'red',
  		fill: '#ffa5a5'
		});
}

ViolationNotification.$inject = [ 
'eventBus', 
'animation', 
'elementRegistry', 
'log',
'elementNotifications',
'canvas' ];