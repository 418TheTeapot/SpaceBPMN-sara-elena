import randomColor from 'randomcolor';

import {
  SCOPE_CREATE_EVENT
} from '../../util/EventHelper';

const HIGH_PRIORITY = 1500;

// Map to store static colors for each participant
const participantColors = new Map();

export default function ColoredScopes(eventBus) {

  function getContrastYIQ(hexcolor) {
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq;
  }

  function getParticipantColor(participantId) {
    // Check if color already exists for the participant
    if (participantColors.has(participantId)) {
      return participantColors.get(participantId);
    }

    // Generate a new static color with high contrast
    const newColor = randomColor({
      luminosity: 'bright',
      hue: 'random'
    });
    participantColors.set(participantId, newColor);
    return newColor;
  }

  function getColors(scope) {
    const {
      element
    } = scope;

    if (element && element.type === 'bpmn:MessageFlow') {
      return {
        primary: '#999',
        auxiliary: '#FFF'
      };
    }

    if (scope.parent) {
      return scope.parent.colors;
    }

    // Get the participant ID (assuming it's in the element data)
    const participantId = element.participantId || element.id;  // Default to element ID if participantId is not available

    // Use a static color for each participant
    const primary = getParticipantColor(participantId);

    return {
      primary,
      auxiliary: getContrastYIQ(primary.substring(1)) >= 128 ? '#111' : '#fff'
    };
  }

  eventBus.on(SCOPE_CREATE_EVENT, HIGH_PRIORITY, event => {

    const {
      scope
    } = event;

    scope.colors = getColors(scope);
  });
}

ColoredScopes.$inject = [
  'eventBus'
];
