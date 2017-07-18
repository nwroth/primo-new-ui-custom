(function(){
"use strict";
'use strict';

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
        if (cutter_2_letter && !cutter_2_number) {
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
    for (var i = 0; i < unsortedList.length; i++) {
        origCallNo = unsortedList[i];
        normalCallNo = normalizeLC(unsortedList[i]);
        if (normalCallNo) {
            if (!callNumberArray[normalCallNo]) {
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
var app = angular.module('viewCustom', ['angularLoad']);

app.filter('encode', function () {
    return encodeURIComponent;
});

// Make the logo a link
app.controller('prmLogoAfterController', [function () {
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
app.controller('prmCopyClipboardBtnAfterController', [function () {
    var vm = this;
    vm.ajax_promise = ajax_promise;
    vm.get_bitlink = get_bitlink;

    function ajax_promise(requestUrl) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', requestUrl);
            xhr.send();
            xhr.onload = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
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

            var requestUrl = "https://api-ssl.bitly.com/v3/shorten?callback=?&format=json&access_token=0fd99ee37b132dd219ef0510cf7c04598f085daf&login=iclibrary&longUrl=" + long_url;

            ajax_promise(requestUrl).then(function (result) {
                vm.bitlink = result.data.url;
                //console.log(vm.bitlink);
                var theLink = document.getElementById("ic-bitly");
                theLink.innerHTML = vm.bitlink;
                theLink.href = vm.bitlink;
            }).catch(function (e) {
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
app.controller('prmOpacAfterController', [function () {
    // console.log(this);

    if (this.parentCtrl.item.delivery.holding.length > 1) {
        this.multipleHoldings = true;
        this.holdingsLocations = [];
        this.allHoldings = this.parentCtrl.item.delivery.holding;
        for (var _i = 0; _i < this.allHoldings.length; _i++) {
            this.holdingsLocations.push(this.allHoldings[_i].mainLocation);
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
        theCallNumber = theCallNumber.replace(/^[(\s]+/, "");
        theCallNumber = theCallNumber.replace(/[)\s]+$/, "");
        this.callNumber = theCallNumber;
    } catch (e) {
        this.callNumber = "";
    }

    // location
    try {
        this.location = this.parentCtrl.item.delivery.bestlocation.mainLocation;
    } catch (e) {
        this.location = "";
    }

    // availability
    try {
        this.availability = this.parentCtrl.item.delivery.bestlocation.availabilityStatus;
    } catch (e) {
        this.availability = "";
    }

    // we only need a map if it's available and
    // has a location
    if (this.availability === "available" && typeof this.location !== "undefined") {

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
            switch (this.location) {
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

            for (var _i2 = 0; _i2 < this.lookupArray.length; _i2++) {
                // console.log(this.lookupArray[i]);
                var start = this.lookupArray[_i2].start;
                // console.log(this.lookupArray[i].start);
                var end = this.lookupArray[_i2].end;
                var test = sortLC(start, end, this.callNumber);
                // console.log(test);
                if (test[1] === this.callNumber || test[0] === this.callNumber && test.length === 2) {
                    this.coordinates = this.lookupArray[_i2];
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
            for (var i = 0; i < this.holdingsLocations.length; i++) {

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
app.controller('prmSearchResultAvailabilityLineAfterController', [function () {
    // console.log(this);

    // what is it?
    try {
        this.category = this.parentCtrl.result.delivery.GetIt1[0].category;
    } catch (e) {
        this.category = "";
    }

    // translate category type to display text
    if (this.category === "Online Resource") {
        this.quickUrlText = "Online access";
    } else if (this.category === "Remote Search Resource") {
        this.quickUrlText = "Full text available";
    } else {
        // this default should help me spot any weird cases
        this.quickUrlText = "LINK";
    }

    // the prioritized full-text link
    try {
        this.quickUrl = this.parentCtrl.result.delivery.GetIt1[0].links[0].link;
    } catch (e) {
        this.quickUrl = "";
    }

    // is it online?
    try {
        this.online = this.parentCtrl.result.delivery.GetIt1[0].links[0].isLinktoOnline;
    } catch (e) {
        this.online = false;
    }

    // title
    try {
        this.title = this.parentCtrl.result.pnx.addata.btitle[0];
    } catch (e) {
        this.title = "";
    }

    // author
    try {
        this.author = this.parentCtrl.result.pnx.addata.au[0];
    } catch (e) {
        this.author = "";
    }

    // call number
    try {
        var theCallNumber = this.parentCtrl.result.delivery.bestlocation.callNumber;
        theCallNumber = theCallNumber.replace(/^[(\s]+/, "");
        theCallNumber = theCallNumber.replace(/[)\s]+$/, "");
        this.callNumber = theCallNumber;
    } catch (e) {
        this.callNumber = "";
    }

    // location
    try {
        this.location = this.parentCtrl.result.delivery.bestlocation.mainLocation;
    } catch (e) {
        this.location = "";
    }

    // bibId
    try {
        var theBibId = this.parentCtrl.result.pnx.control.recordid[0];
        this.bibId = theBibId.replace(/^01ITHACACOL_VOYAGER/, "");
    } catch (e) {
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

var staticLocations = {
    "mcnaughton": { "floor": "2", "x": 131, "y": 156, "width": 103, "height": 11, "message": "This item is located on the low shelves just inside the main entrance, on the side facing the Circulation/Reserves desk.", "english": "Popular Reading" },
    "mcnaud": { "floor": "2", "x": 131, "y": 156, "width": 103, "height": 11, "message": "This item is located on the low shelves just inside the main entrance, on the side facing the Circulation/Reserves desk.", "english": "Popular Reading" },
    "newbooks": { "floor": "2", "x": 132, "y": 166, "width": 101, "height": 13, "message": "This item is located on the low shelves just inside the main entrance, on the side facing the Research Help desk.", "english": "New Books" },
    "newspaper": { "floor": "2", "x": 264, "y": 131, "width": 55, "height": 73, "message": "This item is located on the low shelves on either side of the main staircase on the second floor.", "english": "Newspapers" },
    "circdesk": { "floor": "2", "x": 100, "y": 91, "width": 123, "height": 38, "message": "Ask for this item at the Circulation/Reserves desk on the second floor.", "english": "Circulation Desk" },
    "refdesk": { "floor": "2", "x": 128, "y": 236, "width": 110, "height": 57, "message": "Ask for this item at the Research Help desk on the second floor.", "english": "Reference Desk" },
    "popper": { "floor": "2", "x": 323, "y": 135, "width": 22, "height": 67, "message": "This item is located on the low shelves near the center of the second floor.", "english": "Popular Periodicals" },
    "archives": { "floor": "5", "x": 338, "y": 139, "width": 188, "height": 83, "message": "This item is located in the archives on the fifth floor. Contact Bridget Bower (bbower@ithaca.edu) for access.", "english": "Archives" },
    "serling": { "floor": "5", "x": 338, "y": 139, "width": 188, "height": 83, "message": "This item is located in the archives on the fifth floor. Contact Bridget Bower (bbower@ithaca.edu) for access.", "english": "Archives" },
    "reference": { "floor": "2", "x": 128, "y": 236, "width": 110, "height": 57, "message": "This item is located in the reference stacks behind the Research Help desk on the second floor.", "english": "Reference" },
    "microfilm": { "floor": "4", "x": 483, "y": 59, "width": 39, "height": 64, "message": "This item is located in the metal cases in the southwest corner of the fourth floor, near the restrooms.", "english": "Microfilm" },
    "musper": { "floor": "3", "x": 153, "y": 228, "width": 46, "height": 86, "message": "This item is located in the northeast corner of the third floor, near the administrative offices.", "english": "Music Periodicals" },
    "multimedia": { "floor": "3", "x": 263, "y": 95, "width": 81, "height": 39, "message": "Ask for this item at the Multimedia desk on the third floor.", "english": "Multimedia" },
    "musicref": { "floor": "3", "x": 433, "y": 233, "width": 18, "height": 78, "message": "This item is located near the Music Reference Desk in the NW corner of the third floor.", "english": "Music Reference" },
    "miniscore": { "floor": "3", "x": 413, "y": 250, "width": 21, "height": 64, "message": "This item is located near the Music Reference Desk in the NW corner of the third floor.", "english": "Mini scores" },
    "musicfolio": { "floor": "3", "x": 413, "y": 292, "width": 10, "height": 23, "message": "This item is located near the Music Reference Desk in the NW corner of the third floor.", "english": "Music Folio" },
    "oversize": { "floor": "5", "x": 303, "y": 139, "width": 40, "height": 82, "message": "This item is located in the central area of the fifth floor, near the archives.", "english": "Oversize" },
    "folio": { "floor": "5", "x": 329, "y": 187, "width": 14, "height": 36, "message": "This item is located in the central area of the fifth floor, near the archives.", "english": "Folio" }
};

var stacks = [{ "id": "4.G1.e", "start": "AC1 .E8", "end": "B734 .M3513 2002", "x": "82", "y": "221", "height": "82", "width": "10" }, { "id": "4.G1.w", "start": "B734 .O96 1984", "end": "B1848 .E5 V4 1924", "x": "94", "y": "221", "height": "82", "width": "10" }, { "id": "4.G2.e", "start": "B1853 .E5 V3 1962", "end": "BC135 .C97", "x": "103", "y": "221", "height": "82", "width": "10" }, { "id": "4.G2.w", "start": "BC135 .D4 1966", "end": "BF121 .H25 1965", "x": "112", "y": "221", "height": "82", "width": "10" }, { "id": "4.G3.e", "start": "BF121 .J2 1983", "end": "BF431 .Z9", "x": "121", "y": "221", "height": "82", "width": "10" }, { "id": "4.G3.w", "start": "BF432 .A1 E38", "end": "BF723 .C43 P4", "x": "130", "y": "221", "height": "82", "width": "10" }, { "id": "4.G4.e", "start": "BF723 .C5 A435 2012", "end": "BJ1275 .O38 1983", "x": "139", "y": "221", "height": "82", "width": "10" }, { "id": "4.G4.w", "start": "BJ1279 .S55", "end": "BL801 .G7", "x": "148", "y": "221", "height": "82", "width": "10" }, { "id": "4.G5.e", "start": "BL802 .B43 1998", "end": "BM660 .H63", "x": "157", "y": "221", "height": "82", "width": "10" }, { "id": "4.G5.w", "start": "BM665 .F35 1996", "end": "BR123 .T54", "x": "166", "y": "221", "height": "82", "width": "10" }, { "id": "4.G6.e", "start": "BR124 .B3", "end": "BS1225.55 .K65 2006", "x": "175", "y": "221", "height": "82", "width": "10" }, { "id": "4.G6.w", "start": "BS1233 .A785 2009", "end": "BV3202 .K74 A3 2004", "x": "184", "y": "221", "height": "82", "width": "10" }, { "id": "4.G7.e", "start": "BV3269 .N6 C7 1959", "end": "BX4810 .P3 1961", "x": "194", "y": "221", "height": "82", "width": "10" }, { "id": "4.G7.w", "start": "BX4811 .B74", "end": "CB351 .W3 1969", "x": "203", "y": "221", "height": "82", "width": "10" }, { "id": "4.G8.e", "start": "CB353 .A35", "end": "CT9990 .W48 1967", "x": "212", "y": "221", "height": "82", "width": "10" }, { "id": "4.G8.w", "start": "D3 .A2 A63", "end": "D210 .T89 1984", "x": "221", "y": "221", "height": "82", "width": "10" }, { "id": "4.G9.e", "start": "D214 .B53 2002", "end": "D742 .C5 L5", "x": "230", "y": "221", "height": "82", "width": "10" }, { "id": "4.G9.w", "start": "D742 .G4 S6", "end": "D842.5 .P3913 1985", "x": "240", "y": "221", "height": "82", "width": "10" }, { "id": "4.G10.e", "start": "D843 .A68313 1985", "end": "DA209 .P4 C73 2002", "x": "248", "y": "221", "height": "82", "width": "10" }, { "id": "4.G10.w", "start": "DA209 .P4 P3", "end": "DA521 .W45 1963", "x": "258", "y": "221", "height": "82", "width": "10" }, { "id": "4.G11.e", "start": "DA522.A1 O55", "end": "DA566.9 .C638 A34", "x": "267", "y": "221", "height": "82", "width": "10" }, { "id": "4.G11.w", "start": "DA566.9 .D3 A5", "end": "DC28 .P41", "x": "276", "y": "221", "height": "82", "width": "10" }, { "id": "4.G12.e", "start": "DC29 .B73", "end": "DC340 .N38", "x": "320", "y": "221", "height": "82", "width": "10" }, { "id": "4.G12.w", "start": "DC340 .S33", "end": "DD491 .S68 C35", "x": "328", "y": "221", "height": "82", "width": "10" }, { "id": "4.G13.e", "start": "DD801 .A34 E4", "end": "DG537.8 .S3 B7", "x": "338", "y": "221", "height": "82", "width": "10" }, { "id": "4.G13.w", "start": "DG538 .N5", "end": "DK254 .L3 A254", "x": "347", "y": "221", "height": "82", "width": "10" }, { "id": "4.G14.e", "start": "DK254 .L3 A576", "end": "DP63.7 .J3 A3", "x": "356", "y": "221", "height": "82", "width": "10" }, { "id": "4.G14.w", "start": "DP66 .M42", "end": "DS63 .M58", "x": "365", "y": "221", "height": "82", "width": "10" }, { "id": "4.G15.e", "start": "DS63 .O94 1992", "end": "DS135 .U92 C66", "x": "374", "y": "221", "height": "82", "width": "10" }, { "id": "4.G15.w", "start": "DS135 .Y4 G615", "end": "DS556.815 .T66", "x": "383", "y": "221", "height": "82", "width": "10" }, { "id": "4.G16.e", "start": "DS556.9 .A5 M17", "end": "DS783.7 .Y67", "x": "392", "y": "221", "height": "82", "width": "10" }, { "id": "4.G16.w", "start": "DS784 .B65", "end": "DT407.4 .B73", "x": "401", "y": "221", "height": "82", "width": "10" }, { "id": "4.G17.e", "start": "DT407.4 .P48", "end": "E78 .M6 K51", "x": "411", "y": "221", "height": "82", "width": "10" }, { "id": "4.G17.w", "start": "E78 .M67 A72", "end": "E168 .C87", "x": "420", "y": "221", "height": "82", "width": "10" }, { "id": "4.G18.e", "start": "E168 .G48", "end": "E178 .H87", "x": "429", "y": "221", "height": "82", "width": "10" }, { "id": "4.G18.w", "start": "E178 .J675", "end": "E184 .B15 M33", "x": "438", "y": "221", "height": "82", "width": "10" }, { "id": "4.G19.e", "start": "E184 .B67 C29", "end": "E185.615 .L4777", "x": "447", "y": "221", "height": "82", "width": "10" }, { "id": "4.G19.w", "start": "E185.615 .L4778", "end": "E301 .M16", "x": "456", "y": "221", "height": "82", "width": "10" }, { "id": "4.G20.e", "start": "E301 .M25 2008", "end": "E415.9 .S9 D62", "x": "465", "y": "221", "height": "82", "width": "10" }, { "id": "4.G20.w", "start": "E415.9 .T5 F5", "end": "E487 .R6", "x": "474", "y": "221", "height": "82", "width": "10" }, { "id": "4.G21.e", "start": "E487 .T176", "end": "E743.5 .S8", "x": "483", "y": "221", "height": "82", "width": "10" }, { "id": "4.G21.w", "start": "E743.5 .T36", "end": "E807 .R73", "x": "492", "y": "221", "height": "82", "width": "10" }, { "id": "4.G22.e", "start": "E807 .S45", "end": "F52 .A45", "x": "501", "y": "221", "height": "82", "width": "10" }, { "id": "4.G22.w", "start": "F59 .B9 A7", "end": "F215 .W85", "x": "510", "y": "221", "height": "82", "width": "10" }, { "id": "4.G23.w", "start": "F216 .A85", "end": "F656 .N6 F5", "x": "474", "y": "50", "height": "80", "width": "10" }, { "id": "4.G23.e", "start": "F657.B6 M37", "end": "F1234 .N495", "x": "465", "y": "50", "height": "80", "width": "10" }, { "id": "4.G24.w", "start": "F1234 .O73 M4", "end": "F2271 .S56", "x": "456", "y": "50", "height": "80", "width": "10" }, { "id": "4.G24.e", "start": "F2272 .J553", "end": "G850 1910 .S4 S65", "x": "447", "y": "50", "height": "80", "width": "10" }, { "id": "4.G25.w", "start": "G850 1910 .S95", "end": "GN24 .F6", "x": "438", "y": "50", "height": "80", "width": "10" }, { "id": "4.G25.e", "start": "GN24 .G46", "end": "GN662 .V36", "x": "429", "y": "50", "height": "80", "width": "10" }, { "id": "4.G26.w", "start": "GN663 .B88", "end": "GV346 .T84", "x": "419", "y": "50", "height": "80", "width": "10" }, { "id": "4.G26.e", "start": "GV347 .N13", "end": "GV1589 .K36", "x": "410", "y": "50", "height": "80", "width": "10" }, { "id": "4.G27.w", "start": "GV1590 .B5713", "end": "HB75 .G274", "x": "401", "y": "50", "height": "80", "width": "10" }, { "id": "4.G27.e", "start": "HB75 .G67 1975", "end": "HB3816.5 .I85", "x": "392", "y": "50", "height": "80", "width": "10" }, { "id": "5.G28.w", "start": "HC10 .W67 2011", "end": "HC106.4 .W75", "x": "69", "y": "21", "height": "48", "width": "14" }, { "id": "5.G29.e", "start": "HC106.5 .A727", "end": "HC240 .C312", "x": "86", "y": "29", "height": "82", "width": "10" }, { "id": "5.G29.w", "start": "HC240 .C32 1966", "end": "HC517 .W5 H66", "x": "95", "y": "29", "height": "82", "width": "10" }, { "id": "5.G30.e", "start": "HC533 .I7", "end": "HD58.82 .G67 2004", "x": "103", "y": "29", "height": "82", "width": "10" }, { "id": "5.G30.w", "start": "HD58.82 .H313 2005", "end": "HD1759 .S4 1966", "x": "112", "y": "29", "height": "82", "width": "10" }, { "id": "5.G31.e", "start": "HD1761 .B37", "end": "HD5725 .N7 S44 1980", "x": "122", "y": "29", "height": "82", "width": "10" }, { "id": "5.G31.w", "start": "HD5726 .B9 D6", "end": "HD8055 .A5 A422 1976", "x": "130", "y": "29", "height": "82", "width": "10" }, { "id": "5.G32.e", "start": "HD8055 .A5 G66", "end": "HD9696 .A3 U58", "x": "139", "y": "29", "height": "82", "width": "10" }, { "id": "5.G32.w", "start": "HD9696 .C62 G336 1993", "end": "HE9719 .U54", "x": "147", "y": "29", "height": "82", "width": "10" }, { "id": "5.G33.e", "start": "HE9721 .U5 A49", "end": "HF5415.2 .W454 2012", "x": "156", "y": "29", "height": "82", "width": "10" }, { "id": "5.G33.w", "start": "HF5415.3 .B683 2004", "end": "HF5825 .W4", "x": "165", "y": "29", "height": "82", "width": "10" }, { "id": "5.G34.e", "start": "HF5826.5 .A43", "end": "HG3881 .R78 1991", "x": "173", "y": "29", "height": "82", "width": "10" }, { "id": "5.G34.w", "start": "HG3881 .S1827", "end": "HJ2379 .M4", "x": "182", "y": "29", "height": "82", "width": "10" }, { "id": "5.G35.e", "start": "HJ2381 .A515 1968", "end": "HM251 .M4 1962", "x": "190", "y": "29", "height": "82", "width": "10" }, { "id": "5.G35.w", "start": "HM251 .M45326 1997", "end": "HN49 .C6 M3293 1997", "x": "199", "y": "29", "height": "82", "width": "10" }, { "id": "5.G36.e", "start": "HN49 .C6 T457 1999", "end": "HN583.5 .H6 1987", "x": "207", "y": "29", "height": "82", "width": "10" }, { "id": "5.G36.w", "start": "HN590 .A5 G55 1987", "end": "HQ470 .S3 V3 2002", "x": "217", "y": "29", "height": "82", "width": "10" }, { "id": "5.G37.e", "start": "HQ471 .A713 1993", "end": "HQ814 .W25 1984", "x": "226", "y": "29", "height": "82", "width": "10" }, { "id": "5.G37.w", "start": "HQ833 .B37 1999", "end": "HQ1397 .K63 1992", "x": "234", "y": "29", "height": "82", "width": "10" }, { "id": "5.G38.e", "start": "HQ1403 .A35 2010", "end": "HT334 .U5 W5", "x": "243", "y": "29", "height": "82", "width": "10" }, { "id": "5.G38.w", "start": "HT351 .B34 1986", "end": "HV1461 .G64 2010", "x": "252", "y": "29", "height": "82", "width": "10" }, { "id": "5.G39.e", "start": "HV1461 .H34 1990", "end": "HV5833 .S5 W3", "x": "260", "y": "29", "height": "82", "width": "10" }, { "id": "5.G39.w", "start": "HV5840 .A23 P48 2009", "end": "HV7924 .K6", "x": "269", "y": "29", "height": "82", "width": "10" }, { "id": "5.G40.e", "start": "HV7936 .C83 M42 1999", "end": "HX263 .L43", "x": "277", "y": "29", "height": "82", "width": "10" }, { "id": "5.G40.w", "start": "HX263 .P75 H92", "end": "JA84 .U5 G4", "x": "287", "y": "29", "height": "82", "width": "10" }, { "id": "5.G41.e", "start": "JA84 .U5 G65 1977", "end": "JC599 .U5 M25", "x": "296", "y": "29", "height": "82", "width": "10" }, { "id": "5.G41.w", "start": "JC599 .U5 M3", "end": "JK691 .A76 1987", "x": "304", "y": "29", "height": "82", "width": "10" }, { "id": "5.G42.e", "start": "JK691 .K3", "end": "JL2098 .S6 W34", "x": "313", "y": "29", "height": "82", "width": "10" }, { "id": "5.G42.w", "start": "JL2269 .P7 B84", "end": "JS1239 .Z7 1969", "x": "321", "y": "29", "height": "82", "width": "10" }, { "id": "5.G43.e", "start": "JS1240 .W37 K37", "end": "JX1977 .S817 1988", "x": "330", "y": "29", "height": "82", "width": "10" }, { "id": "5.G43.w", "start": "JX1977 .S94", "end": "KF224 .E43 C67 1996", "x": "339", "y": "29", "height": "82", "width": "10" }, { "id": "5.G44.e", "start": "KF224 .E46 S25", "end": "KF4166 .Z9 V37 1994", "x": "348", "y": "29", "height": "82", "width": "10" }, { "id": "5.G44.w", "start": "KF4192.5 .G8 H85 1985", "end": "KF8972 .Z9 G74 2003", "x": "356", "y": "29", "height": "82", "width": "10" }, { "id": "5.G45.e", "start": "KF8990 .P67 2007", "end": "LA1013.7 .S35 2011", "x": "365", "y": "29", "height": "82", "width": "10" }, { "id": "5.G45.w", "start": "LA1040 .A4 T45", "end": "LB1103 .S6", "x": "373", "y": "29", "height": "82", "width": "10" }, { "id": "5.G46.e", "start": "LB1105 .R6 1966", "end": "LB2343 .W35", "x": "383", "y": "29", "height": "82", "width": "10" }, { "id": "5.G46.w", "start": "LB2343.3 .C62 2005", "end": "LC215 .P75 2008", "x": "391", "y": "29", "height": "82", "width": "10" }, { "id": "5.G47.e", "start": "LC217 .P47", "end": "LC4801 .W65", "x": "400", "y": "29", "height": "82", "width": "10" }, { "id": "5.G47.w", "start": "LC4802 .B37 1995", "end": "N6270 .S84 2005", "x": "408", "y": "29", "height": "82", "width": "10" }, { "id": "5.G48.e", "start": "N6280 .B813 1966", "end": "N6915 .W6 1963", "x": "417", "y": "29", "height": "82", "width": "10" }, { "id": "5.G48.w", "start": "N6916 .B76", "end": "NA279 .C7 G7", "x": "426", "y": "29", "height": "82", "width": "10" }, { "id": "5.G49.e", "start": "NA280 .E5", "end": "NA6311 .N39", "x": "434", "y": "29", "height": "82", "width": "10" }, { "id": "5.G49.w", "start": "NA6402 .B73 1999", "end": "NC1670 .S9", "x": "443", "y": "29", "height": "82", "width": "10" }, { "id": "5.G50.e", "start": "NC1730 .C37 2009", "end": "ND623 .B92 S42", "x": "452", "y": "29", "height": "82", "width": "10" }, { "id": "5.G50.w", "start": "ND623 .C13 A1", "end": "ND2885 .L54", "x": "461", "y": "29", "height": "82", "width": "10" }, { "id": "5.G51.e", "start": "ND2885 .M38 2011", "end": "NX170 .M58 1994", "x": "469", "y": "29", "height": "82", "width": "10" }, { "id": "5.G51.w", "start": "NX170 .R43 2003", "end": "P90 .W8 2001", "x": "478", "y": "29", "height": "82", "width": "10" }, { "id": "5.G52.e", "start": "P91 .A54 1987", "end": "P123 .E95 1982", "x": "469", "y": "29", "height": "82", "width": "10" }, { "id": "5.G52.w", "start": "P123 .G76", "end": "PA4410 .S5 1967", "x": "478", "y": "29", "height": "82", "width": "10" }, { "id": "5.G53.e", "start": "PA4413 .A2 1975", "end": "PC4625 .B6", "x": "505", "y": "29", "height": "82", "width": "10" }, { "id": "5.G53.w", "start": "PC4640 .L38 1993", "end": "PG3021 .T4713 1971", "x": "513", "y": "29", "height": "82", "width": "10" }, { "id": "5.G54.e", "start": "PG3022 .A413 1964", "end": "PG9621 .K3 U713 1998", "x": "528", "y": "21", "height": "60", "width": "15" }, { "id": "5.G55.e", "start": "PH301 .A35", "end": "PL5105 .L49", "x": "528", "y": "274", "height": "58", "width": "14" }, { "id": "5.G56.w", "start": "PL6053 .B7", "end": "PN511 .W633", "x": "513", "y": "246", "height": "82", "width": "10" }, { "id": "5.G56.e", "start": "PN511 .B44", "end": "PN1345 .T7", "x": "505", "y": "246", "height": "82", "width": "10" }, { "id": "5.G57.w", "start": "PN1356 .B76 1997", "end": "PN1992.77 .W44 W473 2003", "x": "496", "y": "246", "height": "82", "width": "10" }, { "id": "5.G57.e", "start": "PN1992.77 .W463 F3", "end": "PN1995.9 .A5 B87 2002", "x": "487", "y": "246", "height": "82", "width": "10" }, { "id": "5.G58.w", "start": "PN1995.9 .A68 S46 2006", "end": "PN1998 .F55", "x": "478", "y": "246", "height": "82", "width": "10" }, { "id": "5.G58.e", "start": "PN1998 .M33 2000", "end": "PN2266 .B73", "x": "470", "y": "246", "height": "82", "width": "10" }, { "id": "5.G59.w", "start": "PN2266 .C592 1994", "end": "PN2782 .S45 1967", "x": "461", "y": "246", "height": "82", "width": "10" }, { "id": "5.G59.e", "start": "PN2784 .C66 1988", "end": "PN4784 .F6 W35 2002", "x": "452", "y": "246", "height": "82", "width": "10" }, { "id": "5.G60.w", "start": "PN4784 .G747 A3", "end": "PN6032 .B52", "x": "443", "y": "246", "height": "82", "width": "10" }, { "id": "5.G60.e", "start": "PN6054 .B3", "end": "PN6790 .S93 T56 2007", "x": "434", "y": "246", "height": "82", "width": "10" }, { "id": "5.G61.w", "start": "PQ11 .G4", "end": "PQ1487 .J53 1972", "x": "426", "y": "246", "height": "82", "width": "10" }, { "id": "5.G61.e", "start": "PQ1489 .L2 A38", "end": "PQ2157 .E42", "x": "417", "y": "246", "height": "82", "width": "10" }, { "id": "5.G62.w", "start": "PQ2158 .A45 1976", "end": "PQ2444 .C76", "x": "408", "y": "246", "height": "82", "width": "10" }, { "id": "5.G62.e", "start": "PQ2444 .S5", "end": "PQ2623 .O8 Z5536 1978", "x": "400", "y": "246", "height": "82", "width": "10" }, { "id": "5.G63.w", "start": "PQ2625 .A16 Q8", "end": "PQ4113 .F76 2004", "x": "391", "y": "246", "height": "82", "width": "10" }, { "id": "5.G63.e", "start": "PQ4113 .T894", "end": "PQ6184 .B8 1947", "x": "382", "y": "246", "height": "82", "width": "10" }, { "id": "5.G64.w", "start": "PQ6184 .C3", "end": "PQ6558 .V5", "x": "374", "y": "246", "height": "82", "width": "10" }, { "id": "5.G64.e", "start": "PQ6560 .A1 1956", "end": "PQ7297 .F793 Z933 1998", "x": "365", "y": "246", "height": "82", "width": "10" }, { "id": "5.G65.w", "start": "PQ7297 .G23 O8 1994", "end": "PQ8549 .P35 Z745 1987", "x": "356", "y": "246", "height": "82", "width": "10" }, { "id": "5.G65.e", "start": "PQ8549 .U7 I68 1996", "end": "PR457 .M38 1997", "x": "348", "y": "246", "height": "82", "width": "10" }, { "id": "5.G66.w", "start": "PR457 .R44 2010", "end": "PR858 .W6 T6", "x": "339", "y": "246", "height": "82", "width": "10" }, { "id": "5.G66.e", "start": "PR861 .B76 1985", "end": "PR1272 .W4", "x": "330", "y": "246", "height": "82", "width": "10" }, { "id": "5.G67.w", "start": "PR1281 .W8", "end": "PR2539 .G6 R3 1974", "x": "321", "y": "246", "height": "82", "width": "10" }, { "id": "5.G67.e", "start": "PR2541 .C6", "end": "PR2944 .T33 1966", "x": "313", "y": "246", "height": "82", "width": "10" }, { "id": "5.G68.w", "start": "PR2952 .A45 1972", "end": "PR3452 .W5", "x": "304", "y": "246", "height": "82", "width": "10" }, { "id": "5.G68.e", "start": "PR3454 .A9 1966", "end": "PR3776 .Z5", "x": "296", "y": "246", "height": "82", "width": "10" }, { "id": "5.G69.w", "start": "PR3777 .M37 1993", "end": "PR4550 .E50", "x": "287", "y": "246", "height": "82", "width": "10" }, { "id": "5.G69.e", "start": "PR4550 .E50", "end": "PR4963 .B7 1933", "x": "278", "y": "246", "height": "82", "width": "10" }, { "id": "5.G70.w", "start": "PR4963 .C7", "end": "PR5562 .A1 1990", "x": "269", "y": "246", "height": "82", "width": "10" }, { "id": "5.G70.e", "start": "PR5562 .A1 1973", "end": "PR6003 .R98 Z5", "x": "261", "y": "246", "height": "82", "width": "10" }, { "id": "5.G71.w", "start": "PR6003 .U13 C6 1970", "end": "PR6023 .A94 Z8", "x": "252", "y": "246", "height": "82", "width": "10" }, { "id": "5.G71.e", "start": "PR6023 .E15 A6 1934", "end": "PR6045 .H245 Z85 1998", "x": "243", "y": "246", "height": "82", "width": "10" }, { "id": "5.G72.w", "start": "PR6045 .I2", "end": "PR9272.9 .J35 Z93 1995", "x": "234", "y": "246", "height": "82", "width": "10" }, { "id": "5.G72.e", "start": "PR9272.9 .N3 F5", "end": "PS310 .W64 S5", "x": "226", "y": "246", "height": "82", "width": "10" }, { "id": "5.G73.w", "start": "PS312 .D3", "end": "PS634 .Y27", "x": "217", "y": "246", "height": "82", "width": "10" }, { "id": "5.G73.e", "start": "PS634.2 .E57", "end": "PS1850 .F63 v.4", "x": "208", "y": "246", "height": "82", "width": "10" }, { "id": "5.G74.w", "start": "PS1850 .F63 v.5", "end": "PS3053 .D4", "x": "199", "y": "246", "height": "82", "width": "10" }, { "id": "5.G74.e", "start": "PS3053 .H3", "end": "PS3509 .V23 A6 1970", "x": "191", "y": "246", "height": "82", "width": "10" }, { "id": "5.G75.w", "start": "PS3511 .A33 E5", "end": "PS3523 .Y85 E56 1994", "x": "182", "y": "246", "height": "82", "width": "10" }, { "id": "5.G75.e", "start": "PS3525 .A1143 Z5 1968", "end": "PS3537 .P652 Z59 2012", "x": "174", "y": "246", "height": "82", "width": "10" }, { "id": "5.G76.w", "start": "PS3537 .T143 A8", "end": "PS3553 .O655 .N6 1984b", "x": "165", "y": "246", "height": "82", "width": "10" }, { "id": "5.G76.e", "start": "PS3553 .O7 A5", "end": "PS3563 .A63 C5", "x": "156", "y": "246", "height": "82", "width": "10" }, { "id": "5.G77.w", "start": "PS3563 .A635 R6", "end": "PS3580 .R3 S5 1973", "x": "147", "y": "246", "height": "82", "width": "10" }, { "id": "5.G77.e", "start": "PS3600 .A6 H37 2009", "end": "PT2380 .K7 1970", "x": "139", "y": "246", "height": "82", "width": "10" }, { "id": "5.G78.w", "start": "PT2381 .A1 1954", "end": "PT3710 .W65 D84", "x": "130", "y": "246", "height": "82", "width": "10" }, { "id": "5.G78.e", "start": "PT3716 .R3", "end": "PZ3.9 .F85 Co 1976", "x": "121", "y": "246", "height": "82", "width": "10" }, { "id": "5.G79.w", "start": "PZ4 .A213 LAS", "end": "Q143 .O4 H35 2002", "x": "112", "y": "246", "height": "82", "width": "10" }, { "id": "5.G79.e", "start": "Q143 .P2 D78", "end": "QA39 .G35", "x": "103", "y": "246", "height": "82", "width": "10" }, { "id": "5.G80.w", "start": "QA39.2 .A88", "end": "QA76.95 .W446 2015", "x": "95", "y": "246", "height": "82", "width": "10" }, { "id": "5.G80.e", "start": "QA90 .B47513 2010", "end": "QA297 .O78", "x": "86", "y": "246", "height": "82", "width": "10" }, { "id": "5.G81.w", "start": "QA297 .R395 1998", "end": "QA809 .D4", "x": "69", "y": "271", "height": "61", "width": "15" }, { "id": "5.G82.e", "start": "QB3 .S52", "end": "QD63 .E88 E98", "x": "172", "y": "139", "height": "82", "width": "10" }, { "id": "5.G82.w", "start": "QD63 .L3 V36 1998", "end": "QD601 .A1 P46", "x": "180", "y": "139", "height": "82", "width": "10" }, { "id": "5.G83.e", "start": "QD601 .C25", "end": "QH506 .P76", "x": "189", "y": "139", "height": "82", "width": "10" }, { "id": "5.G83.w", "start": "QH506 .R654 2006", "end": "QL431 .W58", "x": "198", "y": "139", "height": "82", "width": "10" }, { "id": "5.G84.e", "start": "QL434 .C34", "end": "QP186 .U63 1990", "x": "207", "y": "139", "height": "82", "width": "10" }, { "id": "5.G84.w", "start": "QP187 .B46", "end": "QP625 .N89 C9", "x": "215", "y": "139", "height": "82", "width": "10" }, { "id": "5.G85.e", "start": "QP671 .C8 S36 1996", "end": "RA418.5 .T73 W5 2013", "x": "224", "y": "139", "height": "82", "width": "10" }, { "id": "5.G85.w", "start": "RA421 .A32 1995", "end": "RC267 .W45 1996", "x": "233", "y": "139", "height": "82", "width": "10" }, { "id": "5.G86.e", "start": "RC268 .E35 1984", "end": "RC489 .A72 U85 1984", "x": "242", "y": "139", "height": "82", "width": "10" }, { "id": "5.G86.w", "start": "RC489 .B4 B4352", "end": "RD31.5 .K37 1999", "x": "250", "y": "139", "height": "82", "width": "10" }, { "id": "5.G87.e", "start": "RD34 .S85", "end": "RJ496 .S8 W36 1998", "x": "259", "y": "139", "height": "82", "width": "10" }, { "id": "5.G87.w", "start": "RJ499 .A1 A53 1968", "end": "SK199 .A73 2001", "x": "268", "y": "139", "height": "82", "width": "10" }, { "id": "5.G88.e", "start": "SK203 .B37 2001", "end": "TN153 .S553 2010", "x": "277", "y": "139", "height": "82", "width": "10" }, { "id": "5.G88.w", "start": "TN260 .A43 1947", "end": "TX360 .U63 N49 2012", "x": "285", "y": "139", "height": "82", "width": "10" }, { "id": "5.G89.e", "start": "TX361 .A3 N37", "end": "Z1004 .E85 H6", "x": "294", "y": "139", "height": "82", "width": "10" }, { "id": "5.G89.w", "start": "Z1004 .O83 W75 2014", "end": "ZA4575 .T85 2012", "x": "303", "y": "139", "height": "82", "width": "10" }];

var perStacks = [{ "id": "4.P1.e", "start": "AG305 .N7", "end": "AP2 .L548", "x": "85", "y": "50", "height": "80", "width": "8" }, { "id": "4.P1.w", "start": "AP2 .N67", "end": "AP20 .E926", "x": "94", "y": "50", "height": "80", "width": "8" }, { "id": "4.P2.e", "start": "AP20 .P342", "end": "B52 .T4", "x": "103", "y": "50", "height": "80", "width": "8" }, { "id": "4.P2.w", "start": "B130 .J67", "end": "BL1 .Z99", "x": "112", "y": "50", "height": "80", "width": "8" }, { "id": "4.P3.e", "start": "BL51 .I65", "end": "DS701 .C643", "x": "121", "y": "50", "height": "80", "width": "8" }, { "id": "4.P3.w", "start": "DS777.55 .C4468", "end": "G1 .C3", "x": "130", "y": "50", "height": "80", "width": "8" }, { "id": "4.P4.e", "start": "G1 .N27", "end": "GV1496.3 .P53", "x": "139", "y": "50", "height": "80", "width": "8" }, { "id": "4.P4.w", "start": "GV1580 .C47", "end": "HD28 .A739", "x": "148", "y": "50", "height": "80", "width": "8" }, { "id": "4.P5.e", "start": "HD28 .J597", "end": "HG3881 .B87", "x": "157", "y": "50", "height": "80", "width": "8" }, { "id": "4.P5.w", "start": "HG3881 .J6", "end": "HX1 .S35", "x": "166", "y": "50", "height": "80", "width": "8" }, { "id": "4.P6.e", "start": "HX3 .N36", "end": "JX120 .P35", "x": "175", "y": "50", "height": "80", "width": "8" }, { "id": "4.P6.w", "start": "JX120 .P352", "end": "KF101 .S35", "x": "184", "y": "50", "height": "80", "width": "8" }, { "id": "4.P7.e", "start": "KF889 .T6", "end": "LC5101 .U7", "x": "194", "y": "50", "height": "80", "width": "8" }, { "id": "4.P7.w", "start": "LC5805 .A43", "end": "NA1 .A6", "x": "203", "y": "50", "height": "80", "width": "8" }, { "id": "4.P8.e", "start": "NA1 .B2", "end": "P106 .J68", "x": "213", "y": "50", "height": "80", "width": "8" }, { "id": "4.P8.w", "start": "P215 .P53", "end": "PN661 .S6", "x": "221", "y": "50", "height": "80", "width": "8" }, { "id": "4.P9.e", "start": "PN751 .S8", "end": "PN1994 .Q34", "x": "230", "y": "50", "height": "80", "width": "8" }, { "id": "4.P9.w", "start": "PN1995 .F465", "end": "PQ7081 .A1 H57", "x": "239", "y": "50", "height": "80", "width": "8" }, { "id": "4.P10.e", "start": "PQ7081 .A1 R4", "end": "Q1 .D57", "x": "248", "y": "50", "height": "80", "width": "8" }, { "id": "4.P10.w", "start": "Q1 .N2", "end": "QA3 .A57", "x": "257", "y": "50", "height": "80", "width": "8" }, { "id": "4.P11.e", "start": "QA3 .A572", "end": "QC350 .O6", "x": "266", "y": "50", "height": "80", "width": "8" }, { "id": "4.P11.w", "start": "QC762 .J68", "end": "QD241 .T42", "x": "275", "y": "50", "height": "80", "width": "8" }, { "id": "4.P12.e", "start": "QH75 .A1 C66515", "end": "QK1 .C19", "x": "320", "y": "50", "height": "80", "width": "8" }, { "id": "4.P12.w", "start": "QK1 .P575", "end": "QP1 .A25", "x": "329", "y": "50", "height": "80", "width": "8" }, { "id": "4.P13.e", "start": "QP1 .A251", "end": "QP1 .J72", "x": "338", "y": "50", "height": "80", "width": "8" }, { "id": "4.P13.w", "start": "QP1 .J73", "end": "R15 .A48", "x": "347", "y": "50", "height": "80", "width": "8" }, { "id": "4.P14.e", "start": "R15 .N6", "end": "RC321 .A47", "x": "356", "y": "50", "height": "80", "width": "8" }, { "id": "4.P14.w", "start": "RC321 .E43", "end": "RD594 .N4", "x": "365", "y": "50", "height": "80", "width": "8" }, { "id": "4.P15.e", "start": "RD701 .A3", "end": "RM695 .P57", "x": "374", "y": "50", "height": "80", "width": "8" }, { "id": "4.P15.w", "start": "RM695 .P572", "end": "Z1219 .S255", "x": "383", "y": "50", "height": "80", "width": "8" }];

var musicStacks = [{ "id": "3.M3.w", "start": "M1 .A13 A4", "end": "M2 .R2384", "x": "403", "y": "231", "height": "84", "width": "10" }, { "id": "3.M3.e", "start": "M2 .R2386", "end": "M3 .H26", "x": "394", "y": "230", "height": "84", "width": "10" }, { "id": "3.M4.w", "start": "M3 .H262", "end": "M3 .S3912", "x": "384", "y": "230", "height": "84", "width": "10" }, { "id": "3.M4.e", "start": "M3 .S392 1967", "end": "M23 .N53 T5", "x": "375", "y": "230", "height": "84", "width": "10" }, { "id": "3.M5.w", "start": "M23 .N56", "end": "M557 .B42 S5 1980", "x": "365", "y": "230", "height": "84", "width": "10" }, { "id": "3.M5.e", "start": "M557 .B44 O6", "end": "M1500 .B733 E7 1977", "x": "356", "y": "230", "height": "84", "width": "10" }, { "id": "3.M6.w", "start": "M1500 .B77 K5", "end": "M1507 .P86 M9", "x": "346", "y": "230", "height": "84", "width": "10" }, { "id": "3.M6.e", "start": "M1507 .P86 P6", "end": "M1977 .L3 F74", "x": "337", "y": "230", "height": "84", "width": "10" }, { "id": "3.M7.w", "start": "M1977 .L3 F8", "end": "ML50 .B66 S5 1963", "x": "326", "y": "230", "height": "84", "width": "10" }, { "id": "3.M7.e", "start": "ML50 .B6745 F5", "end": "ML108 .F27", "x": "317", "y": "230", "height": "84", "width": "10" }, { "id": "3.M8.w", "start": "ML109 .P76", "end": "ML350 .A7613 2004", "x": "306", "y": "230", "height": "84", "width": "10" }, { "id": "3.M8.e", "start": "ML350 .B37 M8 2004", "end": "ML410 .G398 A3 2015", "x": "298", "y": "230", "height": "84", "width": "10" }, { "id": "3.M9.w", "start": "ML410 .G398 R54 1999", "end": "ML410 .S932 L4", "x": "254", "y": "230", "height": "84", "width": "10" }, { "id": "3.M9.e", "start": "ML410 .S932 L43 2011", "end": "ML460 .M365 S94", "x": "245", "y": "230", "height": "84", "width": "10" }, { "id": "3.M10.w", "start": "ML460 .M66 O7 2007", "end": "ML1727 .O4", "x": "235", "y": "230", "height": "84", "width": "10" }, { "id": "3.M10.e", "start": "ML1727 .P37", "end": "ML3556 .B33 D5 2009", "x": "226", "y": "230", "height": "84", "width": "10" }, { "id": "3.M11.w", "start": "ML3556 .B76 1984", "end": "MT1 .W435 1982", "x": "217", "y": "230", "height": "84", "width": "10" }, { "id": "3.M11.e", "start": "MT1 .W443 1989", "end": "MT170 .L54 1991", "x": "208", "y": "230", "height": "84", "width": "10" }, { "id": "3.M12.w", "start": "MT170 .M34 S6 2007", "end": "MT956 .S36 R6 2011", "x": "198", "y": "230", "height": "84", "width": "10" }];
(function (window) {
    'use strict';

    var re = {
        not_string: /[^s]/,
        not_bool: /[^t]/,
        not_type: /[^T]/,
        not_primitive: /[^v]/,
        number: /[diefg]/,
        numeric_arg: /bcdiefguxX/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    };

    function sprintf() {
        var key = arguments[0],
            cache = sprintf.cache;
        if (!(cache[key] && cache.hasOwnProperty(key))) {
            cache[key] = sprintf.parse(key);
        }
        return sprintf.format.call(null, cache[key], arguments);
    }

    sprintf.format = function (parse_tree, argv) {
        var cursor = 1,
            tree_length = parse_tree.length,
            node_type = '',
            arg,
            output = [],
            i,
            k,
            match,
            pad,
            pad_character,
            pad_length,
            is_positive = true,
            sign = '';
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i]);
            if (node_type === 'string') {
                output[output.length] = parse_tree[i];
            } else if (node_type === 'array') {
                match = parse_tree[i]; // convenience purposes only
                if (match[2]) {
                    // keyword argument
                    arg = argv[cursor];
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw new Error(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
                        }
                        arg = arg[match[2][k]];
                    }
                } else if (match[1]) {
                    // positional argument (explicit)
                    arg = argv[match[1]];
                } else {
                    // positional argument (implicit)
                    arg = argv[cursor++];
                }

                if (re.not_type.test(match[8]) && re.not_primitive.test(match[8]) && get_type(arg) == 'function') {
                    arg = arg();
                }

                if (re.numeric_arg.test(match[8]) && get_type(arg) != 'number' && isNaN(arg)) {
                    throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)));
                }

                if (re.number.test(match[8])) {
                    is_positive = arg >= 0;
                }

                switch (match[8]) {
                    case 'b':
                        arg = parseInt(arg, 10).toString(2);
                        break;
                    case 'c':
                        arg = String.fromCharCode(parseInt(arg, 10));
                        break;
                    case 'd':
                    case 'i':
                        arg = parseInt(arg, 10);
                        break;
                    case 'j':
                        arg = JSON.stringify(arg, null, match[6] ? parseInt(match[6]) : 0);
                        break;
                    case 'e':
                        arg = match[7] ? parseFloat(arg).toExponential(match[7]) : parseFloat(arg).toExponential();
                        break;
                    case 'f':
                        arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg);
                        break;
                    case 'g':
                        arg = match[7] ? parseFloat(arg).toPrecision(match[7]) : parseFloat(arg);
                        break;
                    case 'o':
                        arg = arg.toString(8);
                        break;
                    case 's':
                        arg = String(arg);
                        arg = match[7] ? arg.substring(0, match[7]) : arg;
                        break;
                    case 't':
                        arg = String(!!arg);
                        arg = match[7] ? arg.substring(0, match[7]) : arg;
                        break;
                    case 'T':
                        arg = get_type(arg);
                        arg = match[7] ? arg.substring(0, match[7]) : arg;
                        break;
                    case 'u':
                        arg = parseInt(arg, 10) >>> 0;
                        break;
                    case 'v':
                        arg = arg.valueOf();
                        arg = match[7] ? arg.substring(0, match[7]) : arg;
                        break;
                    case 'x':
                        arg = parseInt(arg, 10).toString(16);
                        break;
                    case 'X':
                        arg = parseInt(arg, 10).toString(16).toUpperCase();
                        break;
                }
                if (re.json.test(match[8])) {
                    output[output.length] = arg;
                } else {
                    if (re.number.test(match[8]) && (!is_positive || match[3])) {
                        sign = is_positive ? '+' : '-';
                        arg = arg.toString().replace(re.sign, '');
                    } else {
                        sign = '';
                    }
                    pad_character = match[4] ? match[4] === '0' ? '0' : match[4].charAt(1) : ' ';
                    pad_length = match[6] - (sign + arg).length;
                    pad = match[6] ? pad_length > 0 ? str_repeat(pad_character, pad_length) : '' : '';
                    output[output.length] = match[5] ? sign + arg + pad : pad_character === '0' ? sign + pad + arg : pad + sign + arg;
                }
            }
        }
        return output.join('');
    };

    sprintf.cache = {};

    sprintf.parse = function (fmt) {
        var _fmt = fmt,
            match = [],
            parse_tree = [],
            arg_names = 0;
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = match[0];
            } else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = '%';
            } else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1;
                    var field_list = [],
                        replacement_field = match[2],
                        field_match = [];
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list[field_list.length] = field_match[1];
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1];
                            } else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1];
                            } else {
                                throw new SyntaxError("[sprintf] failed to parse named argument key");
                            }
                        }
                    } else {
                        throw new SyntaxError("[sprintf] failed to parse named argument key");
                    }
                    match[2] = field_list;
                } else {
                    arg_names |= 2;
                }
                if (arg_names === 3) {
                    throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported");
                }
                parse_tree[parse_tree.length] = match;
            } else {
                throw new SyntaxError("[sprintf] unexpected placeholder");
            }
            _fmt = _fmt.substring(match[0].length);
        }
        return parse_tree;
    };

    var vsprintf = function vsprintf(fmt, argv, _argv) {
        _argv = (argv || []).slice(0);
        _argv.splice(0, 0, fmt);
        return sprintf.apply(null, _argv);
    };

    /**
     * helpers
     */
    function get_type(variable) {
        if (typeof variable === 'number') {
            return 'number';
        } else if (typeof variable === 'string') {
            return 'string';
        } else {
            return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
        }
    }

    var preformattedPadding = {
        '0': ['', '0', '00', '000', '0000', '00000', '000000', '0000000'],
        ' ': ['', ' ', '  ', '   ', '    ', '     ', '      ', '       '],
        '_': ['', '_', '__', '___', '____', '_____', '______', '_______']
    };
    function str_repeat(input, multiplier) {
        if (multiplier >= 0 && multiplier <= 7 && preformattedPadding[input]) {
            return preformattedPadding[input][multiplier];
        }
        return Array(multiplier + 1).join(input);
    }

    /**
     * export to either browser or node.js
     */
    if (typeof exports !== 'undefined') {
        exports.sprintf = sprintf;
        exports.vsprintf = vsprintf;
    } else {
        window.sprintf = sprintf;
        window.vsprintf = vsprintf;

        if (typeof define === 'function' && define.amd) {
            define(function () {
                return {
                    sprintf: sprintf,
                    vsprintf: vsprintf
                };
            });
        }
    }
})(typeof window === 'undefined' ? undefined : window);
})();