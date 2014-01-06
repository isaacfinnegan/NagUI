// Copyright 2011-2013 Proofpoint, Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//  http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

if (typeof Graphite == 'undefined') {
    Ext.namespace('Graphite');
    Graphite.log = function(log) {
        if (window.console) {
            console.log(log);
        }
    }
}
Ext.define('graphtemplate', {
    extend: 'Ext.data.Model',
    fields: ['name'],
    proxy: {
        type: 'ajax',
        url: '/dashboard/find-template/',
        extraParams: {
            query: null
        },
        reader: {
            type: 'json',
            root: 'templates'
        }
    }
});
Ext.define('template_graph', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'title',
    }, {
        name: 'target',
    }, {
        name: 'from',
    }, {
        name: 'until',
    }, {
        name: 'vtitle',
    }, {
        name: 'areaMode',
    }]
});



Graphite.graphiteWindow = function(n, name_key, title) {
    var nodelist;
    var hostnamelist = new Array();
    if (n.length > 0) {
        nodelist = n;
    } else {
        nodelist = new Array(n);
    }
    for (var i = 0; i < nodelist.length; i++) {
        var hostname = nodelist[i].data.name || nodelist[i].data.host_name || nodelist[i].data[name_key];
        hostnamelist.push(hostname);
    }
    var g = Ext.create('Graphite.GraphitePanel', {
        title: undefined
    });
    var w = Ext.create('Ext.Window', {
        title: title || 'Graphite',
        height: window.innerHeight - 200,
        width: 800,
        layout: 'fit',
        items: g
    });
    Graphite.log(w);
    w.show();
    g.load(hostnamelist.join(','));

}
Ext.define('Graphite.TemplateStore', {
    extend: 'Ext.data.TreeStore',
    alias: 'store.graphite'
});

Ext.define('Graphite.GraphitePanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.graphitepanel',
    frame: true,
    layout: 'border',
    currentGraph: {
        metric: Graphite.config.defaultMetric,
        from: '-6hours',
        until: 'now'
    },
    system_fqdn: '',
    listeners: {
        'resize': {
            fn: function(p) {
                p.setGraph();
            }
        },
        'activate': {
            fn: function(p) {
                p.setGraph();
            }
        },
        'boxready': {
            fn: function(p) {
                p.setGraph();
            }
        }
    },
    loaded: false,
    title: 'Graphite',
    constructor: function(config) {
        this.items = [{
            xtype: 'panel',
            region: 'center',
            layout: 'fit',
            html: "This is where the graph will be"
        }];
        this.timeSelector_tbar = [{
            text: 'Time -6hours',
            menu: {
                xtype: 'menu',
                listeners: {
                    'hide': {
                        fn: function(menu) {
                            menu.up('graphitepanel').optionsPanel.collapse();
                        }
                    }
                },
                items: [{
                    text: '-6hours',
                    handler: function(i) {
                        var gpanel = i.up('panel[xtype=graphitepanel]');
                        gpanel.currentGraph.from = i.text;
                        i.up('button').setText('Time ' + i.text);
                        gpanel.setGraph();
                    }
                }, {
                    text: '-12hours',
                    handler: function(i) {
                        var gpanel = i.up('panel[xtype=graphitepanel]');
                        gpanel.currentGraph.from = i.text;
                        i.up('button').setText('Time ' + i.text);
                        gpanel.setGraph();
                    }
                }, {
                    text: '-24hours',
                    handler: function(i) {
                        var gpanel = i.up('panel[xtype=graphitepanel]');
                        gpanel.currentGraph.from = i.text;
                        i.up('button').setText('Time ' + i.text);
                        gpanel.setGraph();
                    }
                }, {
                    text: '-1weeks',
                    handler: function(i) {
                        var gpanel = i.up('panel[xtype=graphitepanel]');
                        gpanel.currentGraph.from = i.text;
                        i.up('button').setText('Time ' + i.text);
                        gpanel.setGraph();
                    }
                }]
            }
        }]
        this.metricsBrowserSpec = {
            xtype: 'treepanel',
            title: 'Metrics',
            rootVisible: false,
            listeners: {
                'itemclick': {
                    fn: function(view, rec) {
                        console.log(rec);
                        var gpanel = view.up('panel[xtype=graphitepanel]');
                        gpanel.currentGraph.metric = rec.id.replace(rec.store.getRootNode().id + '.', '');
                        gpanel.optionsPanel.collapse();
                        gpanel.setGraph();
                    },
                },
                'beforeitemexpand': {
                    fn: function(node) {
                        if (!node.isExpandable()) {
                            return;
                        }
                        var node_id = node.id.replace(/^[A-Za-z.\-0-9]+./, '*');
                        var proxy = node.getOwnerTree().getStore().getProxy();
                        proxy.setExtraParam('query', (node_id == "") ? "*" : (node_id + ".*"));
                        proxy.setExtraParam('format', 'treejson');
                        proxy.setExtraParam('contexts', '1');
                        proxy.setExtraParam('path', node_id);
                    },
                    scope: this
                }
            },
            store: Ext.create('Ext.data.TreeStore', {
                proxy: {
                    type: 'ajax',
                    url: Graphite.config.metricsPath + 'find/',
                    extraParams: {
                        format: 'treejson',
                        contexts: 1,
                    },
                    pageParam: undefined,
                    sortParam: undefined,
                    groupParam: undefined,
                    filterParam: undefined
                },
                root: {
                    expanded: false,
                    leaf: true
                }
            })
        };
        if (Graphite.config.enableTemplates) {
            this.metricsBrowser = Ext.create('Ext.tree.Panel', this.metricsBrowserSpec);
            this.templatestore = Ext.create('Ext.data.Store', {
                model: 'template_graph',
                proxy: {
                    type: 'ajax',
                    url: '/dashboard/load',
                    extraParams: {
                        template: Graphite.config.defaultTemplate
                    },
                    reader: {
                        type: 'json',
                        root: 'state.graphs',
                        record: 1
                    }
                },
                listeners: {
                    'beforeload': {
                        fn: function(store, op, eOpts) {
                            store.getProxy().url = '/dashboard/load/' + (op.params ? op.params.template : store.getProxy().extraParams.template);
                            return true;
                        }
                    }
                },
                autoLoad: true
            });
            this.optionsPanel = Ext.create('Ext.tab.Panel', {
                region: 'west',
                title: 'Graph Options',
                width: 150,
                collapsed: true,
                animCollapse: false,
                collapsible: true,
                hideCollapseTool: true,
                titleCollapse: true,
                preventHeader: true,
                hideHeaders: true,
                split: false,
                tbar: this.timeSelector_tbar,
                items: [{
                        xtype: 'panel',
                        title: 'Templates',
                        tbar: [{
                            xtype: 'combo',
                            store: Ext.create('Ext.data.Store', {
                                model: 'graphtemplate',
                                autoLoad: true,
                            }),
                            displayField: 'name',
                            triggerAction: 'all',
                            value: Graphite.config.defaultTemplate,
                            selectOnFocus: true,
                            listeners: {
                                'change': {
                                    fn: function(combo, newvalue, oldvalue, eOpts) {
                                        this.templatestore.load({
                                            params: {
                                                template: newvalue
                                            }
                                        });
                                        // combo.up('panel').setTitle(newvalue);
                                    },
                                    scope: this
                                }
                            }
                        }],
                        items: [
                            Ext.create('Ext.view.View', {
                                store: this.templatestore,
                                tpl: [
                                    '<tpl for=".">',
                                    '<div class=template>{title}</div>',
                                    '</tpl>',
                                    '<div class="x-clear"></div>'
                                ],
                                itemSelector: 'div.template',
                                multiSelect: false,
                                emptyText: 'no graphs found in template',
                                listeners: {
                                    'selectionchange': function(div, node) {
                                        this.templateGraph = node[0];
                                        this.optionsPanel.collapse();
                                        this.setGraph();
                                    },
                                    scope: this
                                }
                            })
                        ]
                    },
                    this.metricsBrowser
                ]
            });
            this.items.push(this.optionsPanel);
        } else {
            Ext.apply(this.metricsBrowserSpec, {
                region: 'west',
                width: 150,
                collapsed: true,
                animCollapse: false,
                collapsible: true,
                hideCollapseTool: true,
                titleCollapse: true,
                preventHeader: true,
                hideHeaders: true,
                split: false,
                tbar: this.timeSelector_tbar
            });
            this.metricsBrowser = Ext.create('Ext.tree.Panel', this.metricsBrowserSpec);
            this.items.push(this.metricsBrowser);
            this.optionsPanel = this.metricsBrowser
        }

        Graphite.GraphitePanel.superclass.constructor.apply(this, arguments);
    },
    setGraph: function() {
        if (!this.centerRegion) {
            this.centerRegion = this.down('panel[region=center]');
        }
        var graphUrl = Graphite.config.path + "?from=";
        var targets = this.system_fqdn.split(',');
        graphUrl += this.currentGraph.from + "&until=" + this.currentGraph.until;
        graphUrl += "&width=" + this.centerRegion.getBox().width + "&height=" + this.centerRegion.getBox().height;
        for (var l = 0; l < targets.length; l++) {
            var fqdn = targets[l].split('.');
            if (this.templateGraph) {
                graphUrl += "&areaMode=" + this.templateGraph.get('areaMode');
                graphUrl += "&vtitle=" + this.templateGraph.get('vtitle');
                graphUrl += "&title=" + this.templateGraph.get('title');

                var template_targets = this.templateGraph.get('target');
                for (var tl = 0; tl < template_targets.length; tl++) {
                    graphUrl += "&target=" + template_targets[tl].replace(/{{id}}/g, fqdn[0] + '*');
                }
            } else {
                graphUrl += "&target=" + Graphite.config.metricsPrefix + "." + fqdn[0] + "*." + this.currentGraph.metric;
                graphUrl += "&title=" + this.currentGraph.metric;
            }
        }
        graphUrl += "&_uniq=0.9507563426159322&hideLegend=false";
        this.layout.centerRegion.update("<img src='" + graphUrl + "'>");
        this.loaded = true;
    },
    load: function(system_fqdn) {
        this.loaded = false;
        if (system_fqdn) {
            this.system_fqdn = system_fqdn;
        }
        if (!this.loaded && this.isVisible()) {
            this.setGraph();
        }
        var targets = this.system_fqdn.split(',');
        var fqdn = targets[0].split('.');

        this.metricsBrowser.setRootNode({
            id: Graphite.config.metricsPrefix + '.' + fqdn[0] + '*',
            text: system_fqdn
        });
    },
});