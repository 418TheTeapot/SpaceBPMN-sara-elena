export default function ConditionalStartEventBehavior(simulator, activityBehavior, elementRegistry, scopeBehavior) {
    this._simulator = simulator;
    this._activityBehavior = activityBehavior;
    this._elementRegistry = elementRegistry;
    this._scopeBehavior = scopeBehavior;

    simulator.registerBehavior('bpmn:StartEvent', this);
}

ConditionalStartEventBehavior.$inject = ['simulator', 'activityBehavior', 'elementRegistry', 'scopeBehavior'];

ConditionalStartEventBehavior.prototype.enter = function(context) {
    this.checkAndExit(context);
};

ConditionalStartEventBehavior.prototype.signal = function(context) {
    this.checkAndExit(context);
};

ConditionalStartEventBehavior.prototype.exit = function(context) {
    this._activityBehavior.exit(context);
};

ConditionalStartEventBehavior.prototype.checkCondition = function(element, context) {
    const conditionExpression = element.businessObject.conditionExpression;
    try {
        return conditionExpression ? this.evaluateCondition(conditionExpression.body, context) : true;
    } catch (e) {
        return false;
    }
};

ConditionalStartEventBehavior.prototype.evaluateCondition = function(expression, context) {
    const func = new Function('context', `return ${expression}`);
    return func(context);
};

// ConditionalStartEventBehavior.js

ConditionalStartEventBehavior.prototype.trigger = function(context) {
    const element = context.element;

    // Check if the condition has already been triggered
    if (element._conditionTriggered) {
        console.log(`Condition already triggered for element ${element.id}. Skipping trigger.`);
        return;
    }

    if (this.checkCondition(element, context)) {
        this._simulator.enter(context);
        // Mark the condition as triggered
        element._conditionTriggered = true;
    }
};

ConditionalStartEventBehavior.prototype.checkAndExit = function(context) {
    const element = context.element;

    // Check if the condition has already been triggered
    if (element._conditionTriggered) {
        console.log(`Condition already triggered for element ${element.id}. Skipping exit.`);
        return;
    }

    if (this.checkCondition(element, context)) {
        this._simulator.exit(context);
        // Mark the condition as triggered
        element._conditionTriggered = true;
    }
};


ConditionalStartEventBehavior.prototype.checkAndExit = function(context) {
    if (this.checkCondition(context.element, context)) {
        this._simulator.exit(context);
    }
};