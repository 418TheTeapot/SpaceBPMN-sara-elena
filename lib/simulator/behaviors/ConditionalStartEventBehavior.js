export default function ConditionalStartEventBehavior(simulator, activityBehavior, elementRegistry) {
    this._simulator = simulator;
    this._activityBehavior = activityBehavior;
    this._elementRegistry = elementRegistry;

    simulator.registerBehavior('bpmn:StartEvent', this);  // Aggiunto registro per StartEvent condizionale
}

ConditionalStartEventBehavior.prototype.enter = function(context) {
    const { element, scope } = context;
    console.log('Entering ConditionalStartEvent:', element.id);

    // Verifica la condizione prima di procedere
    const conditionMet = this.checkCondition(element);

    if (conditionMet) {
        this._simulator.exit(context);
    } else {
        console.log('Condition not met for:', element.id);
    }
};

ConditionalStartEventBehavior.prototype.signal = function(context) {
    console.log('Signaling ConditionalStartEvent:', context.element.id);

    // Verifica la condizione al segnale
    const conditionMet = this.checkCondition(context.element);

    if (conditionMet) {
        this._simulator.exit(context);
    } else {
        console.log('Condition not met for:', context.element.id);
    }
};

ConditionalStartEventBehavior.prototype.exit = function(context) {
    console.log('Exiting ConditionalStartEvent:', context.element.id);

    // Logica specifica per l'uscita
    this._activityBehavior.exit(context);
};

ConditionalStartEventBehavior.prototype.checkCondition = function(element) {
    // Implementa la logica per verificare la condizione
    // Supponiamo che l'elemento abbia una proprietà 'destinationUnreachable'
    const conditionExpression = element.businessObject.conditionExpression;

    // Simula la valutazione della condizione (qui puoi aggiungere la tua logica specifica)
    return conditionExpression ? eval(conditionExpression.body) : true;
};

ConditionalStartEventBehavior.$inject = ['simulator', 'activityBehavior', 'elementRegistry',  'scopeBehavior'];
