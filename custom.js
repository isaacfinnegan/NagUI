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



// Overriding the default unhandled queries

NagUI.nodeQueries.unhandledhostproblems = 'GET hosts|Columns: notes notes_url address groups next_check scheduled_downtime_depth downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change plugin_output name state|Filter: scheduled_downtime_depth = 0|Filter: state_type = 1|Filter: state > 0|Filter: acknowledged = 0|Filter: notifications_enabled = 1|Filter: notification_period = 24x7|Filter: notification_period = 24x7_sans_holidays|Filter: notification_period = no_weekend|Or: 3';
NagUI.nodeQueries.unhandledsvcproblems = 'GET services|Columns: host_notes notes notes_url host_address host_groups next_check scheduled_downtime_depth downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change plugin_output host_name description groups state|Filter: scheduled_downtime_depth = 0|Filter: state_type = 1|Filter: state > 0|Filter: host_acknowledged = 0|Filter: acknowledged = 0|Filter: notifications_enabled = 1|Filter: notification_period = 24x7|Filter: notification_period = 24x7_sans_holidays|Filter: notification_period = no_weekend|Or: 3';
NagUI.nodeQueries.unhandledproblems = 'GET services|Columns: host_notes notes notes_url host_address host_groups next_check scheduled_downtime_depth downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change plugin_output host_name description groups state|Filter: scheduled_downtime_depth = 0|Filter: state_type = 1|Filter: state > 0|Filter: host_acknowledged = 0|Filter: acknowledged = 0|Filter: notifications_enabled = 1|Filter: notification_period = 24x7|Filter: notification_period = 24x7_sans_holidays|Filter: notification_period = no_weekend|Or: 3';



//  Uncomment the function below and customize to integrate with your ticketing system.  
//  the ackTicket receives three parameters, the node(s) that is being passed to it (this could
// be an array of nodes), the formData from the ackWindow and a call be to called after a 
// ticket has been created.  the callback should be called with 
//  (ticket numer, dialog object that should be closed <optional> 
// function ackTicket(node, formData, callback) {

// }


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