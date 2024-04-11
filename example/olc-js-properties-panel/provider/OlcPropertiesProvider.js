import { Group } from '@bpmn-io/properties-panel';

import {

    NameProps,
    IdProps,
    PlacePropertiesProps

} from './properties';
import TentativoProps from "./properties/TentativoProps";
import {is} from "bpmn-js/lib/util/ModelUtil";
import {LuxProps} from "./properties/LuxProps";


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

function PlaceGroup(element, injector) {
    const translate = injector.get('translate');

    // const entries = [
    //     ...PlacePropertiesProps({element})
    // ];

    return {
        id: 'place',
        label: translate('Space Properties'),
        entries: TentativoProps(element),
        component: Group
    };

}

function getGroups(element, injector) {

    const groups = [
        GeneralGroup(element, injector),
        // ProvaGroup(element, injector)
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