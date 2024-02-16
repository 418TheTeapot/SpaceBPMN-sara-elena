import { TextFieldEntry, NumberFieldEntry, isTextFieldEntryEdited, isNumberFieldEntryEdited, SelectEntry, isSelectEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { is } from "../../../../util/Util";
export default function(element, modeler) {

  const entries = [
    {
      id: 'guard',
      element,
      component: Guard,
      isEdited: isTextFieldEntryEdited
    }
  ];

  // Aggiungi la voce 'root' solo se l'elemento è di tipo 'Participant'
  if (is(element, 'bpmn:Participant')) {
    entries.push({
      id: 'root',
      element,
      modeler,
      component: Root,
      isEdited: isSelectEntryEdited
    });
  }

  entries.push(
      {
        id: 'destination',
        element,
        modeler,
        component: Destination,
        isEdited: isSelectEntryEdited
      },
      {
        id: 'velocity',
        element,
        component: Velocity,
        isEdited: isNumberFieldEntryEdited
      },
      {
        id: 'duration',
        element,
        component: Duration,
        isEdited: isNumberFieldEntryEdited
      }
  );

  return entries;
}

function Guard(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.guard || '';
  }

  const setValue = value => {
    return modeling.updateProperties(element, {
      guard: value
    });
  }

  return <TextFieldEntry
    id={ id }
    element={ element }
    description={ translate('') }
    label={ translate('Guard') }
    getValue={ getValue }
    setValue={ setValue }
    debounce={ debounce }
  />
}

function Root(props) {
  const { element, id, modeler} = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.root || '';
  }

  const getOptions = () =>  createOptions();

  function createOptions(overrides = {}) {
    const {
      options = []
    } = overrides;

    //definisci un array con le destinazioni che all'inizio è vuoto
    //ad ogni nuovo olc:state aggiungiamo l'opzione dinamicamente
    //fire o dispatch cerca.
    var places = modeler._places.get('Elements');
    var place= places.filter(element => is(element, 'space:Place'));
    const newOptions =[ {
      label: 'null',
      value: null
    },
      ...options];

    if(places.length===0){
      return newOptions;
    }
    else {
      for (let i=0; i<place.length; i++) {
        newOptions.push(
            {
              label: `${place[i].name}`,
              value: place[i].id
            },
            ...options
        );
      }
      // console.log(newOptions);
      return newOptions;
    }
  }

  const setValue = value => {
    return modeling.updateProperties(element, {
      root: value
    })
  }

  console.log(element.businessObject)

  return <SelectEntry
      id={ id }
      element={ element }
      label={ translate('Current Position') }
      getValue={ getValue }
      getOptions= {getOptions}
      setValue ={setValue}
      debounce={ debounce }
  />

}
  function Destination(props) {
    const { element, id, modeler} = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');



    const getValue = () => {
      //console.log(element.businessObject.destination);
      return element.businessObject.destination || '';
    }

    const getOptions = () =>  createOptions();

    function createOptions(overrides = {}) {
      const {
        options = []
      } = overrides;

    //definisci un array con le destinazioni che all'inizio è vuoto
    //ad ogni nuovo olc:state aggiungiamo l'opzione dinamicamente
     //fire o dispatch cerca.
     var places = modeler._places.get('Elements');
     var place= places.filter(element => is(element, 'space:Place'));
     const newOptions =[ {
      label: 'null',
      value: null
    },
    ...options];

    if(places.length===0){
      return newOptions;
    }
    else {
     for (let i=0; i<place.length; i++) {
      newOptions.push(
        {
          label: `${place[i].name}`,
          value: place[i].id
        },
        ...options
      );
    }
    console.log(newOptions);
    return newOptions;
  }
}

const setValue = value => {
  return modeling.updateProperties(element, {
    destination: value
  })
}

console.log(element.businessObject)

    return <SelectEntry
    id={ id }
    element={ element }
    label={ translate('Destination') }
    getValue={ getValue }
    getOptions= {getOptions}
    setValue ={setValue}
    debounce={ debounce }
  />
}

function Velocity(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.velocity || '';
  }

  const setValue = value => {
    return modeling.updateProperties(element, {
      velocity: value
    });
  }
  return <NumberFieldEntry
  id={ id }
  element={ element }
  description={ translate('Define robot velocity') }
  label={ translate('Velocity') }
  getValue={ getValue }
  setValue={ setValue }
  debounce={ debounce }
/>
}

function Duration(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.duration || '';
  }

  const setValue = value => {
    return modeling.updateProperties(element, {
      duration: value
    });
  }

  return <NumberFieldEntry
  id={ id }
  element={ element }
  description={ translate('Must be integer number') }
  label={ translate('Duration') }
  getValue={ getValue }
  setValue={ setValue }
  debounce={ debounce }
/>
}
