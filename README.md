NagUI
=====

LICENSE
-------

This software is open sourced under the Apache 2 license (see LICENSE file)
Copyright 2010-2014 Proofpoint, Inc. All rights reserved.

Sencha ExtJS is distributed according to its GPLv3 license: http://www.sencha.com/license

ABOUT
-----

The NagUI project started due to a need to have a more responsive and centralized view into many different nagios instances.  At the time we have to leverage several nagios server to be able to handle the load that we were creating with the large numbers (3k) of systems and service checks.   The NagUI interface provides a way to see multiple nagios server  host and service data in a single pane of glass, without requiring that the nagios servers be configured to talk or even understand each other.  Almost all the functionality of the built in nagios CGI interface has been replicated, where there are gaps, we (all of us that can use/contribute to the software) will have to add the gaps. Additionally there are use models that prompted some features that the original cgi based Nagios UI does not provide. Such as user customizable groupings of systems, and batch commands (acknowledge, enable/disable).  

INSTALL
-------

To install the NagUI software you need to do the following:

### 1. Install prerequisite software

The required software needed to run the NagUI is as follows:   

* Perl Modules:
  * JSON
  * [Monitoring::Livestatus](https://metacpan.org/pod/Monitoring::Livestatus)
* HTTP Webserver (for the purposes of this documentation, the apache webserver has been used)	

### 2. Make sure Nagios is setup

* Nagios: The setup and configuration of Nagios is beyond the scope of this project. For more info, go to http://www.nagios.org/
* MK Livestatus:  The NagUI uses the livestatus module for nagios to retrieve information and send commands. You can fine out more here: http://mathias-kettner.de/checkmk_livestatus.html
	
### 3. Install NagUI

* Simply untar the NagUI tarball at the document root of your web server.  NagUI relies upon external authentication similarly to how nagios does.   An example webserver config (apache) below can be simply appended to the httpd.conf. Please see your webserver documentation for how you would need to set this up for another webserver. Similarly, if you are not familiar with the apache basic auth file setup. You can read about it here: http://httpd.apache.org/docs/2.2/howto/auth.html

```apacheconf
<Location /nagui/>
	AuthType basic
	AuthBasicProvider file 
	AuthName "Operations Only"
	AuthUserFile /etc/htpasswd
	Require valid-user
    Options +ExecCGI
</Location>
AddHandler cgi-script .cgi
```
	
* __Writable State file:__ As of NagUI 2.1 the server requires a writable file to track state in for Saved and shared views.  The file needs to be writable by the user that executes the nagios_live.cgi, which is usually the web server user.  The locaton of this file is configured in nagui.conf using the statefile parameter.

* __Configure NagUI:__ To configure NagUI you will need to edit the nagui.conf.   This config file defines the remove nagios livestatus instances.  You can define any number of services in this file, and it is a JSON config file.  The nagui.conf is used by the nagios_live.cgi to query the remove nagios instances and gather the data to send to the UI.  Be sure to update the nagui.conf to point to the statefile that the web user has write access to.
	
### 4. Try it out!

Once these steps are followed, you should be able to go to 
	http://yourserver/nagui/ 
and load up the NagUI interface.