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
  EuiFieldText,
  EuiSelect,
  EuiTextArea,
} from '@elastic/eui';
import { EuiMarkdownEditorUiPluginEditorProps } from '@elastic/eui/src/components/markdown_editor/markdown_types';

const savedObjectEmbeddableDemoPlugin = {
  name: 'savedObjectEmbeddableDemoPlugin',
  button: {
    label: 'Saved Object Embeddable',
    iconType: 'savedObjectsApp',
  },
  editor: function SavedObjectEmbeddableEditor({ node, onSave, onCancel }: EuiMarkdownEditorUiPluginEditorProps<{ configuration: { type: string, savedObjectId: string } }>) {
    const [type, setType] = useState((node && node.configuration.type) || 'map');
    const [savedObjectId, setSavedObjectId] = useState((node && node.configuration.savedObjectId) || '');
    const [configString, setConfigString] = useState(() => {
      if (node) {
        const {type, savedObjectId, ...config} = node.configuration;
        return JSON.stringify(config, null, 2);
      }
      return '';
    });

    return (
      <>
        <EuiModalHeader>
          <EuiModalHeaderTitle>Saved Object Embeddable data</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <>
            <EuiForm>
              <EuiFormRow label="Type">
                <EuiSelect
                  options={[
                    { value: 'map', text: 'map' },
                    { value: 'visualization', text: 'visualization' },
                  ]}
                  value={type}
                  onChange={e => setType(e.target.value)}
                />
              </EuiFormRow>

              <EuiFormRow label="Saved Object ID">
                <EuiFieldText
                  value={savedObjectId}
                  onChange={e => setSavedObjectId(e.target.value)}
                />
              </EuiFormRow>

              <EuiFormRow label="Configuration">
                <EuiTextArea value={configString} onChange={e => setConfigString(e.target.value)} />
              </EuiFormRow>
            </EuiForm>
          </>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onCancel}>Cancel</EuiButtonEmpty>

          <EuiButton
            onClick={() =>
              onSave(`!{soe${JSON.stringify({ type, savedObjectId, ...JSON.parse(configString) })}}`, { block: true })
            }
            fill>
            Save
          </EuiButton>
        </EuiModalFooter>
      </>
    );
  },
};

function SavedObjectEmbeddableParser() {
  // @ts-ignore
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.blockTokenizers;
  const methods = Parser.prototype.blockMethods;

  function tokenizeSavedObjectEmbeddable(eat: any, value: string, silent: boolean) {
    if (value.startsWith('!{soe') === false) return false;

    const nextChar = value[5];

    if (nextChar !== '{' && nextChar !== '}') return false; // this isn't actually a embeddable

    if (silent) {
      return true;
    }

    // is there a configuration?
    const hasConfiguration = nextChar === '{';

    let match = '!{soe';
    let configuration = {};

    if (hasConfiguration) {
      let configurationString = '';

      let openObjects = 0;

      for (let i = 5; i < value.length; i++) {
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
      type: 'savedObjectEmbeddableDemoPlugin',
      configuration,
    });
  }

  tokenizers.savedObjectEmbeddable = tokenizeSavedObjectEmbeddable;
  methods.splice(methods.indexOf('text'), 0, 'savedObjectEmbeddable');
}

export {
  savedObjectEmbeddableDemoPlugin as plugin,
  SavedObjectEmbeddableParser as parser,
};
