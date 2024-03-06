import {
    useContext
} from '@bpmn-io/properties-panel/preact/hooks';

import { OlcPropertiesPanelContext } from '../context';

export function useService(type, strict) {
    const {
        getService
    } = useContext(OlcPropertiesPanelContext);

    return getService(type, strict);
}