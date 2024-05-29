export default function TransitionBehavior(
    simulator,
    scopeBehavior) {

  this._simulator = simulator;
  this._scopeBehavior = scopeBehavior;

  simulator.registerBehavior('space:Transition', this);
}

TransitionBehavior.prototype.enter = function(context) {
  this._simulator.exit(context);
};


TransitionBehavior.prototype.exit = function(context) {
  const {
    element,
    scope,
    parentScope
  } = context;


//if(element.connections[connections.length-1].sourceplace)
  if (element['connections'].length > 0){
    // console.log(element)
    // console.log(element.connections)
    // console.log(element.businessObject.destination)
    const next = element['connections'].shift()
    next['connections'] = element['connections']
    next['activatedFlows'] = element['activatedFlows']
    this._simulator.enter({
      element: next,
      scope: scope.parent,
      parentScope
    });
  }
  else {
    element['activatedFlows'].forEach(
        element => this._simulator.enter({
          element,
          scope: parentScope
        })
    );
  }
};

TransitionBehavior.$inject = [
  'simulator',
  'scopeBehavior'
];