import {
  createContext
} from '@bpmn-io/properties-panel/preact';

const GlobalPropertiesPanelContext = createContext({
  selectedElement: null,
  injector: null,
  getService() { return null; }
});

export default GlobalPropertiesPanelContext;