import Commands from "../cmd"

import { DebounceInputModule,  } from '@bpmn-io/properties-panel';
import OlcPropertiesPanelRenderer from "./OlcPropertiesPanelRender";
import {FeelPopupModule} from "../../properties-panel";

export default {
    __depends__: [
        Commands,
        DebounceInputModule,
        FeelPopupModule
    ],
    __init__: [
        'propertiesPanel'
    ],
    propertiesPanel: [ 'type', OlcPropertiesPanelRenderer ]
};