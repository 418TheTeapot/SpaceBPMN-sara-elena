export default function ConditionalStartEventBehavior(
    simulator,
    activityBehavior,
    elementRegistry,
    scopeBehavior
) {
    this._simulator = simulator;
    this._activityBehavior = activityBehavior;
    this._elementRegistry = elementRegistry;
    this._scopeBehavior = scopeBehavior;

    simulator.registerBehavior('bpmn:StartEvent', this);  // Register the behavior for StartEvent
}

ConditionalStartEventBehavior.$inject = ['simulator', 'activityBehavior', 'elementRegistry', 'scopeBehavior'];

ConditionalStartEventBehavior.prototype.enter = function(context) {
    const { element, scope } = context;
    console.log('Entering ConditionalStartEvent:', element.id);

    // Check the condition before proceeding
    const conditionMet = this.checkCondition(element, context);

    if (conditionMet) {
        this._simulator.exit(context);
    } else {
        console.log('Condition not met for:', element.id);
    }
};

ConditionalStartEventBehavior.prototype.signal = function(context) {
    console.log('Signaling ConditionalStartEvent:', context.element.id);

    // Check the condition on signal
    const conditionMet = this.checkCondition(context.element, context);

    if (conditionMet) {
        this._simulator.exit(context);
    } else {
        console.log('Condition not met for:', context.element.id);
    }
};

ConditionalStartEventBehavior.prototype.exit = function(context) {
    console.log('Exiting ConditionalStartEvent:', context.element.id);

    // Specific logic for exit
    this._activityBehavior.exit(context);
};

ConditionalStartEventBehavior.prototype.checkCondition = function(element, context) {
    // Implement logic to check the condition
    const conditionExpression = element.businessObject.conditionExpression;

    // Simulate condition evaluation (you can add your specific logic here)
    try {
        return conditionExpression ? this.evaluateCondition(conditionExpression.body, context) : true;
    } catch (e) {
        console.error('Error evaluating condition for:', element.id, e);
        return false;
    }
};

ConditionalStartEventBehavior.prototype.evaluateCondition = function(expression, context) {
    // Implement safe condition evaluation logic
    // This example uses a Function constructor for demonstration purposes; ensure security for real use cases
    const func = new Function('context', `return ${expression}`);
    return func(context);
};

ConditionalStartEventBehavior.prototype.trigger = function(context) {
    const { element, scope } = context;
    console.log('Triggering ConditionalStartEvent:', element.id);

    if (this.checkCondition(element, context)) {
        this._simulator.enter(context);
    }
};
