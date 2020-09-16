import React, { useState } from 'react';
import {
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  EuiForm,
  EuiFormRow,
  EuiSelect,
} from '@elastic/eui';
import { EuiMarkdownEditorUiPluginEditorProps } from '@elastic/eui/src/components/markdown_editor/markdown_types';

const embeddableDemoPlugin = {
  name: 'embeddableDemoPlugin',
  button: {
    label: 'Embeddable',
    iconType: 'nested',
  },
  editor: function EmbeddableEditor({ node, onSave, onCancel }: EuiMarkdownEditorUiPluginEditorProps<{ configuration: { type: string } }>) {
    const [type, setType] = useState((node && node.configuration.type) || 'placeholder');

    return (
      <>
        <EuiModalHeader>
          <EuiModalHeaderTitle>Embeddable data</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <>
            <EuiForm>
              <EuiFormRow label="Palette">
                <EuiSelect
                  options={[
                    { value: 'placeholder', text: 'Placeholder' },
                    { value: 'HELLO_WORLD_EMBEDDABLE', text: 'Hello World' },
                  ]}
                  value={type}
                  onChange={e => setType(e.target.value)}
                />
              </EuiFormRow>
            </EuiForm>
          </>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onCancel}>Cancel</EuiButtonEmpty>

          <EuiButton
            onClick={() =>
              onSave(`!{embeddable${JSON.stringify({ type })}}`, { block: true })
            }
            fill>
            Save
          </EuiButton>
        </EuiModalFooter>
      </>
    );
  },
};

function EmbeddableParser() {
  // @ts-ignore
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.blockTokenizers;
  const methods = Parser.prototype.blockMethods;

  function tokenizeEmbeddable(eat: any, value: string, silent: boolean) {
    if (value.startsWith('!{embeddable') === false) return false;

    const nextChar = value[12];

    if (nextChar !== '{' && nextChar !== '}') return false; // this isn't actually a embeddable

    if (silent) {
      return true;
    }

    // is there a configuration?
    const hasConfiguration = nextChar === '{';

    let match = '!{embeddable';
    let configuration = {};

    if (hasConfiguration) {
      let configurationString = '';

      let openObjects = 0;

      for (let i = 12; i < value.length; i++) {
        const char = value[i];
        if (char === '{') {
          openObjects++;
          configurationString += char;
        } else if (char === '}') {
          openObjects--;
          if (openObjects === -1) {
            break;
          }
          configurationString += char;
        } else {
          configurationString += char;
        }
      }

      match += configurationString;
      try {
        configuration = JSON.parse(configurationString);
      } catch (e) {
        return false;
      }
    }

    if (value[match.length] !== '}') return false;

    match += '}';

    return eat(match)({
      type: 'embeddableDemoPlugin',
      configuration,
    });
  }

  tokenizers.embeddable = tokenizeEmbeddable;
  methods.splice(methods.indexOf('text'), 0, 'embeddable');
}

export {
  embeddableDemoPlugin as plugin,
  EmbeddableParser as parser,
};
