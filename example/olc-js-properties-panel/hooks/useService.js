// import {
//     useContext
// } from '@bpmn-io/properties-panel/preact/hooks';

import { OlcPropertiesPanelContext } from '../context';
import {useContext} from "preact/hooks";



export function useService(type, strict) {
    const {
        getService
    } = useContext(OlcPropertiesPanelContext);

    return getService(type, strict);

}