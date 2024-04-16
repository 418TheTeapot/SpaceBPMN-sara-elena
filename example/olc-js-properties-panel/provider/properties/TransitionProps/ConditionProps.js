import { SelectEntry, isSelectEntryEdited } from '@bpmn-io/properties-panel';
import { useTranslation } from 'react-i18next';
import { is } from '../../../../lib/util/Util';

export function ConditionProps(props) {
    const { element } = props;

    if (is(element, 'space:Transition')) {
        return [
            {
                id: 'condition',
                component: Condition,
                isEdited: isSelectEntryEdited
            }
        ];
    }
}

function Condition(props) {
    const { element } = props;
    const { t: translate } = useTranslation();

    // const options = [
    //     { value: '', name: translate('Select Condition') },
    //     { value: 'good', name: translate('Good') },
    //     { value: 'critical', name: translate('Critical') },
    //     { value: 'warning', name: translate('Warning') },
    //     { value: 'normal', name: translate('Normal') }
    // ];
    const options = ['good', 'critical', 'warning', 'normal'];

    const getValue = () => ({ value: element.businessObject.condition || '' });

    const getOptions = () => options.map(option => ({ label: option, value: option }));

    const setValue = (value) => {
        element.businessObject.condition = value.value;
    };

    return <SelectEntry
        id={props.id}
        element={element}
        label={translate('Condition')}
        getValue={getValue}
        getOptions={getOptions}
        setValue={setValue}
    />;
}
