import { Group } from '@bpmn-io/properties-panel';

import {
    NameProps,
    IdProps, CustomProps, AssignmentOlcProps,
} from './properties';
import {is} from "bpmn-js/lib/util/ModelUtil";


function GeneralGroup(element, injector) {
    const translate = injector.get('translate');

    const entries = [
        ...NameProps({ element }),
        ...IdProps({ element })
    ];

    return {
        id: 'general',
        label: translate('General'),
        entries,
        component: Group
    };
}

function CustomGroup(element, injector) {
    const translate = injector.get('translate');

    const entries = [
        ...CustomProps({ element }),
        ...AssignmentOlcProps({ element })
    ];

    if(is(element, 'space:Place')) {
        return {
            id: 'place',
            label: translate('Place'),
            entries,
            component: Group
        };
    } else if(is(element, 'space:Transition')){
        return {
            id: 'place',
            label: translate('Transition'),
            entries,
            component: Group
        };
    }


}

function getGroups(element, injector) {

    const groups = [
        GeneralGroup(element, injector),
    ];

    if(is(element, 'space:Place') || is(element, 'space:Transition')) {
        groups.push(CustomGroup(element, injector))
    }

    // contract: if a group returns null, it should not be displayed at all
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

OlcPropertiesProvider.$inject = [ 'propertiesPanel', 'injector' ];