import { TextFieldEntry, NumberFieldEntry, isTextFieldEntryEdited, isNumberFieldEntryEdited, SelectEntry, isSelectEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { is } from "../../../../util/Util";
import {  useState } from "@bpmn-io/properties-panel/preact/hooks";


export default function SpaceProps(element, modeler) {
  const properties = [];

  if (is(element, 'bpmn:Participant')) {
    properties.push({
      id: 'root',
      element,
      modeler,
      component: Root,
      isEdited: isSelectEntryEdited
    });
  } else if (is(element, 'bpmn:Task')) {
    properties.push(
        {
          id: 'guard',
          element,
          component: Guard,
          isEdited: isTextFieldEntryEdited
        },
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
        },
        {
            id: 'assignment',
            element,
            component: Assignment,
            isEdited: isTextFieldEntryEdited
        },

    );
  }

  return properties;
}


function Guard(props) {
  const {element, id} = props;

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
      id={id}
      element={element}
      description={translate('')}
      label={translate('Guard')}
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
  />
}

function Root(props) {
  const {element, id, modeler} = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.root || '';
  }

  const getOptions = () => createOptions();

  function createOptions(overrides = {}) {
    const {
      options = []
    } = overrides;

    //definisci un array con le destinazioni che all'inizio è vuoto
    //ad ogni nuovo olc:state aggiungiamo l'opzione dinamicamente
    //fire o dispatch cerca.
    var places = modeler._places.get('Elements');
    var place = places.filter(element => is(element, 'space:Place'));
    const newOptions = [{
      label: 'null',
      value: null
    },
      ...options];

    if (places.length === 0) {
      return newOptions;
    } else {
      for (let i = 0; i < place.length; i++) {
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
  const { element, id, modeler } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.destination || '';
  }

  const getOptions = () => createOptions();

  function createOptions(overrides = {}) {
    const {
      options = []
    } = overrides;

    var places = modeler._places.get('Elements');
    var place = places.filter(element => is(element, 'space:Place'));
    const newOptions = [{
      label: 'null',
      value: null
    },
      ...options];

    if (places.length === 0) {
      return newOptions;
    } else {
      for (let i = 0; i < place.length; i++) {
        newOptions.push(
            {
              label: `${place[i].name}`,
              value: place[i].id
            },
            ...options
        );
      }
      return newOptions;
    }
  }

  const setValue = value => {
    return modeling.updateProperties(element, {
      destination: value
    })
  }

  console.log(element.businessObject)

  // Accesso alla proprietà 'root'
  const rootValue = element.businessObject.root;

  return (
      <div>
        <SelectEntry
            id={id}
            element={element}
            label={translate('Destination')}
            getValue={getValue}
            getOptions={getOptions}
            setValue={setValue}
            debounce={debounce}
        />
      </div>
  );
}

function Velocity(props) {
  const {element, id} = props;

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
      id={id}
      element={element}
      description={translate('Define robot velocity')}
      label={translate('Velocity')}
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
  />
}

function Duration(props) {
  const {element, id} = props;

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
      id={id}
      element={element}
      description={translate('Must be integer number')}
      label={translate('Duration')}
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
  />
}


function Assignment(props) {
    const {element, id} = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValues = () => {
        let values = element.businessObject.assignment || [];
        if (!Array.isArray(values)) {
            values = [values];
        }
        console.log('Array degli attributi di assegnazione:', values);
        return values;
    }

    const setValues = value => {
        return modeling.updateProperties(element, {
            assignment: value
        });
    }

    const addAttribute = () => {
        const newAttribute = {};
        const updatedAttributes = [...getValues(), newAttribute];
        setValues(updatedAttributes);
    };

    const removeAttribute = (index) => {
        const updatedAttributes = getValues().filter((_, i) => i !== index);
        setValues(updatedAttributes);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1px' }}>
                <span style={{ marginRight: '4px' }}>Add Assignment</span>
                <button onClick={addAttribute} style={{ background: 'white', color: 'black', border: '2px solid black', borderRadius: '4px',  cursor: 'pointer', fontSize: '16px' }}>+</button>
            </div>
            {getValues().map((attribute, index) => (
                <div key={index} style={{ position: 'relative' }}>
                    <TextFieldEntry
                        id={id}
                        element={element}
                        description={translate('')}
                        label={`Assignment ${index + 1}`}
                        getValue={() => attribute.value || ''}
                        setValue={(newValue) => {
                            const updatedAttributes = getValues().map((attr, i) => i === index ? { ...attr, value: newValue } : attr);
                            setValues(updatedAttributes);
                        }}
                        debounce={debounce}
                    />
                    <button
                        onClick={() => removeAttribute(index)}
                        style={{ position: 'absolute', right: '30px', top: '0', background: 'transparent', border: 'none' }}>
                        Remove
                    </button>
                </div>
            ))}
        </div>
    );
}

