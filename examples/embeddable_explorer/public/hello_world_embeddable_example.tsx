/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  EuiErrorBoundary,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiTitle,
  EuiMarkdownEditor,
  EuiMarkdownContext,
  getDefaultEuiMarkdownParsingPlugins,
  getDefaultEuiMarkdownProcessingPlugins,
} from '@elastic/eui';
import * as MarkdownEmbeddable from './plugins/markdown_embeddable';
import * as MarkdownSavedObjectEmbeddable from './plugins/markdown_savedobject_embeddable';
import { EmbeddableRenderer } from '../../../src/plugins/embeddable/public';
import { getSavedObjectFinder } from '../../../src/plugins/saved_objects/public';

const exampleParsingList = getDefaultEuiMarkdownParsingPlugins();
exampleParsingList.push(MarkdownEmbeddable.parser);
exampleParsingList.push(MarkdownSavedObjectEmbeddable.parser);

const exampleProcessingList = getDefaultEuiMarkdownProcessingPlugins();

export function HelloWorldEmbeddableExample({ savedObjects, uiSettings, application, inspector, notifications, overlays, embeddableApi, getEmbeddableFactory, uiActions, helloWorldEmbeddableFactory }: any) {
  const [value, setValue] = useState(`!{embeddable{"type":"HELLO_WORLD_EMBEDDABLE"}}

!{embeddable{"type":"placeholder"}}




# Check out this thing I found

!{soe{"type":"map","savedObjectId":"5dd88580-1906-11e9-919b-ffe5949a18d2","viewMode":"edit","filters":[],"refreshConfig":{"value":0},"isLayerTOCOpen":false,"timeRange":{"from":"now-15d","to":"now"},"mapCenter":{"lat":0,"lon":0,"zoom":0},"openTOCDetails":[],"hiddenLayers":[],"title":"Lots of dots on a map"}}

----

**And check out this !{tooltip[interesting graph](which is totally made up)}!**



!{soe{"type":"visualization","savedObjectId":"f8290060-4c88-11e8-b3d7-01146121b73d","viewMode":"edit","filters":[],"refreshConfig":{"value":0},"timeRange":{"from":"now-15d","to":"now"}}}`);
  const [go, setGo] = useState(false);

  useEffect(() => {
    const EmbeddableMarkdownRenderer = ({ configuration }: any) => {
      const { type, ...config } = configuration;
      return (
        <EuiErrorBoundary>
          <EmbeddableRenderer factory={getEmbeddableFactory(type)} input={config} />
        </EuiErrorBoundary>
      );
    };

    const SavedObjectEmbeddableMarkdownRenderer = ({ position, configuration }: any) => {
      const [embeddable, setEmbeddable] = useState(null);
      const { type, savedObjectId, ...config } = configuration;
      const { replaceNode } = useContext(EuiMarkdownContext);

      const configString = `!{soe${JSON.stringify({ type, savedObjectId, ...config })}}`;

      useEffect(() => {
        const factory = getEmbeddableFactory(type as string);
        if (factory) {
          factory.createFromSavedObject(
            savedObjectId,
            config
          ).then(embeddable => {
            setEmbeddable(embeddable);

            const inputObserver = embeddable.getInput$();

            inputObserver.subscribe(input => {
              const nextConfig = `!{soe${JSON.stringify({ type, savedObjectId, ...input })}}`;

              if (configString !== nextConfig) {
                replaceNode(position, nextConfig);
              }
            });

            return () => inputObserver.unsubscribe();
          });
        }
      }, [getEmbeddableFactory, type, replaceNode, position, configString]);
      return (
        <EuiErrorBoundary>
          <div style={{height: '280px'}}>
            {
              embeddable && <embeddableApi.EmbeddablePanel
                data-test-subj="embeddable-panel"
                embeddable={embeddable}
                getActions={uiActions.getTriggerCompatibleActions}
                getEmbeddableFactory={embeddableApi.getEmbeddableFactory}
                getAllEmbeddableFactories={embeddableApi.getEmbeddableFactories}
                notifications={notifications}
                overlays={overlays}
                inspector={inspector}
                application={application}
                SavedObjectFinder={getSavedObjectFinder(savedObjects, uiSettings)}
              />
            }
          </div>
        </EuiErrorBoundary>
      );
    };

    exampleProcessingList[1][1].components.embeddableDemoPlugin = EmbeddableMarkdownRenderer;
    exampleProcessingList[1][1].components.savedObjectEmbeddableDemoPlugin = SavedObjectEmbeddableMarkdownRenderer;
    setGo(true);
  }, []);

  return (
    <EuiPageBody>
      <EuiPageHeader>
        <EuiPageHeaderSection>
          <EuiTitle size="l">
            <h1>Embeddable Markdown Example</h1>
          </EuiTitle>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentBody>
          {
            go && <EuiMarkdownEditor
              aria-label="markdown editor example"
              height={800}
              value={value}
              onChange={setValue}
              processingPluginList={exampleProcessingList}
              parsingPluginList={exampleParsingList}
              uiPlugins={[MarkdownEmbeddable.plugin, MarkdownSavedObjectEmbeddable.plugin]}
            />
          }
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  );
}
