import {is} from "../../../util/Util";
import SpaceOlcProps from "./parts/SpaceOlcProps";


const LOW_PRIORITY = 500;

export default function SpaceOlcPropertiesProvider(propertiesPanel,translate,eventBus, olcModeler) {

    // API ////////
    this._eventBus = eventBus;
    this._olcModeler = olcModeler;
    const modeler = this._olcModeler;

    this.getGroups = function (element) {
        return function (groups) {
            // Add the "magic" group
            if (is(element, 'space:Place')) {
                groups.push(createSpaceOlcGroup(element, translate));
            }
            if (is(element, 'space:Transition')) {
                groups.push(createSpaceOlcGroup(element, translate));
            }

            return groups;
        }
    };

    propertiesPanel.registerProvider(LOW_PRIORITY, this);

    function createSpaceOlcGroup(element, translate) {
        // var modeler= this._spaceModeler;
        // create a group called "Magic properties".
        const spaceOlcGroup = {
            id: 'space',
            label: translate('SpaceOlc properties'),
            entries: SpaceOlcProps(element, modeler)
        };
        return spaceOlcGroup
    }
}

SpaceOlcPropertiesProvider.$inject = [ 'propertiesPanel', 'translate', 'eventBus', 'olcModeler' ];
