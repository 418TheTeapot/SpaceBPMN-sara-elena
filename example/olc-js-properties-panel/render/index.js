import Commands from "../cmd"

import { DebounceInputModule,  } from '@bpmn-io/properties-panel';
import OlcPropertiesPanelRenderer from "./OlcPropertiesPanelRender";

export default {
    __depends__: [
        Commands,
        DebounceInputModule,
    ],
    __init__: [
        'propertiesPanel'
    ],
    propertiesPanel: [ 'type', OlcPropertiesPanelRenderer ]
};