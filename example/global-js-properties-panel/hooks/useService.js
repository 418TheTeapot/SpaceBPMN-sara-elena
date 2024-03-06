import {
  useContext
} from '@bpmn-io/properties-panel/preact/hooks';

import { GlobalPropertiesPanelContext } from '../context';

export function useService(type, strict) {
  const {
    getService
  } = useContext(GlobalPropertiesPanelContext);

  return getService(type, strict);
}