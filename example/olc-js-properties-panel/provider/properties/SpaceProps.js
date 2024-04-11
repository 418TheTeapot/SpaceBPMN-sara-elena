import React from 'react';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import OlcModeler from "../../../lib/olcmodeler/OlcModeler";

export class SpaceProps extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            attributes: [],
            customProperties: {} // Inizializza le proprietà personalizzate come un oggetto vuoto
        };
    }

    // componentDidMount() {
    //     const { element } = this.props;
    //     this.setState({
    //         attributes: element.businessObject.prova || []
    //     });
    //     console.log('prova', element.businessObject.prova)
    // }

    // Aggiunta di una nuova proprietà personalizzata
    addCustomProperty = (propertyName, propertyValue) => {
        const updatedCustomProperties = { ...this.state.customProperties };
        updatedCustomProperties[propertyName] = propertyValue;
        const updatedAttributes = Object.entries(updatedCustomProperties).map(([key, value]) => ({ name: key, value }));
        this.setState({ customProperties: updatedCustomProperties, attributes: updatedAttributes }, () => {
            console.log('attributes:', this.state.attributes);
            console.log('custom properties:', this.state.customProperties)
            console.log('lux', this.state.attributes[0])
        });
    };

    // Rimozione di una proprietà personalizzata esistente
    removeCustomProperty = (propertyName) => {
        const updatedCustomProperties = { ...this.state.customProperties };
        delete updatedCustomProperties[propertyName];
        this.setState({ customProperties: updatedCustomProperties }, () => {
            console.log('attributes:', this.state.attributes);
            console.log('custom properties:', this.state.customProperties)
        });
    };

    // Cambia lo stato della proprietà personalizzata tra On e Off
    toggleCustomProperty = (propertyName) => {
        const updatedCustomProperties = { ...this.state.customProperties };
        updatedCustomProperties[propertyName] = !updatedCustomProperties[propertyName];
        this.setState({ customProperties: updatedCustomProperties });
    };

    handleChange = (index, newValue) => {
        const updatedAttributes = this.state.attributes.map((attr, i) => i === index ? { ...attr, value: newValue } : attr);
        this.setState({ attributes: updatedAttributes }, () => {
            console.log('handle change attributes:', this.state.attributes);
        });
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
                    <div key={propertyName} style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ marginRight: '8px' }}>{propertyName}</div>
                        <button
                            onClick={() => this.toggleCustomProperty(propertyName)}
                            style={{ background: propertyValue ? 'green' : 'red', border: 'none', cursor: 'pointer', fontSize: '12px', marginRight: '4px' }}>
                            {propertyValue ? 'On' : 'Off'}
                        </button>
                        <button
                            onClick={() => this.removeCustomProperty(propertyName)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                            Remove
                        </button>
                    </div>
                ))}
                {/*{this.state.attributes.map((attribute, index) => (*/}
                {/*    <div key={index} style={{ position: 'relative' }}>*/}
                {/*        <TextFieldEntry*/}
                {/*            id={id}*/}
                {/*            element={element}*/}
                {/*            description={translate('')}*/}
                {/*            label={`Property ${index + 1}`}*/}
                {/*            getValue={() => attribute.value || ''}*/}
                {/*            setValue={(newValue) => this.handleChange(index, newValue)}*/}
                {/*            debounce={debounce}*/}
                {/*        />*/}
                {/*    </div>*/}
                {/*))}*/}
            </div>
        );
    }

}
