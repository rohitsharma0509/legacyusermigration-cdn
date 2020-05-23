/* eslint-disable */

// settings/ configuration for template
(function() {
	// underscore template settings
	_.templateSettings = {
	      
	      // eg, "hello {{name}}" or simple expressions: "hello {{name || 'joe'}}"
		    interpolate : /\{\{(.+?)\}\}/g,
		    
		    // eg: <% if (foo) { %> Hello {{name}} <% } %>
		    evaluate    : /<%([\s\S]+?)%>/g,
		    
		    // escape html: {{% unsafe_html }}
		    escape      : /\{\{%(.+?)\}\}/g

		};

})();