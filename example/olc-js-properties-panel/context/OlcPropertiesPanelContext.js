// In OlcPropertiesPanelContext.js
import { createContext } from 'preact';

const OlcPropertiesPanelContext = createContext({
    selectedElement: null,
    olcModeler: null,
    getService() { return null; }
});



export default OlcPropertiesPanelContext;
