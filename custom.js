/*
This file is automatically loaded after the nagui JS files.  
Apply any install specific customizations here.  some example custom functions and integration
are listed below


customNodes are added to the Nagios Browser pane (left-hand) 
before the Hostgroups and Services and are expanded by referencing a query from NagUI.nodeQueries. 
custome nodes require entries in NagUI.nodeQueries to expand

example: 

NagUI.customNodes=[{
    text: 'Business',
    meta: 1,
    allowDrag:false,
    parms:{
        groupby:'name',
        nodetext: 'name',
        query: 'business'
    }
}];
NagUI.nodeQueries.business='GET hostgroups|Columns: name num_hosts num_services_ok num_services_warn num_services_crit num_services_unknown|Filter: name = Sales|Filter: name = Support|Filter: name = Mail|Or: 3';


*/

NagUI.customNodes = [];



//  Uncomment the function below and customize to integrate with your ticketing system.  
//  the ackTicket receives three parameters, the node(s) that is being passed to it (this could
// be an array of nodes), the formData from the ackWindow and a call be to called after a 
// ticket has been created.  the callback should be called with 
//  (ticket numer, dialog object that should be closed <optional> 
// function ackTicket(node, formData, callback) {

// }

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
            // id: "16" //ENPE
            id: "10" //TADNU test project
        },
        // status: "1",
        project: {
            // id: "11302"  // ENPE
            id: "12402" // TADNU 
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
        msg: data.ticket_num.match(/(XOPS|PROD)/) != null ? 'updating ticket...' : 'creating ticket...',
        width: 250,
        wait: true,
        waitConfig: {
            interval: 150
        }
    });
    if (data.ticket_num.match(/(ENPE|TADNU)/) != null) {
        var comment = {
            body: data.ack_text + "\n\n" + newTicket.description,
            // author: NagUI.username
        };
        Ext.Ajax.request({
            url: '/jira_api/rest/api/latest/issue/' + data.ticket_num + '/comment',
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
            url: '/jira_api/rest/api/latest/issue',
            method: 'POST',
            // timeout: 5000,
            jsonData: newTicket,
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

// Custom function for displaying information about a host.  Example: integration with cmdb or asset system
// function moreInfo(hostname){
// }

//example: function overrides the default (in nagiosnew.js) to add links for jira tickets
function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;\*]*[-A-Z0-9+&@#\/%=~_|])/ig;
    var newtext = text.replace(exp, "<a target=_new href='$1'>$1</a>");
    //  regex based on jira project short code  
    var jira = /((ENPE|OA|OPS)-\d{2,5})/ig;
    return newtext.replace(jira, "<a target=_new href='https://evernote.jira.com/browse/$1'>$1</a>");
}