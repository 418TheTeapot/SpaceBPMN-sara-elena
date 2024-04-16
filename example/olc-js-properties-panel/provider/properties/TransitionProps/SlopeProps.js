import { TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import { is } from '../../../../lib/util/Util';

export function SlopeProps(props) {
    const { element } = props;

    if (is(element, 'space:Transition')) {
        return [
            {
                id: 'slope',
                component: Slope,
                isEdited: isTextFieldEntryEdited
            }
        ];
    }
}

function Slope(props) {
    const { element } = props;
    const { t: translate } = useTranslation();

    const getValue = () => element.businessObject.slope || ''; // Retrieve the current value
    const setValue = (value) => {
        const intValue = parseInt(value);
        if (!isNaN(intValue)) {
            element.businessObject.slope = intValue;  // Set the value converted to integer
        } else {
            console.error("Invalid slope value: ", value);
        }
    };

    return <TextFieldEntry
        id={props.id}
        element={element}
        label={translate('Slope')}
        getValue={getValue}
        setValue={setValue}
        debounce={debounce}
    />;
}
