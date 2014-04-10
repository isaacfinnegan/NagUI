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

NagUI.nodeQueries.donwtimes = 'GET downtimes|Columns: fixed start_time author host_name host_notes host_address comment service_description id type service_state host_state is_service duration triggered_by end_time';


Ext.define('downtime_node',
{
    extend: 'Ext.data.Model',
    fields: ['author', 'host_name', 'comment', 'service_description', 'parms', 'id', 'type', 'text',
        'service_state', 'meta', 'duration', 'triggered_by', 'fixed',
        'host_state', 'is_service',
        {
            type: 'date',
            dateFormat: 'timestamp',
            name: 'start_time',
            mapping: 'start_time'
        },
        {
            type: 'date',
            dateFormat: 'timestamp',
            name: 'end_time',
            mapping: 'end_time'
        },
        {
            name: 'leaf',
            convert: function(v, node)
            {
                if (node.get('duration'))
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
                return 'downtime';
            }
        }
    ]
});



Ext.define('NagUI.DowntimeStore',
{
    extend: 'NagUI.NagiosStore',
    alias: 'store.nagiosdowntimes',
    // requires: ['Ext.data.Tree', 'Ext.data.NodeInterface', 'Ext.data.NodeStore'],
    requires: ['Ext.data.NodeInterface', 'Ext.data.NodeStore'],
    constructor: function(config)
    {
        if (!config.model)
        {
            config.model = 'downtime_node';
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

        NagUI.DowntimeStore.superclass.constructor.apply(this, arguments);
    }
});