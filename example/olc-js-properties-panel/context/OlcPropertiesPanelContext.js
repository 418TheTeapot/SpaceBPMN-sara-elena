// In OlcPropertiesPanelContext.js
import { createContext } from 'preact';




const OlcPropertiesPanelContext = createContext({
    selectedElement: null,
    // olcModeler: null,
    injector: null,
    eventBus: null, //mi prende quello giusto?
    getService() { return null; }
});



export default OlcPropertiesPanelContext;
