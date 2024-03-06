import {
  forEach
} from 'min-dash';

import MultiCommandHandler from './MultiCommandHandler';

// Definizione degli handler dei comandi
const HANDLERS = {
  'properties-panel.multi-command-executor': MultiCommandHandler
};

// Funzione per inizializzare i comandi
function CommandInitializer(eventBus, commandStack) {

  // Attende l'evento di inizializzazione del diagramma
  eventBus.on('diagram.init', function() {

    // Registra ogni handler nel commandStack
    forEach(HANDLERS, function(handler, id) {
      commandStack.registerHandler(id, handler);
    });
  });
}

// Dipendenze del costruttore della funzione CommandInitializer
CommandInitializer.$inject = [ 'eventBus', 'commandStack' ];

// Esporta un oggetto che inizializza i comandi
export default {
  __init__: [ CommandInitializer ]
};
