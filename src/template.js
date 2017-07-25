define([], function(){
	return function(obj) {
obj || (obj = {});
var __t, __p = '';
with (obj) {
__p += 'define(' +
((__t = ( imports )) == null ? '' : __t) +
', function(' +
((__t = ( args )) == null ? '' : __t) +
'){\n\n	var useZones = ' +
((__t = ( useZones )) == null ? '' : __t) +
';\n	var tokens = ' +
((__t = ( intermediate )) == null ? '' : __t) +
';\n	var renderer = stache(tokens);\n\n	var isNode = typeof process === "object" &&\n		{}.toString.call(process) === "[object process]";\n\n	// SSR helpers isProduction, and some that don\'t matter in the client.\n	stache.registerHelper("isProduction", function(options){\n		console.warn("The isProduction helper is deprecated. Use a #switch helper on `env.NODE_ENV` instead.");\n		var loader = typeof System !== "undefined" ? System : undefined;\n		if(loader && loader.isEnv && loader.isEnv("production")) {\n			return options.fn(this);\n		} else {\n			return options.inverse(this);\n		}\n	});\n\n	function systemImportZone(){\n		var oldImport;\n		var myImport = function(){\n			return Promise.resolve(oldImport.apply(this, arguments));\n		};\n		return {\n			beforeTask: function(){\n				oldImport = System.import;\n				System.import = myImport;\n			},\n			afterTask: function(){\n				System.import = oldImport;\n			}\n		};\n	}\n\n	/**\n	 * @function render\n	 * @hide\n	 * @description Call the stache renderer function with Scope and Options.\n	 * @signature `render(scope, options)`\n	 * @param {can-view-scope} scope A can-view-scope object.\n	 * @param {can-view-scope.Options} options An option object.\n	 * @return {DocumentFragment} The result of calling a can-stache renderer,\n	 * a document fragment.\n	 */\n	function render(scope, options){\n		var moduleOptions = { module: module };\n		options = (options && options.add) ? options.add(moduleOptions) :\n			moduleOptions;\n		return renderer(scope, options);\n	}\n\n	/**\n	 * @function connectViewModel\n	 * @description Create a new instance of the provided ViewModel, set it\n	 * as the route\'s data, and call route.ready().\n	 * @signature `connectViewModel()`\n	 * @return {Map} an instance of some map type.\n	 */\n	function connectViewModel() {\n		var ViewModel = autorender.viewModel;\n\n		if(!ViewModel) {\n			var message  = "done-autorender cannot start without a ViewModel. " +\n				"Please ensure your template contains an export for your " +\n				"application\'s ViewModel. https://github.com/donejs/autorender#viewmodel";\n			console.error(message);\n			return;\n		}\n\n		var viewModel = autorender.state = new ViewModel();\n		domData.set.call(document.documentElement, "viewModel", viewModel);\n\n		route.data = viewModel;\n		route.ready();\n		return viewModel;\n	}\n\n	/**\n	 * @function connectViewModelAndAttach\n	 * @description Render the stache template, then update the\n	 * DOM to reflect these changes. Save the state of the ViewModel instance\n	 * so that it can be reused to do rerenders in case of live-reload. This is\n	 * the main entry point of rendering, and happens upon page load.\n	 * @signature `connectViewModelAndAttach()`\n	 **/\n	function connectViewModelAndAttach() {\n		connectViewModel();\n		return renderAndAttach();\n	}\n\n	/**\n	 * @function reattachWithZone\n	 * @description Create a Zone for reattach.\n	 * @signature `reattachWithZone()`\n	 **/\n	function reattachWithZone() {\n		new Zone({\n			plugins: [xhrZone, systemImportZone]\n		}).run(function(){\n			var viewModel = connectViewModel();\n			var result = renderInZone(viewModel);\n		\n			if(typeof doneSsrAttach !== "undefined") {\n				doneSsrAttach(result.fragment);\n			}\n\n			result.promise.then(attach);\n		});\n	}\n\n	var tagsToIgnore = { "SCRIPT": true, "STYLE": true, "LINK": true };\n	\n	/**\n	 * Call a callback for each child Node within a parent, skipping\n	 * elements that should not be touched because of their side-effects.\n	 */\n	function eachChild(parent, callback){\n		var nodes = Array.prototype.slice.call(childNodes(parent)),\n			i = 0, len = nodes.length,\n			node, ignoreTag;\n\n		for(; i < len; i++) {\n			node = nodes[i];\n			ignoreTag = tagsToIgnore[node.nodeName];\n			if(!ignoreTag) {\n				// Returning false breaks the loop\n				if(callback(node) === false) {\n					break;\n				}\n			}\n		}\n	}\n\n	/**\n	 * Remove an element\n	 */\n	function remove(el) {\n		mutate.removeChild.call(el.parentNode, el);\n	}\n\n	/**\n	 * Creates a function that will append to a parent Element.\n	 */\n	function appendTo(parent){\n		return function(el){\n			mutate.appendChild.call(parent, el);\n		}\n	}\n\n	/**\n	 * @function attach\n	 * @hide\n	 * @description Receives the completely rendered DocumentFragment and\n	 * attaches the parts from the head into the document.head, the body into\n	 * document.body.\n	 * @signature `attach(result)`\n	 * @param {RenderResult} The result of rendering within a Zone.\n	 */\n	function attach(result){\n		var frag = result.fragment;\n\n		// If already attached skip this part.\n		if(document.documentElement.hasAttribute("data-attached")) {\n			return;\n		}\n\n		var head = document.head;\n		var body = document.body;\n\n		// Move elements from the fragment\'s head to the document head.\n		eachChild(head, remove);\n\n		var fragHead = frag.querySelector("head");\n		eachChild(fragHead, appendTo(head));\n\n		// Move elements from the fragment\'s body to the document body.\n		eachChild(body, remove);\n\n		var fragBody = frag.querySelector("body");\n		eachChild(fragBody, appendTo(body));\n		document.documentElement.setAttribute("data-attached", "");\n	}\n\n\n	/**\n	 * @function renderAndAttach\n	 * @hide\n	 * @description Render the template with a Zone, wait for all asynchronous\n	 * events to complete, and then attach the DocumentFragment to the page.\n	 * @signature `renderAndAttach()`\n	 * @return {Promise} A Promise that resolves after the template has been\n	 * attached to the DOM.\n	 */\n	function renderAndAttach(){\n		var viewModel = autorender.state;\n		return useZones\n			? renderInZone(viewModel).promise.then(attach)\n			: renderNoZone(viewModel).then(attach);\n	}\n\n	/**\n	 * @function renderIntoZone\n	 * @hide\n	 * @description Render a viewModel in a Zone context, returning the\n	 * Zone promise.\n	 * @signature `renderIntoZone(viewModel)`\n	 * @param {Object} viewModel\n	 * @return {RenderResult} the promise that resolves when asynchronousity\n	 * within the Zone is complete, and the fragment generated.\n	 */\n	function renderInZone(viewModel){\n		var fragment;\n		var zonePromise = new Zone({\n			plugins: [xhrZone, systemImportZone]\n		})\n		.run(function(){\n			fragment = render(viewModel, {});\n		}).then(function(zoneData){\n			return {\n				fragment: fragment,\n				zoneData: zoneData\n			};\n		});\n\n		return {\n			promise: zonePromise,\n			fragment: fragment\n		};\n	}\n\n	/**\n	 * @function renderNoZone\n	 * @hide\n	 * @description Render a viewModel without a Zone.\n	 * @signature `renderIntoZone(viewModel)`\n	 * @param {Object} viewModel\n	 * @return {RenderResult} the promise that resolves immediately with a fragment.\n	 */\n	function renderNoZone(viewModel){\n		var fragment = render(viewModel, {});\n		return Promise.resolve({ fragment: fragment });\n	}\n\n	/**\n	 * @function renderIntoDocument\n	 * @description This is used by done-ssr, it provides a fresh document\n	 * and viewModel, and this function calls the stache renderer and updates\n	 * the document with the result.\n	 * @signature `renderIntoDocument(document, viewModel)`\n	 * @param {Document} document\n	 * @param {Object} viewModel\n	**/\n	function renderIntoDocument(document, viewModel) {\n		var frag = render(viewModel, {});\n\n		var firstChild = frag.firstChild;\n		var documentElement = document.documentElement;\n\n		// If there is an <html> element, which there usually is,\n		// replace the existing documentElement, otherwise just append the fragment\n		if(firstChild && firstChild.nodeName === "HTML") {\n			mutate.replaceChild.call(document, firstChild, documentElement);\n		} else {\n			mutate.appendChild.call(documentElement, frag);\n		}\n	}\n\n	var autorender = {\n		renderAndAttach: renderAndAttach,\n		renderInZone: renderInZone,\n		legacy: false,\n\n		/*\n		 * This was previously used by done-ssr, but no longer is.\n		 * This should be removed as part of 2.0.0.\n		 */\n		render: function(doc, state){\n			console.warn("render() is deprecated in done-autorender 1.3.0. Please use renderIntoDocument() instead.");\n			var frag = render(state, {});\n\n			var oldDoc = can.document;\n			can.document = doc;\n			mutate.appendChild.call(doc.body, frag, doc);\n			can.document = oldDoc;\n		},\n		renderIntoDocument: renderIntoDocument,\n		' +
((__t = ( ases )) == null ? '' : __t) +
'\n	};\n\n	var isNW = (function(){\n		try{var nr = System._nodeRequire; return nr && nr(\'nw.gui\') !== \'undefined\';}catch(e){return false;}\n	})();\n	var isElectron = isNode && !!process.versions.electron;\n\n	if(typeof steal !== \'undefined\' && (isNW || isElectron || !isNode))\n		steal.done().then(function() {\n			if(steal.System.autorenderAutostart !== false) {\n				if (useZones){\n					reattachWithZone();\n				} else {\n					connectViewModelAndAttach();\n				}\n			}\n		});\n\n	return autorender;\n});\n';

}
return __p
}
});