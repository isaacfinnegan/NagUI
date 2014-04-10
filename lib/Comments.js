/* Copyright 2010-2011 Proofpoint, Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

NagUI.nodeQueries.comments = 'GET comments|Filter: entry_type = 1|Columns: entry_time author host_name host_notes host_address comment service_description id type source entry_type expire_time expires persistent service_state host_state is_service';


Ext.define('comment_node',
{
    extend: 'Ext.data.Model',
    fields: ['author', 'host_name', 'comment', 'service_description', 'parms', 'id', 'type', 'text',
        'source', 'entry_type', 'expire_time', 'expires', 'persistent', 'service_state', 'meta',
        'host_state', 'is_service',
        {
            type: 'date',
            dateFormat: 'timestamp',
            name: 'entry_time',
            mapping: 'entry_time'
        },
        {
            name: 'leaf',
            convert: function(v, node)
            {
                if (node.get('entry_type'))
                {
                    return true;
                }
            }
        },
        {
            name: 'checked',
            convert: function(v, node)
            {
                return null;
            }
        },
        {
            name: 'iconCls',
            convert: function(v, node)
            {
                if (node.get('is_service') == 1)
                {
                    return 'service';
                }
                return 'host';
            }
        }
    ]
});



Ext.define('NagUI.CommentStore',
{
    extend: 'NagUI.NagiosStore',
    alias: 'store.nagioscomments',
    // requires: ['Ext.data.Tree', 'Ext.data.NodeInterface', 'Ext.data.NodeStore'],
    requires: ['Ext.data.NodeInterface', 'Ext.data.NodeStore'],
    constructor: function(config)
    {
        if (!config.model)
        {
            config.model = 'comment_node';
        }
        if (!config.proxy)
        {
            config.proxy = {
                type: 'ajax',
                url: NagUI.url
            };
        }
        if (!config.sorters)
        {
            config.sorters = [
            {
                property: 'text',
                direction: 'ASC'
            }]
        }

        NagUI.CommentStore.superclass.constructor.apply(this, arguments);
    }
});