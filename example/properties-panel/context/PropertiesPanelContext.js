import { createContext } from 'preact';

const PropertiesPanelContext = createContext({

  // TODO: get element through context instead of props
  element: null,
  onShow: () => {}
});

export default PropertiesPanelContext;


//scrvi un contesto pèr un mio modeler
//passo il mio modeler
//passo il mio eventBus
//passo il mio servizio
//passo il mio elemento selezionato
//passo il mio evento di selezione
//passo il mio evento di diselezione
//passo il mio evento di cambiamento di selezione
//passo il mio evento di cambiamento di elemento
//passo il mio evento di cambiamento di modeler
//passo il mio evento di cambiamento di eventBus
//passo il mio evento di cambiamento di servizio
//passo il mio evento di cambiamento di elemento selezionato

