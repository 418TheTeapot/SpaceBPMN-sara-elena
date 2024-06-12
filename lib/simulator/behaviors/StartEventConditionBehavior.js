export default function StartEventConditionBehavior(simulator, activityBehavior) {
    this._simulator = simulator;
    this._activityBehavior = activityBehavior;

    simulator.registerBehavior('bpmn:StartEventConditional', this);
}

StartEventConditionBehavior.prototype.enter = function(context) {
    const { element, scope } = context;
    const condition = element.businessObject.condition;

    if (this._activityBehavior.checkCondition(condition)) {
        this._simulator.exit(context);
    }
};

StartEventConditionBehavior.prototype.signal = function(context) {
    this._simulator.exit(context);
};

StartEventConditionBehavior.prototype.exit = function(context) {
    this._activityBehavior.exit(context);
};

StartEventConditionBehavior.$inject = [
    'simulator',
    'activityBehavior'
];
