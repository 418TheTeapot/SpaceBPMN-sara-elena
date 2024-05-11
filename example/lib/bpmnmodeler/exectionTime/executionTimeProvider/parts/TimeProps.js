import { NumberFieldEntry, isNumberFieldEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';


export default function(element,modeler) {

  return [
    {
      id: 'executionTime',
      element,
      modeler,
      component: ExecutionTime,
      isEdited: isNumberFieldEntryEdited
    } 
  ];
}


function ExecutionTime(props) {
  const { element, id, modeler } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return modeler._definitions.diagrams[0].$parent.rootElements[0].executionTime || '';
  }

  const setValue = () => {
    return modeling.updateProperties(element, {
      executionTime: modeler._definitions.diagrams[0].$parent.rootElements[0].executionTime
    });
  }

  return <NumberFieldEntry
  id={ id }
  element={ element }
  description={ translate('Execution Time Process') }
  label={ translate('ExecutionTime') }
  getValue={ getValue }
  setValue={ setValue }
  debounce={ debounce }
/>
}
