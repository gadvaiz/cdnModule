TARGET:
create a CDN module to fetch the fastest cdn from the configuration file called CDN_SERVERS.
in case cdn_server dont include the content of the requested url fetch the cdn_org(also from the conf file).

to use the module Run npm install.

module dependencies:

1. axios - for fetching content
2. dotenv - for access to config.env file.

implementation:

using Promises with Promise.Any (implemented internaly) to get the fastest response.

using State class to manage the cdn list servers.
