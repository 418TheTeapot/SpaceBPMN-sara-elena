import { TextFieldEntry,  isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { is } from "../../../../util/Util";
import {  useState } from "@bpmn-io/properties-panel/preact/hooks";

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
    const {element, id} = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');


    // Array di stringhe
    const [assignments, setAssignments] = useState(element.businessObject.assignment || []);

    const getValue = () => {
        return element.businessObject.assignment || '';
    };

    const setValue = (value) => {
        modeling.updateProperties(element, {
            assignment: value
        });
    };

    const addAssignment = () => {
        const newAssignment = [...assignments, '']; // Aggiungi una nuova stringa vuota
        setAssignments(newAssignment);
        setValue(newAssignment);
    };

    const removeAssignment = (index) => {
        const updatedAssignments = [...assignments];
        updatedAssignments.splice(index, 1); // Rimuovi l'elemento all'indice specificato
        setAssignments(updatedAssignments);
        setValue(updatedAssignments);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1px' }}>
                <span style={{ marginRight: '4px' }}>Add Assignments</span>
                <button onClick={addAssignment}>+</button>
            </div>

            {assignments.map((assignment, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ position: 'relative', marginRight: '4px', width: '100%' }}>
                        <TextFieldEntry
                            id={`assignment-${index}`}
                            element={element}
                            description={translate('')}
                            label={`Assignment ${index + 1}`}
                            getValue={() => assignment}
                            setValue={(value) => setValue(value, index)}
                            debounce={debounce}
                            style={{ paddingLeft: '20px' }}
                        />
                        <button
                            onClick={() => removeAssignment(index)}
                            style={{ position: 'absolute', right: '0', top: '65%', transform: 'translateY(-50%)' }}>
                            X
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );


}
