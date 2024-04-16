import { Group } from '@bpmn-io/properties-panel';

import { NameProps, IdProps } from './properties';
import { AssignmentProps, LuxProps, TemperatureProps } from "./properties/PlaceProps";
import { AlarmProps } from "./properties/PlaceProps/Alarm";
import { is } from "../../lib/util/Util";
import { ConditionProps, DistanceProps, PriorityProps, SlopeProps } from "./properties/TransitionProps";

function GeneralGroup(element, injector) {
    const translate = injector.get('translate');
    const entries = [
        ...NameProps({ element }),
        ...IdProps({ element }),
    ];
    return {
        id: 'general',
        label: translate('General'),
        entries,
        component: Group
    };
}

function SpacePlaceGroup(element, translate) {
    return [
        ...LuxProps({ element }),
        ...TemperatureProps({ element }),
        ...AlarmProps({ element }),
    ];
}

function SpaceTransitionGroup(element, translate) {
    return [
        ...DistanceProps({ element }),
        ...SlopeProps({ element }),
        ...PriorityProps({ element }),
        ...ConditionProps({ element }),
    ];
}

function SpaceOlcGroup(element, injector) {
    const translate = injector.get('translate');
    let entries = [];

    if (is(element, 'space:Place')) {
        entries = SpacePlaceGroup(element, translate);
    } else if (is(element, 'space:Transition')) {
        entries = SpaceTransitionGroup(element, translate);
    }

    // Always include AssignmentProps if needed
    entries.push({
        id: 'assignment',
        component: AssignmentProps,
        element
    });

    return {
        id: 'space-olc',
        label: translate('SpaceOLC properties'),
        entries,
        component: Group
    };
}

function getGroups(element, injector) {
    const groups = [
        GeneralGroup(element, injector),
        SpaceOlcGroup(element, injector),
    ];
    return groups.filter(group => group !== null);
}

export default class OlcPropertiesProvider {
    constructor(propertiesPanel, injector) {
        propertiesPanel.registerProvider(this);
        this._injector = injector;
    }

    getGroups(element) {
        return (groups) => {
            groups = groups.concat(getGroups(element, this._injector));
            return groups;
        };
    }
}

OlcPropertiesProvider.$inject = ['propertiesPanel', 'injector'];
