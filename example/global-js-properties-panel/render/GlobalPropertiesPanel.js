import {
  useState, // Importa il metodo useState dal modulo 'preact/hooks'
  useMemo, // Importa il metodo useMemo dal modulo 'preact/hooks'
  useEffect, // Importa il metodo useEffect dal modulo 'preact/hooks'
  useCallback // Importa il metodo useCallback dal modulo 'preact/hooks'
} from '@bpmn-io/properties-panel/preact/hooks';

import {
  find, // Importa la funzione find dal modulo 'min-dash'
  isArray, // Importa la funzione isArray dal modulo 'min-dash'
  reduce // Importa la funzione reduce dal modulo 'min-dash'
} from 'min-dash';

import { PropertiesPanel } from '@bpmn-io/properties-panel'; // Importa il componente PropertiesPanel dal modulo '@bpmn-io/properties-panel'

import {   GlobalPropertiesPanelContext } from '../context';

// import Mediator from '../example/lib/mediator/Mediator'; // Importa il tuo Mediator
//misa che non ha molto senso qua

import { PanelHeaderProvider } from './PanelHeaderProvider';
import { PanelPlaceholderProvider } from './PanelPlaceholderProvider';

/**
 * Componente GlobalPropertiesPanel.
 *
 * @param {Object} props - Proprietà del componente.
 */
export default function GlobalPropertiesPanel(props) {

  // Estrae le proprietà necessarie dall'oggetto props
  const {
    element,
    injector,
    getProviders,
    layoutConfig: initialLayoutConfig,
    descriptionConfig,
    tooltipConfig,
    feelPopupContainer,
  } = props;

  // Ottiene gli oggetti necessari dall'iniettore
  const canvas1 = injector.get('canvas');
  const canvas2 = injector.get('olc-canvas');

  const elementRegistry = injector.get('elementRegistry');
  const eventBus = injector.get('eventBus');
  const translate = injector.get('translate');

  // Definisce lo stato per l'elemento selezionato
  const [state, setState] = useState({
    selectedElement: element
  });

  const selectedElement = state.selectedElement;

  /**
   * Aggiorna lo stato con l'elemento selezionato e notifica gli interessati sugli aggiornamenti del pannello delle proprietà.
   *
   * @param {Object} element - Elemento da aggiornare.
   * @param {string} canvasId - ID del canvas associato all'elemento.
   */
  const _update = (element, canvasId) => {
    if (!element) {
      return;
    }

    let newSelectedElement = element;

    // Gestisce le etichette
    if (newSelectedElement.type === 'label') {
      newSelectedElement = newSelectedElement.labelTarget;
    }

    // Aggiorna lo stato in base al canvas attivo
    if (canvasId === 'canvas1') {
      // Aggiorna lo stato per canvas1
      setState({
        ...state,
        selectedElementCanvas1: newSelectedElement
      });
    } else if (canvasId === 'canvas2') {
      // Aggiorna lo stato per canvas2
      setState({
        ...state,
        selectedElementCanvas2: newSelectedElement
      });
    }

    // Notifica gli interessati sugli aggiornamenti del pannello delle proprietà
    eventBus.fire('propertiesPanel.updated', {
      element: newSelectedElement,
      canvasId: canvasId
    });
  };



  useEffect(() => {
    const handleClickCanvas1 = (event) => {
      // Logica per gestire il click su canvas1
      const clickedElement = findElementAtPosition(event.x, event.y, canvas1);
      if (clickedElement) {
        _update(clickedElement, 'canvas1');
      }
    };

    const handleClickCanvas2 = (event) => {
      // Logica per gestire il click su canvas2
      const clickedElement = findElementAtPosition(event.x, event.y, canvas2);
      if (clickedElement) {
        _update(clickedElement, 'canvas2');
      }
    };

    canvas1.addEventListener('click', handleClickCanvas1);
    canvas2.addEventListener('click', handleClickCanvas2);

    return () => {
      canvas1.removeEventListener('click', handleClickCanvas1);
      canvas2.removeEventListener('click', handleClickCanvas2);
    };
  }, [canvas1, canvas2]);




  // (2a) Selezione cambiata
  useEffect(() => {
    const onSelectionChanged = (e, sourceCanvas) => {
      const { newSelection = [] } = e;

      if (newSelection.length > 1) {
        return; // Gestisci la selezione multipla qui se necessario
      }

      const newElement = newSelection[0];
      const rootElement = sourceCanvas.getRootElement();

      if (isImplicitRoot(rootElement)) {
        return;
      }

      _update(newElement || rootElement, sourceCanvas === canvas1 ? 'canvas1' : 'canvas2');
    };

    const onSelectionChangedCanvas1 = (e) => onSelectionChanged(e, canvas1);
    const onSelectionChangedCanvas2 = (e) => onSelectionChanged(e, canvas2);

    eventBus.on('canvas1.selection.changed', onSelectionChangedCanvas1);
    eventBus.on('canvas2.selection.changed', onSelectionChangedCanvas2);

    return () => {
      eventBus.off('canvas1.selection.changed', onSelectionChangedCanvas1);
      eventBus.off('canvas2.selection.changed', onSelectionChangedCanvas2);
    };
  }, [canvas1, canvas2, eventBus]);


// (2b) Elemento selezionato cambiato
  useEffect(() => {
    const onElementsChanged = (e, sourceCanvas) => {
      const elements = e.elements;
      const updatedElement = findElement(elements, selectedElement);

      if (updatedElement && elementExists(updatedElement, elementRegistry)) {
        _update(updatedElement, sourceCanvas === canvas1 ? 'canvas1' : 'canvas2');
      }
    };

    const onElementsChangedCanvas1 = (e) => onElementsChanged(e, canvas1);
    const onElementsChangedCanvas2 = (e) => onElementsChanged(e, canvas2);

    eventBus.on('canvas1.elements.changed', onElementsChangedCanvas1);
    eventBus.on('canvas2.elements.changed', onElementsChangedCanvas2);

    return () => {
      eventBus.off('canvas1.elements.changed', onElementsChangedCanvas1);
      eventBus.off('canvas2.elements.changed', onElementsChangedCanvas2);
    };
  }, [canvas1, canvas2, selectedElement, elementRegistry, eventBus]);


  // (2c) Radice dell'elemento cambiata
  useEffect(() => {
    const onRootAdded = (e, sourceCanvas) => {
      const element = e.element;
      _update(element, sourceCanvas === canvas1 ? 'canvas1' : 'canvas2');
    };

    const onRootAddedCanvas1 = (e) => onRootAdded(e, canvas1);
    const onRootAddedCanvas2 = (e) => onRootAdded(e, canvas2);

    eventBus.on('canvas1.root.added', onRootAddedCanvas1);
    eventBus.on('canvas2.root.added', onRootAddedCanvas2);

    return () => {
      eventBus.off('canvas1.root.added', onRootAddedCanvas1);
      eventBus.off('canvas2.root.added', onRootAddedCanvas2);
    };
  }, [canvas1, canvas2, eventBus]);


  // (2d) Voci fornite cambiate
  useEffect(() => {
    const onProvidersChanged = (sourceCanvas) => {
      _update(selectedElement, sourceCanvas === canvas1 ? 'canvas1' : 'canvas2');
    };

    const onProvidersChangedCanvas1 = () => onProvidersChanged(canvas1);
    const onProvidersChangedCanvas2 = () => onProvidersChanged(canvas2);

    eventBus.on('canvas1.propertiesPanel.providersChanged', onProvidersChangedCanvas1);
    eventBus.on('canvas2.propertiesPanel.providersChanged', onProvidersChangedCanvas2);

    return () => {
      eventBus.off('canvas1.propertiesPanel.providersChanged', onProvidersChangedCanvas1);
      eventBus.off('canvas2.propertiesPanel.providersChanged', onProvidersChangedCanvas2);
    };
  }, [canvas1, canvas2, selectedElement, eventBus]);



  // (2e) Template degli elementi cambiato
  useEffect(() => {
    const onTemplatesChangedCanvas1 = () => {
      // Aggiorna gli elementi nel canvas1
      _update(selectedElement, 'canvas1');
    };

    const onTemplatesChangedCanvas2 = () => {
      // Aggiorna gli elementi nel canvas2
      _update(selectedElement, 'canvas2');
    };

    eventBus.on('canvas1.elementTemplates.changed', onTemplatesChangedCanvas1);
    eventBus.on('canvas2.elementTemplates.changed', onTemplatesChangedCanvas2);

    return () => {
      eventBus.off('canvas1.elementTemplates.changed', onTemplatesChangedCanvas1);
      eventBus.off('canvas2.elementTemplates.changed', onTemplatesChangedCanvas2);
    };
  }, [selectedElement, eventBus]);




  // (3) Crea il contesto del pannello delle proprietà BPMN e space:
  const globalPropertiesPanelContext = useMemo(() => ({
    selectedElement,
    canvas1,
    canvas2,
    injector,
    getService(type, strict) {
      return injector.get(type, strict);
    }
    // Qui puoi aggiungere altre funzioni o proprietà utili
  }), [selectedElement, canvas1, canvas2, injector]);


  // (4) Ottieni i gruppi per l'elemento selezionato
  const providers = getProviders(selectedElement);

  const groups = useMemo(() => {
    return reduce(providers, function(groups, provider) {

      // Non raccogliere gruppi per lo stato multi elemento
      if (isArray(selectedElement)) {
        return [];
      }

      const updater = provider.getGroups(selectedElement);

      return updater(groups);
    }, []);
  }, [ providers, selectedElement ]);



  // (5) Notifica i cambiamenti di layout
  const [layoutConfig, setLayoutConfig] = useState(initialLayoutConfig || {});

  const onLayoutChanged = useCallback((newLayout, canvasId) => {
    eventBus.fire('propertiesPanel.layoutChanged', {
      layout: newLayout,
      canvasId: canvasId
    });
  }, [eventBus]);

// React ai cambiamenti di layout esterni
  useEffect(() => {
    const cb = (e) => {
      const { layout, canvasId } = e;

      // Aggiorna la configurazione del layout in base al canvas di origine
      if (canvasId === 'canvas1') {
        // Aggiorna la configurazione del layout per canvas1
      } else if (canvasId === 'canvas2') {
        // Aggiorna la configurazione del layout per canvas2
      }
      setLayoutConfig(layout);
    };

    eventBus.on('propertiesPanel.setLayout', cb);
    return () => eventBus.off('propertiesPanel.setLayout', cb);
  }, [eventBus, setLayoutConfig]);

  // (6) Notifica i cambiamenti di descrizione
  const onDescriptionLoaded = (description) => {
    eventBus.fire('propertiesPanel.descriptionLoaded', {
      description
    });
  };

  // (7) Notifica i cambiamenti del tooltip
  const onTooltipLoaded = (tooltip) => {
    eventBus.fire('propertiesPanel.tooltipLoaded', {
      tooltip
    });
  };

  return (
    <GlobalPropertiesPanelContext.Provider value={ globalPropertiesPanelContext }>
      <PropertiesPanel
        element={ selectedElement }
        headerProvider={ PanelHeaderProvider }
        placeholderProvider={ PanelPlaceholderProvider(translate) }
        groups={ groups }
        layoutConfig={ layoutConfig }
        layoutChanged={ onLayoutChanged }
        descriptionConfig={ descriptionConfig }
        descriptionLoaded={ onDescriptionLoaded }
        tooltipConfig={ tooltipConfig }
        tooltipLoaded={ onTooltipLoaded }
        feelPopupContainer={ feelPopupContainer }
        eventBus={ eventBus } />
    </GlobalPropertiesPanelContext.Provider>
  );
}

/**
 * Verifica se l'elemento è la radice implicita.
 *
 * @param {Object} element - Elemento da verificare.
 * @returns {boolean} - True se l'elemento è la radice implicita, altrimenti False.
 */
function isImplicitRoot(element) {

  // Compatibilità con le versioni precedenti di diagram-js<7.4.0
  return element && (element.isImplicit || element.id === '__implicitroot');
}

/**
 * Trova un elemento in un elenco di elementi.
 *
 * @param {Array<Object>} elements - Elenco degli elementi.
 * @param {Object} element - Elemento da trovare.
 * @returns {Object} - L'elemento trovato.
 */
function findElement(elements, element) {
  return find(elements, (e) => e === element);
}

/**
 * Verifica se un elemento esiste nel registro degli elementi.
 *
 * @param {Object} element - Elemento da verificare.
 * @param {Object} elementRegistry - Registro degli elementi.
 * @returns {boolean} - True se l'elemento esiste, altrimenti False.
 */
function elementExists(element, elementRegistry) {
  return element && elementRegistry.get(element.id);
}
