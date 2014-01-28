if (NagUI.config.jira.enable) {
    function displayDate(value) {
        if (typeof value == 'number') {
            value = value * 1000;
            if (value < 5000000) {
                return '';
            }
            var dt = new Date(value);
        } else {
            var dt = value;
        }
        return dt.format('Y-m-d H:i:s (T)');
    }

    function displayState(value) {
        if (value == 0) {
            return 'OK';
        }
        if (value == 1) {
            return 'Warning';
        }
        if (value == 2) {
            return 'Critical';
        }
        if (value == 3) {
            return 'Unknown';
        }
    }
    var ticketTemplates = {
        service: new Ext.XTemplate(
            'Hostname: {host_name} : {host_address}, Service: {description} \n',
            'State: {[this.stateText(values.state)]} \n',
            'Output: {plugin_output} \n',
            'Date/Time: {[this.asDate(values.last_hard_state_change)]} \n',
            'Host Notes: {host_notes} \n',
            'Notes : {notes_url} \n', {
                asDate: displayDate,
                stateText: displayState
            }),
        host: new Ext.XTemplate(
            'Hostname: {name} : {address}\n',
            // 'Services: ',
            // '<tpl for="services_with_state">',
            //  ' <span class=pp-nagios-{1}>{0}</span>  ',
            // '</tpl><br />',
            // 'Hostgroups: {groups}<br />',
            'Date/Time: {[this.asDate(values.last_hard_state_change)]} \n',
            'Notes: {notes}  {notes_url} /n',
            'Comments: ', {
                asDate: displayDate,
                stateText: displayState,
                log: NagUI.log
            })
    };


    function ackTicket(n, data, callback) {
        var nodeList = new Array();
        var newTicket = {
            description: "",
            summary: "",
            issuetype: {
                id: NagUI.config.jira.issuetype
            },
            // status: "1",
            project: {
                id: NagUI.config.jira.project_id
            },
            reporter: {
                name: NagUI.username
            }
        };

        if (n.length > 0) {
            nodeList = n;
            newTicket.summary = 'Batch Ack: ' + nodeList.length + ' issues: ' + data.ack_text;
            var dt = new Date();
            // newTicket.custom_fields.customfield_10042 = dt.format('d/M/y g:i A');
        } else {
            nodeList.push(n);
            var dt = n.data.last_hard_state_change;
            // newTicket.custom_fields.customfield_10042 = dt.format('d/M/y g:i A');
            switch (n.data.state) {
                case 3:
                    newTicket.summary = 'Unknown: ';
                    break;
                case 2:
                    newTicket.summary = 'Critical: ';
                    break;
                case 1:
                    newTicket.summary = 'Warning: ';
                    break;
            }
            newTicket.summary += n.data.nagios_type == 'host' ? n.data.name : n.data.host_name + ' : ' + n.data.description;
        }

        Ext.each(nodeList, function(i) {
            if (i.state == 0) {
                return;
            }
            if (newTicket.description.length > 12) {
                newTicket.description += "\n\n";
            }
            newTicket.description += ticketTemplates[i.data.nagios_type].apply(i.data);;
        });

        var diag = Ext.MessageBox.show({
            msg: data.ticket_num.match(/(XOPS|PROD|OPS|OA|ENPE)/) != null ? 'updating ticket...' : 'creating ticket...',
            width: 250,
            wait: true,
            waitConfig: {
                interval: 150
            }
        });
        if (data.ticket_num.match(/(ENPE|TADNU|OPS|OA)/) != null) {
            var comment = {
                body: data.ack_text + "\n\n" + newTicket.description,
                // author: NagUI.username
            };
            Ext.Ajax.request({
                url: NagUI.config.jira.jiraRESTbridge_path + 'rest/api/latest/issue/' + data.ticket_num + '/comment',
                method: 'POST',
                // timeout: 50000,
                jsonData: comment,
                failure: function(r, o) {
                    Ext.MessageBox.hide();
                    Ext.Msg.alert('Error', 'Unable to update ticket');
                    return;
                },
                success: function(r, o) {
                    if (typeof ackTicket == 'function') {
                        var link = 'https://evernote.jira.com/browse/' + data.ticket_num;
                        callback(data.ticket_num, diag, {
                            title: 'Ticket Updated',
                            msg: data.ticket_num + '<br /><a target="_blank" href="' + link + '">' + link + '</a>'
                        });
                    }
                }
            });
        } else {
            Ext.Ajax.request({
                url: NagUI.config.jira.jiraRESTbridge_path + 'rest/api/latest/issue',
                method: 'POST',
                // timeout: 5000,
                jsonData: {
                    fields: newTicket
                },
                failure: function(r, o) {
                    Ext.MessageBox.hide();
                    Ext.Msg.alert('Error', 'Unable to create ticket');
                    return;
                },
                success: function(r, o) {
                    var lkup = Ext.decode(r.responseText);
                    if (typeof callback == 'function' && typeof lkup.key != 'undefined') {
                        var link = 'https://evernote.jira.com/browse/' + lkup.key;
                        callback(lkup.key, diag, {
                            title: 'Ticket Created',
                            msg: lkup.key + '<br /><a target="_blank" href="' + link + '">' + link + '</a>'
                        });
                    }
                }
            });
        }
    }


}