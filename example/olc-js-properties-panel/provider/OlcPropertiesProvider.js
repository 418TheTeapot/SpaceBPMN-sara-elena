import {Group} from '@bpmn-io/properties-panel';

import {AuthorProps, ColorProps, CustomProps, IdProps, NameProps} from './properties';
import {is} from "../../lib/util/Util";

import modeling from "../../lib/olcmodeler/modeling";

function GeneralGroup(element, injector) {
    const translate = injector.get('translate');

    const entries = [
        ...NameProps({ element }),
        ...IdProps({ element }),
        ...AuthorProps({ element}),
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
        // ...ColorProps({ element }),
        ...CustomProps({ element }),

    ];
}



function SpaceTransitionGroup(element, translate) {
    return [
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
