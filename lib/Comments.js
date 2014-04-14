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

NagUI.nodeHandlers.Comments = function(view, node)
{
    var newview = addCustomView('Comments',
    {
        rootVisible: false,
        listeners:
        {
            'itemclick':
            {
                fn: function(view, node)
                {
                    var newnode = {
                        data:
                        {}
                    };
                    if (node.get('is_service'))
                    {
                        newnode.data = {
                            host_name: node.data.host_name,
                            description: node.data.service_description,
                            nagios_type: 'service',
                            text: node.data.text
                        };
                    }
                    else
                    {
                        newnode.data = {
                            name: node.data.host_name,
                            nagios_type: 'host',
                            text: node.data.text
                        };
                    }
                    nagiosNodeClick(view, newnode);
                }
            }
        },
        defaultVisibleColumns: ['host', 'author', 'comment', 'service_description'],
        columns: [
            {
                xtype: 'treecolumn',
                text: 'Host',
                dataIndex: 'host_name',
                flex: 2
            },
            {
                text: 'Service',
                dataIndex: 'service_description',
                renderer: nagiosCommentRender,
                flex: 2
            },
            {
                text: 'Author',
                dataIndex: 'author',
                flex: 2
            },
            {
                text: 'Comment',
                dataIndex: 'comment',
                flex: 2
            },
            {
                text: 'Time',
                dataIndex: 'entry_time',
                flex: 2
            },

        ],
        store: new NagUI.CommentStore(
        {

            root:
            {
                text: 'Comments',
                iconCls: 'x-tree-comment',
                meta: 1,
                parms:
                {
                    groupby: '',
                    nodetext: 'author',
                    status: 'comment',
                    query: 'comments'
                }
            }
        })
    });
    newview.getRootNode().expand();
}

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


function nagiosCommentRender(value, o, node, row, col, store)
{
    var r = node.data;
    var rtn = '';
    if (r.is_service)
    {
        // do state dressing
        if (typeof r.service_state != 'undefined')
        {
            rtn += '<span class=pp-nagios-' + r.service_state + '>' + value + '</span>';
            return rtn;
        }
    }
    return rtn + value;
}


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