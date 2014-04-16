Ext.define('NagUI.Livelog',
{
    extend: 'NagUI.NagiosLogGrid',
    alias: 'widget.livelog',
    title: 'Live Log',
    tbar: undefined,
    initialHistory: 200,
    features: [
    {
        ftype: 'filters',
        // encode and local configuration options defined previously for easier reuse
        encode: 'encode', // json encode the filter query
        local: 'local', // defaults to false (remote filtering)

        // Filters are most naturally placed in the column definition, but can also be
        // added here.
        filters: [
        {
            type: 'boolean',
            dataIndex: 'visible'
        }]
    }],
    viewConfig:
    {
        loadMask: false
    },
    columns: [
    {
        text: 'Time',
        dataIndex: 'time',
        width: 130,
        renderer: nagiosDateRender
    },
    {
        text: 'State',
        dataIndex: 'state',
        width: 60,
        renderer: nagiosStateRender,
        filterable: true
    },
    {
        text: 'State Type',
        dataIndex: 'state_type',
        width: 80,
        hidden: true,
        filterable: true
    },
    {
        text: 'Type',
        dataIndex: 'type',
        width: 160,
        hidden: true,
        filterable: true
    },
    {
        text: 'Mesg',
        dataIndex: 'message',
        hidden: false,
        flex: 2
    },
    {
        text: 'Host',
        dataIndex: 'host_name',
        hidden: false,
        filterable: true
    },
    {
        text: 'LineNo',
        dataIndex: 'lineno',
        hidden: true
    },
    {
        text: 'Options',
        dataIndex: 'options',
        hidden: true
    },
    {
        text: 'Service',
        dataIndex: 'service_description',
        hidden: false,
        filterable: true
    },
    {
        text: 'Contact',
        dataIndex: 'contact_name',
        hidden: true,
        filterable: true
    },
    {
        text: 'Output',
        dataIndex: 'plugin_output',
        hidden: true
    },
    {
        text: 'Attempt',
        dataIndex: 'attempt',
        hidden: true
    },
    {
        text: 'Log Class',
        dataIndex: 'class',
        hidden: false,
        renderer: nagiosLogClassRender,
        filterable: true
    },
    {
        text: 'Command',
        dataIndex: 'command_name',
        hidden: true
    }],
    dockedItems: [
    {
        xtype: 'toolbar',
        dock: 'left',
        vertical: true,
        items: [
        {
            xtype: 'button',
            tooltip: 'start/pause displaying log entries as they are recieved from the nagios servers',
            icon: 'images/play.gif',
            handler: function()
            {
                var livelog = this.up('livelog');
                if (this.icon == 'images/play.gif')
                {
                    this.setIcon('images/pause.gif');
                }
                else
                {
                    this.setIcon('images/play.gif');
                }
                livelog.toggleLiveLog();
            }
        }]
    }],
    toggleLiveLog: function()
    {
        if (this.liveTask)
        {
            Ext.util.TaskManager.stop(this.liveTask);
            this.liveTask = false;
            return;
        }
        this.liveTask = Ext.util.TaskManager.start(
        {
            run: function()
            {
                var loglimit = NagUI.config.livelog.cachelimit || 1000;
                if (this.getStore().count() > loglimit)
                {
                    this.getStore().removeAt(loglimit, this.getStore().count() - loglimit)
                }

                var time = Ext.Date.format(new Date(), 'U') - this.initialHistory;
                if (this.store.max('time') > time)
                {
                    time = this.store.max('time') + 1;
                }
                this.store.commitChanges();
                this.getLogs(
                {
                    addRecords: true,
                    rawquery: 'GET log|Columns: type host_name message lineno options contact_name service_description plugin_output state attempt class state_type time type command_name|Filter: time >= ' + time + NagUI.config.livelog.filter
                });
            },
            scope: this,
            interval: NagUI.config.livelog.query_rate ? NagUI.config.livelog.query_rate * 1000 : 10000
        });
    }

});