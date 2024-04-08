import React from 'react';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';

export class SpaceProps extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            attributes: props.element.businessObject.prova || [],
            customProperties: {} // Inizializza le proprietà personalizzate come un oggetto vuoto
        };
    }

    componentDidMount() {
        console.log('Array di proprietà inizializzato:', this.state.attributes);
    }

    // Aggiunta di una nuova proprietà personalizzata
    addCustomProperty = (propertyName, propertyValue) => {
        const updatedCustomProperties = { ...this.state.customProperties };
        updatedCustomProperties[propertyName] = propertyValue;
        this.setState({ customProperties: updatedCustomProperties });
        console.log('custom properties:', this.state.customProperties)
        console.log('attributes:', this.state.attributes)
    };

    // Rimozione di una proprietà personalizzata esistente
    removeCustomProperty = (propertyName) => {
        const updatedCustomProperties = { ...this.state.customProperties };
        delete updatedCustomProperties[propertyName];
        this.setState({ customProperties: updatedCustomProperties });
        console.log('Array di proprietà:', this.state.attributes)

    };

    // Cambia lo stato della proprietà personalizzata tra On e Off
    toggleCustomProperty = (propertyName) => {
        const updatedCustomProperties = { ...this.state.customProperties };
        updatedCustomProperties[propertyName] = !updatedCustomProperties[propertyName];
        this.setState({ customProperties: updatedCustomProperties });
    };

    handleChange = (index, newValue) => {
        const updatedAttributes = this.state.attributes.map((attr, i) => i === index ? { ...attr, value: newValue } : attr);
        this.setState({ attributes: updatedAttributes });
    };

    render() {
        const { element, id } = this.props;
        const { t: translate } = useTranslation();

        return (
            <div>
                <div style={{ marginLeft: '12px', display: 'flex', justifyContent: 'left', alignItems: 'center', marginBottom: '1px' }}>
                    <span style={{ marginRight: '0.25px' }}>Add property</span>
                    <button
                        onClick={() => {
                            const propertyName = prompt('Enter property name:');
                            if (propertyName) {
                                this.addCustomProperty(propertyName, true); // Aggiunge la proprietà con valore iniziale true
                            }
                        }}
                        style={{ background: 'white', color: 'black', border: '1px solid white', cursor: 'pointer', fontSize: '16px' }}>
                        +
                    </button>
                </div>
                {Object.entries(this.state.customProperties).map(([propertyName, propertyValue]) => (
                    <div key={propertyName} style={{ position: 'relative' }}>
                        <div>{propertyName}</div>
                        <button
                            onClick={() => this.toggleCustomProperty(propertyName)}
                            style={{ background: propertyValue ? 'green' : 'red', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                            {propertyValue ? 'On' : 'Off'}
                        </button>
                        <button
                            onClick={() => this.removeCustomProperty(propertyName)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                            Remove
                        </button>
                    </div>
                ))}
                {this.state.attributes.map((attribute, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                        <TextFieldEntry
                            id={id}
                            element={element}
                            description={translate('')}
                            label={`Property ${index + 1}`}
                            getValue={() => attribute.value || ''}
                            setValue={(newValue) => this.handleChange(index, newValue)}
                            debounce={debounce}
                        />
                    </div>
                ))}
            </div>
        );
    }
}
