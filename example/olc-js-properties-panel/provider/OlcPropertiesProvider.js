import { Group } from '@bpmn-io/properties-panel';

import {

    NameProps,
    IdProps

} from './properties';
import PlaceProps from "./properties/PlaceProps";
import {is} from "bpmn-js/lib/util/ModelUtil";
import {LuxProps} from "./properties/LuxProps";


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

function PlaceGroup(element, injector) {
    const translate = injector.get('translate');

    const entries = [
        ...PlaceProps({element}),
        ...LuxProps({ element })
    ];

    return {
        id: 'place',
        label: translate('Space Properties'),
        entries,
        component: Group
    };

}

function getGroups(element, injector) {

    const groups = [
        GeneralGroup(element, injector),
    ];

    if(is(element, 'space:Place')) {
        groups.push(PlaceGroup(element, injector))
    }

    // contract: if a group returns null, it should not be displayed at all
    return groups.filter(group => group !== null);

    // return function(groups) {
    //
    //     groups.push(GeneralGroup(element, injector));
    //     // Add the "magic" group
    //     if(is(element, 'space:Place')) {
    //         groups.push(PlaceGroup(element, injector));
    //     }
    //     return groups;
    // }
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