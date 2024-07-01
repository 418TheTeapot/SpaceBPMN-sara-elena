const TOGGLE_MODE_EVENT = 'tokenSimulation.toggleMode';
const PLAY_SIMULATION_EVENT = 'tokenSimulation.playSimulation';
const PAUSE_SIMULATION_EVENT = 'tokenSimulation.pauseSimulation';
const RESET_SIMULATION_EVENT = 'tokenSimulation.resetSimulation';
const ANIMATION_CREATED_EVENT = 'tokenSimulation.animationCreated';
const ANIMATION_SPEED_CHANGED_EVENT = 'tokenSimulation.animationSpeedChanged';
const ELEMENT_CHANGED_EVENT = 'tokenSimulation.simulator.elementChanged';
const SCOPE_DESTROYED_EVENT = 'tokenSimulation.simulator.destroyScope';
const SCOPE_CHANGED_EVENT = 'tokenSimulation.simulator.scopeChanged';
const SCOPE_CREATE_EVENT = 'tokenSimulation.simulator.createScope';
const SCOPE_FILTER_CHANGED_EVENT = 'tokenSimulation.scopeFilterChanged';
const TRACE_EVENT = 'tokenSimulation.simulator.trace';
const GUARD_VIOLATION_EVENT= 'tokenSimulation.guardViolation';
const SYNTAX_VIOLATION_EVENT= 'tokenSimulation.syntaxViolation';

const MESSAGE_SENT= 'tokenSimulation.messageSent';
const MESSAGE_RECEIVED= 'tokenSimulation.messageReceived';

const CONDITION_ACTIVATED_EVENT = 'tokenSimulation.conditionActivated';


export {
  TOGGLE_MODE_EVENT,
  PLAY_SIMULATION_EVENT,
  PAUSE_SIMULATION_EVENT,
  RESET_SIMULATION_EVENT,
  ANIMATION_CREATED_EVENT,
  ANIMATION_SPEED_CHANGED_EVENT,
  ELEMENT_CHANGED_EVENT,
  SCOPE_DESTROYED_EVENT,
  SCOPE_CHANGED_EVENT,
  SCOPE_CREATE_EVENT,
  SCOPE_FILTER_CHANGED_EVENT,
  TRACE_EVENT,
  GUARD_VIOLATION_EVENT,
  SYNTAX_VIOLATION_EVENT,
  CONDITION_ACTIVATED_EVENT,
  MESSAGE_SENT,
  MESSAGE_RECEIVED
};