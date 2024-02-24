import { TextFieldEntry,  isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { is } from "../../../../util/Util";
import {values} from "lodash";

export default function AssignmentProps(element, modeler) {
    const properties = [];

    if (is(element, 'bpmn:Task') || is(element, 'bpmn:Participant')) {
        properties.push(
            {
                id: 'Assignment',
                element,
                component: Assignment,
                isEdited: isTextFieldEntryEdited
            }
        );
    }

    return properties;
}

function Assignment(props) {
    const { element, modeler } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValues = () => {
        let values = element.businessObject.assignment || [];
        // Assicurati che values sia un array
        if (!Array.isArray(values)) {
            // Se values non è un array, convertilo in un array con un unico elemento
            values = [values];
        }
        console.log('Array degli attributi di assegnazione:', values); // Stampare l'array nella console
        return values;
    };


    // Esporta la funzione setValues per renderla disponibile all'esterno
    const setValues = (value) => {
        return modeling.updateProperties(element, {
            assignment: value
        });
    };

    const addAttribute = () => {
        const newAttribute = { /* struttura del nuovo attributo spaziale */ };
        const updatedAttributes = [...getValues(), newAttribute];
        // Utilizza setValues definito all'interno di Assignment
        setValues(updatedAttributes);
    };

    const removeAttribute = (index) => {
        const updatedAttributes = getValues().filter((_, i) => i !== index);
        setValues(updatedAttributes);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1px' }}>
                <span style={{ marginRight: '4px' }}>Add Assignments</span>
                <button onClick={addAttribute}>+</button>
            </div>
            {getValues().map((attribute, index) => (
                <div key={index}>
                    <TextFieldEntry
                        id={`assignment_${index}`} // ID unico per ogni TextField
                        element={element}
                        description={translate('')}
                        label={`Assignment ${index + 1}`} // Etichetta dinamica
                        getValue={() => attribute}
                        setValue={(newValue) => {
                            const updatedAttributes = getValues().map((attr, i) => {
                                if (i === index) {
                                    return newValue;
                                } else {
                                    return attr;
                                }
                            });
                            setValues(updatedAttributes);
                        }}
                        debounce={debounce}
                    />
                    <button
                        onClick={() => removeAttribute(index)}
                        style={{ marginTop: '4px' }}>
                        Remove
                    </button>
                </div>
            ))}

        </div>
    );

}
