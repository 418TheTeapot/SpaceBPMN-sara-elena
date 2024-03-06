import GlobalPropertiesPanelRenderer from './GlobalPropertiesPanelRenderer';

import Commands from '../cmd';
import { DebounceInputModule } from '@bpmn-io/properties-panel';
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
  propertiesPanel: [ 'type', GlobalPropertiesPanelRenderer ]
};