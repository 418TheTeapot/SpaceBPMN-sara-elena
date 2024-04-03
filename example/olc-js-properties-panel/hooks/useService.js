import {
    useContext
} from '@bpmn-io/properties-panel/preact/hooks';

import { OlcPropertiesPanelContext } from '../context';




//recuperare i servizi del mio OlcModeler
//passare il tipo del servizio che voglio recuperare
//passare se voglio un servizio strict
//ritorna il servizio


export function useService(type, strict) {
    const {
        getService
    } = useContext(OlcPropertiesPanelContext);

    return getService(type, strict);

    //cosa fa useContext?
    //useContext restituisce il valore corrente del contesto fornito (OlcPropertiesPanelContext)
    //dal componente più vicino nell'albero dei componenti che ha il contesto richiesto.
    //Il hook useContext
    // accetta un oggetto contesto (il valore restituito da React.createContext) e restituisce il valore corrente del contesto.
}