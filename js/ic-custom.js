var app = angular.module('viewCustom', ['angularLoad']);

app.filter('encode', function() {
	return encodeURIComponent;
});

// Make the logo a link
app.controller('prmLogoAfterController', [function(){
	var vm = this;
	vm.getIconLink = getIconLink;
	function getIconLink() {
		return vm.parentCtrl.iconLink;
	}
}]);
app.component('prmLogoAfter', {
	bindings: { parentCtrl: '<' },
	controller: 'prmLogoAfterController',
	template: '<div class="product-logo product-logo-local" layout="row" layout-align="start center" layout-fill id="banner"><a href="https://library.ithaca.edu/"><img class="logo-image" alt="{{::(\'nui.header.LogoAlt\' | translate)}}" ng-src="{{$ctrl.getIconLink()}}"/></a></div>'
});

// Map stuff
app.controller('prmLocationItemsAfterController', [function(){
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

    function normalizeLC(callNumber) {
        // remove initial whitespace
        var cn = callNumber.replace(/^\s*/, '');
        // all alpha to uppercase
        cn = cn.toUpperCase();
        var re = /^([A-Z]{1,3})\s*(\d+)\s*\.*(\d*)\s*\.*\s*([A-Z]*)(\d*)\s*([A-Z]*)(\d*)\s*(.*)$/;
        if (cn.match(re)) {
            var bits = cn.match(re);
            var initialLetters = bits[1];
            var classNumber = bits[2];
            var decimalNumber = bits[3];
            var cutter_1_letter = bits[4];
            var cutter_1_number = bits[5];
            var cutter_2_letter = bits[6];
            var cutter_2_number = bits[7];
            var theTrimmings = bits[8];
            if (cutter_2_letter && !(cutter_2_number)) {
                theTrimmings = cutter_2_letter + theTrimmings;
                cutter_2_letter = '';
            }
            if (classNumber) {
                classNumber = sprintf("%5s", classNumber);
            }
            decimalNumber = sprintf("%-12s", decimalNumber);
            if (cutter_1_number) {
                cutter_1_number = ' ' + cutter_1_number;
            }
            if (cutter_2_letter) {
                cutter_2_letter = '   ' + cutter_2_letter;
            }
            if (cutter_2_number) {
                cutter_2_number = ' ' + cutter_2_number;
            }
            if (theTrimmings) {
                theTrimmings.replace(/(\.)(\d)/g, '$1 $2');
                theTrimmings.replace(/(\d)\s*-\s*(\d)/g, '$1-$2');
                // not sure about the following line
                theTrimmings.replace(/(\d+)/g, sprintf("%5s", '$1'));
                theTrimmings = '   ' + theTrimmings;
            }
            var normalized = initialLetters + classNumber + decimalNumber + cutter_1_letter + cutter_1_number + cutter_2_letter + cutter_2_number + theTrimmings;
            return normalized;
        } else {
            console.log('We have a problem: ' + callNumber);
            return;
        }
    }
                
    function sortLC() {
        var unsortedList = Array.prototype.slice.call(arguments);
        var sortedList = [];
        var normalCallNo;
        var callNumberArray = {};
        var origCallNo = "";
        for (let i = 0; i < unsortedList.length; i++) {
            origCallNo = unsortedList[i];
            normalCallNo = normalizeLC(unsortedList[i]);
            if (normalCallNo) {
                if (! callNumberArray[normalCallNo]) {
                    callNumberArray[normalCallNo] = origCallNo;
                }
            }
        }
        var theKeys = Object.keys(callNumberArray);
        var sortedKeys = theKeys.sort();
        for (var j = 0; j < sortedKeys.length; j++) {
            sortedList.push(callNumberArray[sortedKeys[j]]);
        }
        return sortedList;
    }

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
        // console.log(this.containerWidth);

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

            for (let i=0; i < this.lookupArray.length; i++) {
                var start = this.lookupArray[i].start;
                var end = this.lookupArray[i].end;
                var test = sortLC(start, end, this.callNumber);
                if (test[1] === this.callNumber) {
                    this.coordinates = this.lookupArray[i];
                }
            }

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

    				this.locMessage += staticLocations[this.holdingsLocations[i]].english || this.holdingsLocations[i];
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
app.component('prmLocationItemsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'prmLocationItemsAfterController',
    template: '<code ng-show="$ctrl.debug" class="ic-debug">&nbsp;{{$ctrl.location}} | {{$ctrl.callNumber}} | {{$ctrl.availability}}&nbsp;</code><br /><br /><p ng-show="$ctrl.showLocMessage" class="ic-loc-message">{{$ctrl.locMessage}}</p><div ng-show="$ctrl.showMap" id="ic-map-div"><img id="ic-map-img" ng-src="custom/01ITHACACOL/img/floor_{{$ctrl.floor}}.png"><canvas id="ic-map-canvas"></canvas></div>'
});


// Links for trace, sms, notification (based on code 
// from Jeff Peterson, U of Minnesota Libraries)
app.controller('prmSearchResultAvailabilityLineAfterController', [function(){
	// console.log(this);

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
	template: '<div class="ic-links-area" ng-show="$ctrl.showNotOnShelfLink"><a ng-href="https://library.ithaca.edu/services/sms_me_primo.php?title={{$ctrl.title | encode}}&cn={{$ctrl.callNumber | encode}}&loc={{$ctrl.location | encode}}" class="ic-sms-link">Text this Callnumber</a> | <a ng-href="https://library.ithaca.edu/forms/traceform.php?title={{$ctrl.title | encode}}&author={{$ctrl.author | encode}}&cn={{$ctrl.callNumber | encode}}" class="ic-trace-link">Not on shelf?</a></div><div class="ic-links-area" ng-show="$ctrl.showNotifyLink"><a href="https://library.ithaca.edu/forms/notify.php?title={{$ctrl.title | encode}}&bibId={{$ctrl.bibId | encode}}" class="ic-notify-link">Notify Me</a></div>'
});