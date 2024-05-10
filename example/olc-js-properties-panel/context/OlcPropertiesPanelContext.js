
import {
    createContext
} from '@bpmn-io/properties-panel/preact';


const OlcPropertiesPanelContext = createContext({
    selectedElement: null,
    injector: null,
    getService() { return null; }
});



export default OlcPropertiesPanelContext;
