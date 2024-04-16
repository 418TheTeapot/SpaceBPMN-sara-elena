import { SelectEntry, isSelectEntryEdited } from '@bpmn-io/properties-panel';
import { useTranslation } from 'react-i18next';
import { is } from '../../../../lib/util/Util';

export function PriorityProps(props) {
    const { element } = props;

    if (is(element, 'space:Transition')) {
        return [
            {
                id: 'priority',
                component: Priority,
                isEdited: isSelectEntryEdited
            }
        ];
    }
    // return [];
}

function Priority(props) {
    const { element,id } = props;
    const { t: translate } = useTranslation();

    // const options = [
    //     { value: '', name: translate('Select Priority') },
    //     { value: 'high', name: translate('High') },
    //     { value: 'medium', name: translate('Medium') },
    //     { value: 'low', name: translate('Low') }
    // ];
    const options = ['high', 'medium', 'low'];

    const getValue = () => ({ value: element.businessObject.priority || '' });

    const getOptions = () => options.map(option => ({ label: option, value: option }));

    const setValue = (value) => {
        element.businessObject.priority = value.value;
    };

    return <SelectEntry
        id={id}
        element={element}
        label={translate('Priority')}
        getValue={getValue}
        getOptions={getOptions}
        setValue={setValue}
    />;
}
