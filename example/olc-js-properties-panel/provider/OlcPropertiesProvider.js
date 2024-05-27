import { Group } from '@bpmn-io/properties-panel';

import {

    NameProps,
    IdProps

} from './properties';


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

function getGroups(element, injector) {

    const groups = [
        GeneralGroup(element, injector),

    ];

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