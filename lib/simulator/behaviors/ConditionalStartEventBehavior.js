// ConditionalStartEventBehavior.js
export default function ConditionalStartEventBehavior(simulator, activityBehavior, elementRegistry, scopeBehavior) {
    this._simulator = simulator;
    this._activityBehavior = activityBehavior;
    this._elementRegistry = elementRegistry;
    this._scopeBehavior = scopeBehavior;

    simulator.registerBehavior('bpmn:StartEvent', this);
}

ConditionalStartEventBehavior.$inject = ['simulator', 'activityBehavior', 'elementRegistry', 'scopeBehavior'];

ConditionalStartEventBehavior.prototype.enter = ConditionalStartEventBehavior.prototype.signal = function(context) {
    this.checkAndExit(context);
};

ConditionalStartEventBehavior.prototype.exit = function(context) {
    this._activityBehavior.exit(context);
};

ConditionalStartEventBehavior.prototype.checkCondition = function(element, context) {
    const conditionExpression = element.businessObject.conditionExpression;
    if (conditionExpression) {
        const conditionMet = this.evaluateCondition(conditionExpression.body, context);
        console.log(`Condizione valutata per l'elemento : ${element.id}: ${conditionMet}`);
        return conditionMet;
    }
    return true;
};

ConditionalStartEventBehavior.prototype.evaluateCondition = function(expression, context) {
    try {
        return new Function('context', `return ${expression}`)(context);
    } catch (error) {
        console.error(`Errore durante la valutazione dell'espressione condizionale: ${expression}`, error);
        return false;
    }
};

ConditionalStartEventBehavior.prototype.trigger = function(context) {
    if (!context || !context.element) {
        throw new Error('Context or context element is missing');
    }
    const element = context.element;

    if (!element._conditionTriggered && this.checkCondition(element, context)) {
        console.log(`Triggering start event for element ${element.id}`);
        this._simulator.enter(context);
        element._conditionTriggered = true;
    } else {
        console.log(`Start event condition not met or already triggered for element ${element.id}`);
    }
};

ConditionalStartEventBehavior.prototype.checkAndExit = function(context) {
    if (!context || !context.element) {
        throw new Error('Context or context element is missing');
    }
    if (this.checkCondition(context.element, context)) {
        console.log(`Exiting start event for element ${context.element.id}`);
        this._simulator.exit(context);
    }
};