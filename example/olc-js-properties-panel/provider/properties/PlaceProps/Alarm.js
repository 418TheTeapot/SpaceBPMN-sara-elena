import { isSelectEntryEdited, SelectEntry } from "@bpmn-io/properties-panel";
import { useTranslation } from "react-i18next";
import { is } from "../../../../lib/util/Util";  // Assicurati che questo percorso sia corretto

export function AlarmProps(props) {
    const { element } = props;

    if (is(element, 'space:Place')) {
        return [
            {
                id: 'alarm',
                component: Alarm,
                isEdited: isSelectEntryEdited
            }
        ];
    }
    return [];
}

function Alarm(props) {
    const { element, id } = props;
    const { t: translate } = useTranslation();
    const options = ['ON', 'OFF'];

    const getValue = () => element.businessObject.alarm || '';
    const getOptions = () => options.map(option => ({ label: option, value: option }));
    const setValue = value => {
        if (options.includes(value)) {
            element.businessObject.alarm = value;
        } else {
            element.businessObject.alarm = 'OFF';
        }
    }

    return <SelectEntry
        id={id}
        element={element}
        label={translate('Alarm')}
        getValue={getValue}
        getOptions={getOptions}
        setValue={setValue}
    />
}
