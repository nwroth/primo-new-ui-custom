var app = angular.module('viewCustom', ['angularLoad']);

app.filter('encode', function() {
	return encodeURIComponent;
});

// Make the logo a link
app.controller('prmLogoAfterController', [function() {
	var vm = this;
	vm.getIconLink = getIconLink;
	function getIconLink() {
		return vm.parentCtrl.iconLink;
	}
}]);
app.component('prmLogoAfter', {
	bindings: { parentCtrl: '<' },
	controller: 'prmLogoAfterController',
	template: '<div class="product-logo product-logo-local" layout="row" layout-align="start center" layout-fill id="banner"><a href="https://library.ithaca.edu/"><img class="logo-image" alt="Ithaca College Library" ng-src="{{$ctrl.getIconLink()}}"/></a></div>'
});

// Bitly links
app.controller('prmCopyClipboardBtnAfterController', [function(){
	var vm = this;
    vm.ajax_promise = ajax_promise;
	vm.get_bitlink = get_bitlink;

    function ajax_promise(requestUrl) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', requestUrl);
            xhr.send();
            xhr.onload = function() {
                if (xhr.readyState === 4){
                    if (xhr.status === 200){
                        //console.log("xhr done successfully");
                        var resp = xhr.responseText;
                        var respJson = JSON.parse(resp);
                        resolve(respJson);
                    } else {
                        reject(xhr.status);
                        //console.log("xhr failed");
                    }
                } else {
                    //console.log("xhr processing going on");
                }
            };
        });
    }

    function get_bitlink() {

        var long_url = encodeURIComponent(vm.parentCtrl.text);
        if (long_url !== 'undefined') {

            var requestUrl = "https://api-ssl.bitly.com/v3/shorten?callback=?&format=json&access_token={YourBitlyTokenHere}&login=iclibrary&longUrl=" + long_url;

            ajax_promise(requestUrl).then(function(result) {
                vm.bitlink = result.data.url;
                //console.log(vm.bitlink);
                var theLink = document.getElementById("ic-bitly");
                theLink.innerHTML = vm.bitlink;
                theLink.href = vm.bitlink;
            }).catch(function(e) {
                console.log("Problem: " + e);
            });

        }
    }

}]);

app.component('prmCopyClipboardBtnAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'prmCopyClipboardBtnAfterController',
    template: '<div class="form-focus layout-padding layout-row ic-bitly-outer-wrapper" layout="row" layout-padding=""><div layout-margin layout-fill class="word-break-all layout-fill ic-bitly-inner-wrapper"><span layout-fill="layout-fill" class="layout-fill"><a href="#" id="ic-bitly">{{$ctrl.get_bitlink()}}</a></span></div></div><br /><button ng-click="$ctrl.saveOffset()" text="$ctrl.bitlink" clipboard="" ng-hide="$ctrl.copySuccessful" type="button" class="button-confirm button-with-icon md-button md-primoExplore-theme md-ink-ripple" on-copied="$ctrl.clipboardSuccess() | translate" on-error="$ctrl.clipboardFailure(err) | translate" id="copy-citation-button" aria-label="nui.permalink.button" aria-hidden="false" style=""><prm-icon icon-type="svg" svg-icon-set="primo-ui" icon-definition="clipboard"></prm-icon><prm-icon-after parent-ctrl="$ctrl"></prm-icon-after></prm-icon><span translate="nui.permalink.button">Copy the Permalink to Clipboard</span><div class="md-ripple-container"></div></div></button>'
});


// Map stuff
app.controller('prmOpacAfterController', [function(){
	// console.log(this);

    if (this.parentCtrl.item.delivery.holding.length > 1) {
        this.multipleHoldings = true;
        this.holdingsLocations = [];
        this.allHoldings = this.parentCtrl.item.delivery.holding;
        for (let i=0; i<this.allHoldings.length; i++) {
        	this.holdingsLocations.push(this.allHoldings[i].mainLocation);
        }
    }

    this.callNumber = "";
    this.location = "";
    this.availability = "";
    this.floor = 0;
    this.showMap = false;
    this.showLocMessage = false;
    this.locationType = "";
    this.x = 0;
    this.y = 0;
    this.width = 0; // width of highlight box
    this.height = 0; // height of highlight box
    this.lookupArray = null;
    this.coordinates = "";
    this.locMessage = "";
    this.side = "";
    this.sideLong = "";
    this.debug = false;

    this.normalizeLC = normalizeLC;
    this.sortLC = sortLC;

    

    // call number
    try {
        var theCallNumber = this.parentCtrl.item.delivery.bestlocation.callNumber;
        theCallNumber = theCallNumber.replace(/^[(\s]+/,"");
        theCallNumber = theCallNumber.replace(/[)\s]+$/,"");
        this.callNumber = theCallNumber;
    } catch(e) {
        this.callNumber = "";
    }

    // location
    try {
        this.location = this.parentCtrl.item.delivery.bestlocation.mainLocation;
    } catch(e) {
        this.location = "";
    }

    // availability
    try {
        this.availability = this.parentCtrl.item.delivery.bestlocation.availabilityStatus;
    } catch(e) {
        this.availability = "";
    }

  	// we only need a map if it's available and
  	// has a location
    if ( (this.availability === "available") && (typeof this.location !== "undefined") ) {

        this.containerWidth = document.getElementById('full-view-container').offsetWidth;

        this.mapAreaRatio = 1; // amount of containerWidth map will occupy
        if (this.containerWidth > 600) {
            this.mapAreaRatio = 0.6;    
        } else {
            this.mapAreaRatio = 0.83;
        }
        this.mapWidth = this.containerWidth * this.mapAreaRatio;
        this.mapHeight = 0.58666666667 * this.mapWidth;

        this.showLocMessage = true;
    	this.showMap = true;

    	// is it in a static location?
    	for (var loc in staticLocations) {
    		if (loc === this.location) {
    			this.locationType = "static";
    			this.floor = staticLocations[loc].floor;
    			this.x = staticLocations[loc].x;
    			this.y = staticLocations[loc].y;
    			this.width = staticLocations[loc].width;
    			this.height = staticLocations[loc].height;
                this.locMessage = staticLocations[loc].message;
    		}
    	}

    	if (this.locationType !== "static") { 

            // didn't match anything in "for" loop, so
    		this.locationType = "dynamic";

            // where should we look for the item?
            switch(this.location) {
                case "music":
                    this.lookupArray = musicStacks;
                    break;
                case "periodical":
                    this.lookupArray = perStacks;
                    break;
                case "general":
                    this.lookupArray = stacks;
                    break;
                default:
                    this.lookupArray = null;
                    break;
            }
            // console.log(this.lookupArray);

            for (let i=0; i < this.lookupArray.length; i++) {
            	// console.log(this.lookupArray[i]);
                var start = this.lookupArray[i].start;
                // console.log(this.lookupArray[i].start);
                var end = this.lookupArray[i].end;
                var test = sortLC(start, end, this.callNumber);
                // console.log(test);
                if ( (test[1] === this.callNumber) || (test[0] === this.callNumber && test.length === 2) ) {
                    this.coordinates = this.lookupArray[i];
                }
            }

            // console.log(this.coordinates);

            this.floor = this.coordinates.id.split('.')[0];
            this.stack = this.coordinates.id.split('.')[1];
            this.side = this.coordinates.id.split('.')[2];
            if (this.side === "e") {
                this.sideLong = "east";
            } else {
                this.sideLong = "west";
            }
            this.locMessage = "This item is available at stack " + this.stack + ", " + this.sideLong + "  side.";

            this.x = this.coordinates.x;
            this.y = this.coordinates.y;
            this.width = this.coordinates.width;
            this.height = this.coordinates.height;

    	}

    	if (this.multipleHoldings) {

    		this.locMessage += " It may also be available at ";
    		
    		// what locations are there that aren't the "bestlocation"?
    		for (var i=0; i < this.holdingsLocations.length; i++) {

    			if (this.holdingsLocations[i] !== this.location) {
    				var hl = this.holdingsLocations[i];
    				// console.log(hl);
    				this.locMessage += staticLocations[hl.english] || hl;
    				if (i === this.holdingsLocations.length - 1) {
    					this.locMessage += ".";
    				} else {
    					this.locMessage += ", ";
    				}
    			}
    		}

    	}

    }

    // set dimensions for the map image
    var mapImage = document.getElementById("ic-map-img");
    mapImage.setAttribute("width", this.mapWidth);
    mapImage.setAttribute("height", this.mapHeight);

    // set up canvas
    var drawingLayer = document.getElementById("ic-map-canvas");
    drawingLayer.setAttribute("width", this.mapWidth);
    drawingLayer.setAttribute("height", this.mapHeight);
    var drawingContext = drawingLayer.getContext("2d");
    drawingContext.globalAlpha = 0.6;
    drawingContext.fillStyle = "fuchsia";

    // make highlighted area proportional
    this.x = this.x * this.mapWidth / 600;
    this.y = this.y * this.mapHeight / 352;
    this.width = this.width * this.mapWidth / 600;
    this.height = this.height * this.mapHeight / 352;

	drawingContext.fillRect(this.x, this.y, this.width, this.height);

}]);
app.component('prmOpacAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'prmOpacAfterController',
    template: '<code ng-show="$ctrl.debug" class="ic-debug">&nbsp;{{$ctrl.location}} | {{$ctrl.callNumber}} | {{$ctrl.availability}}&nbsp;</code><br /><br /><p ng-show="$ctrl.showLocMessage" class="ic-loc-message">{{$ctrl.locMessage}}</p><div ng-show="$ctrl.showMap" id="ic-map-div"><img id="ic-map-img" ng-src="custom/01ITHACACOL/img/floor_{{$ctrl.floor}}.png"><canvas id="ic-map-canvas"></canvas></div>'
});


// Links for trace, sms, notification 
app.controller('prmSearchResultAvailabilityLineAfterController', [function(){
	// console.log(this);

    // what is it?
    try {
        this.category = this.parentCtrl.result.delivery.GetIt1[0].category;
    } catch(e) {
        this.category = "";
    }

    // translate category type to display text
    if (this.category === "Online Resource") {
        this.quickUrlText = "Online access";
    } else if (this.category === "Remote Search Resource") {
        this.quickUrlText = "Full text available";
    } else { // this default should help me spot any weird cases
        this.quickUrlText = "LINK";
    }

    // the prioritized full-text link
    try {
        this.quickUrl = this.parentCtrl.result.delivery.GetIt1[0].links[0].link;
    } catch(e) {
        this.quickUrl = "";
    }

    // is it online?
    try {
        this.online = this.parentCtrl.result.delivery.GetIt1[0].links[0].isLinktoOnline;
    } catch(e) {
        this.online = false;
    }

    // title
	try {
		this.title = this.parentCtrl.result.pnx.addata.btitle[0];
	} catch(e) {
		this.title = "";
	}

    // author
    try {
        this.author = this.parentCtrl.result.pnx.addata.au[0];
    } catch(e) {
        this.author = "";
    }

    // call number
	try {
		var theCallNumber = this.parentCtrl.result.delivery.bestlocation.callNumber;
		theCallNumber = theCallNumber.replace(/^[(\s]+/,"");
		theCallNumber = theCallNumber.replace(/[)\s]+$/,"");
		this.callNumber = theCallNumber;
	} catch(e) {
		this.callNumber = "";
	}

    // location
    try {
        this.location = this.parentCtrl.result.delivery.bestlocation.mainLocation;
    } catch(e) {
        this.location = "";
    }

    // bibId
    try {
    	var theBibId = this.parentCtrl.result.pnx.control.recordid[0];
    	this.bibId = theBibId.replace(/^01ITHACACOL_VOYAGER/,"");
    } catch(e) {
    	this.bibId = "";
    }

	// this will vary depending on your local requirements... 
	// this.showNotOnShelfLink = this.parentCtrl.result.pnx.control.sourcesystem[0] === "Voyager" && this.title && this.callNumber;

    this.showNotOnShelfLink = Boolean(this.parentCtrl.result.pnx.control.sourcesystem[0] === "Voyager" && this.title && this.callNumber);

    this.showNotifyLink = Boolean(this.location.match(/^acq/) && this.callNumber === "");

}]);

app.component('prmSearchResultAvailabilityLineAfter', {
	bindings: { parentCtrl: '<' },
	controller: 'prmSearchResultAvailabilityLineAfterController',
	template: '<div class="ic-access-link-area" ng-show="$ctrl.online"><prm-icon icon-definition="link" icon-type="svg" svg-icon-set="primo-ui"></prm-icon><a href="{{$ctrl.quickUrl}}" target="_blank">{{$ctrl.quickUrlText}}</a>&nbsp;<prm-icon icon-definition="open-in-new" icon-type="svg" svg-icon-set="primo-ui"></prm-icon><prm-icon icon-definition="chevron-right" icon-type="svg" svg-icon-set="primo-ui"></prm-icon></div><div class="ic-links-area" ng-show="$ctrl.showNotOnShelfLink"><a ng-href="https://library.ithaca.edu/services/sms_me_primo.php?title={{$ctrl.title | encode}}&cn={{$ctrl.callNumber | encode}}&loc={{$ctrl.location | encode}}" class="ic-sms-link">Text this callnumber</a>&nbsp;&nbsp;&nbsp;<a ng-href="https://library.ithaca.edu/forms/traceform.php?title={{$ctrl.title | encode}}&author={{$ctrl.author | encode}}&cn={{$ctrl.callNumber | encode}}" class="ic-trace-link">Not on shelf?</a></div><div class="ic-links-area" ng-show="$ctrl.showNotifyLink"><a href="https://library.ithaca.edu/forms/notify.php?title={{$ctrl.title | encode}}&bibId={{$ctrl.bibId | encode}}" class="ic-notify-link">Notify Me</a></div>'
});

