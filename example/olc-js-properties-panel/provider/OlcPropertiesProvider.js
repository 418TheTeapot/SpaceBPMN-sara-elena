import { Group } from '@bpmn-io/properties-panel';

import {

    NameProps,
    IdProps, AssignmentOlc

} from './properties';
import {Assignment} from "../../lib/bpmnmodeler/spacePropertiesPanel/spacePropertiesProvider/parts/AssignmentProps";
import {is} from "bpmn-js/lib/util/ModelUtil";


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


function SpaceOlcGroup(element, injector) {
    const translate = injector.get('translate');

    const entries = [
        // ...Assignment({ element })
        ...AssignmentOlc({ element }),
    ];

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