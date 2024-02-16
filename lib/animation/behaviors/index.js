import AnimatedMessageFlowBehavior from './AnimatedMessageFlowBehavior';
import AnimatedSequenceFlowBehavior from './AnimatedSequenceFlowBehavior';
import AnimatedTransitionFlowBehavior from './AnimatedTransitionFlow';

export default {
  sequenceFlowBehavior: [ 'type', AnimatedSequenceFlowBehavior ],
  messageFlowBehavior: [ 'type', AnimatedMessageFlowBehavior ],
  transitionBehavior: ['type', AnimatedTransitionFlowBehavior]
};