import {
  forEach
} from 'min-dash';

/**
 * Un gestore che combina ed esegue più comandi.
 *
 * Tutti gli aggiornamenti vengono raggruppati nello stack dei comandi ed eseguiti in un'unica operazione.
 * Questo rende anche possibile annullare le modifiche in un'unica operazione.
 *
 * Esempio d'uso: rimuovere l'attributo camunda:formKey e in aggiunta
 * aggiungere tutti i campi del modulo necessari per la proprietà camunda:formData.
 */
export default class MultiCommandHandler {
  constructor(commandStack) {
    this._commandStack = commandStack;
  }

  // Funzione per eseguire i comandi multipli
  preExecute(context) {
    const commandStack = this._commandStack;

    // Esegue ogni comando nell'array context
    forEach(context, function(command) {
      commandStack.execute(command.cmd, command.context);
    });
  }
}

// Dipendenze del costruttore
MultiCommandHandler.$inject = [ 'commandStack' ];
