import TransitionBehavior from '../../simulator/behaviors/TransitionBehavior';

import inherits from 'inherits';


export default function AnimatedTransitionBehavior(injector, animation) {
    injector.invoke(TransitionBehavior, this);

    this._animation = animation;
}

inherits(AnimatedTransitionBehavior, TransitionBehavior);

AnimatedTransitionBehavior.$inject = [
    'injector',
    'animation'
];

AnimatedTransitionBehavior.prototype.enter = function(context) {

    const {
        element,
        scope
    } = context;

    this._animation.animate(element, scope, () => {
        TransitionBehavior.prototype.enter.call(this, context);
    });
};