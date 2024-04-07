import React from 'react';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';

export class SpaceProps extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            attributes: props.element.businessObject.prova || []
        };
    }

    addAttribute = () => {
        const newAttribute = { value: '', isOff: false };
        this.setState(prevState => ({
            attributes: [...prevState.attributes, newAttribute]
        }));
    };

    removeAttribute = (index) => {
        this.setState(prevState => ({
            attributes: prevState.attributes.filter((_, i) => i !== index)
        }));
    };

    toggleOff = (index) => {
        this.setState(prevState => ({
            attributes: prevState.attributes.map((attr, i) => i === index ? { ...attr, isOff: !attr.isOff } : attr)
        }));
    };

    render() {
        const { element, id } = this.props;
        const { t: translate } = useTranslation();

        return (
            <div>
                <div style={{ marginLeft: '12px', display: 'flex', justifyContent: 'left', alignItems: 'center', marginBottom: '1px' }}>
                    <span style={{ marginRight: '0.25px' }}>Add property</span>
                    <button
                        onClick={this.addAttribute}
                        style={{ background: 'white', color: 'black', border: '1px solid white', cursor: 'pointer', fontSize: '16px' }}>
                        +
                    </button>
                </div>
                {this.state.attributes.map((attribute, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                        <TextFieldEntry
                            id={id}
                            element={element}
                            description={translate('')}
                            label={`Property ${index + 1}`}
                            getValue={() => attribute.value || ''}
                            setValue={(newValue) => {
                                const updatedAttributes = this.state.attributes.map((attr, i) => i === index ? { ...attr, value: newValue } : attr);
                                this.setState({ attributes: updatedAttributes });
                            }}
                            debounce={debounce}
                        />
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={() => this.toggleOff(index)}
                                style={{ marginLeft: '8px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', marginRight: '5px' }}>
                                {attribute.isOff ? 'On' : 'Off'}
                            </button>
                            <button
                                onClick={() => this.removeAttribute(index)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
}
